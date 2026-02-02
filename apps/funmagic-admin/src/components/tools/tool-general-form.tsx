'use client';

import { useActionState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateToolGeneral } from '@/actions/tools';

interface Tool {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  thumbnail: string | null;
  toolTypeId: string;
  isActive: boolean;
  isFeatured: boolean;
}

interface ToolType {
  id: string;
  name: string;
  displayName: string;
}

interface ToolGeneralFormProps {
  tool: Tool;
  toolTypes: ToolType[];
}

export function ToolGeneralForm({ tool, toolTypes }: ToolGeneralFormProps) {
  const [state, action, isPending] = useActionState(updateToolGeneral, {
    success: false,
    message: '',
  });

  return (
    <form action={action}>
      <input type="hidden" name="id" value={tool.id} />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core tool details and identification</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={tool.slug}
                placeholder="my-tool"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={tool.title}
                placeholder="My Tool"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input
                id="shortDescription"
                name="shortDescription"
                defaultValue={tool.shortDescription ?? ''}
                placeholder="A brief description..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Full Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={tool.description ?? ''}
                placeholder="Detailed description..."
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="toolTypeId">Tool Type</Label>
              <Select name="toolTypeId" defaultValue={tool.toolTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tool type" />
                </SelectTrigger>
                <SelectContent>
                  {toolTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                name="thumbnail"
                defaultValue={tool.thumbnail ?? ''}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Control tool visibility and promotion</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Active</Label>
                <p className="text-sm text-muted-foreground">Tool is visible to users</p>
              </div>
              <Switch
                id="isActive"
                name="isActive"
                defaultChecked={tool.isActive}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isFeatured">Featured</Label>
                <p className="text-sm text-muted-foreground">Highlight on homepage</p>
              </div>
              <Switch
                id="isFeatured"
                name="isFeatured"
                defaultChecked={tool.isFeatured}
              />
            </div>
          </CardContent>
        </Card>

        {state.message && (
          <p className={state.success ? 'text-green-600' : 'text-destructive'}>
            {state.message}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}
