'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { deleteTool } from '@/actions/tools';

interface ToolActionsProps {
  toolId: string;
  toolName?: string;
}

export function ToolActions({ toolId, toolName }: ToolActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteTool(toolId);
      } catch (error) {
        console.error('Failed to delete tool:', error);
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/dashboard/tools/${toolId}`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <DeleteConfirmDialog
        title="Delete tool?"
        description={`Are you sure you want to delete${toolName ? ` "${toolName}"` : ' this tool'}? This action cannot be undone.`}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  );
}
