import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Browser SpeechRecognition type shim                               */
/* ------------------------------------------------------------------ */
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

type SpeechRecognitionInstance = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => SpeechRecognitionInstance)
    | null
}

/* ------------------------------------------------------------------ */
/*  Punctuation post-processing                                       */
/* ------------------------------------------------------------------ */
function processPunctuation(text: string): string {
  return text
    .replace(/\b(period|full stop)\b/gi, '.')
    .replace(/\bcomma\b/gi, ',')
    .replace(/\bquestion mark\b/gi, '?')
    .replace(/\bexclamation mark\b/gi, '!')
    .replace(/\b(new line|newline)\b/gi, '\n')
    .replace(/\bsemicolon\b/gi, ';')
    .replace(/\bcolon\b/gi, ':')
}

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */
interface VoiceInputProps {
  onTranscript: (text: string) => void
  onListeningChange: (listening: boolean) => void
  onError: (message: string) => void
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export default function VoiceInput({
  onTranscript,
  onListeningChange,
  onError,
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const finalTranscriptRef = useRef('')

  /* ---- Check browser support on mount ---- */
  useEffect(() => {
    if (!getSpeechRecognition()) {
      setIsSupported(false)
    }
  }, [])

  /* ---- Cleanup on unmount ---- */
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null
        recognitionRef.current.abort()
      }
    }
  }, [])

  /* ---- Start listening ---- */
  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) {
      onError('Voice input is not supported in this browser. Please try Chrome or Edge.')
      return
    }

    // Request mic permission via getUserMedia first for a clean permission prompt
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'
        finalTranscriptRef.current = ''

        recognition.onstart = () => {
          setIsListening(true)
          onListeningChange(true)
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = ''
          let newFinalTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            const transcript = result[0].transcript

            if (result.isFinal) {
              newFinalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          // Process punctuation commands in final text
          if (newFinalTranscript) {
            const processed = processPunctuation(newFinalTranscript)
            finalTranscriptRef.current += processed
            onTranscript(finalTranscriptRef.current)
          } else if (interimTranscript) {
            // Show interim results in real-time (final + pending interim)
            const processed = processPunctuation(interimTranscript)
            onTranscript(finalTranscriptRef.current + processed)
          }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error === 'not-allowed') {
            onError('Microphone access denied. Please allow microphone access in your browser settings.')
          } else if (event.error !== 'aborted') {
            onError('Voice recognition paused. Click the mic to try again.')
          }
          setIsListening(false)
          onListeningChange(false)
        }

        recognition.onend = () => {
          // If still supposed to be listening, auto-restart (handles browser auto-stop)
          if (recognitionRef.current === recognition && isListening) {
            try {
              recognition.start()
            } catch {
              setIsListening(false)
              onListeningChange(false)
            }
          } else {
            setIsListening(false)
            onListeningChange(false)
          }
        }

        recognitionRef.current = recognition
        recognition.start()
      })
      .catch(() => {
        onError('Microphone access denied. Please allow microphone access to use voice input.')
      })
  }, [onTranscript, onListeningChange, onError, isListening])

  /* ---- Stop listening ---- */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      const ref = recognitionRef.current
      recognitionRef.current = null // prevent auto-restart in onend
      ref.stop()
    }
    setIsListening(false)
    onListeningChange(false)
  }, [onListeningChange])

  /* ---- Toggle ---- */
  const handleToggle = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  if (!isSupported) return null

  return (
    <div className="relative" id="voice-input">
      {/* Pulsing ripple rings — visible only when listening */}
      <AnimatePresence>
        {isListening && (
          <>
            {/* Outer ripple */}
            <motion.div
              key="ripple-outer"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: [1, 1.8, 2.2],
                opacity: [0.3, 0.12, 0],
              }}
              transition={{
                duration: 2,
                ease: 'easeOut',
                repeat: Infinity,
              }}
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(244,63,94,0.25) 0%, transparent 70%)',
              }}
            />
            {/* Inner ripple */}
            <motion.div
              key="ripple-inner"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: [1, 1.5, 1.8],
                opacity: [0.4, 0.15, 0],
              }}
              transition={{
                duration: 1.5,
                ease: 'easeOut',
                repeat: Infinity,
                delay: 0.3,
              }}
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(251,113,133,0.3) 0%, transparent 70%)',
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Main button */}
      <motion.button
        onClick={handleToggle}
        whileTap={{ scale: 0.92 }}
        id="voice-toggle"
        className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-lg ${
          isListening
            ? 'bg-gradient-to-br from-rose-500 to-red-500 shadow-rose-300/40 dark:shadow-rose-900/30'
            : 'bg-gradient-to-br from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 shadow-slate-400/20 dark:shadow-black/30 hover:from-slate-600 hover:to-slate-700'
        }`}
        title={isListening ? 'Stop recording' : 'Start voice input'}
      >
        <AnimatePresence mode="wait">
          {isListening ? (
            <motion.div
              key="stop"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Square className="w-4 h-4 text-white" fill="white" strokeWidth={0} />
            </motion.div>
          ) : (
            <motion.div
              key="mic"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Mic className="w-5 h-5 text-white" strokeWidth={1.8} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Listening label */}
      <AnimatePresence>
        {isListening && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-rose-400 font-medium tracking-wider whitespace-nowrap"
          >
            LISTENING
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
