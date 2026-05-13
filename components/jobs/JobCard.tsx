'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Job, STATUS_COLOURS } from '@/lib/types'
import { MapPin, User, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JobCardProps {
  job: Job
  onClick?: () => void
  isDragging?: boolean
}

export function JobCard({ job, onClick, isDragging }: JobCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: job.id })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm p-3 cursor-grab active:cursor-grabbing select-none',
        isDragging && 'opacity-50 rotate-1 shadow-lg'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-gray-500 tracking-wide uppercase">{job.ref}</span>
        {job.fee && (
          <span className="text-sm font-semibold text-[#16512a] shrink-0">£{job.fee}</span>
        )}
      </div>

      {job.property_address && (
        <div className="flex items-start gap-1.5 mb-1.5">
          <MapPin className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-800 leading-tight line-clamp-2">{job.property_address}</p>
        </div>
      )}

      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {job.clients?.name && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[100px]">{job.clients.name}</span>
          </div>
        )}
        {job.service && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Wrench className="h-3 w-3" />
            <span>{job.service}</span>
          </div>
        )}
      </div>

      {job.paid && (
        <div className="mt-2">
          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Paid</span>
        </div>
      )}
    </div>
  )
}

export function JobCardOverlay({ job }: { job: Job }) {
  return (
    <div className="bg-white rounded-lg border border-gray-300 shadow-xl p-3 rotate-2 opacity-90 cursor-grabbing w-56">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-gray-500 tracking-wide uppercase">{job.ref}</span>
        {job.fee && (
          <span className="text-sm font-semibold text-[#16512a] shrink-0">£{job.fee}</span>
        )}
      </div>
      {job.property_address && (
        <p className="text-sm text-gray-800 line-clamp-1">{job.property_address}</p>
      )}
    </div>
  )
}
