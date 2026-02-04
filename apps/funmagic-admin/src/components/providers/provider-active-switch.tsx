'use client';

import { useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { toggleProviderActive } from '@/actions/providers';
import { toast } from 'sonner';

interface ProviderActiveSwitchProps {
  providerId: string;
  isActive: boolean;
}

export function ProviderActiveSwitch({ providerId, isActive }: ProviderActiveSwitchProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      try {
        await toggleProviderActive(providerId, checked);
        toast.success(checked ? 'Provider activated' : 'Provider deactivated');
      } catch {
        toast.error('Failed to update provider status');
      }
    });
  };

  return (
    <Switch
      checked={isActive}
      onCheckedChange={handleToggle}
      disabled={isPending}
    />
  );
}
