'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { deleteBanner } from '@/actions/banners';

interface Banner {
  id: string;
  title: string;
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
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/dashboard/content/banners/${banner.id}/edit`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
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
