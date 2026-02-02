'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { deleteToolType } from '@/actions/tool-types';
import { ToolTypeForm } from './tool-type-form';

interface ToolType {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface ToolTypeActionsProps {
  toolType: ToolType;
}

export function ToolTypeActions({ toolType }: ToolTypeActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this tool type?')) return;

    startTransition(async () => {
      await deleteToolType(toolType.id);
    });
  };

  return (
    <div className="flex items-center gap-1">
      <ToolTypeForm mode="edit" toolType={toolType} />
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isPending}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
