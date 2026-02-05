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
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Pencil, Plus } from 'lucide-react';
import { ToolActiveToggle } from '@/components/tools/tool-active-toggle';
import { ToolFeaturedToggle } from '@/components/tools/tool-featured-toggle';

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tools</h1>
          <p className="text-muted-foreground">Manage AI tools and their configurations</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/tools/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Tool
          </Link>
        </Button>
      </div>

      <Suspense fallback={<TableSkeleton columns={7} rows={10} />}>
        <ToolTableData />
      </Suspense>
    </div>
  );
}

async function ToolTableData() {
  const cookieHeader = (await cookies()).toString();
  const { data } = await api.GET('/api/admin/tools', {
    params: { query: { includeInactive: 'true' } },
    headers: { cookie: cookieHeader },
  });
  const allTools = data?.tools ?? [];

  if (allTools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No tools found</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/tools/new">Create your first tool</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Slug</TableHead>
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
              <TableCell className="text-muted-foreground">{tool.slug}</TableCell>
              <TableCell>
                <Badge variant="outline">{tool.toolType?.displayName ?? 'Unknown'}</Badge>
              </TableCell>
              <TableCell>
                <ToolActiveToggle toolId={tool.id} isActive={tool.isActive} />
              </TableCell>
              <TableCell>
                <ToolFeaturedToggle toolId={tool.id} isFeatured={tool.isFeatured} />
              </TableCell>
              <TableCell className="text-right">{tool.usageCount.toLocaleString()}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/dashboard/tools/${tool.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
