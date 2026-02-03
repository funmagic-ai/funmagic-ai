'use client'

import dynamic from 'next/dynamic'
import type { ToolDetail } from '@/lib/types/tool-configs'

const FigMeExecutor = dynamic(
  () => import('./executors/FigMeExecutor').then((mod) => mod.FigMeExecutor),
  { loading: () => <ExecutorSkeleton /> }
)

const BackgroundRemoveExecutor = dynamic(
  () =>
    import('./executors/BackgroundRemoveExecutor').then(
      (mod) => mod.BackgroundRemoveExecutor
    ),
  { loading: () => <ExecutorSkeleton /> }
)

const CrystalMemoryExecutor = dynamic(
  () =>
    import('./executors/CrystalMemoryExecutor').then(
      (mod) => mod.CrystalMemoryExecutor
    ),
  { loading: () => <ExecutorSkeleton /> }
)

interface ToolExecutorProps {
  tool: ToolDetail
}

export function ToolExecutor({ tool }: ToolExecutorProps) {
  switch (tool.slug) {
    case 'figme':
      return <FigMeExecutor tool={tool} />
    case 'background-remove':
      return <BackgroundRemoveExecutor tool={tool} />
    case 'crystal-memory':
      return <CrystalMemoryExecutor tool={tool} />
    default:
      return <DefaultExecutor tool={tool} />
  }
}

function DefaultExecutor({ tool }: { tool: ToolDetail }) {
  return (
    <div className="bg-card p-8 rounded-xl shadow-sm border">
      <p className="text-muted-foreground text-center py-12">
        Tool interface for &quot;{tool.title}&quot; is coming soon...
      </p>
    </div>
  )
}

function ExecutorSkeleton() {
  return (
    <div className="bg-card p-8 rounded-xl shadow-sm border border-border animate-pulse">
      <div className="h-64 bg-muted rounded-lg" />
    </div>
  )
}
