"use client";

import { Network, TransactionBuilder, sendTransaction } from "@tari-project/ootle";
import { ProviderBuilder, type IndexerProvider } from "@tari-project/ootle-indexer";
import { authenticate, WalletDaemonSigner } from "@tari-project/ootle-wallet-daemon-signer";
import { WalletDaemonClient } from "@tari-project/wallet_jrpc_client";

const walletdUrl = process.env.NEXT_PUBLIC_TARI_WALLETD_URL ?? "http://127.0.0.1:5100/json_rpc";
const walletSessionTtlMs = 60 * 60 * 1000;

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
    return new Error("Wallet origin mismatch. Open SEANCE at http://localhost:3000 so WebAuthn matches the daemon allow-list.");
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

