'use client'

import { useState } from 'react'
import { Job, Client } from '@/lib/types'
import { KanbanBoard } from './KanbanBoard'
import { JobsTable } from './JobsTable'
import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'

export function JobsPageClient({ initialJobs, clients }: { initialJobs: Job[]; clients: Client[] }) {
  const [view, setView] = useState<'kanban' | 'table'>('kanban')

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {initialJobs.length} jobs total
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('kanban')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              view === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </button>
          <button
            onClick={() => setView('table')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              view === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <List className="h-4 w-4" />
            Table
          </button>
        </div>
      </div>

      {view === 'kanban' ? (
        <KanbanBoard initialJobs={initialJobs} clients={clients} />
      ) : (
        <JobsTable initialJobs={initialJobs} clients={clients} />
      )}
    </div>
  )
}
