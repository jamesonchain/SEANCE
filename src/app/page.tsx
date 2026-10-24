"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Check, ChevronRight, CircleHelp, LockKeyhole, Menu, Volume2, VolumeX, X } from "lucide-react";

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
  const [demoMode, setDemoMode] = useState(true);
  const [sealed, setSealed] = useState(false);
  const [amount, setAmount] = useState(420);
  const [sound, setSound] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const totalBids = useMemo(() => (sealed ? 5 : 4), [sealed]);

  return (
    <main className="site-shell">
      <SignalField /><div className="grain" aria-hidden="true" />
      <nav className="topbar">
        <a className="brand" href="#top" aria-label="Seance home"><span className="brand-mark">✦</span> SEANCE</a>
        <div className={`nav-links ${menuOpen ? "is-open" : ""}`}><a href="#how">The ritual</a><a href="#auctions">Auctions</a><a href="#proof">Privacy proof</a></div>
        <div className="nav-actions"><button className="sound-button" onClick={() => setSound(!sound)} aria-label={sound ? "Mute sound" : "Enable sound"}>{sound ? <Volume2 size={15} /> : <VolumeX size={15} />}</button><button className="mode-toggle" onClick={() => setDemoMode(!demoMode)}><span className={`toggle-dot ${!demoMode ? "live" : ""}`} /> {demoMode ? "Demo mode" : "Live mode"}</button><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu">{menuOpen ? <X size={19} /> : <Menu size={19} />}</button></div>
      </nav>

      <section className="hero" id="top"><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line" /> A confidential auction house</p><h1>Let the<br /><em>highest</em> whisper.</h1><p className="hero-lede">Sealed bids for things worth keeping secret.<br />Built on Tari&apos;s confidential layer.</p><a className="cta" href="#auctions">Enter the auction <ArrowDownRight size={16} /></a></div><div className="hero-seal" aria-label="A candle flame illuminates the auction house emblem"><div className="flame" /><div className="halo" /><span>PRIVATE<br /><small>BY DESIGN</small></span></div><div className="hero-foot"><span>01 / 04</span><span>Scroll to descend <ArrowDownRight size={14} /></span></div></section>

      <section className="statement section-pad" id="how"><p className="eyebrow"><span className="eyebrow-line" /> The premise</p><h2>The room sees the ritual.<br /><em>Never the number.</em></h2><div className="statement-grid"><p>SEANCE is a sealed bid auction where each offer travels as a confidential resource. The chain verifies the rules without publishing the amount.</p><span className="vertical-rule" /><p className="mono-note">NO PUBLIC BALANCES<br />NO GUESSES<br />NO BACKDOORS</p></div></section>

      <section className="auction-section section-pad" id="auctions"><div className="section-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> Live now · Block 018421</p><h2>Open <em>rooms</em></h2></div><a className="text-link" href="#proof">View all rooms <ChevronRight size={15} /></a></div><div className="auction-grid"><article className="auction-card featured"><div className="card-top"><span className="status-dot" /> CLOSING IN 04:17:09</div><div className="card-art"><div className="wax-mark">S</div><div className="card-orbit" /></div><div className="card-meta"><p className="mono-note">LOT 001 · ONE OF ONE</p><h3>The First <em>Edition</em></h3><p className="card-sub">A key to the room. Nothing more.</p><div className="card-footer"><span><b>{totalBids}</b> sealed bids</span><a href="#bid">Open lot <ArrowUpRight size={15} /></a></div></div></article><article className="auction-card"><div className="card-top"><span className="status-dot teal" /> REVEALING SOON</div><div className="card-art art-two"><div className="moon-mark">◐</div></div><div className="card-meta"><p className="mono-note">LOT 002 · SCARCITY</p><h3>Night <em>Index</em></h3><p className="card-sub">Coordinates to a place that isn&apos;t there.</p><div className="card-footer"><span><b>12</b> sealed bids</span><a href="#proof">Inspect <ArrowUpRight size={15} /></a></div></div></article></div></section>

      <section className="bid-section section-pad" id="bid"><div className="bid-intro"><p className="eyebrow"><span className="eyebrow-line" /> Lot 001 · The First Edition</p><h2>Make your<br /><em>mark.</em></h2><p>Your amount is encrypted in your wallet before it touches the auction. Only the winning amount is ever revealed.</p><div className="privacy-tag"><LockKeyhole size={14} /> CONFIDENTIAL RESOURCE</div></div><div className="bid-panel"><div className="panel-header"><span>PLACE A SEALED BID</span><span className="panel-step">01 — 02</span></div><label htmlFor="bid-amount">Your maximum offer</label><div className="amount-input"><span>tTARI</span><input id="bid-amount" type="number" min="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /><span className="input-cursor" /></div><div className="input-foot"><span>Balance hidden from the chain</span><span>≈ {amount ? (amount * 0.01).toFixed(2) : "0.00"} TARI</span></div><button className={`seal-button ${sealed ? "sealed" : ""}`} onClick={() => setSealed(true)}>{sealed ? <><Check size={17} /> Bid sealed</> : <>Seal this bid <ArrowUpRight size={16} /></>}</button><p className="demo-note"><CircleHelp size={13} /> {demoMode ? "Demo Mode is active — this is a simulation." : "Live mode — wallet approval required."}</p></div></section>

      <section className="whisper section-pad"><div className="section-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> The whisper wall</p><h2>All we know is<br /><em>that they came.</em></h2></div><span className="mono-note">{totalBids.toString().padStart(2, "0")} PARTICIPANTS</span></div><div className="whisper-list">{(sealed ? [...bids, { id: "YOU…NOW", time: "just now", state: "SEALED" }] : bids).map((bid) => <div className="whisper-row" key={bid.id}><span className="row-id">{bid.id}</span><span className="redaction"><i /><i /><i /></span><span className="row-time">{bid.time}</span><span className="row-state">{bid.state}</span></div>)}</div></section>

      <section className="proof section-pad" id="proof"><div className="section-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> The proof</p><h2>Two views.<br /><em>One truth.</em></h2></div></div><div className="proof-grid"><div className="proof-card chain-view"><div className="proof-label">WHAT THE CHAIN SEES <span>PUBLIC</span></div><div className="chain-lines"><p>auction_id <b>0x8f…2c</b></p><p>resource <b>stealth:TARI</b></p><p>bid_count <b>{totalBids}</b></p><p>amount <b className="blurred">████████</b></p><p>owner <b className="blurred">████████</b></p></div><div className="proof-bottom"><LockKeyhole size={14} /> COMMITMENT VERIFIED</div></div><div className="proof-card human-view"><div className="proof-label">WHAT YOU SEE <span className="teal-label">PRIVATE</span></div><div className="reveal-number">{sealed ? amount.toLocaleString() : "— — —"}<small>tTARI</small></div><div className="proof-bottom teal-text"><span className="signal-dot" /> ONLY THE WINNER SEES THEIR AMOUNT</div></div></div></section>
      <footer className="footer"><div className="brand"><span className="brand-mark">✦</span> SEANCE</div><p>Private by design. Built for the Tari Ootle October build contest.</p><span className="mono-note">© 2026 · NO SECRETS LEFT BEHIND</span></footer>
    </main>
  );
}
