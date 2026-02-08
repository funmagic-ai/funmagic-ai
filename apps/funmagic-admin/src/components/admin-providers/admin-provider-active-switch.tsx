'use client';

import { useState, useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { DeactivateConfirmDialog } from '@/components/ui/deactivate-confirm-dialog';
import { toggleAdminProviderActive } from '@/actions/admin-providers';
import { toast } from 'sonner';

interface AdminProviderActiveSwitchProps {
  providerId: string;
  providerName: string;
  isActive: boolean;
}

export function AdminProviderActiveSwitch({ providerId, providerName, isActive }: AdminProviderActiveSwitchProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  const performToggle = (activate: boolean) => {
    startTransition(async () => {
      try {
        await toggleAdminProviderActive(providerId, activate);
        toast.success(activate ? 'Provider activated' : 'Provider deactivated');
        setShowDeactivateDialog(false);
      } catch {
        toast.error('Failed to update provider status');
      }
    });
  };

  const handleToggle = (checked: boolean) => {
    if (!checked) {
      setShowDeactivateDialog(true);
    } else {
      performToggle(true);
    }
  };

  return (
    <>
      <Switch
        checked={isActive}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
      <DeactivateConfirmDialog
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
        onConfirm={() => performToggle(false)}
        title="Deactivate provider?"
        description={`Are you sure you want to deactivate "${providerName}"? This provider will no longer be available in AI Studio.`}
        isPending={isPending}
      />
    </>
  );
}
