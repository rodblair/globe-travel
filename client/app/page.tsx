"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";

const LandingGlobe = dynamic(() => import("@/components/globes/LandingGlobe"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black" />,
});

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6, ease: [0, 0, 0.2, 1] as const },
};

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.1,
    },
  },
  viewport: { once: true },
};

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/signup");
  }, [router]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const globeY = useTransform(
    scrollYProgress,
    [0, 0.3, 0.6, 1],
    ["0%", "10%", "5%", "15%"],
  );
  const globeX = useTransform(
    scrollYProgress,
    [0, 0.25, 0.5, 0.75, 1],
    ["0%", "10%", "-8%", "12%", "-5%"],
  );
  const globeScale = useTransform(
    scrollYProgress,
    [0, 0.4, 0.7, 1],
    [1, 1.05, 0.95, 1.02],
  );
  const globeOpacity = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [1, 0.85, 0.7],
  );

  const starsY = useTransform(
    scrollYProgress,
    [0, 0.2, 0.4, 0.6, 0.8, 1],
    ["0%", "8%", "5%", "18%", "12%", "25%"],
  );
  const starsX = useTransform(
    scrollYProgress,
    [0, 0.15, 0.35, 0.55, 0.75, 1],
    ["0%", "-3%", "5%", "-8%", "2%", "-12%"],
  );

  const stars2Y = useTransform(
    scrollYProgress,
    [0, 0.25, 0.5, 0.75, 1],
    ["0%", "-5%", "10%", "3%", "20%"],
  );
  const stars2X = useTransform(
    scrollYProgress,
    [0, 0.3, 0.6, 1],
    ["0%", "6%", "-4%", "8%"],
  );

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
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
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
        style={{
          x: globeX,
          y: globeY,
          scale: globeScale,
          opacity: globeOpacity,
        }}
      >
        <LandingGlobe />
      </motion.div>

      {/* Hero Section */}
      <div className="relative h-screen overflow-hidden z-10">
        <div
          className="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-transparent"
          style={{ height: "50%" }}
        />

        <div className="relative h-full flex flex-col items-center justify-center">
          <motion.div
            className="text-center max-w-4xl px-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold mb-6 leading-[1.1] tracking-tight font-serif">
              <span className="text-white">Your World.</span>
              <br />
              <span className="text-white/70 italic">Your Story.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Every place you&apos;ve been. Every dream you&apos;ll chase. All on one
              beautiful globe.
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
                Start Your Journey
              </span>
              <ArrowRight className="relative z-10 w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.8) 100%)",
          }}
        />
        <div className="max-w-5xl mx-auto relative">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-4 font-serif">
              Your travel companion, reimagined
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Everything you need to track, dream, and share your adventures.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            {/* Interactive Globe - large card */}
            <motion.div
              className="md:col-span-2 lg:col-span-2 row-span-2 rounded-2xl overflow-hidden relative min-h-75 md:min-h-100 group backdrop-blur-sm border border-white/5"
              style={{ background: "rgba(15, 12, 10, 0.4)" }}
              variants={fadeInUp}
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
                <h3 className="text-2xl font-semibold mb-2 font-serif text-white">
                  Interactive Globe
                </h3>
                <p className="text-white/60 font-serif italic text-lg">
                  See every country you&apos;ve explored light up on your personal 3D
                  globe.
                </p>
              </div>
            </motion.div>

            {/* AI Travel Advisor */}
            <motion.div
              className="rounded-2xl overflow-hidden relative group backdrop-blur-sm border border-white/5"
              style={{ background: "rgba(15, 12, 10, 0.35)" }}
              variants={fadeInUp}
            >
              <div
                className="absolute inset-0 opacity-45 group-hover:opacity-60 transition-opacity duration-500"
                style={{
                  backgroundImage: "url('/r7.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "saturate(0.8)",
                }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/20" />
              <div className="relative p-6">
                <h3 className="text-xl font-semibold mb-2 font-serif text-white">
                  AI Travel Advisor
                </h3>
                <p className="text-white/50 font-serif italic">
                  Chat with AI that knows your style and suggests your next dream
                  destination.
                </p>
              </div>
            </motion.div>

            {/* Travel Journal */}
            <motion.div
              className="rounded-2xl overflow-hidden relative group backdrop-blur-sm border border-white/5"
              style={{ background: "rgba(15, 12, 10, 0.35)" }}
              variants={fadeInUp}
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
                <h3 className="text-xl font-semibold mb-2 font-serif text-white">
                  Travel Journal
                </h3>
                <p className="text-white/50 font-serif italic">
                  Capture memories, photos, and stories from every adventure.
                </p>
              </div>
            </motion.div>

            {/* Bucket List - wide card */}
            <motion.div
              className="md:col-span-2 lg:col-span-2 rounded-2xl overflow-hidden relative group backdrop-blur-sm border border-white/5"
              style={{ background: "rgba(15, 12, 10, 0.35)" }}
              variants={fadeInUp}
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
                <h3 className="text-xl font-semibold mb-2 font-serif text-white">
                  Bucket List
                </h3>
                <p className="text-white/50 font-serif italic text-lg">
                  Build your dream list. Track what&apos;s next. Share with friends.
                </p>
              </div>
            </motion.div>

            {/* Share & Connect */}
            <motion.div
              className="rounded-2xl overflow-hidden relative group backdrop-blur-sm border border-white/5"
              style={{ background: "rgba(15, 12, 10, 0.35)" }}
              variants={fadeInUp}
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
                <h3 className="text-xl font-semibold mb-2 font-serif text-white">
                  Share & Connect
                </h3>
                <p className="text-white/50 font-serif italic">
                  Compare maps with friends. Plan trips together. Inspire each
                  other.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 py-24 px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.7) 100%)",
          }}
        />
        <div className="max-w-6xl mx-auto relative">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-4 font-serif">
              Three steps to your travel universe
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto font-serif italic">
              From memories to dreams, all in one place.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              className="relative rounded-2xl overflow-hidden backdrop-blur-sm border border-white/5 group"
              style={{ background: "rgba(15, 12, 10, 0.35)" }}
              {...fadeInUp}
            >
              <div
                className="h-48 opacity-55 group-hover:opacity-70 transition-opacity duration-500"
                style={{
                  backgroundImage: "url('/r10.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "saturate(0.8)",
                }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/20" />
              <div className="absolute top-4 left-4">
                <span className="text-5xl font-serif text-white/15">01</span>
              </div>
              <div className="p-6 relative">
                <h3 className="text-xl font-semibold mb-2 font-serif text-white">
                  Tell Your Story
                </h3>
                <p className="text-white/50 font-serif italic">
                  Chat with our AI about your adventures. We&apos;ll map every place
                  you&apos;ve been.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="relative rounded-2xl overflow-hidden backdrop-blur-sm border border-white/5 group"
              style={{ background: "rgba(15, 12, 10, 0.35)" }}
              {...fadeInUp}
              transition={{ delay: 0.1 }}
            >
              <div
                className="h-48 opacity-55 group-hover:opacity-70 transition-opacity duration-500"
                style={{
                  backgroundImage: "url('/r12.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "saturate(0.8)",
                }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/20" />
              <div className="absolute top-4 left-4">
                <span className="text-5xl font-serif text-white/15">02</span>
              </div>
              <div className="p-6 relative">
                <h3 className="text-xl font-semibold mb-2 font-serif text-white">
                  Dream & Discover
                </h3>
                <p className="text-white/50 font-serif italic">
                  Explore new destinations with AI recommendations tailored to
                  you.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="relative rounded-2xl overflow-hidden backdrop-blur-sm border border-white/5 group"
              style={{ background: "rgba(15, 12, 10, 0.35)" }}
              {...fadeInUp}
              transition={{ delay: 0.2 }}
            >
              <div
                className="h-48 opacity-55 group-hover:opacity-70 transition-opacity duration-500"
                style={{
                  backgroundImage: "url('/r1.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "saturate(0.8)",
                }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/20" />
              <div className="absolute top-4 left-4">
                <span className="text-5xl font-serif text-white/15">03</span>
              </div>
              <div className="p-6 relative">
                <h3 className="text-xl font-semibold mb-2 font-serif text-white">
                  Share Your Globe
                </h3>
                <p className="text-white/50 font-serif italic">
                  Show the world where you&apos;ve been. Inspire friends to explore.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.7) 100%)",
          }}
        />
        <motion.div
          className="max-w-5xl mx-auto text-center relative"
          {...fadeInUp}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-6 font-serif">
            Ready to map your world?
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of travelers sharing their journeys.
          </p>
          <Button
            size="lg"
            className="bg-white hover:bg-white/90 text-black font-semibold px-8 py-6 rounded-full"
            onClick={() => router.push("/signup")}
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 bg-black border-t border-white/10">
        <div className="max-w-5xl mx-auto flex items-center justify-center">
          <p className="text-gray-400 text-sm">
            &copy; 2026 Globe Travel. Made with wanderlust.
          </p>
        </div>
      </footer>
    </div>
  );
}
