"use client";

import { Network, TransactionBuilder, sendTransaction } from "@tari-project/ootle";
import { ProviderBuilder, type IndexerProvider } from "@tari-project/ootle-indexer";
import { WalletDaemonSigner } from "@tari-project/ootle-wallet-daemon-signer";

const walletdUrl = process.env.NEXT_PUBLIC_TARI_WALLETD_URL ?? "http://127.0.0.1:18103";

export type TariLiveSession = {
  provider: IndexerProvider;
  signer: WalletDaemonSigner;
  address: string;
  epoch: number;
  network: Network;
};

export async function connectTariLive(): Promise<TariLiveSession> {
  const provider = await ProviderBuilder.new().withNetwork(Network.Esmeralda).connect();
  try {
    const signer = await WalletDaemonSigner.connect({ url: walletdUrl, appName: "SEANCE" });
    const [address, epoch] = await Promise.all([signer.getAddress(), provider.getCurrentEpoch()]);
    return { provider, signer, address, epoch, network: Network.Esmeralda };
  } catch (error) {
    provider.stopWatcher();
    throw error;
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

