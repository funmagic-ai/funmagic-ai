import { Suspense } from 'react';
import { db, toolTypes } from '@/lib/db';
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
import { ToolTypeForm } from '@/components/tool-types/tool-type-form';
import { ToolTypeActions } from '@/components/tool-types/tool-type-actions';

export default function ToolTypesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tool Types</h1>
          <p className="text-muted-foreground">Manage tool categories</p>
        </div>
        <ToolTypeForm mode="create" />
      </div>

      <Suspense fallback={<TableSkeleton columns={6} rows={10} />}>
        <ToolTypesTable />
      </Suspense>
    </div>
  );
}

async function ToolTypesTable() {
  const allToolTypes = await db.query.toolTypes.findMany({
    orderBy: toolTypes.sortOrder,
  });

  if (allToolTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No tool types configured</p>
        <ToolTypeForm mode="create" className="mt-4" />
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
            <TableHead>Icon</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allToolTypes.map((type) => (
            <TableRow key={type.id}>
              <TableCell className="font-medium">{type.name}</TableCell>
              <TableCell>{type.displayName}</TableCell>
              <TableCell className="text-muted-foreground">{type.icon ?? '-'}</TableCell>
              <TableCell>
                {type.color ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="text-sm text-muted-foreground">{type.color}</span>
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{type.sortOrder}</TableCell>
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
