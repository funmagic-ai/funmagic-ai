import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { connection } from 'next/server'
import { setRequestLocale } from 'next-intl/server'
import { getToolBySlug } from '@/lib/queries/tools'
import type { ToolDetail } from '@/lib/types/tool-configs'
import type { SupportedLocale } from '@funmagic/shared'

interface ToolPageProps {
  params: Promise<{ locale: string; slug: string }>
}

// Tools that have been migrated to colocated routes
const MIGRATED_TOOLS = ['figme', 'background-remove', 'crystal-memory'] as const

function ToolPageSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto py-12 px-4 sm:px-6 lg:px-8 animate-pulse">
      <div className="h-10 w-3/4 bg-muted rounded mb-4" />
      <div className="h-6 w-full bg-muted rounded mb-8" />
      <div className="h-64 w-full bg-muted rounded" />
    </div>
  )
}

async function ToolContent({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  await connection()
  const { locale, slug } = await params
  setRequestLocale(locale)

  // Redirect to colocated route if this tool has been migrated
  if (MIGRATED_TOOLS.includes(slug as typeof MIGRATED_TOOLS[number])) {
    redirect(`/${locale}/tools/${slug}`)
  }

  const tool = await getToolBySlug(slug, locale as SupportedLocale)

  if (!tool || !tool.isActive) {
    notFound()
  }

  const toolDetail: ToolDetail = {
    id: tool.id,
    slug: tool.slug,
    title: tool.title,
    description: tool.description,
    shortDescription: tool.shortDescription,
    thumbnail: tool.thumbnail,
    config: tool.config as ToolDetail['config'],
    isActive: tool.isActive,
    isFeatured: tool.isFeatured,
    usageCount: tool.usageCount,
  }

  return (
    <div className="max-w-[1200px] mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold mb-4">{tool.title}</h1>
      {tool.description && (
        <p className="text-muted-foreground mb-8">{tool.description}</p>
      )}
      <DefaultToolExecutor tool={toolDetail} />
    </div>
  )
}

function DefaultToolExecutor({ tool }: { tool: ToolDetail }) {
  return (
    <div className="glass-panel rounded-xl p-8">
      <p className="text-muted-foreground text-center py-12">
        Tool interface for &quot;{tool.title}&quot; is coming soon...
      </p>
    </div>
  )
}

export default async function ToolPage({ params }: ToolPageProps) {
  return (
    <Suspense fallback={<ToolPageSkeleton />}>
      <ToolContent params={params} />
    </Suspense>
  )
}
