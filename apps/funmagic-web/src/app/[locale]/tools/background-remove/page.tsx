import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { setRequestLocale } from 'next-intl/server'
import { getToolBySlug } from '@/lib/queries/tools'
import { BackgroundRemoveClient } from './background-remove-client'
import type { ToolDetail } from '@/lib/types/tool-configs'
import type { SupportedLocale } from '@funmagic/shared'

interface PageProps {
  params: Promise<{ locale: string }>
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

async function BackgroundRemoveContent({ params }: { params: Promise<{ locale: string }> }) {
  // Defer to runtime to avoid build-time locale issues
  await connection()

  const { locale } = await params
  setRequestLocale(locale)

  const tool = await getToolBySlug('background-remove', locale as SupportedLocale)

  // Check if tool exists and is active (configured in admin)
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
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-4">{tool.title}</h1>
      {tool.description && (
        <p className="text-muted-foreground mb-8">{tool.description}</p>
      )}
      <BackgroundRemoveClient tool={toolDetail} />
    </div>
  )
}

export default async function BackgroundRemovePage({ params }: PageProps) {
  return (
    <Suspense fallback={<ToolPageSkeleton />}>
      <BackgroundRemoveContent params={params} />
    </Suspense>
  )
}
