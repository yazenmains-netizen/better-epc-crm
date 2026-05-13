'use client'

import { useState } from 'react'
import { Job, Client, STATUS_COLOURS } from '@/lib/types'
import { JobModal } from '@/components/jobs/JobModal'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function CalendarView({ initialJobs, clients }: { initialJobs: Job[]; clients: Client[] }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Job | null>(null)
  const [defaultDate, setDefaultDate] = useState('')

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Build calendar grid — Mon-start, 6 rows max
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  // Monday-based: Mon=0, Sun=6
  const startOffset = (firstDay.getDay() + 6) % 7
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7

  const cells: (Date | null)[] = []
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1
    if (dayNum < 1 || dayNum > lastDay.getDate()) cells.push(null)
    else cells.push(new Date(year, month, dayNum))
  }

  // Group jobs by date string
  const byDate: Record<string, Job[]> = {}
  for (const job of initialJobs) {
    if (!job.date) continue
    const key = job.date.slice(0, 10)
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(job)
  }

  function openNew(date: Date) {
    setEditing(null)
    setDefaultDate(isoDate(date))
    setModalOpen(true)
  }

  function openEdit(job: Job) {
    setEditing(job)
    setDefaultDate('')
    setModalOpen(true)
  }

  const monthLabel = new Date(year, month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const todayStr = isoDate(today)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Booked surveys and appointments</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-gray-800 min-w-36 text-center">{monthLabel}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()) }}
            className="ml-2 text-xs text-[#16512a] hover:underline font-medium"
          >
            Today
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            if (!date) {
              return <div key={i} className="min-h-24 border-b border-r border-gray-100 bg-gray-50/50" />
            }
            const key = isoDate(date)
            const dayJobs = byDate[key] || []
            const isToday = key === todayStr
            const isWeekend = date.getDay() === 0 || date.getDay() === 6

            return (
              <div
                key={key}
                className={cn(
                  'min-h-24 border-b border-r border-gray-100 p-1.5 cursor-pointer group relative',
                  isWeekend ? 'bg-gray-50/40' : 'bg-white',
                  'hover:bg-blue-50/30 transition-colors'
                )}
                onClick={() => openNew(date)}
              >
                {/* Date number */}
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full',
                    isToday ? 'bg-[#16512a] text-white' : 'text-gray-600'
                  )}>
                    {date.getDate()}
                  </span>
                  <Plus className="h-3 w-3 text-gray-300 group-hover:text-[#16512a] opacity-0 group-hover:opacity-100 transition-all" />
                </div>

                {/* Jobs on this day */}
                <div className="space-y-0.5">
                  {dayJobs.slice(0, 3).map(job => (
                    <div
                      key={job.id}
                      onClick={e => { e.stopPropagation(); openEdit(job) }}
                      className={cn(
                        'text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity border',
                        STATUS_COLOURS[job.status] || 'bg-gray-100 text-gray-600 border-gray-200'
                      )}
                      title={`${job.time ? job.time + ' · ' : ''}${job.property_address || job.ref || ''}`}
                    >
                      {job.time && <span className="font-semibold mr-1">{job.time}</span>}
                      {job.property_address?.split(',')[0] || job.ref || 'Job'}
                    </div>
                  ))}
                  {dayJobs.length > 3 && (
                    <div className="text-xs text-gray-400 pl-1">+{dayJobs.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        {[
          ['To Be Booked', 'bg-blue-100 text-blue-700 border-blue-200'],
          ['Booked In', 'bg-purple-100 text-purple-700 border-purple-200'],
          ['Completed', 'bg-teal-100 text-teal-700 border-teal-200'],
          ['Invoice Sent', 'bg-amber-100 text-amber-700 border-amber-200'],
          ['Paid', 'bg-green-100 text-green-700 border-green-200'],
        ].map(([label, cls]) => (
          <div key={label} className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', cls)}>
            {label}
          </div>
        ))}
        <p className="text-xs text-gray-400 ml-1 self-center">Click a day to book a new job · Click a job to edit</p>
      </div>

      <JobModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); setDefaultDate('') }}
        job={editing}
        clients={clients}
        defaultDate={defaultDate}
      />
    </>
  )
}
