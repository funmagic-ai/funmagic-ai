'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil } from 'lucide-react';
import { updateToolType } from '@/actions/tool-types';
import { cn } from '@/lib/utils';

interface ToolTypeFormProps {
  mode: 'create' | 'edit';
  className?: string;
  toolType?: {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    sortOrder: number;
    isActive: boolean;
  };
}

export function ToolTypeForm({ mode, className, toolType }: ToolTypeFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // For create mode, render a link button to the new page
  if (mode === 'create') {
    return (
      <Button size="sm" className={cn(className)} asChild>
        <Link href="/dashboard/tool-types/new">
          <Plus className="mr-2 h-4 w-4" />
          Add Tool Type
        </Link>
      </Button>
    );
  }

  // Edit mode uses dialog
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      if (toolType) {
        await updateToolType(toolType.id, formData);
      }
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Tool Type</DialogTitle>
            <DialogDescription>Update tool type details</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name (slug)</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={toolType?.name}
                  placeholder="figme"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  defaultValue={toolType?.displayName}
                  placeholder="FigMe"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                defaultValue={toolType?.description ?? ''}
                placeholder="Generate 3D figurines from photos"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  name="icon"
                  defaultValue={toolType?.icon ?? ''}
                  placeholder="wand"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  name="color"
                  type="color"
                  defaultValue={toolType?.color ?? '#3b82f6'}
                  className="h-10 w-full"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  min="0"
                  defaultValue={toolType?.sortOrder ?? 0}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Active</Label>
                <p className="text-sm text-muted-foreground">Show in tool creation</p>
              </div>
              <Switch
                id="isActive"
                name="isActive"
                defaultChecked={toolType?.isActive ?? true}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
