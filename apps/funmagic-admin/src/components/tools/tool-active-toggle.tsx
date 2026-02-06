'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { DeactivateConfirmDialog } from '@/components/ui/deactivate-confirm-dialog';
import { toggleToolStatus } from '@/actions/tools';

interface ToolActiveToggleProps {
  toolId: string;
  toolName: string;
  isActive: boolean;
}

export function ToolActiveToggle({ toolId, toolName, isActive }: ToolActiveToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  const performToggle = () => {
    startTransition(async () => {
      try {
        await toggleToolStatus(toolId, 'isActive');
        toast.success(isActive ? 'Tool deactivated' : 'Tool activated');
        setShowDeactivateDialog(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to toggle tool status');
      }
    });
  };

  const handleToggle = () => {
    if (isActive) {
      setShowDeactivateDialog(true);
    } else {
      performToggle();
    }
  };

  return (
    <>
      <Switch
        checked={isActive}
        onCheckedChange={handleToggle}
        disabled={isPending}
        aria-label={isActive ? 'Deactivate tool' : 'Activate tool'}
      />
      <DeactivateConfirmDialog
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
        onConfirm={performToggle}
        title="Deactivate tool?"
        description={`Are you sure you want to deactivate "${toolName}"? This tool will no longer be available to users.`}
        isPending={isPending}
      />
    </>
  );
}
