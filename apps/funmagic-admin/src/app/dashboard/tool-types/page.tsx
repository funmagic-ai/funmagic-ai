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
import { Plus } from 'lucide-react';
import { ToolTypeActions } from '@/components/tool-types/tool-type-actions';

export default function ToolTypesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tool Types</h1>
          <p className="text-muted-foreground">Manage tool categories</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/tool-types/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Tool Type
          </Link>
        </Button>
      </div>

      <Suspense fallback={<TableSkeleton columns={4} rows={10} />}>
        <ToolTypesTable />
      </Suspense>
    </div>
  );
}

async function ToolTypesTable() {
  const cookieHeader = (await cookies()).toString();
  const { data } = await api.GET('/api/admin/tool-types', {
    headers: { cookie: cookieHeader },
  });
  const allToolTypes = data?.toolTypes ?? [];

  if (allToolTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No tool types configured</p>
        <Button size="sm" className="mt-4" asChild>
          <Link href="/dashboard/tool-types/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Tool Type
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Display Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allToolTypes.map((type) => (
            <TableRow key={type.id}>
              <TableCell className="font-medium">{type.name}</TableCell>
              <TableCell>{type.displayName}</TableCell>
              <TableCell>
                <Badge variant={type.isActive ? 'default' : 'secondary'}>
                  {type.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <ToolTypeActions toolType={type} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
