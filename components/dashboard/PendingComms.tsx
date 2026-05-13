'use client'

import { useState } from 'react'
import { Mail, MessageSquare, Send, X, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

interface CommItem {
  id: string
  type: 'email' | 'sms'
  recipient: string
  subject: string | null
  body: string
  created_at: string
}

export function PendingComms({ initialItems }: { initialItems: CommItem[] }) {
  const [items, setItems] = useState<CommItem[]>(initialItems)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  if (items.length === 0) return null

  async function handleSend(id: string) {
    setLoading(id)
    try {
      const res = await fetch('/api/comms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Failed to send')
        return
      }
      setItems(prev => prev.filter(i => i.id !== id))
      toast.success('Sent!')
    } finally {
      setLoading(null)
    }
  }

  async function handleSkip(id: string) {
    setLoading(id)
    try {
      await fetch('/api/comms/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setItems(prev => prev.filter(i => i.id !== id))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-amber-100 bg-amber-50">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold shrink-0">
          {items.length}
        </span>
        <h2 className="font-semibold text-gray-900">Pending Messages</h2>
        <span className="text-xs text-amber-700 ml-1">— review before sending</span>
      </div>

      <div className="divide-y divide-gray-50">
        {items.map(item => (
          <div key={item.id} className="px-5 py-3">
            <div className="flex items-start justify-between gap-3">
              {/* Icon + meta */}
              <div className="flex items-start gap-2 min-w-0">
                <span className={`mt-0.5 shrink-0 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${
                  item.type === 'email'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-green-50 text-green-700 border-green-200'
                }`}>
                  {item.type === 'email' ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                  {item.type === 'email' ? 'Email' : 'SMS'}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.subject ?? item.body.slice(0, 60) + '…'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">To: {item.recipient}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                  title="Preview message"
                >
                  {expanded === item.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => handleSkip(item.id)}
                  disabled={loading === item.id}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                  title="Skip"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleSend(item.id)}
                  disabled={loading === item.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16512a] hover:bg-[#0f3d1e] text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  <Send className="h-3 w-3" />
                  Send
                </button>
              </div>
            </div>

            {/* Expanded preview */}
            {expanded === item.id && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 whitespace-pre-wrap border border-gray-100">
                {item.type === 'email'
                  ? item.body.replace(/<[^>]+>/g, '').trim()
                  : item.body}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
