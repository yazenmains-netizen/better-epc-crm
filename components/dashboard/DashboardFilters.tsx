'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function DashboardFilters({ currentMonth }: { currentMonth: string }) {
  const router = useRouter()
  const isAllTime = currentMonth === 'all'

  const [year, month] = isAllTime ? [0, 0] : currentMonth.split('-').map(Number)
  const label = isAllTime
    ? 'All Time'
    : new Date(year, month - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const today = new Date()
  const isCurrentMonth = !isAllTime && year === today.getFullYear() && month === today.getMonth() + 1

  function go(offset: number) {
    const d = new Date(year, month - 1 + offset)
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    router.push(`/?month=${m}`)
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => go(-1)}
        disabled={isAllTime}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className={`text-sm font-semibold min-w-32 text-center ${isAllTime ? 'text-[#16512a]' : 'text-gray-800'}`}>
        {label}
      </span>
      <button
        onClick={() => go(1)}
        disabled={isCurrentMonth || isAllTime}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      {isAllTime ? (
        <button
          onClick={() => router.push('/')}
          className="ml-2 text-xs text-[#16512a] hover:underline font-medium"
        >
          This month
        </button>
      ) : (
        <button
          onClick={() => router.push('/?month=all')}
          className="ml-2 text-xs text-gray-400 hover:text-[#16512a] hover:underline font-medium"
        >
          All time
        </button>
      )}
    </div>
  )
}
