'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { deleteBanner } from '@/actions/banners';
import { BannerForm } from './banner-form';

interface Banner {
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
  startsAt: Date | null;
  endsAt: Date | null;
}

interface BannerActionsProps {
  banner: Banner;
}

export function BannerActions({ banner }: BannerActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    startTransition(async () => {
      await deleteBanner(banner.id);
    });
  };

  return (
    <div className="flex items-center gap-1">
      <BannerForm mode="edit" banner={banner} />
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isPending}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
