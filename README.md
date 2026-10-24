# SEANCE

> Let the highest whisper.

SEANCE is a candlelit sealed-bid auction interface for Tari Ootle. It makes a privacy concept legible: the room can see that bids exist, but not their amounts.

## Current status

The polished Next.js frontend and deterministic auction-rule core are working. Demo Mode is enabled by default so a judge can click through without a wallet. The Tari template adapter and local-swarm deployment still require a pinned Ootle SDK/toolchain and a funded local wallet; this repo does not pretend the visual simulation is a live chain transaction.

## Privacy, plainly

Tari confidential resources hide amounts in commitments. Stealth resources also hide ownership. Fees, timing, transaction shape, revealed boundaries, and identity-linked public calls can still leak. A public smart contract cannot magically compare plaintext values it cannot access, so a fully trustless hidden maximum requires a reveal/settlement or threshold-authority flow. SEANCE labels that boundary instead of claiming zero-knowledge auction computation.

## Architecture

- `src/app/page.tsx` — single-page auction house, Demo Mode, sealed-bid interaction, whisper wall, and chain-vs-human proof view.
- `src/app/globals.css` — custom ink/bone/ember/teal visual system, responsive layout, grain, candle/orbit effects, and motion.
- `template/src/lib.rs` — deterministic auction rules: create, commit, close, settle, refund, access control, tie-break, and edge cases.
- `docs/research.md` — Tari Ootle research, privacy model, wallet integration path, and localnet notes.

## Run locally

```bash
npm install
npm run dev
npm run build
```

Open http://localhost:3000. For the auction core:

```bash
./scripts/test-template.sh
```

The default Next 16 Turbopack build may be restricted in hardened environments that disallow a child process from binding to a port. `npx next build --webpack` is the verified production build command in this workspace.

## Demo flow

1. Scroll to `Open rooms` and choose `The First Edition`.
2. Change the amount, then press `Seal this bid`.
3. Notice the new hidden slot on the Whisper Wall.
4. Compare the public commitment view with the private reveal view.
5. Toggle `Demo mode` to see the live-wallet boundary. Demo Mode is a simulation.

## 75-second demo script

| Time | Shot | Voiceover |
| --- | --- | --- |
| 00–08s | Black page, ember flame, SEANCE title | “Every auction has a secret.” |
| 08–18s | Scroll into Open rooms, hover Lot 001 | “SEANCE is a sealed-bid room built on Tari.” |
| 18–31s | Enter 420 tTARI, press Seal this bid | “Your maximum offer is encrypted before it touches the auction.” |
| 31–43s | Whisper Wall adds YOU…NOW | “The chain sees a participant and a commitment. Never the number.” |
| 43–56s | Split What the chain sees / What you see | “This is the proof: public state on one side, private value on the other.” |
| 56–68s | Toggle Demo Mode, show disclaimer | “Demo Mode is a simulation. Live mode hands signing to the Tari wallet.” |
| 68–75s | Return to hero and logo | “Let the highest whisper.” |

## Forum post

SEANCE is a sealed-bid auction house for Tari Ootle. Bid amounts travel as confidential resources, so the room can see the ritual without seeing the number. The interface makes the privacy boundary tangible: whispering bid slots, a physical seal, and a split view of what the chain sees versus what the winner sees.

## Announcement

**Bluesky:** I built SEANCE for the Tari Ootle October build contest: a candlelit sealed-bid auction where the room sees the ritual, never the number. Demo it here: [link]

**Reddit:** SEANCE is my Tari Ootle October build: a sealed-bid auction concept with a working auction-rule core and a polished Demo Mode. It shows exactly what confidential resources hide—and what they still reveal—without faking privacy. [link]

## License

MIT. See [LICENSE](./LICENSE).
