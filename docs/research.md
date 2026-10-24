# Tari Ootle research

Research checkpoint: 25 October 2026

## What Ootle templates are

An Ootle template is Rust code compiled to a WebAssembly (`wasm32-unknown-unknown`) binary. The published WASM becomes a template on the network; transactions instantiate components from it and call their methods. The current publishing guide caps the optimized binary at 1 MiB. The Tari CLI can scaffold, build, and publish templates, while the wallet daemon JSON-RPC is currently the supported publishing path.

## The privacy primitives

- **Confidential resource:** hides amounts with Pedersen commitments and range proofs, but the vault and its owning component remain visible.
- **Stealth resource:** hides amounts and ownership by putting funds in UTXOs with one-time stealth addresses. Native TARI is a stealth resource.
- **Encrypted output data:** the recipient's wallet decrypts the amount and mask; a third party cannot do so without the relevant key.
- **What still leaks:** fees are revealed, transaction shape and timing are public, revealed inputs/outputs are public, and calls that require a public signature can link an action to a key.

## Honest commit/reveal auction design

SEANCE now models a commit/reveal auction. During bidding, the bidder submits `SHA-256(amount || ":" || salt)` plus a deposit. The amount and salt are not in the commitment. The seller closes bidding, bidders reveal the amount and salt, and the template verifies the hash. A verified highest amount wins; verified losers are refunded; equal amounts go to the earliest commitment; unrevealed bids forfeit their deposit to the seller.

Tari confidential resources are stored in vaults and hide balances, so the adapter can use a confidential vault for deposits if the published template transaction path supports the required withdrawal/deposit proof. If the adapter instead uses a public resource, the deposit amount is visible. In either case, the bid amount is hidden only during the commit phase; it is intentionally revealed when the bidder reveals. Fees, timing, transaction structure, and identity-linked public calls remain visible.

The Rust crate tests the phase rules and hash verification. It is not yet a published Tari template, so the repository does not claim that an on-chain auction has been deployed.

## Local swarm and deployment

The Ootle repository documents a localnet using `tari_swarm_daemon`: clone Tari and tari-ootle side by side, initialize `data/swarm/config.toml`, and start the swarm. The swarm supplies a base node, console wallet, validator, Ootle wallet, and indexer. The admin UI is served at `http://localhost:8080`.

The template workflow is:

1. Install Rust and the WASM target: `rustup target add wasm32-unknown-unknown`.
2. Build the template with Cargo (or `tari build`).
3. Run `tari publish <template>` against a funded local wallet account, or publish through the wallet UI.
4. Submit manifests through walletd JSON-RPC and wait for the transaction receipt.

## Frontend integration choice

For a browser dApp, use `@tari-project/ootle` with `@tari-project/ootle-indexer` and the wallet-daemon signer/WebAuthn flow. The running Esmeralda v0.47.0 daemon serves its web UI at `http://127.0.0.1:5100` and JSON-RPC at `http://127.0.0.1:5100/json_rpc`; its configured allowed origin is exactly `http://localhost:3000`, so the frontend must be opened on that origin. `WalletDaemonSigner.connect({ url, appName })` calls `auth.method`, then performs the browser passkey registration or login and exchanges the credential for a session token. The SDK enables `auth.refresh` for the daemon's 3600-second session TTL. The web app should request wallet approval for transaction signing; it must not receive or store a seed, passkey, or private key. The indexer is used for public auction state and transaction status, while the wallet signer creates/authorizes private transfers.

The wallet daemon client also exposes `accounts.get_balances`; SEANCE uses it after authentication to display the real default account's address and token balances. The v0.47 daemon currently answers JSON-RPC preflight with wildcard CORS, so browser credential mode is intentionally omitted; the bearer session token remains memory-only and the user reconnects with a passkey after the 3600-second TTL. A failed fetch means the daemon is unavailable, a WebAuthn `SecurityError` normally means the page origin does not match the daemon allow-list, `NotAllowedError` is a cancelled or timed-out passkey prompt, `CredentialNotFound` means this browser profile has not registered the daemon's passkey, and an expired/invalid session is handled as a reauthentication error.

## Sources

- https://github.com/tari-project/tari-ootle
- https://ootle.tari.com/concepts/privacy/
- https://ootle.tari.com/concepts/templates-and-assets/
- https://ootle.tari.com/guides/publishing-templates/
- https://ootle.tari.com/guides/cli/
- https://github.com/tari-project/ootle.ts

## Live network research (24 October 2026)

The current public testnet is **Esmeralda**. The wallet daemon release guide documents v0.47.0 binaries and the command `tari_ootle_walletd --network esme`; its local web UI runs on port 5100. Public testnet faucet state is not guaranteed: the guide says the faucet may be empty. The supported funding path is to burn Minotari on the base layer, then claim the burn proof in the Ootle wallet. Localnet has a funded faucet that can claim 1,000 tTARI.

The documented browser integration is the TypeScript SDK, not a browser extension: `@tari-project/ootle` builds transactions, `@tari-project/ootle-indexer` reads/submits chain data, and `@tari-project/ootle-wallet-daemon-signer` delegates signing to a running wallet daemon. The SDK examples use a local wallet-daemon endpoint and explicit wallet authorization. Seeds and private keys must remain inside the wallet daemon.

The repository’s current Rust crate is a tested deterministic commit/reveal auction-rule core. It is not yet compiled against `tari_template_lib`, so it has no valid Tari template address and cannot honestly be deployed. A real deployment requires replacing the standalone crate with a Tari template crate, building the WASM target against the pinned Ootle toolchain, funding a wallet, publishing it, and recording the resulting template address. The real UI must not display fabricated transaction IDs or chain data while those prerequisites are absent.
