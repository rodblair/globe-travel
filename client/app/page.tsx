"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Users, Map, Sparkles, MessageSquare } from "lucide-react";
import LandingGlobe from "@/components/globes/LandingGlobe";

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0, 0, 0.2, 1] as const },
};

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const globeY = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], ["0%", "10%", "5%", "15%"]);
  const globeX = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], ["0%", "10%", "-8%", "12%", "-5%"]);
  const globeScale = useTransform(scrollYProgress, [0, 0.4, 0.7, 1], [1, 1.05, 0.95, 1.02]);
  const globeOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.85, 0.7]);

  const starsY = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6, 0.8, 1], ["0%", "8%", "5%", "18%", "12%", "25%"]);
  const starsX = useTransform(scrollYProgress, [0, 0.15, 0.35, 0.55, 0.75, 1], ["0%", "-3%", "5%", "-8%", "2%", "-12%"]);
  const stars2Y = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], ["0%", "-5%", "10%", "3%", "20%"]);
  const stars2X = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], ["0%", "6%", "-4%", "8%"]);

  return (
    <div ref={containerRef} className="bg-black text-white relative">
      {/* Stars layer 1 */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-2"
        style={{ y: starsY, x: starsX }}
        animate={{ opacity: [0.6, 0.45, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(2.5px 2.5px at 3% 8%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 12% 22%, rgba(255,255,255,0.6), transparent),
              radial-gradient(2.5px 2.5px at 7% 48%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 18% 72%, rgba(255,255,255,0.55), transparent),
              radial-gradient(2.5px 2.5px at 5% 91%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 28% 5%, rgba(255,255,255,0.6), transparent),
              radial-gradient(2.5px 2.5px at 35% 33%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 42% 58%, rgba(255,255,255,0.55), transparent),
              radial-gradient(2.5px 2.5px at 31% 85%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 52% 12%, rgba(255,255,255,0.6), transparent),
              radial-gradient(2.5px 2.5px at 58% 41%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 48% 68%, rgba(255,255,255,0.55), transparent),
              radial-gradient(2.5px 2.5px at 55% 94%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 68% 18%, rgba(255,255,255,0.6), transparent),
              radial-gradient(2.5px 2.5px at 75% 52%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 72% 78%, rgba(255,255,255,0.55), transparent),
              radial-gradient(2.5px 2.5px at 85% 6%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 91% 29%, rgba(255,255,255,0.6), transparent),
              radial-gradient(2.5px 2.5px at 88% 55%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 95% 82%, rgba(255,255,255,0.55), transparent)
            `,
          }}
        />
      </motion.div>

      {/* Stars layer 2 */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-2"
        style={{ y: stars2Y, x: stars2X }}
        animate={{ opacity: [0.55, 0.65, 0.55] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(2px 2px at 9% 15%, rgba(255,255,255,0.6), transparent),
              radial-gradient(2.5px 2.5px at 16% 38%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 11% 62%, rgba(255,255,255,0.55), transparent),
              radial-gradient(2.5px 2.5px at 22% 88%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 38% 11%, rgba(255,255,255,0.6), transparent),
              radial-gradient(2.5px 2.5px at 45% 45%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 33% 71%, rgba(255,255,255,0.55), transparent),
              radial-gradient(2.5px 2.5px at 62% 25%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 66% 62%, rgba(255,255,255,0.6), transparent),
              radial-gradient(2.5px 2.5px at 59% 88%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 78% 8%, rgba(255,255,255,0.55), transparent),
              radial-gradient(2.5px 2.5px at 82% 42%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 79% 72%, rgba(255,255,255,0.6), transparent),
              radial-gradient(2.5px 2.5px at 93% 48%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 97% 75%, rgba(255,255,255,0.55), transparent)
            `,
          }}
        />
      </motion.div>

      {/* Globe */}
      <motion.div
        className="fixed inset-0 z-1 pointer-events-auto"
        style={{ x: globeX, y: globeY, scale: globeScale, opacity: globeOpacity }}
      >
        <LandingGlobe />
      </motion.div>

      {/* ─── HERO ─── */}
      <div className="relative h-screen overflow-hidden z-10">
        <div
          className="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-transparent"
          style={{ height: "50%" }}
        />
        <div className="relative h-full flex flex-col items-center justify-center">
          <motion.div
            className="text-center max-w-4xl px-6"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
          >
            <motion.p
              className="text-xs font-semibold tracking-[0.25em] uppercase text-amber-400/80 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              AI planning for short city breaks
            </motion.p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold mb-6 leading-[1.1] tracking-tight font-serif">
              <span className="text-white">The city break your group</span>
              <br />
              <span className="text-white/70 italic">will actually book.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Globe helps friends pick a city, line up dates, balance budgets, and build a tight 2–3 day plan
              everyone is excited to share.
            </p>
            <button
              onClick={() => router.push("/signup")}
              className="group relative h-16 mx-auto rounded-full overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-105 shadow-lg shadow-black/30 hover:shadow-xl flex items-center justify-center gap-3"
              style={{ width: "280px" }}
            >
              <div
                className="absolute inset-0 opacity-35"
                style={{
                  backgroundImage: "url('/r6.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to right, rgba(25, 22, 18, 0.95) 0%, rgba(25, 22, 18, 0.8) 35%, rgba(25, 22, 18, 0.3) 65%, transparent 100%)",
                }}
              />
              <span className="relative z-10 text-white font-semibold text-xl font-serif tracking-wide">
                Start your group break
              </span>
              <ArrowRight className="relative z-10 w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>

      {/* ─── PROBLEM ─── */}
      <section className="relative z-10 py-28 px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.65) 80%, rgba(0,0,0,0.85) 100%)",
          }}
        />
        <div className="max-w-5xl mx-auto relative">
          <motion.div className="mb-16" {...fadeInUp}>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-400/70 mb-4">The problem</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold font-serif leading-tight max-w-3xl">
              Short-break planning falls apart fast.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden">
            {[
              {
                num: "01",
                title: "The group chat spins forever",
                body: "One chat for dates, one for flights, one for restaurants — and somehow nobody knows what is actually decided.",
              },
              {
                num: "02",
                title: "Weekends are short",
                body: "You only have 48-72 hours, so a slow decision means a rushed itinerary, the wrong neighbourhood, and missed reservations.",
              },
              {
                num: "03",
                title: "Everyone wants something different",
                body: "One friend wants food, another wants galleries, someone just wants a cute hotel and an easy pace. The plan needs to reconcile all of it.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.num}
                className="p-8 md:p-10"
                style={{ background: "rgba(12, 11, 9, 0.5)" }}
                {...fadeInUp}
                transition={{ delay: i * 0.1, duration: 0.7, ease: [0, 0, 0.2, 1] }}
              >
                <span className="text-5xl font-serif text-white/8 block mb-4">{item.num}</span>
                <h3 className="text-lg font-semibold font-serif text-white mb-3">{item.title}</h3>
                <p className="text-white/45 font-serif italic leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOLUTION ─── */}
      <section className="relative z-10 py-28 px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 30% 50%, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.8) 100%)",
          }}
        />
        <div className="max-w-5xl mx-auto relative">
          <motion.div className="mb-16" {...fadeInUp}>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-400/70 mb-4">How Globe works</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold font-serif leading-tight max-w-3xl">
              AI that understands the group,
              <br />
              <span className="text-white/60 italic">and the kind of weekend you want.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Travel DNA — large */}
            <motion.div
              className="md:row-span-2 rounded-2xl overflow-hidden relative min-h-72 group"
              style={{ background: "rgba(15, 12, 10, 0.4)" }}
              {...fadeInUp}
            >
              <div
                className="absolute inset-0 opacity-40 group-hover:opacity-55 transition-opacity duration-500"
                style={{
                  backgroundImage: "url('/r8.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "saturate(0.7)",
                }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-black/10" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold tracking-widest uppercase text-amber-400/80">Group fit</span>
                </div>
                <h3 className="text-2xl font-semibold mb-3 font-serif text-white">
                  It learns how your crew travels
                </h3>
                <p className="text-white/55 font-serif italic text-lg leading-relaxed">
                  Globe maps each person&apos;s style — food-first, design lover, nightlife energy, slow mornings, low-budget, premium stays — then builds a break the whole group can say yes to.
                </p>
              </div>
            </motion.div>

            {/* AI Itinerary */}
            <motion.div
              className="rounded-2xl overflow-hidden relative group"
              style={{ background: "rgba(15, 12, 10, 0.4)" }}
              {...fadeInUp}
              transition={{ delay: 0.1, duration: 0.7, ease: [0, 0, 0.2, 1] as const }}
            >
              <div
                className="absolute inset-0 opacity-40 group-hover:opacity-55 transition-opacity duration-500"
                style={{
                  backgroundImage: "url('/r7.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "saturate(0.7)",
                }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10" />
              <div className="relative p-7">
                <div className="flex items-center gap-2 mb-3">
                  <Map className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold tracking-widest uppercase text-amber-400/80">Weekend planner</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 font-serif text-white">
                  A realistic 48-hour plan
                </h3>
                <p className="text-white/50 font-serif italic leading-relaxed">
                  Globe turns a destination into a sharp day-by-day city break with the right neighbourhoods, pacing, and real stops you can actually make.
                </p>
              </div>
            </motion.div>

            {/* Friend Loop */}
            <motion.div
              className="rounded-2xl overflow-hidden relative group"
              style={{ background: "rgba(15, 12, 10, 0.4)" }}
              {...fadeInUp}
              transition={{ delay: 0.15, duration: 0.7, ease: [0, 0, 0.2, 1] as const }}
            >
              <div
                className="absolute inset-0 opacity-40 group-hover:opacity-55 transition-opacity duration-500"
                style={{
                  backgroundImage: "url('/r13.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "saturate(0.7)",
                }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10" />
              <div className="relative p-7">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold tracking-widest uppercase text-amber-400/80">Friend loop</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 font-serif text-white">
                  Coordinate without the chaos
                </h3>
                <p className="text-white/50 font-serif italic leading-relaxed">
                  Share the draft, let friends react to neighbourhoods and stops, and let AI reconcile the feedback into one clear plan instead of twenty conflicting messages.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative z-10 py-28 px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.7) 100%)",
          }}
        />
        <div className="max-w-5xl mx-auto relative">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-400/70 mb-4">The flow</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-4 font-serif">
              From group chat to go-bag
            </h2>
            <p className="text-white/45 text-lg max-w-xl mx-auto font-serif italic">
              Three steps. No spreadsheets.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                img: "/r10.png",
                title: "Set the crew vibe",
                body: "Tell Globe who is going, how each person likes to travel, your rough budget, and how packed the weekend should feel.",
              },
              {
                num: "02",
                img: "/r12.png",
                title: "Get a crisp city-break plan",
                body: "Pick a city and length of stay. Globe generates an opinionated 2-3 day itinerary with real venues, timing, and a pace that fits the group.",
              },
              {
                num: "03",
                img: "/r1.png",
                title: "Share, vote, and lock it in",
                body: "Send the trip to the group, gather reactions quickly, and regenerate the plan around what the crew actually wants to do together.",
              },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                className="relative rounded-2xl overflow-hidden backdrop-blur-sm border border-white/5 group"
                style={{ background: "rgba(15, 12, 10, 0.35)" }}
                {...fadeInUp}
                transition={{ delay: i * 0.1, duration: 0.7, ease: [0, 0, 0.2, 1] }}
              >
                <div
                  className="h-44 opacity-50 group-hover:opacity-65 transition-opacity duration-500"
                  style={{
                    backgroundImage: `url('${step.img}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "saturate(0.8)",
                  }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/20" />
                <div className="absolute top-4 left-4">
                  <span className="text-5xl font-serif text-white/10">{step.num}</span>
                </div>
                <div className="p-6 relative">
                  <h3 className="text-lg font-semibold mb-2 font-serif text-white">{step.title}</h3>
                  <p className="text-white/45 font-serif italic leading-relaxed text-sm">{step.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BROADER ECOSYSTEM ─── */}
      <section className="relative z-10 py-28 px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.8) 100%)",
          }}
        />
        <div className="max-w-5xl mx-auto relative">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-400/70 mb-4">Your city-break toolkit</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-4 font-serif">
              Everything a friend group needs
            </h2>
            <p className="text-white/45 text-lg max-w-xl mx-auto font-serif italic">
              Built for quick escapes, shared taste, and plans that survive contact with the group chat.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            <motion.div
              className="md:col-span-2 lg:col-span-2 rounded-2xl overflow-hidden relative min-h-64 group border border-white/5"
              style={{ background: "rgba(15, 12, 10, 0.4)" }}
              {...fadeInUp}
            >
              <div
                className="absolute inset-0 opacity-50 group-hover:opacity-60 transition-opacity duration-500"
                style={{
                  backgroundImage: "url('/r8.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "saturate(0.8)",
                }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-black/20" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h3 className="text-2xl font-semibold mb-2 font-serif text-white">City-break map</h3>
                <p className="text-white/55 font-serif italic text-lg">
                  See where your group has already gone and spot the next easy win for a quick getaway.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="rounded-2xl overflow-hidden relative group border border-white/5"
              style={{ background: "rgba(15, 12, 10, 0.35)" }}
              {...fadeInUp}
              transition={{ delay: 0.1, duration: 0.7, ease: [0, 0, 0.2, 1] as const }}
            >
              <div
                className="absolute inset-0 opacity-45 group-hover:opacity-60 transition-opacity duration-500"
                style={{
                  backgroundImage: "url('/r11.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "saturate(0.8)",
                }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/20" />
              <div className="relative p-6">
                <h3 className="text-xl font-semibold mb-2 font-serif text-white">Shared notes</h3>
                <p className="text-white/50 font-serif italic">
                  Keep the best restaurants, hotels, and hidden finds your friends want to remember for the next escape.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="md:col-span-2 lg:col-span-2 rounded-2xl overflow-hidden relative group border border-white/5"
              style={{ background: "rgba(15, 12, 10, 0.35)" }}
              {...fadeInUp}
              transition={{ delay: 0.15, duration: 0.7, ease: [0, 0, 0.2, 1] as const }}
            >
              <div
                className="absolute inset-0 opacity-40 group-hover:opacity-55 transition-opacity duration-500"
                style={{
                  backgroundImage: "url('/r9.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "saturate(0.8)",
                }}
              />
              <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/50 to-black/30" />
              <div className="relative p-8">
                <h3 className="text-xl font-semibold mb-2 font-serif text-white">Weekend shortlist</h3>
                <p className="text-white/50 font-serif italic text-lg">
                  Build a tight shortlist of cities the whole crew could do next and keep it ready to book.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="rounded-2xl overflow-hidden relative group border border-white/5"
              style={{ background: "rgba(15, 12, 10, 0.35)" }}
              {...fadeInUp}
              transition={{ delay: 0.2, duration: 0.7, ease: [0, 0, 0.2, 1] as const }}
            >
              <div
                className="absolute inset-0 opacity-45 group-hover:opacity-60 transition-opacity duration-500"
                style={{
                  backgroundImage: "url('/r13.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "saturate(0.8)",
                }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/20" />
              <div className="relative p-6">
                <h3 className="text-xl font-semibold mb-2 font-serif text-white">Share & compare</h3>
                <p className="text-white/50 font-serif italic">
                  Compare preferences, line up overlap, and find the trip idea everyone is most likely to say yes to.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── LIVE ITINERARY CALLOUT ─── */}
      <section className="relative z-10 py-24 px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.75) 100%)",
          }}
        />
        <motion.div className="max-w-4xl mx-auto relative" {...fadeInUp}>
          <div
            className="rounded-2xl border border-white/8 p-10 md:p-14 text-center"
            style={{ background: "rgba(12, 11, 9, 0.6)" }}
          >
            <div className="flex items-center justify-center gap-2 mb-5">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-400/80">Living itinerary</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-5 font-serif leading-tight">
              &ldquo;Swap the Saturday dinner for somewhere with outdoor seating.&rdquo;
            </h2>
            <p className="text-white/45 text-lg font-serif italic max-w-xl mx-auto leading-relaxed">
              One message to your itinerary and Globe updates the plan — new venue, smarter walk order, the crew aligned before anyone opens a tenth chat thread.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative z-10 py-28 px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.7) 100%)",
          }}
        />
        <motion.div className="max-w-5xl mx-auto text-center relative" {...fadeInUp}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-5 font-serif">
            Your next short city break
            <br />
            <span className="text-white/60 italic">starts here.</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Free to start. Faster than a spreadsheet. Better than a group chat spiral.
          </p>
          <button
            onClick={() => router.push("/signup")}
            className="group inline-flex items-center gap-3 bg-white hover:bg-white/90 text-black font-semibold text-lg px-10 py-5 rounded-full transition-all duration-300 hover:scale-105 shadow-lg shadow-black/30"
          >
            Plan your first weekend
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 py-8 px-6 bg-black border-t border-white/10">
        <div className="max-w-5xl mx-auto flex items-center justify-center">
          <p className="text-gray-400 text-sm">
            &copy; 2026 Globe Travel. Built for city breaks with friends.
          </p>
        </div>
      </footer>
    </div>
  );
}
