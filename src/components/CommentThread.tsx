import { useEffect, useState } from 'react'
import { Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Comment } from '@/types'

export function CommentThread({ songId }: { songId: string }) {
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [name, setName] = useState('')
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('comments')
      .select('*')
      .eq('song_id', songId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError(error.message)
        else setComments(data)
      })
    return () => {
      cancelled = true
    }
  }, [songId])

  const submit = async () => {
    const body = draft.trim()
    if (!body || submitting) return
    setSubmitting(true)
    setError(null)
    const display_name = name.trim() || 'Anonymous'
    const { data, error } = await supabase
      .from('comments')
      .insert({ song_id: songId, display_name, body })
      .select()
      .single()
    setSubmitting(false)
    if (error) {
      setError('Could not post your comment. Please try again.')
      return
    }
    setComments((cs) => [...(cs ?? []), data])
    setDraft('')
  }

  return (
    <div className="mt-3.5 border-t border-starlight/[0.08] pt-3">
      {comments === null && <p className="m-0 text-[13px] text-[#7A7699]">Loading comments…</p>}
      {comments?.length === 0 && (
        <p className="m-0 mb-2.5 text-[13px] text-[#7A7699]">No comments yet — say something.</p>
      )}
      {comments && comments.length > 0 && (
        <div className="mb-2.5 flex flex-col gap-2">
          {comments.map((c) => (
            <div key={c.id} className="text-[13px] text-[#D8D4F0]">
              <span className="font-bold text-[#F0B9E4]">{c.display_name}</span>
              <span className="text-[#7A7699]"> — </span>
              {c.body}
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          maxLength={60}
          className="w-[90px] rounded-lg border border-starlight/[0.14] bg-white/[0.03] px-2.5 py-2 text-[12.5px] text-starlight outline-none placeholder:text-[#7A7699]"
        />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Leave a comment..."
          maxLength={2000}
          className="flex-1 rounded-lg border border-starlight/[0.14] bg-white/[0.03] px-2.5 py-2 text-[12.5px] text-starlight outline-none placeholder:text-[#7A7699]"
        />
        <button
          type="button"
          onClick={submit}
          disabled={submitting || !draft.trim()}
          className="flex w-[34px] items-center justify-center rounded-lg border border-aurora-teal/40 bg-aurora-teal/10 text-aurora-teal disabled:opacity-40"
        >
          <Send size={14} />
        </button>
      </div>
      {error && <p className="mt-2 text-[12px] text-stardust-pink">{error}</p>}
    </div>
  )
}
