'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { deleteToolType } from '@/actions/tool-types';

interface ToolType {
  id: string;
  name: string;
}

interface ToolTypeActionsProps {
  toolType: ToolType;
}

export function ToolTypeActions({ toolType }: ToolTypeActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteToolType(toolType.id);
      } catch (error) {
        console.error('Failed to delete tool type:', error);
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
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
