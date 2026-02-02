import { Suspense } from 'react';
import { db, banners } from '@/lib/db';
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
import { BannerForm } from '@/components/content/banner-form';
import { BannerActions } from '@/components/content/banner-actions';

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content</h1>
          <p className="text-muted-foreground">Manage banners and promotional content</p>
        </div>
        <BannerForm mode="create" />
      </div>

      <Suspense fallback={<TableSkeleton columns={6} rows={10} />}>
        <BannersTable />
      </Suspense>
    </div>
  );
}

async function BannersTable() {
  const allBanners = await db.query.banners.findMany({
    orderBy: banners.position,
  });

  if (allBanners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No banners configured</p>
        <BannerForm mode="create" className="mt-4" />
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Thumbnail</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Schedule</TableHead>
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
                <TableCell>
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
                <TableCell>{banner.position}</TableCell>
                <TableCell className="text-muted-foreground">
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
