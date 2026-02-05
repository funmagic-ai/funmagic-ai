import { Suspense } from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Plus, ImageIcon } from 'lucide-react';
import { BannersTable } from '@/components/content/banners-table';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';

export default function ContentPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Content</h1>
          <p className="text-muted-foreground">Manage banners and promotional content</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/content/banners/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Banner
          </Link>
        </Button>
      </div>

      <Suspense fallback={<TableSkeleton columns={5} rows={10} />}>
        <BannersTableWrapper />
      </Suspense>
    </div>
  );
}

interface AdminBanner {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string;
  link: string | null;
  linkText: string;
  linkTarget: string;
  type: string;
  position: number | null;
  badge: string | null;
  badgeColor: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

async function BannersTableWrapper() {
  const cookieHeader = (await cookies()).toString();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${baseUrl}/api/admin/banners`, {
    headers: { cookie: cookieHeader },
  });
  const data = (await res.json()) as { banners: AdminBanner[] };
  const allBanners = data?.banners ?? [];

  if (allBanners.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ImageIcon />
          </EmptyMedia>
          <EmptyTitle>No banners configured</EmptyTitle>
          <EmptyDescription>
            Create promotional banners to display on your site.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" asChild>
            <Link href="/dashboard/content/banners/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Banner
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return <BannersTable banners={allBanners} />;
}
