'use client'

import { useState, useEffect } from 'react'
import {
  Mail, MessageSquare, Send, X, ChevronDown, ChevronUp,
  Clock, CheckCircle, SkipForward, PenSquare, Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

type CommItem = {
  id: string
  type: 'email' | 'sms'
  recipient: string
  subject: string | null
  body: string
  status: 'pending' | 'sent' | 'skipped'
  created_at: string
  sent_at: string | null
  jobs: {
    ref: string
    property_address: string | null
    service: string | null
    clients: { name: string } | { name: string }[] | null
  } | null
}

type JobOption = {
  id: string
  ref: string
  property_address: string | null
  service: string | null
  date: string | null
  fee: number | null
  contact_phone: string | null
  client_type: string | null
  status: string
  clients: { name: string; email: string | null; phone: string | null } | { name: string; email: string | null; phone: string | null }[] | null
}

function getClientName(item: CommItem) {
  if (!item.jobs?.clients) return null
  const c = Array.isArray(item.jobs.clients) ? item.jobs.clients[0] : item.jobs.clients
  return c?.name ?? null
}

function getJobClient(job: JobOption) {
  if (!job.clients) return null
  return Array.isArray(job.clients) ? job.clients[0] : job.clients
}

function TypeBadge({ type }: { type: 'email' | 'sms' }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${
      type === 'email'
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : 'bg-green-50 text-green-700 border-green-200'
    }`}>
      {type === 'email' ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
      {type === 'email' ? 'Email' : 'SMS'}
    </span>
  )
}

function StatusBadge({ status }: { status: CommItem['status'] }) {
  if (status === 'pending') return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="h-3 w-3" /> Pending
    </span>
  )
  if (status === 'sent') return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700 border border-green-200">
      <CheckCircle className="h-3 w-3" /> Sent
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500 border border-gray-200">
      <SkipForward className="h-3 w-3" /> Skipped
    </span>
  )
}

// ── Pending tab ────────────────────────────────────────────────────────────

function PendingTab({ items, onSend, onSkip }: {
  items: CommItem[]
  onSend: (id: string) => Promise<void>
  onSkip: (id: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <CheckCircle className="h-8 w-8 mx-auto mb-3 text-gray-300" />
        <p className="text-sm font-medium">No pending messages</p>
        <p className="text-xs mt-1">All caught up — use Compose to send a manual message</p>
      </div>
    )
  }

  async function handle(fn: (id: string) => Promise<void>, id: string) {
    setLoading(id)
    try { await fn(id) } finally { setLoading(null) }
  }

  return (
    <div className="divide-y divide-gray-100">
      {items.map(item => {
        const clientName = getClientName(item)
        return (
          <div key={item.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <TypeBadge type={item.type} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.subject ?? item.body.slice(0, 60) + '…'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {clientName && <span className="font-medium text-gray-500">{clientName} · </span>}
                    {item.jobs?.property_address ?? item.recipient}
                  </p>
                  <p className="text-xs text-gray-300 mt-0.5">To: {item.recipient}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                  title="Preview"
                >
                  {expanded === item.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => handle(onSkip, item.id)}
                  disabled={loading === item.id}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors disabled:opacity-40"
                  title="Skip"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handle(onSend, item.id)}
                  disabled={loading === item.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16512a] hover:bg-[#0f3d1e] text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  <Send className="h-3 w-3" />
                  {loading === item.id ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>

            {expanded === item.id && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 whitespace-pre-wrap border border-gray-100 leading-relaxed">
                {item.type === 'email' ? item.body.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : item.body}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── History tab ────────────────────────────────────────────────────────────

function HistoryTab({ items }: { items: CommItem[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'sent' | 'skipped'>('all')

  const visible = items.filter(i => filter === 'all' || i.status === filter)

  if (visible.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-sm">No messages yet</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2 px-5 py-3 border-b border-gray-100">
        {(['all', 'sent', 'skipped'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
              filter === f
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="divide-y divide-gray-100">
        {visible.map(item => {
          const clientName = getClientName(item)
          const date = item.sent_at ?? item.created_at
          return (
            <div key={item.id} className="px-5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <TypeBadge type={item.type} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.subject ?? item.body.slice(0, 60) + '…'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {clientName && <span className="font-medium text-gray-500">{clientName} · </span>}
                      {item.recipient}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400">
                    {format(new Date(date), 'd MMM, HH:mm')}
                  </span>
                  <StatusBadge status={item.status} />
                  <button
                    onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    {expanded === item.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              {expanded === item.id && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 whitespace-pre-wrap border border-gray-100 leading-relaxed">
                  {item.type === 'email' ? item.body.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : item.body}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Compose tab ────────────────────────────────────────────────────────────

type TemplateItem = { id: string; label: string; channel: 'email' | 'sms'; needs: 'email' | 'phone' }
type TemplateGroup = { label: string; items: TemplateItem[] }

const TEMPLATE_GROUPS: TemplateGroup[] = [
  {
    label: 'Automated templates',
    items: [
      { id: 'booking-confirmation', label: 'Booking Confirmation', channel: 'email', needs: 'email' },
      { id: 'payment-chaser',       label: 'Payment Reminder',     channel: 'email', needs: 'email' },
      { id: 'day-before-reminder',  label: 'Day Before Reminder',  channel: 'sms',   needs: 'phone' },
      { id: 'review-request',       label: 'Review Request',       channel: 'sms',   needs: 'phone' },
    ],
  },
  {
    label: 'Other templates',
    items: [
      { id: 'epc-pre-visit',  label: 'EPC Pre-Visit Info',      channel: 'email', needs: 'email' },
      { id: 'job-completion', label: 'Job Completion + Invoice', channel: 'email', needs: 'email' },
    ],
  },
  {
    label: 'Custom',
    items: [
      { id: 'custom-email', label: 'Custom Email', channel: 'email', needs: 'email' },
      { id: 'custom-sms',   label: 'Custom SMS',   channel: 'sms',   needs: 'phone' },
    ],
  },
]

const ALL_TEMPLATES = TEMPLATE_GROUPS.flatMap(g => g.items)

const SIG = '\n\nYazen Yafai\nBetter EPC Rating\n07413 993550 | yourhomespecialist.co.uk'

function buildContent(
  id: string,
  job: JobOption,
  client: { name: string; email: string | null; phone: string | null } | null,
  googleReviewUrl: string,
  lodgementUrl = '',
): { subject: string; body: string } {
  const addr = job.property_address ?? 'the property'
  const svc  = job.service ?? 'assessment'
  const name = client?.name ?? 'there'
  const dateStr = job.date ? format(new Date(job.date), 'd MMMM yyyy') : 'your scheduled date'

  switch (id) {
    case 'booking-confirmation':
      return {
        subject: `Booking Confirmed – ${addr}`,
        body: `Hi ${name},\n\nI'm writing to confirm that I've booked in the ${svc} at ${addr} for ${dateStr}.\n\nPlease don't hesitate to get in touch if you need anything changed or have any questions.${SIG}`,
      }
    case 'payment-chaser':
      return {
        subject: `Invoice Reminder – ${job.ref ?? 'N/A'}`,
        body: `Hi ${name},\n\nJust a friendly reminder that invoice ${job.ref ?? 'N/A'} for £${(job.fee ?? 0).toFixed(2)} is still outstanding.\n\nBank: Monzo Business\nSort Code: 04-00-06\nAccount Number: 09572715\n\nPlease get in touch if you have any questions.${SIG}`,
      }
    case 'day-before-reminder':
      return {
        subject: '',
        body: `Hi, this is a reminder that Yazen from Better EPC Rating will be visiting ${addr} tomorrow (${dateStr}) for your ${svc}. Please ensure access is available. Call/text 07413 993550 with any questions.`,
      }
    case 'review-request':
      return {
        subject: '',
        body: `Hi, thank you for choosing Better EPC Rating for your ${svc} at ${addr}. We'd really appreciate a quick review — it only takes a minute: ${googleReviewUrl} Thanks, Yazen`,
      }
    case 'epc-pre-visit':
      return {
        subject: `EPC Visit – What to Prepare – ${addr}`,
        body: `Hi ${name},\n\nI'm writing ahead of the EPC assessment at ${addr} on ${dateStr}.\n\nTo help me carry out the assessment as efficiently as possible, please ensure the following before my visit:\n\n• All rooms, including any loft, are accessible\n• The boiler and hot water cylinder are accessible (any cupboards unlocked)\n• Heating controls (thermostat, programmer) are visible and accessible\n• Any outbuildings or extensions are accessible\n• Loft hatch is clear and accessible if there is one\n\nThe assessment typically takes 45–60 minutes. You don't need to be present throughout, but access must be arranged.\n\nPlease feel free to call or text if you have any questions.${SIG}`,
      }
    case 'job-completion': {
      const lodgement = lodgementUrl || '[LODGEMENT URL]'
      return {
        subject: `${job.ref ? job.ref + ' – ' : ''}${addr} – ${svc} Complete`,
        body: `Hi ${name},\n\nPlease find the lodgement for ${addr} below:\n\n${lodgement}\n\nPlease also find the invoice (${job.ref ?? 'N/A'} — £${(job.fee ?? 0).toFixed(2)}) attached.\n\nPlease don't hesitate to get in touch if you need anything else.${SIG}`,
      }
    }
    default:
      return { subject: '', body: '' }
  }
}

