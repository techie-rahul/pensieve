import { motion } from 'framer-motion'

export type AuraState = 'idle' | 'typing' | 'thinking' | 'listening'

interface NeuralAuraProps {
  state: AuraState
}

/* ------------------------------------------------------------------ */
/*  Colour palettes per state — richer, more saturated                */
/* ------------------------------------------------------------------ */
const palettes: Record<AuraState, { core: string; mid: string; outer: string; accent: string }> = {
  idle: {
    core:   'rgba(45, 212, 191, 0.30)',    // teal-400
    mid:    'rgba(96, 165, 250, 0.18)',     // blue-400
    outer:  'rgba(56, 189, 248, 0.10)',     // sky-400
    accent: 'rgba(45, 212, 191, 0.50)',     // bright teal dot
  },
  typing: {
    core:   'rgba(129, 140, 248, 0.50)',    // indigo-400 — vibrant neon
    mid:    'rgba(168, 85, 247, 0.30)',     // purple-500
    outer:  'rgba(99, 102, 241, 0.14)',     // indigo-500
    accent: 'rgba(165, 120, 255, 0.70)',    // bright purple dot
  },
  thinking: {
    core:   'rgba(251, 191, 36, 0.40)',     // amber-400
    mid:    'rgba(245, 158, 11, 0.25)',     // amber-500
    outer:  'rgba(252, 211, 77, 0.12)',     // amber-300
    accent: 'rgba(251, 191, 36, 0.65)',     // bright gold dot
  },
  listening: {
    core:   'rgba(244, 63, 94, 0.40)',      // rose-500
    mid:    'rgba(251, 113, 133, 0.25)',    // rose-400
    outer:  'rgba(253, 164, 175, 0.12)',    // rose-300
    accent: 'rgba(244, 63, 94, 0.60)',      // bright rose dot
  },
}

/* ------------------------------------------------------------------ */
/*  Animation variants per state                                      */
/* ------------------------------------------------------------------ */

// Idle: slow, deep breathing — calm presence
const idleOuter = {
  animate: {
    scale: [1, 1.06, 1.02, 1.08, 1],
    opacity: [0.4, 0.6, 0.45, 0.65, 0.4],
    transition: { duration: 6, ease: 'easeInOut', repeat: Infinity },
  },
}
const idleMid = {
  animate: {
    scale: [1, 1.1, 0.98, 1.12, 1],
    opacity: [0.5, 0.75, 0.55, 0.8, 0.5],
    transition: { duration: 5, ease: 'easeInOut', repeat: Infinity },
  },
}
const idleCore = {
  animate: {
    scale: [1, 1.08, 1.02, 1.1, 1],
    opacity: [0.6, 0.85, 0.65, 0.9, 0.6],
    transition: { duration: 4.5, ease: 'easeInOut', repeat: Infinity },
  },
}

// Typing: faster heartbeat — vibrant neon glow
const typingOuter = {
  animate: {
    scale: [1, 1.12, 0.96, 1.1, 1],
    opacity: [0.45, 0.75, 0.5, 0.7, 0.45],
    transition: { duration: 2.4, ease: 'easeInOut', repeat: Infinity },
  },
}
const typingMid = {
  animate: {
    scale: [1, 1.18, 0.94, 1.15, 1],
    opacity: [0.55, 0.9, 0.6, 0.85, 0.55],
    transition: { duration: 1.8, ease: 'easeInOut', repeat: Infinity },
  },
}
const typingCore = {
  animate: {
    scale: [1, 1.22, 0.95, 1.18, 1.02, 1],
    opacity: [0.65, 1, 0.7, 0.95, 0.75, 0.65],
    transition: { duration: 1.5, ease: 'easeInOut', repeat: Infinity },
  },
}

// Thinking: rapid shimmer + rotation — intense gold aurora
const thinkingOuter = {
  animate: {
    scale: [1, 1.15, 0.95, 1.12, 1],
    opacity: [0.4, 0.65, 0.45, 0.6, 0.4],
    rotate: [0, 90, 180, 270, 360],
    transition: { duration: 3, ease: 'easeInOut', repeat: Infinity },
  },
}
const thinkingMid = {
  animate: {
    scale: [1, 1.2, 0.93, 1.18, 1],
    opacity: [0.55, 0.85, 0.5, 0.8, 0.55],
    rotate: [0, -60, -120, -180],
    transition: { duration: 2.2, ease: 'easeInOut', repeat: Infinity },
  },
}
const thinkingCore = {
  animate: {
    scale: [1, 1.25, 0.9, 1.2, 1],
    opacity: [0.65, 1, 0.55, 0.95, 0.65],
    rotate: [0, 180, 360],
    transition: { duration: 1.8, ease: 'easeInOut', repeat: Infinity },
  },
}

