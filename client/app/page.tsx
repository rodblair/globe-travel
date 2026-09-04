"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Sparkles, Users, MessageSquare } from "lucide-react";
import { HorizonHero } from "@/components/atmosphere/HorizonHero";
import { ContourOverlay } from "@/components/atmosphere/ContourOverlay";
import { CompassRose } from "@/components/atmosphere/CompassRose";
import { GlobeBrand } from "@/components/atmosphere/GlobeBrand";
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
    <main className="bg-paper text-foreground" aria-label="Globe.travel overview">
      {/* ─────────────── HERO ─────────────── */}
      <div ref={heroRef}>
        <HorizonHero variant="noon" className="flex min-h-[92vh] flex-col">
          {/* Top bar */}
          <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 pt-5 md:px-6 md:pt-6">
            <Link href="/" className="flex min-h-11 items-center justify-self-start">
              <GlobeBrand />
            </Link>
            <nav className="hidden items-center gap-6 pt-1 t-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-2 md:flex">
              <Link href="#how" className="flex min-h-11 items-center hover:text-foreground transition-colors">
                How it works
              </Link>
              <Link href="#crew" className="flex min-h-11 items-center hover:text-foreground transition-colors">
                Live preview
              </Link>
              <Link href="/login" className="flex min-h-11 items-center hover:text-foreground transition-colors">
                Sign in
              </Link>
              <Button asChild size="sm" className="rounded-full px-5 normal-case tracking-normal">
                <Link href="/api/guest/start">Plan a trip</Link>
              </Button>
            </nav>
          </header>

          {/* Hero copy + product proof */}
          <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-12 md:px-6 md:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <motion.div style={{ y: driftY }} className="max-w-xl text-left">
              <p className="mb-4 t-mono text-[0.6875rem] uppercase tracking-[0.18em] text-[var(--brass)]">
                One shared plan for the whole group
              </p>
              <h1 className="h-hero mb-5 max-w-[13ch] text-foreground [&>em]:not-italic [&>em]:text-ink-2">
                Plan the trip everyone <em>can say yes to.</em>
              </h1>
              <p className="mb-7 max-w-[52ch] text-body-lg leading-relaxed text-ink-2">
                Describe the trip once. Globe builds a day-by-day itinerary, maps every stop,
                and gives your friends one clear place to react.
              </p>
              <div className="flex w-full max-w-md flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center">
                <Button asChild size="xl" className="rounded-full px-7">
                  <Link href="/api/guest/start" className="touch-target">
                    Plan a trip free
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="xl"
                  className="rounded-full px-7 text-foreground hover:bg-paper-raised"
                >
                  <Link href="#crew" className="touch-target">
                    See a sample day
                  </Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-ink-3">
                Free to start · Invite friends when you&apos;re ready
              </p>
            </motion.div>

            <motion.div
              {...fade}
              transition={{ ...fade.transition, delay: 0.12 }}
              className="relative mx-auto w-full max-w-[560px]"
              aria-label="Sample Kyoto group itinerary"
            >
              <div className="absolute -inset-5 rounded-[2rem] bg-[var(--paper-raised)]/45 blur-2xl" aria-hidden />
              <div className="card-paper relative aspect-[5/4] overflow-hidden rounded-[1.25rem] border border-rule-strong shadow-[var(--shadow-md)]">
                <MeridianFrame inset={10} length={14} color="var(--ink-3)" opacity={0.6} />
                <div className="paper-grain pointer-events-none absolute inset-0" />
                <div className="absolute inset-x-5 top-5 z-10 flex items-start justify-between gap-4">
                  <div>
                    <p className="t-mono text-[0.625rem] uppercase tracking-[0.22em] text-[var(--brass)]">Kyoto · Day 02</p>
                    <p className="mt-1 t-h3 text-foreground">Lanterns, markets & tea</p>
                  </div>
                  <span className="rounded-full border border-rule-strong bg-paper-raised px-3 py-1 text-xs text-ink-2">6 stops</span>
                </div>
                <div className="absolute inset-0 opacity-50">
                  <ContourOverlay density="dense" className="text-ink-2" />
                </div>
                <div className="absolute inset-x-4 bottom-10 top-16">
                  <ThreadDemo />
                </div>
                <div className="absolute inset-x-5 bottom-4 z-10 flex items-center justify-between t-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-3">
                  <span>09:00 → 22:00</span>
                  <span>14.2 km · walking</span>
                </div>
              </div>
              <div className="absolute -bottom-5 left-5 z-20 flex items-center gap-3 rounded-full border border-rule-strong bg-paper-raised px-4 py-2.5 shadow-[var(--panel-shadow-hover)]">
                <div className="flex -space-x-2" aria-hidden>
                  {["MP", "RB", "JL"].map((initials) => (
                    <span key={initials} className="grid h-8 w-8 place-items-center rounded-full border-2 border-[var(--paper-raised)] bg-[var(--paper-recessed)] text-[0.625rem] font-semibold text-ink-2">
                      {initials}
                    </span>
                  ))}
                </div>
                <span className="text-sm font-medium text-ink-2">3 friends reviewing</span>
              </div>
            </motion.div>
          </div>

          {/* value ledger */}
          <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-6 md:px-6 md:pb-8">
            <div className="grid grid-cols-3 gap-2 border-t border-rule-strong pt-4 t-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-2 sm:tracking-[0.16em]">
              <span>01 · Describe the trip</span>
              <span className="text-center">02 · Review one plan</span>
              <span className="text-right">03 · Share with friends</span>
            </div>
          </div>
        </HorizonHero>
      </div>

      {/* ─────────────── STANZA — opening line ─────────────── */}
	      <section className="relative overflow-hidden px-4 py-20 md:px-6 md:py-24">
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-rule" />
        <div className="paper-grain absolute inset-0 pointer-events-none" />
        <motion.div
          {...fade}
          className="relative mx-auto max-w-[760px] text-center"
        >
          <p className="mb-5 t-mono text-[0.6875rem] uppercase tracking-[0.2em] text-ink-2">
            Why it works
          </p>
          <p className="h-display leading-[1.14] text-foreground">
            A group trip is easier to book when the plan feels clear.{" "}
            <span className="text-ink-3 t-italic">
              Globe turns the messy chat into one calm itinerary
            </span>{" "}
            with a map people want to share.
          </p>
        </motion.div>
      </section>

      {/* ─────────────── HOW IT WORKS — three paper cards ─────────────── */}
      <section
        id="how"
	        className="relative bg-[var(--paper-recessed)] px-4 py-20 md:px-6 md:py-24"
      >
        <div aria-hidden className="absolute inset-0 -z-0">
          <ContourOverlay density="sparse" />
        </div>
        <div className="paper-grain absolute inset-0 pointer-events-none" />
        <div className="relative mx-auto max-w-6xl">
          <motion.div {...fade} className="mb-10 max-w-2xl md:mb-12">
            <p className="mb-4 t-mono text-[0.6875rem] uppercase tracking-[0.2em] text-ink-2">
              How it works
            </p>
            <h2 className="h-display leading-[1.1] text-foreground">
              Three steps from group chat to{" "}
              <span className="t-italic text-ink-2">shared itinerary.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
            {[
              {
                num: "01",
                kicker: "ORIENT",
                title: "Set the crew",
                body: "Tell Globe who is going, how each person likes to travel, and the rough shape of the trip you want.",
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
                className="card-paper relative p-6 shadow-[var(--panel-shadow)] transition-shadow hover:shadow-[var(--panel-shadow-hover)] md:p-7"
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
	        className="relative overflow-hidden bg-paper px-4 py-20 md:px-6 md:py-24"
      >
        <div className="paper-grain absolute inset-0 pointer-events-none" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <motion.div {...fade}>
            <p className="mb-4 t-mono text-[0.6875rem] uppercase tracking-[0.2em] text-ink-2">
              The Globe.travel map
            </p>
            <h2 className="mb-5 max-w-[18ch] h-display leading-[1.1] text-foreground">
              A brass thread connects the day.
            </h2>
            <p className="mb-6 max-w-md text-body-lg text-ink-2">
              Each stop becomes a star — earlier, later, where you sleep, where
              you eat. A walking sequence you can read at a glance. Move a stop
              and the thread re-draws.
            </p>
            <ul className="space-y-3 text-body text-ink-2 max-w-md">
              {[
                "Drag a place; the route smooths.",
                "Friends react inline — Globe folds it in.",
                "Share it. It feels unmistakably Globe.travel.",
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
	      <section className="relative overflow-hidden bg-[var(--paper-recessed)] px-4 py-20 md:px-6 md:py-24">
        <div aria-hidden className="absolute inset-0 -z-0 opacity-80">
          <ContourOverlay density="sparse" />
        </div>
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-rule"
        />
        <motion.div
          {...fade}
          className="relative mx-auto max-w-3xl text-center"
        >
          <CompassRose size={48} showLabels={false} className="mx-auto mb-6" />
          <h2 className="mb-5 h-display leading-[1.1] text-foreground">
            Your next group trip{" "}
            <span className="t-italic text-ink-3">begins here.</span>
          </h2>
          <p className="mx-auto mb-9 max-w-md text-body-lg text-ink-2">
            Free to start. Faster than a spreadsheet. Quieter than the chat.
          </p>
          <Button asChild size="xl" className="rounded-full px-8">
            <Link href="/signup" className="touch-target">
              Plan your first trip
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </section>

      <footer className="relative border-t border-rule bg-paper px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <GlobeBrand textClassName="text-[0.9375rem]" />
          <p className="t-mono text-[0.625rem] tracking-[0.18em] uppercase text-ink-3">
            © 2026 · BUILT FOR FRIENDS
          </p>
        </div>
      </footer>
    </main>
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
