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
import { Badge } from '@/components/ui/badge';
import { updateAdminProvider } from '@/actions/admin-providers';
import { CheckCircle2, XCircle } from 'lucide-react';

interface AdminProvider {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  baseUrl: string | null;
  config?: unknown;
  isActive: boolean;
  hasApiKey: boolean;
  hasApiSecret: boolean;
}

interface AdminProviderEditFormProps {
  provider: AdminProvider;
}

export function AdminProviderEditForm({ provider }: AdminProviderEditFormProps) {
  const router = useRouter();

  const [state, action, isPending] = useActionState(
    async (prevState: FormState, formData: FormData) => {
      const result = await updateAdminProvider(prevState, formData);

      if (result.success) {
        toast.success(result.message || 'Provider updated successfully');
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push('/dashboard/admin-providers');
      } else if (!result.success) {
        toast.error(result.message || 'Failed to update provider');
      }

      return result;
    },
    { success: false, message: '', errors: {} as Record<string, string[]> }
  );

  return (
    <form action={action}>
      <input type="hidden" name="id" value={provider.id} />

      <div className="mx-auto max-w-4xl grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Provider Details</CardTitle>
                <CardDescription>Basic provider information</CardDescription>
              </div>
              {provider.hasApiKey ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  API Key Configured
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  API Key Not Set
                </Badge>
              )}
            </div>
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
                  defaultValue={provider.name}
                  placeholder="e.g., openai"
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
                  defaultValue={provider.displayName}
                  placeholder="e.g., OpenAI"
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
                defaultValue={provider.description ?? ''}
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
            <CardDescription>API credentials (encrypted before storage)</CardDescription>
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
                placeholder="Leave empty to keep current key"
              />
              <p className="text-xs text-muted-foreground">
                {provider.hasApiKey
                  ? 'Current key is set (hidden for security). Enter a new key to replace it.'
                  : 'Primary API key for this provider.'}
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
                placeholder="Leave empty to keep current secret"
              />
              <p className="text-xs text-muted-foreground">
                {provider.hasApiSecret
                  ? 'Current secret is set (hidden). Enter a new secret to replace it.'
                  : 'Secondary key/secret if required by the provider.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Endpoint and status settings</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="baseUrl">
                Base URL <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="baseUrl"
                name="baseUrl"
                defaultValue={provider.baseUrl ?? ''}
                placeholder="e.g., https://api.openai.com/v1"
              />
              <p className="text-xs text-muted-foreground">
                Custom endpoint for self-hosted or proxy instances. Leave empty to use SDK defaults.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  {provider.isActive
                    ? 'This provider is currently active in AI Studio'
                    : 'This provider is currently inactive'}
                </p>
              </div>
              <Badge variant={provider.isActive ? 'default' : 'secondary'}>
                {provider.isActive ? 'Active' : 'Inactive'}
              </Badge>
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
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}
