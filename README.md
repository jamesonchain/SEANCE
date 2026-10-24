# SEANCE

Confidential sealed-bid auctions for Tari Ootle.

[![MIT License](https://img.shields.io/badge/license-MIT-7CF3D0.svg)](LICENSE) [![Rust](https://img.shields.io/badge/built_with-Rust-orange.svg)](template) [![Tari Ootle](https://img.shields.io/badge/network-Tari_Ootle-FF5A1F.svg)](https://ootle.tari.com/)

> Hero image placeholder: `public/seance-hero.png`

## Overview

SEANCE is an auction interface for Tari Ootle. It is designed around sealed bids: participants submit an offer without publishing the amount to the chain, then the auction settles according to explicit close, reveal, winner, and refund rules.

The repository currently contains a polished frontend, a tested auction-rule core, and a real Tari Ootle SDK connection path. The Tari template has not yet been published, so the live UI refuses to fabricate a component address, transaction ID, or auction state. Demo Mode remains available as an offline preview and is off by default.

## Features

- Live-mode connection to the Esmeralda Ootle indexer and a local Tari wallet daemon.
- Wallet-daemon signing through the official TypeScript SDK; private keys stay in the daemon.
- Explicit offline preview mode labelled `SIMULATION`.
- Auction UI for creating a lot, placing a bid, closing, revealing, and refunding once the template is deployed.
- Rust tests for highest-bid settlement, tie-breaking, late bids, duplicate bids, zero bids, missing reveals, and seller authorization.
- Chain-versus-human privacy panel that shows only verified live fields.

## How privacy works

The intended Tari flow uses confidential or stealth resources. Confidential resources hide amounts with commitments but still expose the owning vault/component. Stealth resources hide amounts and ownership using one-time addresses. Fees, timing, transaction structure, revealed inputs/outputs, and identity-linked public calls remain visible.

The current repository proves the auction rules in Rust, but it does not yet prove a deployed on-chain auction template. A public component cannot inspect arbitrary hidden bid plaintexts by itself. A production settlement therefore needs an honest reveal/settlement or threshold-authority design. Until that design is deployed and verified, SEANCE does not claim that the current UI is a live private auction.

## Architecture

```mermaid
flowchart LR
  UI[Next.js frontend] --> SDK[@tari-project/ootle]
  SDK --> IDX[Esmeralda or LocalNet indexer]
  SDK --> SIGN[WalletDaemonSigner]
  SIGN --> WALLET[Tari wallet daemon]
  WALLET --> CHAIN[Tari Ootle validators]
  UI --> TEMPLATE[Published auction template]
  TEMPLATE --> CHAIN
```

## Tech stack

- Next.js 16 App Router and TypeScript
- Tailwind CSS, custom CSS, GSAP-ready interaction layer, Lenis-ready scroll layer
- Rust auction-rule core and Tari Ootle template target
- `@tari-project/ootle`, `@tari-project/ootle-indexer`, and `@tari-project/ootle-wallet-daemon-signer`
- Esmeralda testnet or Tari LocalNet

## Getting started

### Frontend

Prerequisites: Node.js 22+, npm, Rust, Cargo, and a Tari Ootle wallet daemon.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Live Mode is the default. Set `NEXT_PUBLIC_TARI_WALLETD_URL` if the wallet daemon is not at `http://127.0.0.1:18103`. Set `NEXT_PUBLIC_SEANCE_COMPONENT_ADDRESS` only after publishing a real auction component.

### Esmeralda testnet

Download a matching `tari_ootle_walletd` release, then run:

```bash
./tari_ootle_walletd --network esme
```

The wallet UI is at `http://localhost:5100`. Public testnet faucet balances may be empty. The documented funding path is to burn Minotari and claim the burn proof in the Ootle wallet.

### LocalNet

Clone `tari` and `tari-ootle` side by side, install the WASM target, then run from the `tari-ootle` checkout:

```bash
rustup target add wasm32-unknown-unknown
cargo run --bin tari_swarm_daemon --release -- -c data/swarm/config.toml init
cargo run --bin tari_swarm_daemon --release -- -c data/swarm/config.toml start
```

The swarm admin UI is at `http://localhost:8080`; it starts a wallet, validator, indexer, and funded local faucet.

## Usage

1. Start a wallet daemon and connect it from the Live Mode banner.
2. Publish the Tari auction template and configure `NEXT_PUBLIC_SEANCE_COMPONENT_ADDRESS`.
3. Create an auction through the wallet-signed component call.
4. Place sealed bids using the wallet’s confidential-resource flow.
5. Close the auction, settle the winner, reveal the winning amount, and refund losing deposits.

If the wallet daemon or template address is unavailable, the UI reports the missing prerequisite and submits nothing. Demo Mode can be enabled manually for an offline preview.

## Project structure

```text
src/app/       Next.js page, metadata, and visual system
src/lib/       Tari SDK connection and transaction boundary
template/      Rust auction-rule core and future Tari WASM adapter
docs/          Tari research and privacy notes
scripts/       Repeatable local test commands
```

## Testing

```bash
npm run lint
npm run test:template
npx next build --webpack
```

For the full wallet, three-account, local-swarm flow, see [TESTING.md](TESTING.md). This environment verified the Esmeralda indexer connection, but had no wallet daemon, funded accounts, local swarm, deployed template, or transaction hashes available to run end to end.

## Roadmap

- Replace the standalone Rust core with a `tari_template_lib` WASM template.
- Publish the template to LocalNet, then Esmeralda, and record its address here.
- Implement wallet-daemon JRPC calls for confidential bid deposits and owned-output settlement.
- Add verified transaction receipts and real substate data to the chain proof panel.
- Add browser integration tests against a reproducible LocalNet fixture.

## Contributing

Keep changes small, run lint and Rust tests, do not commit `.env` files, wallet databases, seeds, private keys, or generated build output, and explain any privacy claim with a reproducible chain observation.

## License

MIT. See [LICENSE](LICENSE).

## Acknowledgements

Built against the Tari Ootle protocol and its open-source TypeScript SDK.
