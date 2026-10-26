#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

cargo build \
  --manifest-path template/Cargo.toml \
  --release \
  --target wasm32-unknown-unknown \
  --features tari-template

printf '%s\n' "$repo_root/template/target/wasm32-unknown-unknown/release/seance_auction.wasm"
