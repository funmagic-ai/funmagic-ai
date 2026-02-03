'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
import { createProvider } from '@/actions/providers';

const providerTypes = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'replicate', label: 'Replicate' },
  { value: 'fal', label: 'Fal.ai' },
  { value: 'tripo', label: 'Tripo3D' },
  { value: 'stability', label: 'Stability AI' },
];

export function ProviderGeneralForm() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (prevState: { success: boolean; message: string; providerId?: string }, formData: FormData) => {
      const result = await createProvider(prevState, formData);

      if (result.success && result.providerId) {
        toast.success(result.message || 'Provider created successfully');
        await new Promise(resolve => setTimeout(resolve, 1500));
        router.push(`/dashboard/providers/${result.providerId}`);
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
            <CardDescription>Core provider details and identification</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name (slug)</Label>
                <Input id="name" name="name" placeholder="openai-prod" required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" name="displayName" placeholder="OpenAI" required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider type" />
                </SelectTrigger>
                <SelectContent>
                  {providerTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Optional description"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credentials</CardTitle>
            <CardDescription>API keys and connection settings</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                placeholder="sk-..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="baseUrl">Base URL (optional)</Label>
              <Input id="baseUrl" name="baseUrl" placeholder="https://api.openai.com/v1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Control provider availability</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Active</Label>
                <p className="text-sm text-muted-foreground">Enable this provider</p>
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
            {isPending ? 'Creating...' : 'Create Provider'}
          </Button>
        </div>
      </div>
    </form>
  );
}
