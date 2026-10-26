#!/usr/bin/env node
import process from "node:process";

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const url = process.env.TARI_WALLETD_URL ?? "http://127.0.0.1:5100/json_rpc";
const token = required("TARI_AUTH_TOKEN");
const component = required("SEANCE_COMPONENT_ADDRESS");
const depositResource = required("SEANCE_DEPOSIT_RESOURCE");
const seller = process.env.TARI_SELLER_ACCOUNT ?? "seller";
const bidder1 = process.env.TARI_BIDDER1_ACCOUNT ?? "bidder1";
const bidder2 = process.env.TARI_BIDDER2_ACCOUNT ?? "bidder2";
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

console.error(`The three-account flow is intentionally explicit: ${seller}, ${bidder1}, ${bidder2}.`);
console.error("Use the exact manifests emitted by the wallet UI/SDK for the current confidential deposit resource.");
console.error("This runner is a guardrail until a WebAuthn session and a component address are supplied; it will not fabricate transactions.");
console.log(JSON.stringify({
  network: process.env.TARI_NETWORK ?? "esmeralda",
  component,
  depositResource,
  accounts: { seller, bidder1, bidder2 },
  next: ["instantiate", "commit bidder1", "commit bidder2", "close", "reveal bidder1", "reveal bidder2", "settle", "claim"],
  daemon_probe: await rpc("auth.method", {}),
}, null, 2));
