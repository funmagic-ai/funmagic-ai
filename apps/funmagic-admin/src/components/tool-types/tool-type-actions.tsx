'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { DeactivateConfirmDialog } from '@/components/ui/deactivate-confirm-dialog';
import { deleteToolType, getActiveToolsCountForToolType, toggleToolTypeStatus } from '@/actions/tool-types';

interface ToolType {
  id: string;
  name: string;
  isActive: boolean;
}

interface ToolTypeActionsProps {
  toolType: ToolType;
}

export function ToolTypeActions({ toolType }: ToolTypeActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [isToggling, startToggleTransition] = useTransition();
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [activeToolsCount, setActiveToolsCount] = useState(0);
  const [isFetchingCount, setIsFetchingCount] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteToolType(toolType.id);
        toast.success('Tool type deleted successfully');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to delete tool type');
      }
    });
  };

  const performToggle = () => {
    startToggleTransition(async () => {
      try {
        await toggleToolTypeStatus(toolType.id);
        const message = toolType.isActive
          ? activeToolsCount > 0
            ? `Tool type and ${activeToolsCount} tool${activeToolsCount > 1 ? 's' : ''} deactivated`
            : 'Tool type deactivated'
          : 'Tool type activated';
        toast.success(message);
        setShowDeactivateDialog(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to toggle status');
      }
    });
  };

  const handleToggle = async () => {
    if (toolType.isActive) {
      setIsFetchingCount(true);
      try {
        const count = await getActiveToolsCountForToolType(toolType.id);
        setActiveToolsCount(count);
        setShowDeactivateDialog(true);
      } finally {
        setIsFetchingCount(false);
      }
    } else {
      performToggle();
    }
  };

  const getDeactivateDescription = () => {
    if (activeToolsCount > 0) {
      return `This will deactivate "${toolType.name}" and ${activeToolsCount} active tool${activeToolsCount > 1 ? 's' : ''} that use${activeToolsCount === 1 ? 's' : ''} this type. Tools will no longer be available to users.`;
    }
    return `Are you sure you want to deactivate "${toolType.name}"? This tool type will no longer be available.`;
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={toolType.isActive}
        onCheckedChange={handleToggle}
        disabled={isToggling || isFetchingCount}
        aria-label="Toggle active status"
      />
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/dashboard/tool-types/${toolType.id}/edit`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <DeleteConfirmDialog
        title="Delete tool type?"
        description={`Are you sure you want to delete "${toolType.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        isPending={isPending}
      />
      <DeactivateConfirmDialog
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
        onConfirm={performToggle}
        title={activeToolsCount > 0 ? 'Deactivate tool type and tools?' : 'Deactivate tool type?'}
        description={getDeactivateDescription()}
        isPending={isToggling}
      />
    </div>
  );
}
