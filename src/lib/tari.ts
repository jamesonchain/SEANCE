"use client";

import type { Network, TransactionBuilder } from "@tari-project/ootle";
import { ProviderBuilder, type IndexerProvider } from "@tari-project/ootle-indexer";
import { authenticate, WalletDaemonSigner } from "@tari-project/ootle-wallet-daemon-signer";
import { WalletDaemonClient } from "@tari-project/wallet_jrpc_client";

const walletdUrl = process.env.NEXT_PUBLIC_TARI_WALLETD_URL ?? "http://127.0.0.1:5100/json_rpc";
const walletSessionTtlMs = 60 * 60 * 1000;
const loadOotle = () => import("@tari-project/ootle");

function formatAmount(amount: string | number | bigint, divisibility: number) {
  const raw = BigInt(amount);
  const scale = BigInt(10) ** BigInt(divisibility);
  const whole = raw / scale;
  const fraction = raw % scale;
  if (fraction === BigInt(0) || divisibility === 0) return whole.toString();
  return `${whole}.${fraction.toString().padStart(divisibility, "0").replace(/0+$/, "")}`;
}

function walletConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  if (normalized.includes("credentialnotfound") || normalized.includes("credential not found")) {
    return new Error("No Tari passkey is registered for this browser profile. Open http://127.0.0.1:5100, register the wallet passkey, then connect again.");
  }
  if (normalized.includes("notallowederror") || normalized.includes("cancelled") || normalized.includes("canceled") || normalized.includes("timed out")) {
    return new Error("Passkey cancelled or timed out. Press Connect wallet and approve the Tari passkey prompt.");
  }
  if (normalized.includes("securityerror") || normalized.includes("origin") || normalized.includes("insecure")) {
    return new Error("Wallet origin mismatch. The daemon must be started with --enable-vite-dev-port 3000 and SEANCE must be opened at http://localhost:3000.");
  }
  if (normalized.includes("401") || normalized.includes("403") || normalized.includes("unauthorized") || normalized.includes("auth.refresh") || normalized.includes("session")) {
    return new Error("Wallet session expired. Connect wallet again to start a fresh 60-minute Tari session.");
  }
  if (normalized.includes("failed to fetch") || normalized.includes("networkerror") || normalized.includes("econnrefused") || normalized.includes("fetch failed")) {
    return new Error(`Tari wallet daemon is not running at ${walletdUrl}. Start tari_ootle_walletd v0.47.0 on Esmeralda and try again.`);
  }
  return new Error(message || "Could not connect to the Tari wallet daemon.");
}

export type TariLiveSession = {
  provider: IndexerProvider;
  signer: WalletDaemonSigner;
  client: WalletDaemonClient;
  address: string;
  balance: string;
  balanceSymbol: string;
  epoch: number;
  network: Network;
  expiresAt: number;
};

export async function connectTariLive(): Promise<TariLiveSession> {
  const { Network } = await loadOotle();
  const provider = await ProviderBuilder.new().withNetwork(Network.Esmeralda).connect();
  // The v0.47 daemon's JSON-RPC CORS response is wildcard. Browser credential
  // mode would therefore be rejected by the platform; the bearer session token
  // is kept in memory and a fresh passkey login is required after expiry.
  const client = WalletDaemonClient.usingFetchTransport(walletdUrl, { credentials: "omit" });
  try {
    // `authenticate` is the SDK's browser WebAuthn flow. Keep the token in the
    // daemon client only; the passkey and wallet keys never enter app storage.
    const token = await authenticate(client, { appName: "SEANCE" });
    client.setToken(token);
    client.setReauthenticationEnabled(true);
    const signer = WalletDaemonSigner.new({ url: walletdUrl, authToken: token });
    await signer.fetchAccountInfo();
    const [address, epoch, balances] = await Promise.all([
      signer.getAddress(),
      provider.getCurrentEpoch(),
      client.accountsGetBalances({ account: null, refresh: true }),
    ]);
    const faucetBalance = balances.balances.find((entry) => entry.token_symbol?.toLowerCase().includes("tari") || entry.token_symbol?.toLowerCase().includes("xtr"));
    return {
      provider,
      signer,
      client,
      address,
      balance: faucetBalance ? formatAmount(faucetBalance.balance, faucetBalance.divisibility) : "0",
      balanceSymbol: faucetBalance?.token_symbol ?? "tTARI",
      epoch,
      network: Network.Esmeralda,
      expiresAt: Date.now() + walletSessionTtlMs,
    };
  } catch (error) {
    provider.stopWatcher();
    throw walletConnectionError(error);
  }
}

