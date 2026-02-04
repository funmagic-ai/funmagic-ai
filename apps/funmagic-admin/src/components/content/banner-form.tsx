'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BannerFormProps {
  className?: string;
}

export function BannerForm({ className }: BannerFormProps) {
  return (
    <Button size="sm" className={cn(className)} asChild>
      <Link href="/dashboard/content/banners/new">
        <Plus className="mr-2 h-4 w-4" />
        Add Banner
      </Link>
    </Button>
  );
}
