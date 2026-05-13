'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import { Job, Client, KANBAN_COLUMNS, JobStatus, STATUS_COLUMN_COLOURS } from '@/lib/types'
import { JobCard, JobCardOverlay } from './JobCard'
import { JobModal } from './JobModal'
import { updateJobStatus } from '@/app/actions/jobs'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

function KanbanColumn({
  status,
  jobs,
  onCardClick,
  onAddClick,
}: {
  status: JobStatus
  jobs: Job[]
  onCardClick: (job: Job) => void
  onAddClick: (status: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex flex-col w-60 shrink-0">
      {/* Column header */}
      <div className={cn('bg-white rounded-t-lg border border-b-0 border-gray-200 px-3 pt-3 pb-2 border-t-4', STATUS_COLUMN_COLOURS[status])}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700 truncate">{status}</span>
          <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 ml-1 shrink-0">
            {jobs.length}
          </span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[200px] bg-gray-50 rounded-b-lg border border-gray-200 p-2 space-y-2 transition-colors',
          isOver && 'bg-green-50 border-green-300'
        )}
      >
        {jobs.map(job => (
          <JobCard key={job.id} job={job} onClick={() => onCardClick(job)} />
        ))}

        <button
          onClick={() => onAddClick(status)}
          className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add job
        </button>
      </div>
    </div>
  )
}

interface KanbanBoardProps {
  initialJobs: Job[]
  clients: Client[]
}

export function KanbanBoard({ initialJobs, clients }: KanbanBoardProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [activeJob, setActiveJob] = useState<Job | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<string>('To Be Booked')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const jobsByStatus = KANBAN_COLUMNS.reduce<Record<string, Job[]>>((acc, status) => {
    acc[status] = jobs.filter(j => j.status === status)
    return acc
  }, {})

  function handleDragStart(event: DragStartEvent) {
    setActiveJob(jobs.find(j => j.id === event.active.id) || null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveJob(null)
    const { active, over } = event
    if (!over) return

    const jobId = active.id as string
    const newStatus = over.id as string
    const job = jobs.find(j => j.id === jobId)
    if (!job || job.status === newStatus) return

    // Optimistic update
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus as JobStatus } : j))
    const result = await updateJobStatus(jobId, newStatus)
    if (result?.error) {
      // Revert on error
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: job.status } : j))
    }
  }

  function handleCardClick(job: Job) {
    setEditingJob(job)
    setModalOpen(true)
  }

  function handleAddClick(status: string) {
    setEditingJob(null)
    setDefaultStatus(status)
    setModalOpen(true)
  }

  function handleModalClose() {
    setModalOpen(false)
    setEditingJob(null)
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-[500px]">
          {KANBAN_COLUMNS.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              jobs={jobsByStatus[status] || []}
              onCardClick={handleCardClick}
              onAddClick={handleAddClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeJob && <JobCardOverlay job={activeJob} />}
        </DragOverlay>
      </DndContext>

      <JobModal
        open={modalOpen}
        onClose={handleModalClose}
        job={editingJob}
        clients={clients}
        defaultStatus={defaultStatus}
      />
    </>
  )
}
