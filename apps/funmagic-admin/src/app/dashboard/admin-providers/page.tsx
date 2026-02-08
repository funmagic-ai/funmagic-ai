import { Suspense } from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { AdminProviderActiveSwitch } from '@/components/admin-providers/admin-provider-active-switch';
import { AdminProviderActions } from '@/components/admin-providers/admin-provider-actions';
import { Plus, Server, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminProvider {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  baseUrl: string | null;
  config: unknown;
  isActive: boolean;
  hasApiKey: boolean;
  hasApiSecret: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminProvidersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Studio Providers</h1>
          <p className="text-muted-foreground">
            Configure API keys for AI Studio image generation
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/admin-providers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Provider
          </Link>
        </Button>
      </div>

      <Suspense fallback={<TableSkeleton columns={5} rows={3} />}>
        <AdminProvidersTable />
      </Suspense>
    </div>
  );
}

async function AdminProvidersTable() {
  const cookieHeader = (await cookies()).toString();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${baseUrl}/api/admin/admin-providers`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });

  const data = await response.json() as { providers: AdminProvider[] };
  const allProviders = data?.providers ?? [];

  if (allProviders.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center">
        <Server className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">No AI providers configured</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Add an AI provider to enable image generation in AI Studio.
        </p>
        <Button size="sm" className="mt-4" asChild>
          <Link href="/dashboard/admin-providers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Provider
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
            <TableHead>Provider</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>API Key</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allProviders.map((provider) => (
            <TableRow key={provider.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{provider.displayName}</span>
                  <span className="text-xs text-muted-foreground">{provider.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {provider.description || '-'}
              </TableCell>
              <TableCell>
                {provider.hasApiKey ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Not Set
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <AdminProviderActiveSwitch
                  providerId={provider.id}
                  providerName={provider.displayName}
                  isActive={provider.isActive}
                />
              </TableCell>
              <TableCell>
                <AdminProviderActions
                  providerId={provider.id}
                  providerName={provider.displayName}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
