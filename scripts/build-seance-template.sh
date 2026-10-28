#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

cargo build \
  --manifest-path template/Cargo.toml \
  --release \
  --target wasm32-unknown-unknown \
  --features tari-template

wasm_path="$repo_root/template/target/wasm32-unknown-unknown/release/seance_auction.wasm"

if [[ ! -f "$wasm_path" ]]; then
  printf 'ERROR: expected WASM output was not produced: %s\n' "$wasm_path" >&2
  exit 1
fi

if wasm_size_bytes="$(stat -f '%z' "$wasm_path" 2>/dev/null)"; then
  :
else
  wasm_size_bytes="$(stat -c '%s' "$wasm_path")"
fi

printf 'WASM: %s (%s bytes)\n' "$wasm_path" "$wasm_size_bytes"
