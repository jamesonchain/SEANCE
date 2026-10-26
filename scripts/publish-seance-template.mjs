#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required; load .env in your shell without committing it`);
  return value;
};

const url = process.env.TARI_WALLETD_URL ?? "http://127.0.0.1:5100/json_rpc";
const token = required("TARI_AUTH_TOKEN");
const account = process.env.TARI_SELLER_ACCOUNT ?? "seller";
const maxFee = process.env.TARI_MAX_FEE ?? "100000000";
const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const wasmPath = process.argv[2] ?? path.join(repoRoot, "template/target/wasm32-unknown-unknown/release/seance_auction.wasm");
const binary = (await fs.readFile(wasmPath)).toString("base64");
let id = 1;

async function rpc(method, params) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ jsonrpc: "2.0", id: id++, method, params }),
  });
  const body = await response.json();
  if (body.error) throw new Error(`${method}: ${body.error.message ?? JSON.stringify(body.error)}`);
  return body.result;
}

const dryRun = await rpc("transactions.publish_template", {
  binary,
  fee_account: account,
  max_fee: maxFee,
  detect_inputs: true,
  dry_run: true,
  metadata: null,
});
const requiredFee = dryRun.dry_run_fee;
if (requiredFee == null) throw new Error("publish dry run returned no fee");
const paddedFee = (BigInt(requiredFee) + BigInt(requiredFee) / 10n).toString();
const published = await rpc("transactions.publish_template", {
  binary,
  fee_account: account,
  max_fee: paddedFee,
  detect_inputs: true,
  dry_run: false,
  metadata: null,
});
const result = await rpc("transactions.wait_result", {
  transaction_id: published.transaction_id,
  timeout_secs: 300,
});

console.log(JSON.stringify({
  network: process.env.TARI_NETWORK ?? "esmeralda",
  transaction_id: published.transaction_id,
  dry_run_fee: requiredFee,
  max_fee: paddedFee,
  finalized: result,
}, null, 2));
console.error("Extract the template_<hex> address from the accepted UP substates in finalized.result and set SEANCE_TEMPLATE_ADDRESS locally.");
