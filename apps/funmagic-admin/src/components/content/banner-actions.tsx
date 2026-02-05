'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { deleteBanner, toggleBannerStatus } from '@/actions/banners';

interface Banner {
  id: string;
  title: string;
  isActive: boolean;
}

interface BannerActionsProps {
  banner: Banner;
}

export function BannerActions({ banner }: BannerActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [isToggling, startToggleTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteBanner(banner.id);
        toast.success('Banner deleted successfully');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to delete banner');
      }
    });
  };

  const handleToggle = () => {
    startToggleTransition(async () => {
      try {
        await toggleBannerStatus(banner.id);
        toast.success(banner.isActive ? 'Banner deactivated' : 'Banner activated');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to toggle status');
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={banner.isActive}
        onCheckedChange={handleToggle}
        disabled={isToggling}
        aria-label="Toggle active status"
      />
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/dashboard/content/banners/${banner.id}/edit`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <DeleteConfirmDialog
        title="Delete banner?"
        description={`Are you sure you want to delete "${banner.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  );
}
