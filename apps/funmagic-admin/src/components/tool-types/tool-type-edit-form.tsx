'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { updateToolType } from '@/actions/tool-types';
import type { FormState } from '@/lib/form-types';

interface ToolType {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isActive: boolean;
}

interface ToolTypeEditFormProps {
  toolType: ToolType;
}

export function ToolTypeEditForm({ toolType }: ToolTypeEditFormProps) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (prevState: FormState, formData: FormData) => {
      const result = await updateToolType(prevState, formData);

      if (result.success) {
        toast.success(result.message || 'Tool type updated successfully');
        await new Promise(resolve => setTimeout(resolve, 1500));
        router.push('/dashboard/tool-types');
      }

      return result;
    },
    { success: false, message: '', errors: {} as Record<string, string[]> }
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={toolType.id} />
      <div className="mx-auto max-w-4xl grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Tool type name and display settings</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Name (slug) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={toolType.name}
                  placeholder="e.g., style-transform"
                  aria-invalid={!!state.errors?.name}
                />
                {state.errors?.name && (
                  <p className="text-destructive text-xs">{state.errors.name[0]}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Unique identifier. Only lowercase letters, numbers, and hyphens.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="displayName">
                  Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="displayName"
                  name="displayName"
                  defaultValue={toolType.displayName}
                  placeholder="e.g., Style Transform"
                  aria-invalid={!!state.errors?.displayName}
                />
                {state.errors?.displayName && (
                  <p className="text-destructive text-xs">{state.errors.displayName[0]}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Human-readable name shown to users
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">
                Description <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="description"
                name="description"
                defaultValue={toolType.description ?? ''}
                placeholder="e.g., Transform images with AI styles"
              />
              <p className="text-muted-foreground text-xs">
                Brief description of this tool type
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Control visibility</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">
                  Active <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <p className="text-sm text-muted-foreground">Show in tool creation</p>
              </div>
              <Switch
                id="isActive"
                name="isActive"
                defaultChecked={toolType.isActive}
              />
            </div>
          </CardContent>
        </Card>

        {state.message && !state.success && !state.errors && (
          <p className="text-destructive">{state.message}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/tool-types')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Update Tool Type'}
          </Button>
        </div>
      </div>
    </form>
  );
}