/**
 * Sends a real component method call after the template has been published.
 * The address is deliberately environment-configured; no fabricated address
 * is allowed to reach the chain or the UI.
 */
export async function invokeAuctionMethod(
  session: TariLiveSession,
  methodName: string,
  args: unknown[] = [],
) {
  const { TransactionBuilder, sendTransaction } = await loadOotle();
  if (Date.now() >= session.expiresAt) throw new Error("Wallet session expired. Connect wallet again to start a fresh 60-minute Tari session.");
  const componentAddress = process.env.NEXT_PUBLIC_SEANCE_COMPONENT_ADDRESS;
  if (!componentAddress) {
    throw new Error("SEANCE is not deployed: set NEXT_PUBLIC_SEANCE_COMPONENT_ADDRESS after publishing the Tari template.");
  }
  const maxEpoch = Math.max(session.epoch + 10, await session.provider.getCurrentEpoch() + 10);
  const unsigned = TransactionBuilder.new(session.network, maxEpoch)
    .feeTransactionPayFromComponent(session.address, BigInt(1000))
    .callMethod(
      { componentAddress, methodName } as never,
      args as never,
    )
    .buildUnsignedTransaction();
  return sendTransaction(session.provider, session.signer, unsigned);
}

function auctionAddress() {
  const address = process.env.NEXT_PUBLIC_SEANCE_COMPONENT_ADDRESS;
  if (!address) throw new Error("SEANCE is not deployed: set NEXT_PUBLIC_SEANCE_COMPONENT_ADDRESS after publishing the Tari template.");
  return address;
}

function depositResource() {
  const address = process.env.NEXT_PUBLIC_SEANCE_DEPOSIT_RESOURCE;
  if (!address || address === "resource_<hex>") {
    throw new Error("SEANCE deposit resource is not configured: set NEXT_PUBLIC_SEANCE_DEPOSIT_RESOURCE to the real resource address accepted by the published template.");
  }
  return address;
}

async function sendAuctionTransaction(session: TariLiveSession, builder: TransactionBuilder) {
  const { sendTransaction } = await loadOotle();
  if (Date.now() >= session.expiresAt) throw new Error("Wallet session expired. Connect wallet again to start a fresh 60-minute Tari session.");
  return sendTransaction(session.provider, session.signer, builder.buildUnsignedTransaction());
}

export async function commitAuctionBid(session: TariLiveSession, commitment: Uint8Array, depositMicroTari: bigint) {
  const { TransactionBuilder, amountLiteral, bytesLiteral, resourceAddressLiteral } = await loadOotle();
  const maxEpoch = Math.max(session.epoch + 10, await session.provider.getCurrentEpoch() + 10);
  const builder = TransactionBuilder.new(session.network, maxEpoch)
    .feeTransactionPayFromComponent(session.address, BigInt(1000))
    .callMethod({ componentAddress: session.address, methodName: "withdraw" }, [resourceAddressLiteral(depositResource()), amountLiteral(depositMicroTari)])
    .saveVar("deposit")
    .callMethod({ componentAddress: auctionAddress(), methodName: "commit" }, [bytesLiteral(commitment), { Workspace: "deposit" }]);
  return sendAuctionTransaction(session, builder);
}

export async function closeAuction(session: TariLiveSession) {
  return invokeAuctionMethod(session, "close_bidding");
}

