import { Suspense } from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { ToolGeneralForm } from '@/components/tools/tool-general-form';

export default function NewToolPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/tools">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Tool</h1>
          <p className="text-muted-foreground">Add a new tool to the platform</p>
        </div>
      </div>

      <Suspense fallback={<NewToolSkeleton />}>
        <NewToolContent />
      </Suspense>
    </div>
  );
}

async function NewToolContent() {
  const cookieHeader = (await cookies()).toString();
  const { data } = await api.GET('/api/admin/tool-types', {
    headers: { cookie: cookieHeader },
  });
  const allToolTypes = (data?.toolTypes ?? []).filter((t) => t.isActive);

  return <ToolGeneralForm toolTypes={allToolTypes} />;
}

function NewToolSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
