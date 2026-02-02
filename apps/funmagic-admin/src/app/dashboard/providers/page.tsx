import { Suspense } from 'react';
import Link from 'next/link';
import { db, providers } from '@/lib/db';
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
import { ProviderForm } from '@/components/providers/provider-form';

export default function ProvidersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Providers</h1>
          <p className="text-muted-foreground">Manage AI service providers</p>
        </div>
        <ProviderForm mode="create" />
      </div>

      <Suspense fallback={<TableSkeleton columns={6} rows={10} />}>
        <ProvidersTable />
      </Suspense>
    </div>
  );
}

async function ProvidersTable() {
  const allProviders = await db.query.providers.findMany();

  if (allProviders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No providers configured</p>
        <ProviderForm mode="create" className="mt-4" />
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
            <TableHead>Type</TableHead>
            <TableHead>Health</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allProviders.map((provider) => (
            <TableRow key={provider.id}>
              <TableCell className="font-medium">{provider.name}</TableCell>
              <TableCell>{provider.displayName}</TableCell>
              <TableCell>
                <Badge variant="outline">{provider.type}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={provider.isHealthy ? 'default' : 'destructive'}>
                  {provider.isHealthy ? 'Healthy' : 'Unhealthy'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={provider.isActive ? 'default' : 'secondary'}>
                  {provider.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/dashboard/providers/${provider.id}`}>
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
