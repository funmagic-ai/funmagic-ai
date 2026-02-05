'use client';

import { useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { toggleToolStatus } from '@/actions/tools';

interface ToolFeaturedToggleProps {
  toolId: string;
  isFeatured: boolean;
}

export function ToolFeaturedToggle({ toolId, isFeatured }: ToolFeaturedToggleProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await toggleToolStatus(toolId, 'isFeatured');
      } catch (error) {
        console.error('Failed to toggle featured status:', error);
      }
    });
  };

  return (
    <Switch
      checked={isFeatured}
      onCheckedChange={handleToggle}
      disabled={isPending}
      aria-label={isFeatured ? 'Remove from featured' : 'Add to featured'}
    />
  );
}
