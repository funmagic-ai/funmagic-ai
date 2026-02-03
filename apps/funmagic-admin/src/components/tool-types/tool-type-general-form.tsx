'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { createToolType } from '@/actions/tool-types';

export function ToolTypeGeneralForm() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (prevState: { success: boolean; message: string }, formData: FormData) => {
      const result = await createToolType(prevState, formData);

      if (result.success) {
        toast.success(result.message || 'Tool type created successfully');
        await new Promise(resolve => setTimeout(resolve, 1500));
        router.push('/dashboard/tool-types');
      }

      return result;
    },
    { success: false, message: '' }
  );

  return (
    <form action={formAction}>
      <div className="mx-auto max-w-4xl grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core tool type details and identification</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name (slug)</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="figme"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
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
                placeholder="Generate 3D figurines from photos"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Visual styling for this tool type</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  name="icon"
                  placeholder="wand"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  name="color"
                  type="color"
                  defaultValue="#3b82f6"
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
                  defaultValue={0}
                />
                <p className="text-muted-foreground text-xs">Lower numbers appear first</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Control tool type availability</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Active</Label>
                <p className="text-sm text-muted-foreground">Show in tool creation</p>
              </div>
              <Switch id="isActive" name="isActive" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {state.message && !state.success && (
          <p className="text-destructive">{state.message}</p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating...' : 'Create Tool Type'}
          </Button>
        </div>
      </div>
    </form>
  );
}