export async function revealAuctionBid(session: TariLiveSession, amountMicroTari: bigint, salt: string) {
  const { amountLiteral, bytesLiteral } = await loadOotle();
  return invokeAuctionMethod(session, "reveal", [amountLiteral(amountMicroTari), bytesLiteral(new TextEncoder().encode(salt))]);
}

export async function settleAuction(session: TariLiveSession) {
  return invokeAuctionMethod(session, "settle");
}

export type AuctionCreationEstimate = {
  feeEstimateMicroTari: bigint;
  maxFeeMicroTari: bigint;
};

export type AuctionCreationResult = {
  componentAddress: string;
  depositResource: string;
  feePaidMicroTari: bigint | null;
  transactionHash: string | null;
};

async function buildAuctionCreationTransaction(session: TariLiveSession, maxFeeMicroTari: bigint) {
  const { TransactionBuilder, componentAddressLiteral, resourceAddressLiteral } = await loadOotle();
  const templateAddress = process.env.NEXT_PUBLIC_SEANCE_TEMPLATE_ADDRESS;
  if (!templateAddress || templateAddress === "template_<hex>") {
    throw new Error("SEANCE template is not configured.");
  }
  const maxEpoch = Math.max(session.epoch + 10, await session.provider.getCurrentEpoch() + 10);
  return TransactionBuilder.new(session.network, maxEpoch)
    .feeTransactionPayFromComponent(session.address, maxFeeMicroTari)
    .callFunction(
      { templateAddress, functionName: "instantiate" } as never,
      [componentAddressLiteral(session.address), resourceAddressLiteral(depositResource())] as never,
    )
    .buildUnsignedTransaction();
}

function dryRunFee(response: unknown): bigint {
  if (typeof response !== "object" || response === null || !("result" in response)) {
    throw new Error("Auction creation dry run returned an invalid response.");
  }
  const result = response.result;
  if (typeof result !== "object" || result === null || !("Finalized" in result)) {
    throw new Error("Auction creation dry run did not finalize; inspect the daemon response and try again.");
  }
  const execution = (result.Finalized as { execution_result?: { finalize?: { total_fees_required?: bigint | number | string } } }).execution_result;
  const required = execution?.finalize?.total_fees_required;
  if (required == null) throw new Error("Auction creation dry run returned no fee estimate.");
  return typeof required === "bigint" ? required : BigInt(required);
}

export async function estimateAuctionCreation(session: TariLiveSession): Promise<AuctionCreationEstimate> {
  const { sendDryRun } = await loadOotle();
  const unsigned = await buildAuctionCreationTransaction(session, BigInt(100000));
  const response = await sendDryRun(session.provider, session.signer, unsigned);
  const feeEstimateMicroTari = dryRunFee(response);
  return {
    feeEstimateMicroTari,
    maxFeeMicroTari: feeEstimateMicroTari + feeEstimateMicroTari / BigInt(10) + BigInt(1),
  };
}

export async function createAuction(session: TariLiveSession, maxFeeMicroTari: bigint): Promise<AuctionCreationResult> {
  const { sendTransaction } = await loadOotle();
  const response = await sendTransaction(
    session.provider,
    session.signer,
    await buildAuctionCreationTransaction(session, maxFeeMicroTari),
  );
  const upSubstates = response.receipt?.receipt.diff_summary.upped ?? [];
  const componentAddress = upSubstates.map((entry) => entry.substate_id).find((id) => id.startsWith("component_"));
  if (!componentAddress) throw new Error("Auction creation committed but the receipt contained no component address.");
  const finalized = response.result;
  let transactionHash: string | null = null;
  if (typeof finalized === "object" && finalized !== null && "Finalized" in finalized) {
    const hash = finalized.Finalized.execution_result?.finalize?.transaction_hash;
    transactionHash = hash == null ? null : String(hash);
  }
  return {
    componentAddress,
    depositResource: depositResource(),
    feePaidMicroTari: response.receipt?.receipt.fee_receipt.total_fees_paid ?? null,
    transactionHash,
  };
}

export async function commitmentFor(amount: string, salt: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${amount}:${salt}`));
  return new Uint8Array(digest);
}

