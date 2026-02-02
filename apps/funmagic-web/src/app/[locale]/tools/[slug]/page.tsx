import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { setRequestLocale } from 'next-intl/server'
import { getToolBySlug } from '@/lib/queries/tools'
import { ToolExecutor } from '@/components/tools/ToolExecutor'
import type { ToolDetail } from '@/lib/types/tool-configs'

interface ToolPageProps {
  params: Promise<{ locale: string; slug: string }>
}

function ToolPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-pulse">
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

  const tool = await getToolBySlug(slug)

  if (!tool) {
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
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-4">{tool.title}</h1>
      {tool.description && (
        <p className="text-muted-foreground mb-8">{tool.description}</p>
      )}
      <ToolExecutor tool={toolDetail} />
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
