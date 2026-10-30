"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Check, ChevronRight, CircleHelp, LockKeyhole, Menu, Moon, Sun, Volume2, VolumeX, X } from "lucide-react";
import type { TariLiveSession } from "@/lib/tari";
import IdleMotion from "@/components/IdleMotion";

const SealScene = dynamic(() => import("@/components/SealScene"), { ssr: false, loading: () => <div className="seal-fallback is-loading" role="img" aria-label="Loading wax seal"><span>S</span><i /></div> });

const bids = [
  { id: "0x7A…91", time: "02:14", state: "SEALED" },
  { id: "0xB4…2E", time: "01:47", state: "SEALED" },
  { id: "0x19…C8", time: "00:58", state: "SEALED" },
  { id: "0xD2…44", time: "00:31", state: "SEALED" },
];

function SignalField() {
  return <div className="signal-field" data-idle-motion aria-hidden="true"><span className="orb orb-a" /><span className="orb orb-b" /><span className="orb orb-c" /><span className="ember-particle ember-particle-a" /><span className="ember-particle ember-particle-b" /><span className="ember-particle ember-particle-c" /><span className="ember-particle ember-particle-d" /><span className="ember-particle ember-particle-e" /><span className="ember-particle ember-particle-f" /></div>;
}

export default function Home() {
  const [demoMode, setDemoMode] = useState(false);
  const [sealed, setSealed] = useState(false);
  const [phase, setPhase] = useState<"bidding" | "reveal" | "settled">("bidding");
  const [revealed, setRevealed] = useState(false);
  const [revealAmount, setRevealAmount] = useState(420);
  const [salt, setSalt] = useState("");
  const [deposit] = useState(10);
  const [amount, setAmount] = useState(420);
  const [sound, setSound] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"crypt" | "study">(() => {
    if (typeof document === "undefined") return "crypt";
    return document.documentElement.dataset.theme === "study" ? "study" : "crypt";
  });
  const [session, setSession] = useState<TariLiveSession | null>(null);
  const [liveState, setLiveState] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [liveError, setLiveError] = useState("");
  const [auctionFee, setAuctionFee] = useState<bigint | null>(null);
  const [auctionMaxFee, setAuctionMaxFee] = useState<bigint | null>(null);
  const [auctionComponent, setAuctionComponent] = useState("");
  const [auctionResource, setAuctionResource] = useState("");
  const totalBids = useMemo(() => (demoMode && sealed ? 5 : demoMode ? 4 : 0), [demoMode, sealed]);
  const templateAddress = process.env.NEXT_PUBLIC_SEANCE_TEMPLATE_ADDRESS;
  const errorText = liveError.toLowerCase();
  const stateMessage = errorText.includes("insufficient") || errorText.includes("balance") ? "Insufficient funds. Add revealed tTARI to the selected account, then try again." : errorText.includes("account") || errorText.includes("component") ? "Wrong account selected. Select the seller account that owns the revealed deposit resource." : liveError ? liveError : liveState === "connecting" ? "The daemon is processing the request. Approve it in the wallet window." : auctionComponent ? "Transaction accepted. The auction component and deposit resource are ready." : session ? "Wallet connected. Live chain data is available." : "Wallet daemon not running. Start it, then connect the seller account.";
  useEffect(() => {
    const stored = window.localStorage.getItem("seance-theme") as "crypt" | "study" | null;
    const initial = stored ?? (window.matchMedia("(prefers-color-scheme: light)").matches ? "study" : "crypt");
    document.documentElement.dataset.theme = initial;
    const timer = window.setTimeout(() => setTheme(initial), 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("seance-theme", theme);
    document.dispatchEvent(new Event("seance-theme-change"));
  }, [theme]);
  useEffect(() => {
    const root = document.documentElement;
    const move = (event: MouseEvent) => { root.style.setProperty("--cursor-x", `${event.clientX}px`); root.style.setProperty("--cursor-y", `${event.clientY}px`); };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);
  useEffect(() => {
    history.scrollRestoration = "manual";
    const resetScroll = async () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (window.location.hash) window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
      const [{ ScrollTrigger }, { default: Lenis }] = await Promise.all([import("gsap/ScrollTrigger"), import("lenis")]);
      ScrollTrigger.clearScrollMemory();
      const lenis = new Lenis({ autoRaf: false });
      lenis.scrollTo(0, { immediate: true });
      ScrollTrigger.refresh();
      lenis.destroy();
    };
    void resetScroll();
    const onPageShow = () => { void resetScroll(); };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.classList.add("opening-lock");
    document.body.classList.add("opening-lock");
    const release = window.setTimeout(() => {
      root.classList.remove("opening-lock");
      document.body.classList.remove("opening-lock");
    }, reduced ? 80 : 1200);
    return () => window.clearTimeout(release);
  }, []);
  useEffect(() => {
    const magnets = Array.from(document.querySelectorAll<HTMLElement>(".magnetic"));
    const cleanups = magnets.map((element) => {
      const move = (event: MouseEvent) => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.12;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.12;
        element.style.transform = `translate(${x}px, ${y}px)`;
      };
      const leave = () => { element.style.transform = "translate(0, 0)"; };
      element.addEventListener("mousemove", move, { passive: true });
      element.addEventListener("mouseleave", leave, { passive: true });
      return () => { element.removeEventListener("mousemove", move); element.removeEventListener("mouseleave", leave); };
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);
  const connectWallet = async () => {
    setLiveState("connecting"); setLiveError("");
    try { const { connectTariLive } = await import("@/lib/tari"); setSession(await connectTariLive()); setLiveState("connected"); }
    catch (error) { setLiveState("error"); setLiveError(error instanceof Error ? error.message : "Could not connect to the Tari wallet daemon."); }
  };
  const sealBid = async () => {
    if (demoMode) { setSealed(true); return; }
    if (!session) { setLiveError("Connect the Tari wallet daemon before submitting a live bid."); setLiveState("error"); return; }
    if (!amount || amount <= 0) { setLiveError("Enter a bid greater than zero."); return; }
    const revealSalt = salt || crypto.randomUUID();
    setSalt(revealSalt);
    setLiveState("connecting"); setLiveError("");
    try {
      const microTari = BigInt(1000000);
      const { commitmentFor, commitAuctionBid } = await import("@/lib/tari");
      const commitment = await commitmentFor((BigInt(amount) * microTari).toString(), revealSalt);
      await commitAuctionBid(session, commitment, BigInt(deposit) * microTari);
      setSealed(true); setLiveState("connected");
    } catch (error) { setLiveState("error"); setLiveError(error instanceof Error ? error.message : "Commit transaction failed."); }
  };
  const closeBidding = async () => {
    if (demoMode) { setPhase("reveal"); return; }
    if (!session) { setLiveError("Connect the Tari wallet daemon before closing the auction."); setLiveState("error"); return; }
    setLiveState("connecting"); setLiveError("");
    try {
      const { closeAuction, settleAuction } = await import("@/lib/tari");
      if (phase === "reveal" && revealed) { await settleAuction(session); setPhase("settled"); }
      else { await closeAuction(session); setPhase("reveal"); }
      setLiveState("connected");
    } catch (error) { setLiveState("error"); setLiveError(error instanceof Error ? error.message : "Auction phase transaction failed."); }
  };
  const revealBid = async () => {
    if (demoMode) { setRevealed(true); setPhase("settled"); return; }
    if (!session) { setLiveError("Connect the Tari wallet daemon before revealing."); setLiveState("error"); return; }
    if (!salt) { setLiveError("The original salt is required for reveal."); return; }
    setLiveState("connecting"); setLiveError("");
    try { const { revealAuctionBid } = await import("@/lib/tari"); await revealAuctionBid(session, BigInt(revealAmount) * BigInt(1000000), salt); setRevealed(true); setLiveState("connected"); }
    catch (error) { setLiveState("error"); setLiveError(error instanceof Error ? error.message : "Reveal transaction failed."); }
  };
  const estimateAuction = async () => {
    if (demoMode) { setLiveError("Auction creation is disabled in Demo mode; no fee estimate is simulated."); setLiveState("error"); return; }
    if (!session) { setLiveError("Connect the seller wallet before creating an auction."); setLiveState("error"); return; }
    setLiveState("connecting"); setLiveError("");
    try {
      const { estimateAuctionCreation } = await import("@/lib/tari");
      const estimate = await estimateAuctionCreation(session);
      setAuctionFee(estimate.feeEstimateMicroTari); setAuctionMaxFee(estimate.maxFeeMicroTari); setLiveState("connected");
    } catch (error) { setLiveState("error"); setLiveError(error instanceof Error ? error.message : "Auction creation fee estimate failed."); }
  };
  const createAuctionLive = async () => {
    if (!session || auctionMaxFee === null) { setLiveError("Run a live fee estimate before creating the auction."); setLiveState("error"); return; }
    setLiveState("connecting"); setLiveError("");
    try {
      const { createAuction } = await import("@/lib/tari");
      const result = await createAuction(session, auctionMaxFee);
      setAuctionComponent(result.componentAddress); setAuctionResource(result.depositResource); setLiveState("connected");
    } catch (error) { setLiveState("error"); setLiveError(error instanceof Error ? error.message : "Auction creation transaction failed."); }
  };

  return (
    <main className="site-shell">
      <IdleMotion /><SignalField /><div className="grain" aria-hidden="true" />
      <nav className="topbar">
        <a className="brand" href="#top" aria-label="Seance home"><span className="brand-mark">✦</span> SEANCE</a>
        <div className={`nav-links ${menuOpen ? "is-open" : ""}`}><a href="#how">The ritual</a><a href="#auctions">Auctions</a><a href="#proof">Privacy proof</a></div>
        <div className="nav-actions"><button className="sound-button" onClick={() => setSound(!sound)} aria-label={sound ? "Mute sound" : "Enable sound"}>{sound ? <Volume2 size={15} /> : <VolumeX size={15} />}</button><button className="theme-toggle" suppressHydrationWarning onClick={() => setTheme(theme === "crypt" ? "study" : "crypt")} aria-label={`Switch to ${theme === "crypt" ? "the study" : "the crypt"}`}><span className="theme-orb"><Moon className="theme-icon-crypt" size={13} /><Sun className="theme-icon-study" size={13} /></span><span className="theme-label"><span className="theme-label-crypt">The crypt</span><span className="theme-label-study">The study</span></span></button><button className="mode-toggle" onClick={() => setDemoMode(!demoMode)}><span className={`toggle-dot ${!demoMode ? "live" : ""}`} /> {demoMode ? "Demo mode" : "Live mode"}</button><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu">{menuOpen ? <X size={19} /> : <Menu size={19} />}</button></div>
      </nav>
      <div className={`mode-banner ${demoMode ? "simulation" : "live"}`}><span className="status-dot" /> {demoMode ? "SIMULATION | offline preview only" : liveState === "connected" ? `LIVE | ${session?.address.slice(0, 12)}… · ${session?.balance} ${session?.balanceSymbol} · epoch ${session?.epoch}` : "LIVE MODE | Tari wallet required"}<button disabled={liveState === "connecting"} onClick={demoMode ? () => setDemoMode(false) : connectWallet}>{demoMode ? "Return to live mode" : liveState === "connected" ? "Wallet connected" : liveState === "connecting" ? "Connecting..." : "Connect wallet"}</button></div>
      {session && !demoMode && <div className="wallet-details" aria-live="polite"><span>ACCOUNT <b>{session.address}</b></span><span>BALANCE <b>{session.balance} {session.balanceSymbol}</b></span><span>SESSION <b>60 MIN · RECONNECT ON EXPIRY</b></span></div>}
      {liveError && <div className="live-error" role="alert">{liveError}<button aria-label="Dismiss error" onClick={() => setLiveError("")}><X size={14} /></button></div>}
      <div className={`state-panel state-${liveError ? "error" : liveState}`} role="status" aria-live="polite" aria-busy={liveState === "connecting"}><span className="state-indicator" /> <span>{stateMessage}</span>{liveError && <button className="text-link" onClick={() => setLiveError("")}>Dismiss</button>}</div>

      <section className="hero" id="top"><div className="hero-spotlight" aria-hidden="true" /><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line" /> A confidential auction house</p><h1><span>Let the</span><br /><span><em>highest</em> whisper.</span></h1><p className="hero-lede">Sealed bids for things worth keeping secret.<br />Built on Tari&apos;s commit/reveal ritual.</p><a className="cta magnetic" href="#auctions">Enter the auction <ArrowDownRight size={16} /></a></div><div className="hero-visual" data-idle-motion><SealScene /><span className="visual-note">CLICK THE SEAL · CRACK THE SILENCE</span></div><div className="hero-foot"><span>01 / 04</span><span>Scroll to descend <ArrowDownRight size={14} /></span></div></section>

      <section className="ritual-section section-pad" id="how"><div className="ritual-sticky"><p className="eyebrow"><span className="eyebrow-line" /> The ritual</p><h2>The room sees the ritual.<br /><em>Not before close.</em></h2><p className="ritual-intro">Three deliberate movements. A commitment, a reveal, a settlement. Every phase has a boundary the chain can verify.</p><div className="ritual-progress"><span className="ritual-progress-fill" /><span>01 / 03</span></div></div><div className="ritual-steps"><article className="ritual-step" data-idle-motion><div className="ritual-illustration commit-illustration"><span className="sigil-line" /><i /></div><div><p className="eyebrow">01 · Commit</p><h3>Seal the <em>amount.</em></h3><p>Hash the bid with a secret salt. During bidding, the chain sees only the commitment and the deposit.</p></div></article><article className="ritual-step" data-idle-motion><div className="ritual-illustration reveal-illustration"><span className="ritual-candle" /></div><div><p className="eyebrow">02 · Reveal</p><h3>Return with <em>proof.</em></h3><p>After close, reveal the amount and salt. A mismatch fails. A missing reveal forfeits the deposit.</p></div></article><article className="ritual-step" data-idle-motion><div className="ritual-illustration settle-illustration"><span /><span /><span /></div><div><p className="eyebrow">03 · Settle</p><h3>Let the rules <em>speak.</em></h3><p>The highest verified reveal wins. Losers are refunded. An equal reveal goes to the earliest commitment.</p></div></article></div></section>

      <section className="auction-section section-pad" id="auctions"><div className="section-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> Live chain state | {session ? `Epoch ${session.epoch}` : "Connect wallet to read"}</p><h2>Open <em>rooms</em></h2></div><a className="text-link" href="#proof">View chain proof <ChevronRight size={15} /></a></div><div className="auction-grid"><article className="auction-card featured" aria-busy={liveState === "connecting"}><div className="card-top"><span className="status-dot" /> {session ? "CONNECTED TO ESMERALDA" : liveState === "connecting" ? "READING PROVIDER" : "AWAITING WALLET CONNECTION"}</div><div className="card-art"><div className="wax-mark">S</div><div className="card-orbit" /></div><div className="card-meta"><p className="mono-note">LOT 001 · {demoMode ? "OFFLINE PREVIEW" : session ? "CHAIN DATA" : "NOT DEPLOYED"}</p><h3>The First <em>Edition</em></h3><p className="card-sub">{liveState === "connecting" ? <span className="skeleton-line" /> : demoMode ? "Simulation only." : session ? "Provider connected; auction data awaits a deployed component." : "No fictional auction data is shown in live mode."}</p><div className="card-footer"><span><b>{demoMode ? totalBids : "N/A"}</b> {demoMode ? "preview bids" : "chain bids"}</span><a className="magnetic" href="#bid">Open lot <ArrowUpRight size={15} /></a></div></div></article><article className="auction-card"><div className="card-top"><span className="status-dot teal" /> COMMIT / REVEAL</div><div className="card-art art-two"><div className="moon-mark">◐</div></div><div className="card-meta"><p className="mono-note">LOT 002 · UNAVAILABLE</p><h3>Night <em>Index</em></h3><p className="card-sub">Commitments are hidden while bidding; verified amounts are revealed at close.</p><div className="card-footer"><span><b>N/A</b> chain bids</span><a className="magnetic" href="#proof">Inspect <ArrowUpRight size={15} /></a></div></div></article></div><div className="create-auction-panel"><div><p className="eyebrow"><span className="eyebrow-line" /> Seller action</p><h3>Create the <em>room.</em></h3><p className="card-sub">Calls the published <code>instantiate(seller, deposit_resource)</code> constructor. No simulated fee or address is shown.</p>{auctionFee !== null && <p className="mono-note">REAL DRY-RUN FEE: <b>{auctionFee.toString()} µTARI</b> · MAX FEE: {auctionMaxFee?.toString()} µTARI</p>}{auctionComponent && <p className="mono-note">COMPONENT: <b>{auctionComponent}</b><br />DEPOSIT RESOURCE: <b>{auctionResource}</b></p>}</div><div className="create-auction-actions"><button className="seal-button" onClick={estimateAuction}>Estimate create fee</button>{auctionFee !== null && !auctionComponent && <button className="seal-button reveal-button" onClick={createAuctionLive}>Create auction</button>}</div></div></section>

      <section className="bid-section section-pad" id="bid"><div className="bid-intro"><p className="eyebrow"><span className="eyebrow-line" /> Phase 01 | Commit</p><h2>Make your<br /><em>mark.</em></h2><p>Hidden while bidding, revealed at the close. Commit a hash of your amount and a private salt, then deposit funds.</p><div className="privacy-tag"><LockKeyhole size={14} /> AMOUNT HIDDEN DURING COMMIT</div></div><div className="bid-panel"><div className="panel-header"><span>PLACE A COMMITMENT</span><span className="panel-step">01 | 03</span></div><label htmlFor="bid-amount">Your amount stays hidden now</label><div className="amount-input"><span>tTARI</span><input id="bid-amount" type="number" min="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /><span className="input-cursor" /></div><div className="input-foot"><span>{demoMode ? "Offline preview only" : session ? "Wallet signs the commitment" : "Connect wallet before submitting"}</span><span>{demoMode ? `≈ ${(amount * 0.01).toFixed(2)} TARI preview` : "deposit amount depends on resource"}</span></div><button className={`seal-button ${sealed ? "sealed" : ""}`} onClick={sealBid}>{sealed ? <><Check size={17} /> {demoMode ? "Commitment sealed" : "Commitment submitted"}</> : <>Seal commitment <ArrowUpRight size={16} /></>}</button><p className="demo-note"><CircleHelp size={13} /> {demoMode ? "Simulation | no transaction was submitted." : "Live mode | wallet approval required."}</p></div></section>

      <section className="reveal-section section-pad" id="reveal"><div className="reveal-copy"><p className="eyebrow"><span className="eyebrow-line" /> Phase 02 | Reveal</p><h2>The candle<br /><em>returns.</em></h2><p>After bidding closes, reveal the original amount and salt. The template checks the hash. Unrevealed bids forfeit their deposit.</p><button className="text-link phase-button" onClick={closeBidding}>{phase === "bidding" ? "Close bidding" : phase === "reveal" ? "Reveal phase open" : "Auction settled"} <ArrowUpRight size={15} /></button></div><div className="reveal-panel"><div className="reveal-candle"><div className="reveal-flame" /><div className="reveal-wick" /></div><div className="panel-header"><span>REVEAL YOUR COMMITMENT</span><span className="panel-step">02 | 03</span></div><label htmlFor="reveal-amount">Original amount</label><div className="amount-input"><span>tTARI</span><input id="reveal-amount" type="number" min="1" value={revealAmount} onChange={(e) => setRevealAmount(Number(e.target.value))} /></div><label htmlFor="reveal-salt">Private salt</label><input className="salt-input" id="reveal-salt" type="text" value={salt} onChange={(e) => setSalt(e.target.value)} placeholder="the salt used at commit" /><button className="seal-button reveal-button" onClick={revealBid}>{revealed ? "Reveal verified" : "Reveal amount and salt"} <ArrowUpRight size={16} /></button><p className="demo-note">{demoMode ? "Simulation | the hash check is represented locally." : "Live mode | no reveal transaction until a template is deployed."}</p></div></section>

      <section className="whisper section-pad"><div className="section-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> The whisper wall</p><h2>All we know is<br /><em>that they came.</em></h2></div><span className="mono-note">{demoMode ? `${totalBids.toString().padStart(2, "0")} PREVIEW PARTICIPANTS` : session ? "CHAIN PARTICIPANTS" : "CHAIN DATA UNAVAILABLE"}</span></div><div className="whisper-list">{(demoMode || session) && (sealed ? [...bids, { id: "PENDING…TX", time: "pending", state: "COMMITMENT" }] : bids).map((bid) => <div className="whisper-row" key={bid.id}><span className="row-id">{bid.id}</span><span className="redaction"><i /><i /><i /></span><span className="row-time">{bid.time}</span><span className="row-state">{bid.state}</span></div>)}{!demoMode && !session && <div className="empty-chain">Connect a Tari wallet to read live auction participants.</div>}</div></section>

      <section className="proof section-pad" id="proof"><div className="section-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> The proof</p><h2>Two views.<br /><em>One truth.</em></h2></div></div><div className="proof-grid"><div className="proof-card chain-view"><div className="proof-label">WHAT THE CHAIN SEES <span>PUBLIC</span></div><div className="chain-lines"><p>network <b>{session ? "esmeralda" : "N/A"}</b></p><p>wallet <b>{session ? `${session.address.slice(0, 8)}…` : "N/A"}</b></p><p>epoch <b>{session ? session.epoch : "N/A"}</b></p><p>template <b>{templateAddress ? `${templateAddress.slice(0, 16)}…` : "NOT CONFIGURED"}</b></p><p>commitment <b className="blurred">{session ? "PRESENT" : "N/A"}</b></p><p>amount at commit <b className="blurred">{session ? "HIDDEN" : "N/A"}</b></p></div><div className="proof-bottom"><LockKeyhole size={14} /> {session ? "PROVIDER VERIFIED" : "CONNECT WALLET TO READ"}</div></div><div className="proof-card human-view"><div className="proof-label">WHAT REVEAL SHOWS <span className="teal-label">AT CLOSE</span></div><div className="reveal-number">{demoMode && revealed ? revealAmount.toLocaleString() : "N/A"}<small>{demoMode && revealed ? "PREVIEW" : "tTARI"}</small></div><div className="proof-bottom teal-text"><span className="signal-dot" /> {demoMode ? "SIMULATION | REVEAL PREVIEW" : "AMOUNT IS REVEALED ONLY AFTER CLOSE"}</div></div></div></section>
      <footer className="footer"><div className="brand"><span className="brand-mark">✦</span> SEANCE</div><p>Sealed during bidding. Revealed at close.</p><span className="mono-note">© 2026 · COMMIT / REVEAL</span></footer>
    </main>
  );
}
