import { useState } from 'react'
import { supabase } from './lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, ArrowRight, Loader2, BookOpen } from 'lucide-react'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Check your email to confirm your account.')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" id="auth-page">
      {/* Subtle background gradient blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#c7d2fe]/30 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#a5b4fc]/20 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px]"
      >
        {/* Card */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-10">
          {/* Logo & title */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center mb-4 shadow-lg shadow-indigo-200/50"
            >
              <BookOpen className="w-7 h-7 text-white" strokeWidth={1.8} />
            </motion.div>

            <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.02em]">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-[14px] text-gray-400 mt-1">
              {isLogin
                ? 'Sign in to continue to Pensieve'
                : 'Start your reflective journey'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" id="auth-form">
            {/* Email */}
            <div className="relative group">
              <Mail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-300 group-focus-within:text-indigo-400 transition-colors"
                strokeWidth={1.8}
              />
              <input
                id="auth-email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-gray-50/80 border border-gray-200/80 text-[15px] text-gray-900 placeholder:text-gray-300 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-300 group-focus-within:text-indigo-400 transition-colors"
                strokeWidth={1.8}
              />
              <input
                id="auth-password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-gray-50/80 border border-gray-200/80 text-[15px] text-gray-900 placeholder:text-gray-300 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            {/* Error / Success messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[13px] text-red-500 text-center"
                  id="auth-error"
                >
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p
                  key="success"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[13px] text-emerald-600 text-center"
                  id="auth-success"
                >
                  {success}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              id="auth-submit"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-[15px] font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-200/40 hover:shadow-xl hover:shadow-indigo-200/50 transition-shadow cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </>
              )}
            </motion.button>
          </form>

          {/* Toggle login / signup */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError(null)
                setSuccess(null)
              }}
              id="auth-toggle"
              className="text-[13px] text-gray-400 hover:text-indigo-500 transition-colors cursor-pointer"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        {/* Footer branding */}
        <p className="text-center text-[12px] text-gray-300 mt-6 tracking-wide">
          PENSIEVE · Privacy-first reflective journaling
        </p>
      </motion.div>
    </div>
  )
}
