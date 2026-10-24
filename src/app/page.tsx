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
  const [amount, setAmount] = useState(420);
  const [sound, setSound] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<TariLiveSession | null>(null);
  const [liveState, setLiveState] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [liveError, setLiveError] = useState("");
  const totalBids = useMemo(() => (sealed ? 5 : 4), [sealed]);
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

      <section className="statement section-pad" id="how"><p className="eyebrow"><span className="eyebrow-line" /> The premise</p><h2>The room sees the ritual.<br /><em>Never the number.</em></h2><div className="statement-grid"><p>SEANCE is a sealed bid auction where each offer travels as a confidential resource. The chain verifies the rules without publishing the amount.</p><span className="vertical-rule" /><p className="mono-note">NO PUBLIC BALANCES<br />NO GUESSES<br />NO BACKDOORS</p></div></section>

      <section className="auction-section section-pad" id="auctions"><div className="section-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> Live chain state · {session ? `Epoch ${session.epoch}` : "Connect wallet to read"}</p><h2>Open <em>rooms</em></h2></div><a className="text-link" href="#proof">View chain proof <ChevronRight size={15} /></a></div><div className="auction-grid"><article className="auction-card featured"><div className="card-top"><span className="status-dot" /> {session ? "CONNECTED TO ESMERALDA" : "AWAITING WALLET CONNECTION"}</div><div className="card-art"><div className="wax-mark">S</div><div className="card-orbit" /></div><div className="card-meta"><p className="mono-note">LOT 001 · {session ? "CHAIN DATA" : "NOT DEPLOYED"}</p><h3>The First <em>Edition</em></h3><p className="card-sub">{session ? "Read from the configured Tari provider." : "No fictional auction data is shown in live mode."}</p><div className="card-footer"><span><b>{session ? totalBids : "—"}</b> {session ? "sealed bids" : "chain bids"}</span><a href="#bid">Open lot <ArrowUpRight size={15} /></a></div></div></article><article className="auction-card"><div className="card-top"><span className="status-dot teal" /> READ-ONLY PREVIEW</div><div className="card-art art-two"><div className="moon-mark">◐</div></div><div className="card-meta"><p className="mono-note">LOT 002 · UNAVAILABLE</p><h3>Night <em>Index</em></h3><p className="card-sub">A real auction will appear after template deployment.</p><div className="card-footer"><span><b>—</b> chain bids</span><a href="#proof">Inspect <ArrowUpRight size={15} /></a></div></div></article></div></section>

      <section className="bid-section section-pad" id="bid"><div className="bid-intro"><p className="eyebrow"><span className="eyebrow-line" /> Lot 001 · The First Edition</p><h2>Make your<br /><em>mark.</em></h2><p>Your amount is encrypted in your wallet before it touches the auction. Only the winning amount is ever revealed.</p><div className="privacy-tag"><LockKeyhole size={14} /> CONFIDENTIAL RESOURCE</div></div><div className="bid-panel"><div className="panel-header"><span>PLACE A SEALED BID</span><span className="panel-step">01 — 02</span></div><label htmlFor="bid-amount">Your maximum offer</label><div className="amount-input"><span>tTARI</span><input id="bid-amount" type="number" min="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /><span className="input-cursor" /></div><div className="input-foot"><span>{demoMode ? "Offline preview only" : session ? "Wallet signs the transaction" : "Connect wallet before submitting"}</span><span>{demoMode ? `≈ ${(amount * 0.01).toFixed(2)} TARI preview` : "real tTARI"}</span></div><button className={`seal-button ${sealed ? "sealed" : ""}`} onClick={sealBid}>{sealed ? <><Check size={17} /> {demoMode ? "Preview sealed" : "Bid submitted"}</> : <>Seal this bid <ArrowUpRight size={16} /></>}</button><p className="demo-note"><CircleHelp size={13} /> {demoMode ? "Simulation — no transaction was submitted." : "Live mode — wallet approval required."}</p></div></section>

      <section className="whisper section-pad"><div className="section-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> The whisper wall</p><h2>All we know is<br /><em>that they came.</em></h2></div><span className="mono-note">{session ? `${totalBids.toString().padStart(2, "0")} CHAIN PARTICIPANTS` : "CHAIN DATA UNAVAILABLE"}</span></div><div className="whisper-list">{session && (sealed ? [...bids, { id: "PENDING…TX", time: "pending", state: "SUBMITTING" }] : bids).map((bid) => <div className="whisper-row" key={bid.id}><span className="row-id">{bid.id}</span><span className="redaction"><i /><i /><i /></span><span className="row-time">{bid.time}</span><span className="row-state">{bid.state}</span></div>)}{!session && <div className="empty-chain">Connect a Tari wallet to read live auction participants.</div>}</div></section>

      <section className="proof section-pad" id="proof"><div className="section-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> The proof</p><h2>Two views.<br /><em>One truth.</em></h2></div></div><div className="proof-grid"><div className="proof-card chain-view"><div className="proof-label">WHAT THE CHAIN SEES <span>PUBLIC</span></div><div className="chain-lines"><p>network <b>{session ? "esmeralda" : "—"}</b></p><p>wallet <b>{session ? `${session.address.slice(0, 8)}…` : "—"}</b></p><p>epoch <b>{session ? session.epoch : "—"}</b></p><p>amount <b className="blurred">{session ? "COMMITTED" : "—"}</b></p><p>owner <b className="blurred">{session ? "NOT READABLE" : "—"}</b></p></div><div className="proof-bottom"><LockKeyhole size={14} /> {session ? "PROVIDER VERIFIED" : "CONNECT WALLET TO READ"}</div></div><div className="proof-card human-view"><div className="proof-label">WHAT YOU SEE <span className="teal-label">PRIVATE</span></div><div className="reveal-number">{demoMode && sealed ? amount.toLocaleString() : "— — —"}<small>{demoMode && sealed ? "PREVIEW" : "tTARI"}</small></div><div className="proof-bottom teal-text"><span className="signal-dot" /> {demoMode ? "SIMULATION — NOT A CHAIN REVEAL" : "NO WINNER REVEAL WITHOUT DEPLOYED TEMPLATE"}</div></div></div></section>
      <footer className="footer"><div className="brand"><span className="brand-mark">✦</span> SEANCE</div><p>Private by design. Built for the Tari Ootle October build contest.</p><span className="mono-note">© 2026 · NO SECRETS LEFT BEHIND</span></footer>
    </main>
  );
}
