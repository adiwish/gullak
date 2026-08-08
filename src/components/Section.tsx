import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function SectionLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground', className)}
      {...props}
    />
  )
}
