import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  colour: 'green' | 'blue' | 'orange' | 'red'
}

const colourMap = {
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-700',
    value: 'text-green-700',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-700',
    value: 'text-blue-700',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'bg-orange-100 text-orange-700',
    value: 'text-orange-700',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-700',
    value: 'text-red-700',
  },
}

export function StatCard({ title, value, subtitle, icon: Icon, colour }: StatCardProps) {
  const c = colourMap[colour]
  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white p-5 shadow-sm')}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={cn('mt-1 text-3xl font-bold tracking-tight', c.value)}>{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className={cn('rounded-lg p-2.5', c.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