function ComposeTab({
  jobs,
  googleReviewUrl,
  onSent,
}: {
  jobs: JobOption[]
  googleReviewUrl: string
  onSent: (item: CommItem) => void
}) {
  const [jobSearch, setJobSearch] = useState('')
  const [selectedJobId, setSelectedJobId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [lodgementUrl, setLodgementUrl] = useState('')
  const [recipient, setRecipient] = useState('')
  const [sending, setSending] = useState(false)
  const [showJobList, setShowJobList] = useState(false)

  const selectedJob    = jobs.find(j => j.id === selectedJobId) ?? null
  const selectedClient = selectedJob ? getJobClient(selectedJob) : null
  const template       = ALL_TEMPLATES.find(t => t.id === templateId) ?? null

  const filteredJobs = jobs.filter(j => {
    const q = jobSearch.toLowerCase()
    return (
      (j.ref ?? '').toLowerCase().includes(q) ||
      (j.property_address ?? '').toLowerCase().includes(q) ||
      (getJobClient(j)?.name ?? '').toLowerCase().includes(q)
    )
  }).slice(0, 20)

  // Auto-fill subject + body when template or job changes
  useEffect(() => {
    if (!templateId || !selectedJob) { setSubject(''); setBody(''); return }
    if (templateId === 'custom-email' || templateId === 'custom-sms') { setSubject(''); setBody(''); return }
    const content = buildContent(templateId, selectedJob, selectedClient, googleReviewUrl, lodgementUrl)
    setSubject(content.subject)
    setBody(content.body)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, selectedJobId])

  function selectTemplate(id: string) {
    setTemplateId(id)
    const t = ALL_TEMPLATES.find(x => x.id === id)
    if (t && selectedJob) {
      const auto = t.channel === 'email'
        ? (selectedClient?.email ?? '')
        : (selectedJob.contact_phone ?? selectedClient?.phone ?? '')
      setRecipient(auto)
    }
    if (!selectedJob || id === 'custom-email' || id === 'custom-sms') { setSubject(''); setBody(''); return }
    const content = buildContent(id, selectedJob, selectedClient, googleReviewUrl, lodgementUrl)
    setSubject(content.subject)
    setBody(content.body)
  }

  function updateLodgement(url: string) {
    setLodgementUrl(url)
    if (templateId === 'job-completion' && selectedJob) {
      const content = buildContent('job-completion', selectedJob, selectedClient, googleReviewUrl, url)
      setSubject(content.subject)
      setBody(content.body)
    }
  }

  const isEmail = template?.channel === 'email'
  const canSend = !!(selectedJob && template && recipient.trim() && body.trim())

  async function handleSend() {
    if (!canSend) return
    setSending(true)
    try {
      const res = await fetch('/api/comms/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJob!.id,
          manualBody: body,
          manualSubject: subject || undefined,
          manualRecipient: recipient,
          channel: template!.channel,
        }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Failed to send')
        return
      }

      toast.success(`${isEmail ? 'Email' : 'SMS'} sent to ${recipient}`)

      onSent({
        id: crypto.randomUUID(),
        type: template!.channel as 'email' | 'sms',
        recipient,
        subject: subject || null,
        body,
        status: 'sent',
        created_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        jobs: {
          ref: selectedJob!.ref,
          property_address: selectedJob!.property_address,
          service: selectedJob!.service,
          clients: selectedClient ? { name: selectedClient.name } : null,
        },
      })

      setTemplateId(''); setSubject(''); setBody(''); setLodgementUrl(''); setRecipient('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="px-5 py-5 space-y-6">

      {/* Job picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Job / Property</label>
        <div className="relative">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#16512a] focus-within:border-transparent">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by ref, address or client name…"
              value={selectedJob
                ? `${selectedJob.ref} · ${selectedJob.property_address ?? ''} (${getJobClient(selectedJob)?.name ?? ''})`
                : jobSearch}
              onChange={e => {
                if (selectedJobId) { setSelectedJobId(''); setTemplateId(''); setSubject(''); setBody(''); setRecipient('') }
                setJobSearch(e.target.value)
                setShowJobList(true)
              }}
              onFocus={() => { if (!selectedJobId) setShowJobList(true) }}
              onBlur={() => setTimeout(() => setShowJobList(false), 150)}
              className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
            />
            {selectedJobId && (
              <button onClick={() => { setSelectedJobId(''); setJobSearch(''); setTemplateId(''); setSubject(''); setBody(''); setRecipient('') }} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {showJobList && !selectedJobId && jobs.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
              {filteredJobs.map(job => {
                const c = getJobClient(job)
                return (
                  <button
                    key={job.id}
                    onClick={() => { setSelectedJobId(job.id); setJobSearch(''); setShowJobList(false) }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                  >
                    <p className="text-sm font-medium text-gray-900">{job.ref} · {job.property_address ?? '—'}</p>
                    <p className="text-xs text-gray-500">{c?.name ?? '—'} · {job.service ?? '—'} · {job.status}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Template groups */}
      {selectedJob && (
        <div className="space-y-4">
          {TEMPLATE_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{group.label}</p>
              <div className="grid grid-cols-2 gap-2">
                {group.items.map(t => (
                  <button
                    key={t.id}
                    onClick={() => selectTemplate(t.id)}
                    className={`text-left px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                      templateId === t.id
                        ? 'border-[#16512a] bg-green-50 text-[#16512a]'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {t.channel === 'email'
                        ? <Mail className="h-3 w-3 shrink-0" />
                        : <MessageSquare className="h-3 w-3 shrink-0" />}
                      {t.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lodgement URL field — job completion only */}
      {templateId === 'job-completion' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Lodgement URL <span className="text-gray-400 font-normal">(paste from your lodgement portal)</span>
          </label>
          <input
            type="url"
            value={lodgementUrl}
            onChange={e => updateLodgement(e.target.value)}
            placeholder="https://…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16512a] focus:border-transparent"
          />
        </div>
      )}

      {/* Subject (email only) */}
      {templateId && isEmail && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Email subject…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16512a] focus:border-transparent"
          />
        </div>
      )}

      {/* Body — editable for all templates */}
      {templateId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Message <span className="text-gray-400 font-normal">— edit freely before sending</span>
          </label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Type your message…"
            rows={templateId === 'epc-pre-visit' || templateId === 'job-completion' ? 12 : 8}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16512a] focus:border-transparent resize-y font-mono leading-relaxed"
          />
        </div>
      )}

      {/* Recipient + Send */}
      {templateId && (
        <div className="space-y-3 pt-1 border-t border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              To <span className="text-gray-400 font-normal">({isEmail ? 'email address' : 'phone number'} — edit if needed)</span>
            </label>
            <input
              type={isEmail ? 'email' : 'tel'}
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              placeholder={isEmail ? 'email@address.com' : '07700 000000'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16512a] focus:border-transparent"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSend}
              disabled={!canSend || sending}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#16512a] hover:bg-[#0f3d1e] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {sending ? 'Sending…' : 'Send Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function CommsHub({
  initialItems,
  jobs,
  googleReviewUrl,
}: {
  initialItems: CommItem[]
  jobs: JobOption[]
  googleReviewUrl: string
}) {
  const [items, setItems] = useState<CommItem[]>(initialItems)
  const [tab, setTab] = useState<'pending' | 'history' | 'compose'>('pending')

  const pending = items.filter(i => i.status === 'pending')
  const history = items.filter(i => i.status !== 'pending')

  async function handleSend(id: string) {
    const res = await fetch('/api/comms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}))
      toast.error(error ?? 'Failed to send')
      return
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'sent' as const, sent_at: new Date().toISOString() } : i))
    toast.success('Sent!')
  }

  async function handleSkip(id: string) {
    await fetch('/api/comms/skip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'skipped' as const } : i))
  }

  function handleManualSent(item: CommItem) {
    setItems(prev => [item, ...prev])
    setTab('history')
  }

  const tabs = [
    { id: 'pending' as const, label: 'Pending', count: pending.length },
    { id: 'history' as const, label: 'History', count: history.length },
    { id: 'compose' as const, label: 'Compose', icon: PenSquare },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-[#16512a] text-[#16512a]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {'icon' in t && t.icon && <t.icon className="h-3.5 w-3.5" />}
            {t.label}
            {'count' in t && (t.count ?? 0) > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                t.id === 'pending'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'pending' && (
        <PendingTab items={pending} onSend={handleSend} onSkip={handleSkip} />
      )}
      {tab === 'history' && (
        <HistoryTab items={history} />
      )}
      {tab === 'compose' && (
        <ComposeTab jobs={jobs} googleReviewUrl={googleReviewUrl} onSent={handleManualSent} />
      )}
    </div>
  )
}
