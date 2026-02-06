import { Suspense } from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Package, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolActiveToggle } from '@/components/tools/tool-active-toggle';
import { ToolFeaturedToggle } from '@/components/tools/tool-featured-toggle';
import { ToolActions } from '@/components/tools/tool-actions';
import { getAllToolDefinitions } from '@funmagic/shared';

export default function ToolsPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <Suspense fallback={<ToolsPageSkeleton />}>
        <ToolsPageContent />
      </Suspense>
    </div>
  );
}

async function ToolsPageContent() {
  const cookieHeader = (await cookies()).toString();
  const { data } = await api.GET('/api/admin/tools', {
    params: { query: { includeInactive: 'true' } },
    headers: { cookie: cookieHeader },
  });
  const allTools = data?.tools ?? [];

  // Calculate tool availability
  const allDefinitions = getAllToolDefinitions();
  const usedSlugs = allTools.map((t) => t.slug);
  const availableCount = allDefinitions.filter((def) => !usedSlugs.includes(def.name)).length;
  const totalDefinitions = allDefinitions.length;
  const allToolsAdded = availableCount === 0;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Tools</h1>
          <p className="text-muted-foreground">Manage AI tools and their configurations</p>
        </div>
        {allToolsAdded ? (
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Tool
          </Button>
        ) : (
          <Button asChild>
            <Link href="/dashboard/tools/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Tool
            </Link>
          </Button>
        )}
      </div>

      {/* Tool Definition Status Card */}
      <div
        className={cn(
          'rounded-lg border p-4 flex items-center justify-between',
          allToolsAdded
            ? 'bg-muted/50 border-muted-foreground/20'
            : 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              allToolsAdded ? 'bg-muted' : 'bg-blue-100 dark:bg-blue-900'
            )}
          >
            {allToolsAdded ? (
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div>
            <p className="font-medium">
              {allToolsAdded
                ? 'All tool definitions added'
                : `${availableCount} tool definition${availableCount > 1 ? 's' : ''} available`}
            </p>
            <p className="text-sm text-muted-foreground">
              {allTools.length} of {totalDefinitions} definitions configured
            </p>
          </div>
        </div>
      </div>

      {allTools.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No tools found</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/tools/new">Create your first tool</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Slug</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Usage</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTools.map((tool) => (
                <TableRow key={tool.id}>
                  <TableCell className="font-medium">{tool.title}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{tool.slug}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tool.toolType?.displayName ?? 'Unknown'}</Badge>
                  </TableCell>
                  <TableCell>
                    <ToolActiveToggle toolId={tool.id} toolName={tool.title} isActive={tool.isActive} />
                  </TableCell>
                  <TableCell>
                    <ToolFeaturedToggle toolId={tool.id} isFeatured={tool.isFeatured} />
                  </TableCell>
                  <TableCell className="text-right">{tool.usageCount.toLocaleString()}</TableCell>
                  <TableCell>
                    <ToolActions toolId={tool.id} toolName={tool.title} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

function ToolsPageSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <Skeleton className="h-[72px] w-full rounded-lg" />
      <div className="rounded-md border">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </>
  );
}
