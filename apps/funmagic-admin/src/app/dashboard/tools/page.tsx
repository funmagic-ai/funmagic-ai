import { Suspense } from 'react';
import Link from 'next/link';
import { db, tools } from '@/lib/db';
import { desc } from 'drizzle-orm';
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

      <Suspense fallback={<TableSkeleton columns={6} rows={10} />}>
        <ToolTableData />
      </Suspense>
    </div>
  );
}

async function ToolTableData() {
  const allTools = await db.query.tools.findMany({
    with: { toolType: true },
    orderBy: desc(tools.createdAt),
  });

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
            <TableHead>Status</TableHead>
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
                <div className="flex gap-1">
                  {tool.isActive ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  {tool.isFeatured && <Badge variant="outline">Featured</Badge>}
                </div>
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
