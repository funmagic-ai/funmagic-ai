'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createProvider } from '@/actions/providers';
import type { FormState } from '@/lib/form-types';

interface ProviderLimits {
  rpm?: number;
  rpd?: number;
  concurrency?: number;
  costPerRequest?: number;
  costPerToken?: number;
  costPerSecond?: number;
}

interface ProviderConfig {
  limits?: ProviderLimits;
  [key: string]: unknown;
}

export function ProviderGeneralForm() {
  const router = useRouter();

  // Limits state for rate limiting
  const [limits, setLimits] = useState<ProviderLimits>({});
  // Extra config (anything besides limits)
  const [extraConfigJson, setExtraConfigJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleJsonChange = (value: string) => {
    setExtraConfigJson(value);
    if (!value.trim()) {
      setJsonError(null);
      return;
    }
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch {
      setJsonError('Invalid JSON syntax');
    }
  };

  // Build final config JSON
  const buildConfigJson = () => {
    const config: ProviderConfig = {};

    // Only include limits if any are set
    const hasLimits = Object.values(limits).some(v => v !== undefined && v !== '');
    if (hasLimits) {
      config.limits = Object.fromEntries(
        Object.entries(limits).filter(([_, v]) => v !== undefined && v !== '')
      ) as ProviderLimits;
    }

    // Merge extra config
    if (extraConfigJson.trim()) {
      try {
        const extra = JSON.parse(extraConfigJson);
        Object.assign(config, extra);
      } catch {
        // Invalid JSON, ignore
      }
    }

    return JSON.stringify(config);
  };

  const [state, formAction, isPending] = useActionState(
    async (prevState: FormState & { providerId?: string }, formData: FormData) => {
      const result = await createProvider(prevState, formData);

      if (result.success && result.providerId) {
        toast.success(result.message || 'Provider created successfully');
        await new Promise(resolve => setTimeout(resolve, 1500));
        router.push('/dashboard/providers');
      } else if (!result.success) {
        toast.error(result.message || 'Failed to create provider');
      }

      return result;
    },
    { success: false, message: '', errors: {} as Record<string, string[]> }
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="config" value={buildConfigJson()} />
      <div className="mx-auto max-w-4xl grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core provider details and identification</CardDescription>
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
                  placeholder="e.g., openai-prod"
                  aria-invalid={!!state.errors?.name}
                />
                {state.errors?.name && (
                  <p className="text-destructive text-xs">{state.errors.name[0]}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Unique slug identifier for the provider
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="displayName">
                  Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="displayName"
                  name="displayName"
                  placeholder="e.g., OpenAI"
                  aria-invalid={!!state.errors?.displayName}
                />
                {state.errors?.displayName && (
                  <p className="text-destructive text-xs">{state.errors.displayName[0]}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Human-readable name shown in admin
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
                placeholder="e.g., Production OpenAI instance"
                rows={2}
              />
              <p className="text-muted-foreground text-xs">
                Internal notes about this provider
              </p>
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
              <Label htmlFor="appId">
                APPID <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="appId"
                name="appId"
                placeholder="e.g., 1234567890"
              />
              <p className="text-muted-foreground text-xs">
                Application ID if required by provider (e.g., Tencent Cloud)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="apiKey">
                API Key <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                autoComplete="off"
                placeholder="e.g., sk-..."
              />
              <p className="text-muted-foreground text-xs">
                Primary authentication key or SecretId
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
                autoComplete="off"
                placeholder="Leave empty if not required"
              />
              <p className="text-muted-foreground text-xs">
                Secondary key or SecretKey if required
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="baseUrl">
                Base URL <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="baseUrl"
                name="baseUrl"
                placeholder="e.g., https://api.openai.com/v1"
                aria-invalid={!!state.errors?.baseUrl}
              />
              {state.errors?.baseUrl && (
                <p className="text-destructive text-xs">{state.errors.baseUrl[0]}</p>
              )}
              <p className="text-muted-foreground text-xs">
                Custom endpoint for self-hosted or proxy instances
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rate Limits & Costs</CardTitle>
            <CardDescription>
              Configure rate limiting and cost tracking for this provider
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="limits.rpm">
                  Requests per Minute <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="limits.rpm"
                  type="number"
                  value={limits.rpm ?? ''}
                  onChange={(e) => setLimits({ ...limits, rpm: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="e.g., 60"
                />
                <p className="text-xs text-muted-foreground">RPM limit for rate limiting</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="limits.rpd">
                  Requests per Day <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="limits.rpd"
                  type="number"
                  value={limits.rpd ?? ''}
                  onChange={(e) => setLimits({ ...limits, rpd: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="e.g., 1000"
                />
                <p className="text-xs text-muted-foreground">Daily request limit</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="limits.concurrency">
                  Max Concurrency <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="limits.concurrency"
                  type="number"
                  value={limits.concurrency ?? ''}
                  onChange={(e) => setLimits({ ...limits, concurrency: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="e.g., 10"
                />
                <p className="text-xs text-muted-foreground">Max parallel requests</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="limits.costPerRequest">
                  Cost per Request ($) <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="limits.costPerRequest"
                  type="number"
                  step="0.001"
                  value={limits.costPerRequest ?? ''}
                  onChange={(e) => setLimits({ ...limits, costPerRequest: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="e.g., 0.01"
                />
                <p className="text-xs text-muted-foreground">Fixed cost per API call</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="limits.costPerToken">
                  Cost per Token ($) <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="limits.costPerToken"
                  type="number"
                  step="0.000001"
                  value={limits.costPerToken ?? ''}
                  onChange={(e) => setLimits({ ...limits, costPerToken: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="e.g., 0.00001"
                />
                <p className="text-xs text-muted-foreground">For LLM providers</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="limits.costPerSecond">
                  Cost per Second ($) <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="limits.costPerSecond"
                  type="number"
                  step="0.001"
                  value={limits.costPerSecond ?? ''}
                  onChange={(e) => setLimits({ ...limits, costPerSecond: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="e.g., 0.001"
                />
                <p className="text-xs text-muted-foreground">For video/audio providers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Configuration</CardTitle>
            <CardDescription>Raw JSON for additional settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label>Additional Configuration (JSON)</Label>
              <Textarea
                value={extraConfigJson}
                onChange={(e) => handleJsonChange(e.target.value)}
                className={`font-mono text-sm ${jsonError ? 'border-destructive' : ''}`}
                rows={6}
                placeholder='{"customKey": "value"}'
              />
              {jsonError && (
                <p className="text-destructive text-xs">{jsonError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Extra configuration that will be merged with limits.
                Do not include &quot;limits&quot; key here.
              </p>
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
            onClick={() => router.push('/dashboard/providers')}
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
