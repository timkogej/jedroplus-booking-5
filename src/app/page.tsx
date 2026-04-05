'use client';

import { motion, type Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const heroVariants: Variants = {
  hidden: { opacity: 0, y: -24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut' as const },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

const Gradient = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-teal-300 bg-clip-text text-transparent font-semibold">
    {children}
  </span>
);

export default function Home() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #0d0820 0%, #110d2e 40%, #0a1628 100%)',
        fontFamily: 'var(--font-nunito), var(--font-outfit), sans-serif',
      }}
    >
      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #0D9488 0%, transparent 70%)' }}
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10"
      >
        {/* Hero */}
        <motion.div
          variants={heroVariants}
          className="flex flex-col items-center justify-center pt-28 pb-16 px-6 text-center"
        >
          <h1
            className="text-5xl font-extrabold tracking-tight text-white mb-5"
            style={{ fontFamily: 'var(--font-nunito), sans-serif', letterSpacing: '-0.02em' }}
          >
            <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-teal-300 bg-clip-text text-transparent">
              Jedro+
            </span>{' '}
            booking platform
          </h1>
          <p
            className="text-lg text-white/60 max-w-xl"
            style={{ fontFamily: 'var(--font-nunito), sans-serif', fontWeight: 400 }}
          >
            A modern appointment scheduling platform for your business.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="max-w-4xl mx-auto px-6 pb-28 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Card 1 */}
          <motion.div
            variants={cardVariants}
            className="rounded-2xl p-8"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            <h2
              className="text-xl font-bold text-white mb-3"
              style={{ fontFamily: 'var(--font-nunito), sans-serif' }}
            >
              Book in a few clicks
            </h2>
            <p
              className="text-white/60 leading-relaxed"
              style={{ fontFamily: 'var(--font-nunito), sans-serif' }}
            >
              Schedule an appointment in a few clicks —{' '}
              <Gradient>anywhere, anytime</Gradient>. Simple for clients, powerful for your business.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            variants={cardVariants}
            className="rounded-2xl p-8"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            <h2
              className="text-xl font-bold text-white mb-3"
              style={{ fontFamily: 'var(--font-nunito), sans-serif' }}
            >
              Grow effortlessly
            </h2>
            <p
              className="text-white/60 leading-relaxed"
              style={{ fontFamily: 'var(--font-nunito), sans-serif' }}
            >
              <Gradient>Fewer</Gradient> calls.{' '}
              <Gradient>More</Gradient> bookings.{' '}
              <Gradient>24/7</Gradient> scheduling.{' '}
              <Gradient>Professional</Gradient> impression.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            variants={cardVariants}
            className="rounded-2xl p-8"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            <h2
              className="text-xl font-bold text-white mb-3"
              style={{ fontFamily: 'var(--font-nunito), sans-serif' }}
            >
              Your brand, your design
            </h2>
            <p
              className="text-white/60 leading-relaxed"
              style={{ fontFamily: 'var(--font-nunito), sans-serif' }}
            >
              Choose your{' '}
              <Gradient>style</Gradient>. Set{' '}
              <Gradient>colors</Gradient> that match your{' '}
              <Gradient>brand</Gradient> — and let the platform handle the rest.
            </p>
          </motion.div>

          {/* Card 4 */}
          <motion.div
            variants={cardVariants}
            className="rounded-2xl p-8"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            <h2
              className="text-xl font-bold text-white mb-3"
              style={{ fontFamily: 'var(--font-nunito), sans-serif' }}
            >
              Built for conversion
            </h2>
            <p
              className="text-white/60 leading-relaxed"
              style={{ fontFamily: 'var(--font-nunito), sans-serif' }}
            >
              Create a booking{' '}
              <Gradient>experience</Gradient> that brings your clients from discovery to reservation — seamlessly.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
