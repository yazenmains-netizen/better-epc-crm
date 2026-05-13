import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string
}

export function NativeSelect({ className, children, placeholder, ...props }: NativeSelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          'w-full appearance-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors',
          'focus:border-ring focus:ring-3 focus:ring-ring/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'h-9 pr-8',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  )
}
