import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db, providers } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { ProviderEditForm } from '@/components/providers/provider-edit-form';

interface ProviderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProviderDetailPage({ params }: ProviderDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/providers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Provider</h1>
          <p className="text-muted-foreground">Update provider configuration</p>
        </div>
      </div>

      <Suspense fallback={<ProviderDetailSkeleton />}>
        <ProviderDetailContent id={id} />
      </Suspense>
    </div>
  );
}

async function ProviderDetailContent({ id }: { id: string }) {
  const provider = await db.query.providers.findFirst({
    where: eq(providers.id, id),
  });

  if (!provider) {
    notFound();
  }

  return <ProviderEditForm provider={provider} />;
}

function ProviderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-96" />
    </div>
  );
}
