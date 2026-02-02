import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db, tools, toolTypes, providers } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { ToolGeneralForm } from '@/components/tools/tool-general-form';
import { ToolConfigForm } from '@/components/tools/tool-config-form';

interface ToolDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/tools">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Tool</h1>
          <p className="text-muted-foreground">Update tool settings and configuration</p>
        </div>
      </div>

      <Suspense fallback={<ToolDetailSkeleton />}>
        <ToolDetailContent id={id} />
      </Suspense>
    </div>
  );
}

async function ToolDetailContent({ id }: { id: string }) {
  const tool = await db.query.tools.findFirst({
    where: eq(tools.id, id),
    with: { toolType: true },
  });

  if (!tool) {
    notFound();
  }

  const allToolTypes = await db.query.toolTypes.findMany({
    where: eq(toolTypes.isActive, true),
  });

  const allProviders = await db.query.providers.findMany({
    where: eq(providers.isActive, true),
  });

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="configuration">Configuration</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-6">
        <ToolGeneralForm tool={tool} toolTypes={allToolTypes} />
      </TabsContent>

      <TabsContent value="configuration" className="space-y-6">
        <ToolConfigForm tool={tool} providers={allProviders} />
      </TabsContent>
    </Tabs>
  );
}

function ToolDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
