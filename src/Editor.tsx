import { useState, useRef, useEffect, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { generateReflection } from './lib/groq'
import type { ReflectionResult } from './lib/groq'
import { concepts } from './lib/concepts'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut,
  Feather,
  Cloud,
  CloudOff,
  Loader2,
  Sparkles,
  X,
  Brain,
  ShieldCheck,
  Clock,
} from 'lucide-react'
import HistorySidebar from './components/HistorySidebar'
import type { HistoryEntry } from './components/HistorySidebar'
import VoiceInput from './components/VoiceInput'
import NeuralAura from './components/NeuralAura'
import type { AuraState } from './components/NeuralAura'
import { useAutoSave } from './hooks/useAutoSave'
import type { SaveStatus } from './hooks/useAutoSave'

interface EditorProps {
  session: Session
}

/* ------------------------------------------------------------------ */
/*  Save-status pill                                                  */
/* ------------------------------------------------------------------ */
function StatusPill({ status }: { status: SaveStatus }) {
  const config: Record<SaveStatus, { icon: React.ReactNode; label: string; cls: string }> = {
    saved: {
      icon: <Cloud className="w-3.5 h-3.5" strokeWidth={1.8} />,
      label: 'Saved',
      cls: 'text-emerald-500/70',
    },
    saving: {
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.8} />,
      label: 'Syncing…',
      cls: 'text-indigo-400',
    },
    unsaved: {
      icon: <CloudOff className="w-3.5 h-3.5" strokeWidth={1.8} />,
      label: 'Unsaved',
      cls: 'text-slate-400/60',
    },
  }

  const c = config[status]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.25 }}
        className={`flex items-center gap-1.5 ${c.cls}`}
        id="save-status"
      >
        {c.icon}
        <span className="text-[12px] tracking-wide font-medium">{c.label}</span>
      </motion.div>
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/*  Confidence ring — radial progress indicator                       */
/* ------------------------------------------------------------------ */
function ConfidenceRing({ value }: { value: number }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative w-[72px] h-[72px] flex items-center justify-center">
      <svg width="72" height="72" className="rotate-[-90deg]">
        {/* Track */}
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.12)"
          strokeWidth="4"
        />
        {/* Progress */}
        <motion.circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="url(#confidence-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
        <defs>
          <linearGradient id="confidence-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[16px] font-semibold text-slate-700 dark:text-slate-200 leading-none">
          {value}%
        </span>
        <span className="text-[9px] text-slate-400 dark:text-slate-500 tracking-wider mt-0.5">
          CONF
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Reflection card overlay                                           */
/* ------------------------------------------------------------------ */
function ReflectionCard({
  result,
  onClose,
}: {
  result: ReflectionResult
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[600px] mx-auto"
      id="reflection-card"
    >
      <div className="relative rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/40 dark:border-slate-700/30 shadow-[0_8px_60px_rgba(99,102,241,0.08)] p-8 sm:p-10">
        {/* Close button */}
        <button
          onClick={onClose}
          id="reflection-close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100/60 dark:bg-slate-800/60 flex items-center justify-center hover:bg-slate-200/80 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 text-slate-400" strokeWidth={2} />
        </button>

        {/* Header */}
        <div className="flex items-start gap-5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Brain className="w-5 h-5 text-indigo-400" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-semibold text-slate-800 dark:text-slate-100 tracking-[-0.01em]">
              Pattern Reflection
            </h3>
            <p className="text-[13px] text-slate-400 dark:text-slate-500 mt-0.5">
              Based on your recent entries · Matched concept:&nbsp;
              <span className="text-indigo-400 font-medium">{result.concept}</span>
            </p>
            {(() => {
              const matched = concepts.find(c => c.name === result.concept)
              return matched ? (
                <p className="text-[11px] text-slate-400/60 dark:text-slate-500/50 mt-1 italic">
                  {matched.citation}
                </p>
              ) : null
            })()}
          </div>
        </div>

        {/* Body — reflection + confidence */}
        <div className="flex gap-6 items-start">
          <p className="flex-1 text-[15px] leading-[1.75] text-slate-600 dark:text-slate-300">
            {result.reflection}
          </p>
          <div className="shrink-0">
            <ConfidenceRing value={result.confidence} />
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 h-px bg-slate-200/40 dark:bg-slate-700/30" />

        {/* Disclaimer */}
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" strokeWidth={1.8} />
          <p className="text-[11px] leading-[1.6] text-slate-300 dark:text-slate-600">
            Pensieve observes patterns for self-reflection. It is not a clinical tool
            or a substitute for professional therapy.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Editor page — Premium Sanctuary + Reflection Engine               */
/* ------------------------------------------------------------------ */
export default function Editor({ session }: EditorProps) {
  const [content, setContent] = useState('')
  const [auraState, setAuraState] = useState<AuraState>('idle')
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Reflection state — named per spec
  const [reflection, setReflection] = useState<ReflectionResult | null>(null)
  const [isReflecting, setIsReflecting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // History sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auto-save hook
  const { saveStatus, entryId, resetForEntry } = useAutoSave(content, session.user.id)

  /* ---- History: select an existing entry ---- */
  const handleSelectEntry = useCallback((entry: HistoryEntry) => {
    setContent(entry.content)
    resetForEntry(entry.id, entry.content)
    setReflection(null)
  }, [resetForEntry])

  /* ---- History: start a new blank entry ---- */
  const handleNewEntry = useCallback(() => {
    setContent('')
    resetForEntry(null, '')
    setReflection(null)
  }, [resetForEntry])

  /* ---- Show toast (auto-dismiss after 5 s) ---- */
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 5000)
  }, [])

  // Clean up toast timer
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  /* ---- Voice input handlers ---- */
  const voiceBaseRef = useRef('')
  const [isVoiceActive, setIsVoiceActive] = useState(false)

  const handleVoiceTranscript = useCallback((text: string) => {
    setContent(voiceBaseRef.current + (voiceBaseRef.current ? ' ' : '') + text)
  }, [])

  const handleVoiceListeningChange = useCallback((listening: boolean) => {
    setIsVoiceActive(listening)
    if (listening) {
      // Snapshot current content so voice appends after it
      voiceBaseRef.current = content
      setAuraState('listening')
    } else {
      setAuraState('idle')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  const handleVoiceError = useCallback((msg: string) => {
    showToast(msg)
  }, [showToast])

  /* ---- Typing → idle transition (3 s inactivity) ---- */
  const handleTyping = useCallback(() => {
    if (isVoiceActive) return // don't override voice aura
    setAuraState('typing')
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      if (!isVoiceActive) setAuraState('idle')
    }, 3000)
  }, [isVoiceActive])

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }, [])

  /* ---- Auto-resize textarea ---- */
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 420)}px`
  }, [content])

  /* ---- Sign out ---- */
  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  /* ---- Reflect ---- */
  const handleReflect = async () => {
    setIsReflecting(true)
    setReflection(null)
    setAuraState('thinking')

    try {
      // 1. Fetch the latest 5 entries from Supabase
      const { data: entries, error } = await supabase
        .from('entries')
        .select('content')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false })
        .limit(5)

      if (error) throw new Error(error.message)

      // Combine current unsaved content with fetched entries
      const allTexts: string[] = []
      if (content.trim()) allTexts.push(content)
      if (entries) {
        for (const e of entries) {
          if (e.content && e.content.trim()) allTexts.push(e.content)
        }
      }

      if (allTexts.length === 0) {
        throw new Error('empty')
      }

      // 2. Call Groq with concept-enriched prompt
      const rawResult = await generateReflection(allTexts.slice(0, 5))

      // 3. Validate result before displaying — last line of defense
      const validatedResult = {
        reflection:
          typeof rawResult.reflection === 'string' && rawResult.reflection.trim()
            ? rawResult.reflection.trim()
            : 'Your writing reveals interesting patterns. Continue journaling to deepen self-understanding.',
        concept:
          typeof rawResult.concept === 'string' && rawResult.concept.trim()
            ? rawResult.concept.trim()
            : 'General Observation',
        confidence: Math.min(Math.max(Number(rawResult.confidence) || 70, 0), 80),
      }

      setReflection(validatedResult)
    } catch (err) {
      const msg = err instanceof Error && err.message === 'empty'
        ? 'Write something first — the reflection engine needs your words to find patterns.'
        : 'The patterns are still forming. Try writing a few more sentences.'
      showToast(msg)
    } finally {
      setIsReflecting(false)
      setAuraState('idle')
    }
  }

  /* ---- Today's date ---- */
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" id="editor-page">
      {/* ---- History sidebar ---- */}
      <HistorySidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userId={session.user.id}
        onSelectEntry={handleSelectEntry}
        onNewEntry={handleNewEntry}
        activeEntryId={entryId}
      />

      {/* ---- Neural Aura + Voice mic — top-right corner ---- */}
      <div className="fixed top-0 right-0 z-0">
        <NeuralAura state={auraState} />
      </div>

      {/* ---- Floating voice mic — near the aura, top-right ---- */}
      <div className="fixed top-20 right-6 z-20">
        <VoiceInput
          onTranscript={handleVoiceTranscript}
          onListeningChange={handleVoiceListeningChange}
          onError={handleVoiceError}
        />
      </div>

      {/* ---- Glassmorphic header ---- */}
      <header className="glass-header flex items-center justify-between px-6 sm:px-8 py-3.5 sticky top-0 z-30 bg-white/50 backdrop-blur-2xl border-b border-slate-200/50 transition-colors">
        <div className="flex items-center gap-3">
          {/* Archive (history) button */}
          <button
            onClick={() => setSidebarOpen(true)}
            id="archive-btn"
            className="w-8 h-8 rounded-lg bg-slate-100/50 dark:bg-slate-800/40 flex items-center justify-center hover:bg-slate-200/60 dark:hover:bg-slate-700/40 transition-colors cursor-pointer"
            title="Journal Archive"
          >
            <Clock className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
          </button>

          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-sm shadow-indigo-200/40">
            <Feather className="w-4 h-4 text-white" strokeWidth={1.8} />
          </div>
          <span className="text-[15px] font-semibold text-slate-800 dark:text-slate-200 tracking-[-0.01em]">
            Pensieve
          </span>
        </div>

        <div className="flex items-center gap-5">
          <StatusPill status={saveStatus} />

          <div className="hidden sm:flex items-center gap-3">
            <span className="text-[13px] text-slate-400 dark:text-slate-500">
              {session.user.email}
            </span>
            <div className="w-px h-4 bg-slate-200/60 dark:bg-slate-700/50" />
          </div>

          <button
            onClick={handleSignOut}
            id="sign-out-btn"
            className="flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.8} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* ---- Writing area ---- */}
      <main className="flex-1 flex flex-col items-center px-5 sm:px-8 pt-14 sm:pt-20 pb-12 relative z-10">
        <AnimatePresence mode="wait">
          {reflection ? (
            /* ---- Reflection card overlay ---- */
            <ReflectionCard
              key="reflection"
              result={reflection}
              onClose={() => setReflection(null)}
            />
          ) : (
            /* ---- Editor ---- */
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[680px]"
            >
              {/* Date heading */}
              <p className="text-[13px] font-semibold text-slate-400 dark:text-slate-500 tracking-[0.12em] uppercase mb-8 leading-relaxed">
                {today}
              </p>

              {/* Borderless textarea */}
              <textarea
                ref={textareaRef}
                id="journal-editor"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  handleTyping()
                }}
                placeholder="What's on your mind today…"
                spellCheck
                className="editor-text w-full bg-transparent text-[18px] sm:text-[20px] leading-[1.9] text-[#1E293B] dark:text-slate-200 placeholder:text-slate-300/50 dark:placeholder:text-slate-600/50 outline-none resize-none caret-indigo-400 selection:bg-indigo-100 dark:selection:bg-indigo-900/30"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- Floating toast ---- */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-slate-800/80 dark:bg-slate-700/80 backdrop-blur-lg text-[13px] text-slate-200 shadow-lg shadow-black/10 max-w-[420px] text-center"
              id="reflection-toast"
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- Bottom area: Reflect button + privacy note ---- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-auto pt-10 flex flex-col items-center gap-5"
        >
          {/* Reflect button — glassmorphic with subtle glow */}
          {!reflection && (
            <motion.button
              onClick={handleReflect}
              disabled={isReflecting}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              id="reflect-btn"
              className="flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/40 shadow-[0_2px_20px_rgba(99,102,241,0.10)] hover:shadow-[0_4px_30px_rgba(99,102,241,0.18)] text-[14px] font-medium text-slate-600 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isReflecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" strokeWidth={2} />
                  Reflecting…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-400" strokeWidth={2} />
                  Reflect
                </>
              )}
            </motion.button>
          )}

          <p className="text-[12px] text-slate-300 dark:text-slate-600 tracking-[0.08em] text-center">
            Your thoughts are private · Write freely
          </p>
        </motion.div>
      </main>
    </div>
  )
}
