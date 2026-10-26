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

Build the publishable `tari_template_lib 0.35.0` adapter:

```bash
../SEANCE/scripts/build-seance-template.sh
export TARI_AUTH_TOKEN="<short-lived WebAuthn session token>"
node ../SEANCE/scripts/publish-seance-template.mjs
```

Record the returned template address. Instantiate the component, record its component address, and set it locally (never commit the file):

```bash
export NEXT_PUBLIC_SEANCE_COMPONENT_ADDRESS="<published-component-address>"
export NEXT_PUBLIC_TARI_WALLETD_URL="http://127.0.0.1:5100/json_rpc"
```

## 3. Run the commit/reveal flow

```bash
cd SEANCE
npm install
npm run dev
```

Connect three wallet accounts in separate daemon profiles or approved account sessions:

1. Seller account: create the auction and close the bidding phase.
2. Bidder A: submit `SHA-256(amount + ":" + salt)` and a deposit.
3. Bidder B: submit a different commitment and deposit.

Then open the reveal phase. Each bidder submits the original amount and salt. Verify that the template rejects a wrong salt, accepts a matching reveal, selects the highest verified amount, gives equal amounts to the earliest commitment, refunds verified losers, and sends unrevealed deposits to the seller.

Confidential resources can hide deposit balances in vaults. If the deployed adapter uses a public resource instead, deposit amounts are visible. Bid amounts are hidden during commit and intentionally revealed during reveal.

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

The adapter was built and the deployment scripts were added. The last deployment attempt could not proceed because `127.0.0.1:5100` refused the connection; WebAuthn also requires a browser session and the daemon's origin must be changed to `http://localhost:3000`. Therefore this repository intentionally records no template address or transaction hashes yet. No hashes are fabricated.