// Listening: warm, steady heartbeat — rose glow
const listeningOuter = {
  animate: {
    scale: [1, 1.1, 0.97, 1.08, 1],
    opacity: [0.4, 0.7, 0.45, 0.65, 0.4],
    transition: { duration: 2.8, ease: 'easeInOut', repeat: Infinity },
  },
}
const listeningMid = {
  animate: {
    scale: [1, 1.15, 0.96, 1.12, 1],
    opacity: [0.5, 0.85, 0.55, 0.8, 0.5],
    transition: { duration: 2.2, ease: 'easeInOut', repeat: Infinity },
  },
}
const listeningCore = {
  animate: {
    scale: [1, 1.2, 0.94, 1.16, 1.02, 1],
    opacity: [0.6, 1, 0.65, 0.9, 0.7, 0.6],
    transition: { duration: 1.6, ease: 'easeInOut', repeat: Infinity },
  },
}

const variantsMap: Record<AuraState, { outer: typeof idleOuter; mid: typeof idleMid; core: typeof idleCore }> = {
  idle:      { outer: idleOuter,      mid: idleMid,      core: idleCore },
  typing:    { outer: typingOuter,    mid: typingMid,    core: typingCore },
  thinking:  { outer: thinkingOuter,  mid: thinkingMid,  core: thinkingCore },
  listening: { outer: listeningOuter, mid: listeningMid, core: listeningCore },
}

/* ------------------------------------------------------------------ */
/*  Component — multi-layered nebula                                  */
/* ------------------------------------------------------------------ */
export default function NeuralAura({ state }: NeuralAuraProps) {
  const colors = palettes[state]
  const variants = variantsMap[state]

  return (
    <div
      className="pointer-events-none select-none"
      aria-hidden="true"
      id="neural-aura"
    >
      {/* Layer 1 — outermost haze (largest, most blurred, lowest opacity) */}
      <motion.div
        key={`outer-${state}`}
        variants={variants.outer as any}
        animate="animate"
        className="absolute -top-28 -right-28 rounded-full"
        style={{
          width: 400,
          height: 400,
          background: `radial-gradient(circle, ${colors.outer} 0%, transparent 70%)`,
          filter: 'blur(80px)',
        }}
      />

      {/* Layer 2 — mid glow */}
      <motion.div
        key={`mid-${state}`}
        variants={variants.mid as any}
        animate="animate"
        className="absolute -top-16 -right-16 rounded-full"
        style={{
          width: 300,
          height: 300,
          background: `radial-gradient(circle, ${colors.mid} 0%, transparent 65%)`,
          filter: 'blur(60px)',
        }}
      />

      {/* Layer 3 — inner core (brightest, sharpest) */}
      <motion.div
        key={`core-${state}`}
        variants={variants.core as any}
        animate="animate"
        className="absolute -top-6 -right-6 rounded-full"
        style={{
          width: 180,
          height: 180,
          background: `radial-gradient(circle, ${colors.core} 0%, transparent 60%)`,
          filter: 'blur(40px)',
        }}
      />

      {/* Layer 4 — vivid accent dot in the centre of the glow */}
      <motion.div
        key={`accent-${state}`}
        animate={{
          scale: [1, 1.8, 1.1, 1.6, 1],
          opacity: [0.4, 0.9, 0.5, 0.85, 0.4],
        }}
        transition={{
          duration: state === 'thinking' ? 1 : state === 'typing' ? 1.6 : state === 'listening' ? 1.2 : 3,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
        className="absolute top-6 right-6 rounded-full"
        style={{
          width: 16,
          height: 16,
          background: colors.accent,
          filter: 'blur(6px)',
        }}
      />

      {/* Layer 5 — secondary ambient spill for 'typing' neon illumination */}
      {state === 'typing' && (
        <motion.div
          key="neon-spill"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.15, 0.35, 0.18, 0.3, 0.15],
            scale: [1, 1.08, 1.02, 1.06, 1],
          }}
          transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity }}
          className="absolute -top-40 -right-40 rounded-full"
          style={{
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, rgba(129,140,248,0.18) 0%, rgba(168,85,247,0.06) 50%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
      )}

      {/* Layer 5b — rose ambient spill for 'listening' mode */}
      {state === 'listening' && (
        <motion.div
          key="rose-spill"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.12, 0.3, 0.15, 0.25, 0.12],
            scale: [1, 1.06, 1.01, 1.05, 1],
          }}
          transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity }}
          className="absolute -top-40 -right-40 rounded-full"
          style={{
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, rgba(244,63,94,0.16) 0%, rgba(251,113,133,0.05) 50%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
      )}
    </div>
  )
}
