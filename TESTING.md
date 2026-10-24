# Testing the real flow

This is the exact three-wallet flow for LocalNet. It requires a matching Tari Ootle checkout, the Tari base-layer checkout, Rust 1.88, Node.js 22+, and the current `tari_ootle_walletd`/SDK versions.

## 1. Start LocalNet

Clone both repositories into the same parent directory:

```bash
git clone https://github.com/tari-project/tari.git
git clone https://github.com/tari-project/tari-ootle.git ootle
cd tari-ootle
rustup target add wasm32-unknown-unknown
cargo run --bin tari_swarm_daemon --release -- -c data/swarm/config.toml init
cargo run --bin tari_swarm_daemon --release -- -c data/swarm/config.toml start
```

Open `http://localhost:8080` and confirm the validator, indexer, and wallet are healthy. Use the local faucet to fund three separate wallet accounts. Do not put wallet databases or seeds in this repository.

## 2. Build and publish the template

The current `template/` crate is the tested auction-rule core, not yet a publishable `tari_template_lib` WASM template. Before running these commands, replace it with the Tari template adapter and build it against the same Ootle toolchain as the swarm:

```bash
cargo build --target wasm32-unknown-unknown --release
tari publish --yes <auction-template>
```

Record the returned template address. Instantiate the component, record its component address, and set it locally (never commit the file):

```bash
export NEXT_PUBLIC_SEANCE_COMPONENT_ADDRESS="<published-component-address>"
export NEXT_PUBLIC_TARI_WALLETD_URL="http://127.0.0.1:18103"
```

## 3. Run SEANCE

```bash
cd SEANCE
npm install
npm run dev
```

Connect three wallet accounts in separate daemon profiles or approved account sessions:

1. Seller account: create the auction and close it.
2. Bidder A: submit a confidential bid.
3. Bidder B: submit a confidential bid.

Then use the seller account to close and settle. Verify that the winner can decrypt/reveal the winning value and that losing deposits return to the losing accounts.

## 4. Required evidence

Save the following in local notes, not in Git:

- Published template address.
- Auction component address.
- One transaction ID for create.
- One transaction ID per bid.
- Close transaction ID.
- Settlement/reveal transaction ID.
- Refund transaction IDs.
- Indexer observations showing committed amounts are not public plaintext.

As of 24 October 2026, this repository has no template address or transaction hashes. The public Esmeralda indexer connection was verified, but no wallet daemon, funded LocalNet, published template, or end-to-end transaction was available in the execution environment. No hashes are fabricated.
