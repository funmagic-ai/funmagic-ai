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
import { ProviderActiveSwitch } from '@/components/providers/provider-active-switch';
import { ProviderActions } from '@/components/providers/provider-actions';
import { Plus, Server } from 'lucide-react';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';

export default function ProvidersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Providers</h1>
          <p className="text-muted-foreground">Manage AI service providers</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/providers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Provider
          </Link>
        </Button>
      </div>

      <Suspense fallback={<TableSkeleton columns={6} rows={10} />}>
        <ProvidersTable />
      </Suspense>
    </div>
  );
}

async function ProvidersTable() {
  const cookieHeader = (await cookies()).toString();
  const { data } = await api.GET('/api/admin/providers', {
    headers: { cookie: cookieHeader },
  });
  const allProviders = data?.providers ?? [];

  if (allProviders.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Server />
          </EmptyMedia>
          <EmptyTitle>No providers configured</EmptyTitle>
          <EmptyDescription>
            Add an AI service provider to get started.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" asChild>
            <Link href="/dashboard/providers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Provider
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Display Name</TableHead>
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
                <Badge variant={!provider.healthCheckUrl ? 'secondary' : provider.isHealthy ? 'default' : 'destructive'}>
                  {!provider.healthCheckUrl ? 'No Health Check' : provider.isHealthy ? 'Healthy' : 'Unhealthy'}
                </Badge>
              </TableCell>
              <TableCell>
                <ProviderActiveSwitch
                  providerId={provider.id}
                  isActive={provider.isActive}
                />
              </TableCell>
              <TableCell>
                <ProviderActions providerId={provider.id} providerName={provider.displayName} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
