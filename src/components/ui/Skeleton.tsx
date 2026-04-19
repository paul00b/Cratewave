interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = 'h-12 w-full' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-lg bg-surface ${className}`} />
}

interface SkeletonListProps {
  count: number
  className?: string
}

export function SkeletonList({ count, className = 'h-20 w-full' }: SkeletonListProps) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  )
}
