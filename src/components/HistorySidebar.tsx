import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { X, Plus, Search, FileText } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
export interface HistoryEntry {
  id: string
  content: string
  created_at: string
  updated_at: string
}

interface HistorySidebarProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onSelectEntry: (entry: HistoryEntry) => void
  onNewEntry: () => void
  activeEntryId: string | null
}

/* ------------------------------------------------------------------ */
/*  Date grouping helpers                                             */
/* ------------------------------------------------------------------ */
function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const entryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffMs = today.getTime() - entryDay.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays <= 7) return 'Last Week'
  if (diffDays <= 30) return 'This Month'
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function groupEntries(entries: HistoryEntry[]): Map<string, HistoryEntry[]> {
  const groups = new Map<string, HistoryEntry[]>()
  for (const entry of entries) {
    const group = getDateGroup(entry.updated_at || entry.created_at)
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group)!.push(entry)
  }
  return groups
}

function getPreview(content: string): string {
  const trimmed = content.replace(/\s+/g, ' ').trim()
  if (trimmed.length <= 40) return trimmed || 'Empty entry'
  return trimmed.slice(0, 40) + '…'
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export default function HistorySidebar({
  isOpen,
  onClose,
  userId,
  onSelectEntry,
  onNewEntry,
  activeEntryId,
}: HistorySidebarProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  /* ---- Fetch entries when sidebar opens ---- */
  useEffect(() => {
    if (!isOpen) return

    const fetchEntries = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('entries')
        .select('id, content, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (!error && data) {
        setEntries(data as HistoryEntry[])
      }
      setLoading(false)
    }

    fetchEntries()
  }, [isOpen, userId])

  /* ---- Filtered + grouped entries ---- */
  const filtered = useMemo(() => {
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter((e) => e.content.toLowerCase().includes(q))
  }, [entries, search])

  const grouped = useMemo(() => groupEntries(filtered), [filtered])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/10 dark:bg-black/30"
            id="sidebar-backdrop"
          />

          {/* Sidebar drawer */}
          <motion.aside
            key="sidebar-drawer"
            initial={{ x: -340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -340, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[320px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-r border-slate-200/40 dark:border-slate-700/30 shadow-[4px_0_40px_rgba(0,0,0,0.06)] flex flex-col"
            id="history-sidebar"
          >
            {/* ---- Header ---- */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/30 dark:border-slate-700/25">
              <h2 className="text-[14px] font-semibold text-slate-700 dark:text-slate-200 tracking-[-0.01em]">
                Journal Archive
              </h2>
              <button
                onClick={onClose}
                id="sidebar-close"
                className="w-7 h-7 rounded-lg bg-slate-100/50 dark:bg-slate-800/50 flex items-center justify-center hover:bg-slate-200/60 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
              </button>
            </div>

            {/* ---- New Entry button ---- */}
            <div className="px-4 pt-4 pb-2">
              <button
                onClick={() => {
                  onNewEntry()
                  onClose()
                }}
                id="new-entry-btn"
                className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/30 dark:border-indigo-800/25 text-[13px] font-medium text-indigo-500 dark:text-indigo-400 hover:from-indigo-500/15 hover:to-purple-500/15 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" strokeWidth={2} />
                New Entry
              </button>
            </div>

            {/* ---- Search bar ---- */}
            <div className="px-4 pb-3">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 dark:text-slate-600"
                  strokeWidth={2}
                />
                <input
                  type="text"
                  placeholder="Search entries…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  id="sidebar-search"
                  className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-700/30 text-[12px] text-slate-600 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none focus:border-indigo-300/50 transition-colors"
                />
              </div>
            </div>

            {/* ---- Entries list ---- */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-thin">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-400 rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <FileText className="w-8 h-8 text-slate-200 dark:text-slate-700" strokeWidth={1.2} />
                  <p className="text-[12px] text-slate-300 dark:text-slate-600">
                    {search ? 'No matching entries' : 'No entries yet'}
                  </p>
                </div>
              ) : (
                Array.from(grouped.entries()).map(([group, items]) => (
                  <div key={group} className="mb-5">
                    {/* Group label */}
                    <p className="text-[10px] font-semibold text-slate-300 dark:text-slate-600 tracking-[0.1em] uppercase mb-2 px-1">
                      {group}
                    </p>

                    {/* Entry cards */}
                    <div className="space-y-1">
                      {items.map((entry) => {
                        const isActive = entry.id === activeEntryId
                        return (
                          <button
                            key={entry.id}
                            onClick={() => {
                              onSelectEntry(entry)
                              onClose()
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all cursor-pointer group ${
                              isActive
                                ? 'bg-indigo-50/60 dark:bg-indigo-900/15 border border-indigo-200/40 dark:border-indigo-800/25'
                                : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30 border border-transparent'
                            }`}
                          >
                            <p
                              className={`text-[13px] leading-snug truncate ${
                                isActive
                                  ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                                  : 'text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {getPreview(entry.content)}
                            </p>
                            <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">
                              {formatTime(entry.updated_at || entry.created_at)}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ---- Footer ---- */}
            <div className="px-5 py-3 border-t border-slate-200/30 dark:border-slate-700/25">
              <p className="text-[10px] text-slate-300 dark:text-slate-600 text-center tracking-wider">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
