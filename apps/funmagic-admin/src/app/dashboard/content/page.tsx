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
import { Plus, ImageIcon } from 'lucide-react';
import { BannerActions } from '@/components/content/banner-actions';
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

      <Suspense fallback={<TableSkeleton columns={6} rows={10} />}>
        <BannersTable />
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
  linkText: string | null;
  linkTarget: string | null;
  type: string;
  position: number | null;
  badge: string | null;
  badgeColor: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

async function BannersTable() {
  // TODO: After regenerating API types with `bun run api:generate`, use:
  // const { data } = await api.GET('/api/admin/banners');
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

  const now = new Date();

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="hidden sm:table-cell">Thumbnail</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="hidden sm:table-cell">Position</TableHead>
            <TableHead className="hidden md:table-cell">Schedule</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allBanners.map((banner) => {
            const isScheduled =
              (banner.startsAt && new Date(banner.startsAt) > now) ||
              (banner.endsAt && new Date(banner.endsAt) < now);

            return (
              <TableRow key={banner.id}>
                <TableCell className="hidden sm:table-cell">
                  {banner.thumbnail ? (
                    <img
                      src={banner.thumbnail}
                      alt={banner.title}
                      className="h-12 w-20 rounded object-cover"
                    />
                  ) : (
                    <div className="h-12 w-20 rounded bg-muted" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{banner.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{banner.type}</Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{banner.position}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {banner.startsAt || banner.endsAt ? (
                    <div className="text-xs">
                      {banner.startsAt && (
                        <p>Start: {new Date(banner.startsAt).toLocaleDateString()}</p>
                      )}
                      {banner.endsAt && (
                        <p>End: {new Date(banner.endsAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  ) : (
                    'Always'
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {banner.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {isScheduled && <Badge variant="outline">Scheduled</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <BannerActions banner={banner} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
