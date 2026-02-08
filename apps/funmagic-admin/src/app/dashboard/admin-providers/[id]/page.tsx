import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { AdminProviderEditForm } from '@/components/admin-providers/admin-provider-edit-form';

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

interface AdminProviderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminProviderDetailPage({ params }: AdminProviderDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin-providers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configure Provider</h1>
          <p className="text-muted-foreground">Set API key for AI Studio integration</p>
        </div>
      </div>

      <Suspense fallback={<AdminProviderDetailSkeleton />}>
        <AdminProviderDetailContent id={id} />
      </Suspense>
    </div>
  );
}

async function AdminProviderDetailContent({ id }: { id: string }) {
  const cookieHeader = (await cookies()).toString();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${baseUrl}/api/admin/admin-providers/${id}`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });

  if (!response.ok) {
    notFound();
  }

  const data = await response.json() as { provider: AdminProvider };

  if (!data?.provider) {
    notFound();
  }

  return <AdminProviderEditForm provider={data.provider} />;
}

function AdminProviderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64" />
    </div>
  );
}
