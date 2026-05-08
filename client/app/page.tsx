"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Sparkles, Users, MessageSquare } from "lucide-react";
import { HorizonHero } from "@/components/atmosphere/HorizonHero";
import { ContourOverlay } from "@/components/atmosphere/ContourOverlay";
import { CompassRose } from "@/components/atmosphere/CompassRose";
import { ItineraryThread } from "@/components/atmosphere/ItineraryThread";
import { DestinationPin } from "@/components/atmosphere/DestinationPin";
import { MeridianFrame } from "@/components/atmosphere/MeridianFrame";
import { Button } from "@/components/ui/button";

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0, 0, 0.2, 1] as const },
};

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const driftY = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);

  return (
    <div className="bg-paper text-foreground">
      {/* ─────────────── HERO ─────────────── */}
      <div ref={heroRef}>
        <HorizonHero
          coordinate="35°00′N · 135°46′E · KYOTO"
          variant="dawn"
          className="min-h-[88vh] flex flex-col"
        >
          {/* Top bar */}
          <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-6">
            <Link href="/" className="flex items-center gap-3">
              <CompassRose size={32} showLabels={false} />
              <span className="t-serif text-[1.0625rem] tracking-[-0.005em] text-paper">
                Globe<span className="text-paper/65">.travel</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-7 t-mono text-[0.6875rem] tracking-[0.16em] uppercase text-paper/75">
              <Link href="#how" className="hover:text-paper transition-colors">
                How it works
              </Link>
              <Link href="#crew" className="hover:text-paper transition-colors">
                For groups
              </Link>
              <Link href="/login" className="hover:text-paper transition-colors">
                Sign in
              </Link>
            </nav>
            <Link
              href="/signup"
              className="t-mono text-[0.6875rem] tracking-[0.16em] uppercase rounded-full border border-paper/35 px-4 py-2 text-paper hover:border-paper/60 hover:bg-paper/10 transition"
            >
              Begin
            </Link>
          </header>

          {/* Hero copy */}
          <motion.div
            style={{ y: driftY }}
            className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center"
          >
            <p className="t-mono text-[0.6875rem] tracking-[0.24em] uppercase text-paper/80 mb-6">
              An atmospheric weekend planner
            </p>
            <h1 className="h-hero text-paper max-w-[20ch] mx-auto mb-6 [&>em]:not-italic [&>em]:text-paper/70">
              The city break your group <em>will actually book.</em>
            </h1>
            <p className="text-body-lg text-paper/75 max-w-xl mx-auto leading-relaxed mb-10">
              A quiet workspace where friends pick a city, line up dates,
              balance budgets, and arrive with a 48-hour plan everyone is
              excited to share.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button asChild size="xl" className="rounded-full px-7">
                <Link href="/signup">
                  Begin a weekend
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="xl"
                className="rounded-full px-7 text-paper hover:bg-paper/10"
              >
                <Link href="/chat">
                  Open the planner
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* horizon ledger */}
          <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-8">
            <div className="flex items-end justify-between gap-6 t-mono text-[0.6875rem] tracking-[0.18em] uppercase text-paper/75">
              <span>EST. 2024 · TORONTO</span>
              <span className="hidden sm:inline">SCROLL · 03 SECTIONS</span>
              <span className="text-right">
                FOR FRIENDS WHO TRAVEL TOGETHER
              </span>
            </div>
          </div>
        </HorizonHero>
      </div>

      {/* ─────────────── STANZA — opening line ─────────────── */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-rule" />
        <div className="paper-grain absolute inset-0 pointer-events-none" />
        <motion.div
          {...fade}
          className="relative max-w-3xl mx-auto text-center"
        >
          <p className="t-mono text-[0.6875rem] tracking-[0.24em] uppercase text-ink-3 mb-6">
            § ONE — A QUIET PREMISE
          </p>
          <p className="h-display leading-[1.18] text-foreground">
            A weekend with friends is short.{" "}
            <span className="text-ink-3 t-italic">
              The plan should be short, too —
            </span>{" "}
            a single legible page everyone can read on the train.
          </p>
        </motion.div>
      </section>

      {/* ─────────────── HOW IT WORKS — three paper cards ─────────────── */}
      <section
        id="how"
        className="relative px-6 py-24 bg-[var(--paper-recessed)]"
      >
        <div aria-hidden className="absolute inset-0 -z-0">
          <ContourOverlay density="sparse" />
        </div>
        <div className="paper-grain absolute inset-0 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto">
          <motion.div {...fade} className="mb-16 max-w-2xl">
            <p className="t-mono text-[0.6875rem] tracking-[0.24em] uppercase text-ink-3 mb-4">
              § TWO — HOW IT WORKS
            </p>
            <h2 className="h-display leading-[1.1] text-foreground">
              Three steps from group chat to{" "}
              <span className="t-italic text-ink-2">go-bag.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                kicker: "ORIENT",
                title: "Set the crew",
                body: "Tell Globe who is going, how each person likes to travel, and the rough shape of the weekend you want.",
                icon: Users,
              },
              {
                num: "02",
                kicker: "DRAFT",
                title: "Read a real plan",
                body: "An opinionated 2-3 day itinerary with the right neighbourhoods, pacing, and venues. Not a list — a sequence.",
                icon: Sparkles,
              },
              {
                num: "03",
                kicker: "ALIGN",
                title: "Share & lock in",
                body: "Friends react in one place. Globe folds the feedback in. Nobody opens a tenth chat thread.",
                icon: MessageSquare,
              },
            ].map((step, i) => (
              <motion.article
                key={step.num}
                {...fade}
                transition={{
                  ...fade.transition,
                  delay: i * 0.08,
                }}
                className="card-paper relative p-7 shadow-[var(--panel-shadow)] hover:shadow-[var(--panel-shadow-hover)] transition-shadow"
              >
                <MeridianFrame inset={6} length={10} color="var(--rule-strong)" opacity={0.7} />
                <p className="t-mono text-[0.625rem] tracking-[0.22em] uppercase text-[var(--brass)] mb-3">
                  {step.kicker} · {step.num}
                </p>
                <step.icon className="h-5 w-5 mb-5 text-ink-2" strokeWidth={1.4} />
                <h3 className="t-h3 text-foreground mb-3">{step.title}</h3>
                <p className="text-body text-ink-2">{step.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── ITINERARY THREAD DEMO ─────────────── */}
      <section
        id="crew"
        className="relative px-6 py-28 overflow-hidden bg-paper"
      >
        <div className="paper-grain absolute inset-0 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.05fr] gap-14 items-center">
          <motion.div {...fade}>
            <p className="t-mono text-[0.6875rem] tracking-[0.24em] uppercase text-ink-3 mb-4">
              § THREE — THE THREAD
            </p>
            <h2 className="h-display leading-[1.1] text-foreground mb-6 max-w-[18ch]">
              A brass thread connects the day.
            </h2>
            <p className="text-body-lg text-ink-2 max-w-md mb-7">
              Each stop becomes a star — earlier, later, where you sleep, where
              you eat. A walking sequence you can read at a glance. Move a stop
              and the thread re-draws.
            </p>
            <ul className="space-y-3 text-body text-ink-2 max-w-md">
              {[
                "Drag a place; the route smooths.",
                "Friends react inline — Globe folds it in.",
                "Print it. It looks like a keepsake.",
              ].map((line, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-[7px] h-[6px] w-[6px] rounded-full bg-[var(--brass)] shrink-0"
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Itinerary canvas */}
          <motion.div
            {...fade}
            transition={{ ...fade.transition, delay: 0.1 }}
          >
            <div className="relative card-paper aspect-[4/5] sm:aspect-[5/6] overflow-hidden shadow-[var(--shadow-md)]">
              <MeridianFrame inset={10} length={14} color="var(--ink-3)" opacity={0.6} />
              <div className="paper-grain absolute inset-0 pointer-events-none" />
              {/* day stamp */}
              <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
                <span className="t-mono text-[0.625rem] tracking-[0.22em] uppercase text-ink-3">
                  DAY 02 · KYOTO
                </span>
                <span className="t-mono text-[0.625rem] tracking-[0.22em] uppercase text-ink-3">
                  09:00 → 22:00
                </span>
              </div>
              {/* contour bg */}
              <div className="absolute inset-0 opacity-[0.55]">
                <ContourOverlay density="dense" className="text-ink-2" />
              </div>
              {/* the thread + pins */}
              <ThreadDemo />
              {/* footer ledger */}
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between t-mono text-[0.625rem] tracking-[0.18em] uppercase text-ink-3">
                <span>06 STOPS</span>
                <span>14.2 KM · WALKING</span>
                <span>9 hrs</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─────────────── CTA ─────────────── */}
      <section className="relative px-6 py-32 bg-[var(--paper-recessed)] overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-0 opacity-80">
          <ContourOverlay density="sparse" />
        </div>
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-rule"
        />
        <motion.div
          {...fade}
          className="relative max-w-3xl mx-auto text-center"
        >
          <CompassRose size={56} showLabels={false} className="mb-8 mx-auto" />
          <h2 className="h-display leading-[1.1] text-foreground mb-5">
            Your next short city break{" "}
            <span className="t-italic text-ink-3">begins here.</span>
          </h2>
          <p className="text-body-lg text-ink-2 max-w-md mx-auto mb-10">
            Free to start. Faster than a spreadsheet. Quieter than the chat.
          </p>
          <Button asChild size="xl" className="rounded-full px-8">
            <Link href="/signup">
              Plan your first weekend
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </section>

      <footer className="relative px-6 py-10 border-t border-rule bg-paper">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <CompassRose size={20} showLabels={false} />
            <span className="t-serif text-[0.9375rem] text-foreground">
              Globe<span className="text-ink-3">.travel</span>
            </span>
          </div>
          <p className="t-mono text-[0.625rem] tracking-[0.18em] uppercase text-ink-3">
            © 2026 · BUILT FOR FRIENDS
          </p>
        </div>
      </footer>
    </div>
  );
}

// Thread demo with curated points + DestinationPins on top of the SVG.
function ThreadDemo() {
  const w = 480;
  const h = 580;
  const pts = [
    { x: 90, y: 460, label: "Café Bibliotic", n: 1, mag: 3 as const },
    { x: 170, y: 380, label: "Nishiki Market", n: 2, mag: 2 as const },
    { x: 280, y: 330, label: "Kennin-ji", n: 3, mag: 3 as const },
    { x: 360, y: 240, label: "Yasaka Lantern", n: 4, mag: 2 as const },
    { x: 290, y: 150, label: "Kiyomizu-dera", n: 5, mag: 1 as const },
    { x: 150, y: 110, label: "Pontochō dinner", n: 6, mag: 2 as const },
  ];
  return (
    <div className="absolute inset-0">
      <ItineraryThread
        points={pts}
        width={w}
        height={h}
        className="absolute inset-0 w-full h-full"
      />
      {pts.map((p) => (
        <div
          key={p.n}
          className="absolute"
          style={{
            left: `${(p.x / w) * 100}%`,
            top: `${(p.y / h) * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <DestinationPin
            magnitude={p.mag}
            number={p.n}
            label={p.label}
          />
        </div>
      ))}
    </div>
  );
}
