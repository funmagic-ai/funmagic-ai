'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { FormState } from '@/lib/form-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { createAdminProvider } from '@/actions/admin-providers';
import { Shield } from 'lucide-react';

export function AdminProviderCreateForm() {
  const router = useRouter();

  const [state, action, isPending] = useActionState(
    async (prevState: FormState, formData: FormData) => {
      const result = await createAdminProvider(prevState, formData);

      if (result.success) {
        toast.success(result.message || 'Provider created successfully');
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push('/dashboard/admin-providers');
      } else if (!result.success) {
        toast.error(result.message || 'Failed to create provider');
      }

      return result;
    },
    { success: false, message: '', errors: {} as Record<string, string[]> }
  );

  return (
    <form action={action}>
      <div className="mx-auto max-w-2xl grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Provider Details
            </CardTitle>
            <CardDescription>Basic information about the AI provider</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Name (slug) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., openai, anthropic"
                  aria-invalid={!!state.errors?.name}
                />
                {state.errors?.name && (
                  <p className="text-destructive text-xs">{state.errors.name[0]}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Unique identifier (lowercase, no spaces)
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="displayName">
                  Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="displayName"
                  name="displayName"
                  placeholder="e.g., OpenAI, Anthropic"
                  aria-invalid={!!state.errors?.displayName}
                />
                {state.errors?.displayName && (
                  <p className="text-destructive text-xs">{state.errors.displayName[0]}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Human-readable name shown in UI
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">
                Description <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="e.g., OpenAI GPT models for image generation"
                rows={2}
              />
              <p className="text-muted-foreground text-xs">
                Brief description of this provider's capabilities
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>API credentials for this provider</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="apiKey">
                API Key <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                placeholder="Enter API key"
              />
              <p className="text-xs text-muted-foreground">
                Primary API key. Will be encrypted before storage.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="apiSecret">
                API Secret <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="apiSecret"
                name="apiSecret"
                type="password"
                placeholder="Enter API secret (if required)"
              />
              <p className="text-xs text-muted-foreground">
                Secondary key/secret if required by the provider
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Optional endpoint settings</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="baseUrl">
                Base URL <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="baseUrl"
                name="baseUrl"
                placeholder="e.g., https://api.openai.com/v1"
              />
              <p className="text-xs text-muted-foreground">
                Custom endpoint for self-hosted or proxy instances. Leave empty to use SDK defaults.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-base">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Enable this provider in AI Studio immediately
                </p>
              </div>
              <input type="hidden" name="isActive" value="true" />
              <Switch
                id="isActive"
                defaultChecked={true}
                onCheckedChange={(checked) => {
                  const input = document.querySelector('input[name="isActive"]') as HTMLInputElement;
                  if (input) input.value = checked.toString();
                }}
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
            onClick={() => router.push('/dashboard/admin-providers')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating...' : 'Create Provider'}
          </Button>
        </div>
      </div>
    </form>
  );
}
