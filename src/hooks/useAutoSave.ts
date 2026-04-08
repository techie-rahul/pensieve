import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type SaveStatus = 'saved' | 'saving' | 'unsaved'

/**
 * Debounced auto-save hook.
 * Upserts `content` into the Supabase `entries` table after 3 s of inactivity.
 *
 * Table schema assumed:
 *   id         uuid   (primary key, default gen_random_uuid())
 *   user_id    uuid   (references auth.users)
 *   content    text
 *   updated_at timestamptz
 *
 * The upsert uses a unique constraint on (user_id, id).
 */
export function useAutoSave(content: string, userId: string | undefined) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [entryId, setEntryId] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>(content)

  /* ---- persist function ---- */
  const persist = useCallback(
    async (text: string) => {
      if (!userId) return
      if (text === lastSavedRef.current && entryId) return // nothing changed

      setSaveStatus('saving')

      try {
        if (entryId) {
          // Update existing entry
          const { error } = await supabase
            .from('entries')
            .update({ content: text, updated_at: new Date().toISOString() })
            .eq('id', entryId)

          if (error) throw error
        } else {
          // Insert new entry for today
          const { data, error } = await supabase
            .from('entries')
            .insert({
              user_id: userId,
              content: text,
              updated_at: new Date().toISOString(),
            })
            .select('id')
            .single()

          if (error) throw error
          if (data) setEntryId(data.id)
        }

        lastSavedRef.current = text
        setSaveStatus('saved')
      } catch (err) {
        console.error('[useAutoSave] save failed:', err)
        setSaveStatus('unsaved')
      }
    },
    [userId, entryId],
  )

  /* ---- debounce on content change ---- */
  useEffect(() => {
    if (!userId) return

    // Mark as unsaved whenever content diverges from last saved snapshot
    if (content !== lastSavedRef.current) {
      setSaveStatus('unsaved')
    }

    // Clear any pending timer
    if (timerRef.current) clearTimeout(timerRef.current)

    // Skip empty content
    if (!content.trim()) return

    // Set a 3-second debounce
    timerRef.current = setTimeout(() => {
      persist(content)
    }, 3000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [content, userId, persist])

  /* ---- Reset hook for loading an existing entry ---- */
  const resetForEntry = useCallback(
    (id: string | null, savedContent: string) => {
      setEntryId(id)
      lastSavedRef.current = savedContent
      setSaveStatus('saved')
      // Clear any pending timer
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  return { saveStatus, entryId, setEntryId, resetForEntry }
}
