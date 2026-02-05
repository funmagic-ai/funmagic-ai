'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { deleteToolType, toggleToolTypeStatus } from '@/actions/tool-types';

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

  const handleToggle = () => {
    startToggleTransition(async () => {
      try {
        await toggleToolTypeStatus(toolType.id);
        toast.success(toolType.isActive ? 'Tool type deactivated' : 'Tool type activated');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to toggle status');
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={toolType.isActive}
        onCheckedChange={handleToggle}
        disabled={isToggling}
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
    </div>
  );
}
