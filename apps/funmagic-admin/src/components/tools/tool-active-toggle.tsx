'use client';

import { useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { toggleToolStatus } from '@/actions/tools';

interface ToolActiveToggleProps {
  toolId: string;
  isActive: boolean;
}

export function ToolActiveToggle({ toolId, isActive }: ToolActiveToggleProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await toggleToolStatus(toolId, 'isActive');
      } catch (error) {
        console.error('Failed to toggle tool status:', error);
      }
    });
  };

  return (
    <Switch
      checked={isActive}
      onCheckedChange={handleToggle}
      disabled={isPending}
      aria-label={isActive ? 'Deactivate tool' : 'Activate tool'}
    />
  );
}
