"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Check, ChevronRight, CircleHelp, LockKeyhole, Menu, Volume2, VolumeX, X } from "lucide-react";
import type { TariLiveSession } from "@/lib/tari";

const bids = [
  { id: "0x7A…91", time: "02:14", state: "SEALED" },
  { id: "0xB4…2E", time: "01:47", state: "SEALED" },
  { id: "0x19…C8", time: "00:58", state: "SEALED" },
  { id: "0xD2…44", time: "00:31", state: "SEALED" },
];

function SignalField() {
  return <div className="signal-field" aria-hidden="true"><span className="orb orb-a" /><span className="orb orb-b" /><span className="orb orb-c" /></div>;
}

export default function Home() {
  const [demoMode, setDemoMode] = useState(false);
  const [sealed, setSealed] = useState(false);
  const [phase, setPhase] = useState<"bidding" | "reveal" | "settled">("bidding");
  const [revealed, setRevealed] = useState(false);
  const [revealAmount, setRevealAmount] = useState(420);
  const [salt, setSalt] = useState("");
  const [amount, setAmount] = useState(420);
  const [sound, setSound] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<TariLiveSession | null>(null);
  const [liveState, setLiveState] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [liveError, setLiveError] = useState("");
  const totalBids = useMemo(() => (demoMode && sealed ? 5 : demoMode ? 4 : 0), [demoMode, sealed]);
  const connectWallet = async () => {
    setLiveState("connecting"); setLiveError("");
    try { const { connectTariLive } = await import("@/lib/tari"); setSession(await connectTariLive()); setLiveState("connected"); }
    catch (error) { setLiveState("error"); setLiveError(error instanceof Error ? error.message : "Could not connect to the Tari wallet daemon."); }
  };
  const sealBid = () => {
    if (demoMode) { setSealed(true); return; }
    if (!session) { setLiveError("Connect the Tari wallet daemon before submitting a live bid."); setLiveState("error"); return; }
    setLiveError("The live auction component is not deployed yet. No transaction was submitted."); setLiveState("error");
  };
  const closeBidding = () => {
    if (demoMode) { setPhase("reveal"); return; }
    setLiveError("The live auction component is not deployed yet. No close transaction was submitted."); setLiveState("error");
  };
  const revealBid = () => {
    if (demoMode) { setRevealed(true); setPhase("settled"); return; }
    setLiveError("The live auction component is not deployed yet. No reveal transaction was submitted."); setLiveState("error");
  };

  return (
    <main className="site-shell">
      <SignalField /><div className="grain" aria-hidden="true" />
      <nav className="topbar">
        <a className="brand" href="#top" aria-label="Seance home"><span className="brand-mark">✦</span> SEANCE</a>
        <div className={`nav-links ${menuOpen ? "is-open" : ""}`}><a href="#how">The ritual</a><a href="#auctions">Auctions</a><a href="#proof">Privacy proof</a></div>
        <div className="nav-actions"><button className="sound-button" onClick={() => setSound(!sound)} aria-label={sound ? "Mute sound" : "Enable sound"}>{sound ? <Volume2 size={15} /> : <VolumeX size={15} />}</button><button className="mode-toggle" onClick={() => setDemoMode(!demoMode)}><span className={`toggle-dot ${!demoMode ? "live" : ""}`} /> {demoMode ? "Demo mode" : "Live mode"}</button><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu">{menuOpen ? <X size={19} /> : <Menu size={19} />}</button></div>
      </nav>
      <div className={`mode-banner ${demoMode ? "simulation" : "live"}`}><span className="status-dot" /> {demoMode ? "SIMULATION — offline preview only" : liveState === "connected" ? `LIVE — ${session?.address.slice(0, 12)}… · epoch ${session?.epoch}` : "LIVE MODE — Tari wallet required"}<button onClick={demoMode ? () => setDemoMode(false) : connectWallet}>{demoMode ? "Return to live mode" : liveState === "connected" ? "Wallet connected" : liveState === "connecting" ? "Connecting…" : "Connect wallet"}</button></div>
      {liveError && <div className="live-error" role="alert">{liveError}<button aria-label="Dismiss error" onClick={() => setLiveError("")}><X size={14} /></button></div>}

      <section className="hero" id="top"><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line" /> A confidential auction house</p><h1>Let the<br /><em>highest</em> whisper.</h1><p className="hero-lede">Sealed bids for things worth keeping secret.<br />Built on Tari&apos;s confidential layer.</p><a className="cta" href="#auctions">Enter the auction <ArrowDownRight size={16} /></a></div><div className="hero-seal" aria-label="A candle flame illuminates the auction house emblem"><div className="flame" /><div className="halo" /><span>PRIVATE<br /><small>BY DESIGN</small></span></div><div className="hero-foot"><span>01 / 04</span><span>Scroll to descend <ArrowDownRight size={14} /></span></div></section>

      <section className="statement section-pad" id="how"><p className="eyebrow"><span className="eyebrow-line" /> The premise</p><h2>The room sees the ritual.<br /><em>Not before close.</em></h2><div className="statement-grid"><p>SEANCE is a commit/reveal auction. The chain sees a commitment while bidding is open, then the bidder reveals the amount and salt after close so the template can verify and compare it.</p><span className="vertical-rule" /><p className="mono-note">HIDDEN WHILE BIDDING<br />REVEALED AT CLOSE<br />RULES VERIFIED ON CHAIN</p></div></section>

      <section className="auction-section section-pad" id="auctions"><div className="section-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> Live chain state · {session ? `Epoch ${session.epoch}` : "Connect wallet to read"}</p><h2>Open <em>rooms</em></h2></div><a className="text-link" href="#proof">View chain proof <ChevronRight size={15} /></a></div><div className="auction-grid"><article className="auction-card featured"><div className="card-top"><span className="status-dot" /> {session ? "CONNECTED TO ESMERALDA" : "AWAITING WALLET CONNECTION"}</div><div className="card-art"><div className="wax-mark">S</div><div className="card-orbit" /></div><div className="card-meta"><p className="mono-note">LOT 001 · {demoMode ? "OFFLINE PREVIEW" : session ? "CHAIN DATA" : "NOT DEPLOYED"}</p><h3>The First <em>Edition</em></h3><p className="card-sub">{demoMode ? "Simulation only." : session ? "Provider connected; auction data awaits a deployed component." : "No fictional auction data is shown in live mode."}</p><div className="card-footer"><span><b>{demoMode ? totalBids : "—"}</b> {demoMode ? "preview bids" : "chain bids"}</span><a href="#bid">Open lot <ArrowUpRight size={15} /></a></div></div></article><article className="auction-card"><div className="card-top"><span className="status-dot teal" /> COMMIT / REVEAL</div><div className="card-art art-two"><div className="moon-mark">◐</div></div><div className="card-meta"><p className="mono-note">LOT 002 · UNAVAILABLE</p><h3>Night <em>Index</em></h3><p className="card-sub">Commitments are hidden while bidding; verified amounts are revealed at close.</p><div className="card-footer"><span><b>—</b> chain bids</span><a href="#proof">Inspect <ArrowUpRight size={15} /></a></div></div></article></div></section>

      <section className="bid-section section-pad" id="bid"><div className="bid-intro"><p className="eyebrow"><span className="eyebrow-line" /> Phase 01 · Commit</p><h2>Make your<br /><em>mark.</em></h2><p>Hidden while bidding, revealed at the close. Commit a hash of your amount and a private salt, then deposit funds.</p><div className="privacy-tag"><LockKeyhole size={14} /> AMOUNT HIDDEN DURING COMMIT</div></div><div className="bid-panel"><div className="panel-header"><span>PLACE A COMMITMENT</span><span className="panel-step">01 — 03</span></div><label htmlFor="bid-amount">Your amount stays hidden now</label><div className="amount-input"><span>tTARI</span><input id="bid-amount" type="number" min="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /><span className="input-cursor" /></div><div className="input-foot"><span>{demoMode ? "Offline preview only" : session ? "Wallet signs the commitment" : "Connect wallet before submitting"}</span><span>{demoMode ? `≈ ${(amount * 0.01).toFixed(2)} TARI preview` : "deposit amount depends on resource"}</span></div><button className={`seal-button ${sealed ? "sealed" : ""}`} onClick={sealBid}>{sealed ? <><Check size={17} /> {demoMode ? "Commitment sealed" : "Commitment submitted"}</> : <>Seal commitment <ArrowUpRight size={16} /></>}</button><p className="demo-note"><CircleHelp size={13} /> {demoMode ? "Simulation — no transaction was submitted." : "Live mode — wallet approval required."}</p></div></section>

      <section className="reveal-section section-pad" id="reveal"><div className="reveal-copy"><p className="eyebrow"><span className="eyebrow-line" /> Phase 02 · Reveal</p><h2>The candle<br /><em>returns.</em></h2><p>After bidding closes, reveal the original amount and salt. The template checks the hash. Unrevealed bids forfeit their deposit.</p><button className="text-link phase-button" onClick={closeBidding}>{phase === "bidding" ? "Close bidding" : phase === "reveal" ? "Reveal phase open" : "Auction settled"} <ArrowUpRight size={15} /></button></div><div className="reveal-panel"><div className="reveal-candle"><div className="reveal-flame" /><div className="reveal-wick" /></div><div className="panel-header"><span>REVEAL YOUR COMMITMENT</span><span className="panel-step">02 — 03</span></div><label htmlFor="reveal-amount">Original amount</label><div className="amount-input"><span>tTARI</span><input id="reveal-amount" type="number" min="1" value={revealAmount} onChange={(e) => setRevealAmount(Number(e.target.value))} /></div><label htmlFor="reveal-salt">Private salt</label><input className="salt-input" id="reveal-salt" type="text" value={salt} onChange={(e) => setSalt(e.target.value)} placeholder="the salt used at commit" /><button className="seal-button reveal-button" onClick={revealBid}>{revealed ? "Reveal verified" : "Reveal amount and salt"} <ArrowUpRight size={16} /></button><p className="demo-note">{demoMode ? "Simulation — the hash check is represented locally." : "Live mode — no reveal transaction until a template is deployed."}</p></div></section>

      <section className="whisper section-pad"><div className="section-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> The whisper wall</p><h2>All we know is<br /><em>that they came.</em></h2></div><span className="mono-note">{demoMode ? `${totalBids.toString().padStart(2, "0")} PREVIEW PARTICIPANTS` : session ? "CHAIN PARTICIPANTS" : "CHAIN DATA UNAVAILABLE"}</span></div><div className="whisper-list">{(demoMode || session) && (sealed ? [...bids, { id: "PENDING…TX", time: "pending", state: "COMMITMENT" }] : bids).map((bid) => <div className="whisper-row" key={bid.id}><span className="row-id">{bid.id}</span><span className="redaction"><i /><i /><i /></span><span className="row-time">{bid.time}</span><span className="row-state">{bid.state}</span></div>)}{!demoMode && !session && <div className="empty-chain">Connect a Tari wallet to read live auction participants.</div>}</div></section>

      <section className="proof section-pad" id="proof"><div className="section-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> The proof</p><h2>Two views.<br /><em>One truth.</em></h2></div></div><div className="proof-grid"><div className="proof-card chain-view"><div className="proof-label">WHAT THE CHAIN SEES <span>PUBLIC</span></div><div className="chain-lines"><p>network <b>{session ? "esmeralda" : "—"}</b></p><p>wallet <b>{session ? `${session.address.slice(0, 8)}…` : "—"}</b></p><p>epoch <b>{session ? session.epoch : "—"}</b></p><p>commitment <b className="blurred">{session ? "PRESENT" : "—"}</b></p><p>amount at commit <b className="blurred">{session ? "HIDDEN" : "—"}</b></p></div><div className="proof-bottom"><LockKeyhole size={14} /> {session ? "PROVIDER VERIFIED" : "CONNECT WALLET TO READ"}</div></div><div className="proof-card human-view"><div className="proof-label">WHAT REVEAL SHOWS <span className="teal-label">AT CLOSE</span></div><div className="reveal-number">{demoMode && revealed ? revealAmount.toLocaleString() : "— — —"}<small>{demoMode && revealed ? "PREVIEW" : "tTARI"}</small></div><div className="proof-bottom teal-text"><span className="signal-dot" /> {demoMode ? "SIMULATION — REVEAL PREVIEW" : "AMOUNT IS REVEALED ONLY AFTER CLOSE"}</div></div></div></section>
      <footer className="footer"><div className="brand"><span className="brand-mark">✦</span> SEANCE</div><p>Private by design. Built for the Tari Ootle October build contest.</p><span className="mono-note">© 2026 · NO SECRETS LEFT BEHIND</span></footer>
    </main>
  );
}
