'use client';

import { useActionState, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { updateProvider } from '@/actions/providers';

interface Provider {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  type: string;
  apiKey: string | null;
  apiSecret: string | null;
  baseUrl: string | null;
  webhookSecret: string | null;
  config: unknown;
  isActive: boolean;
  isHealthy: boolean | null;
  healthCheckUrl: string | null;
  lastHealthCheckAt: Date | null;
}

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

interface ProviderEditFormProps {
  provider: Provider;
}

const providerTypes = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'replicate', label: 'Replicate' },
  { value: 'fal', label: 'Fal.ai' },
  { value: 'tripo', label: 'Tripo3D' },
  { value: 'stability', label: 'Stability AI' },
];

function parseConfig(config: unknown): ProviderConfig {
  if (typeof config === 'object' && config !== null) {
    return config as ProviderConfig;
  }
  return {};
}

export function ProviderEditForm({ provider }: ProviderEditFormProps) {
  const existingConfig = parseConfig(provider.config);

  // Limits state (for future rate limiting)
  const [limits, setLimits] = useState<ProviderLimits>(existingConfig.limits ?? {});
  // Extra config (anything besides limits)
  const { limits: _, ...extraConfig } = existingConfig;
  const [extraConfigJson, setExtraConfigJson] = useState(
    Object.keys(extraConfig).length > 0 ? JSON.stringify(extraConfig, null, 2) : ''
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  const [state, action, isPending] = useActionState(updateProvider, {
    success: false,
    message: '',
  });

  return (
    <form action={action}>
      <input type="hidden" name="id" value={provider.id} />
      <input type="hidden" name="config" value={buildConfigJson()} />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Provider Details</CardTitle>
                <CardDescription>Basic provider information</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant={provider.isActive ? 'default' : 'secondary'}>
                  {provider.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant={provider.isHealthy ? 'default' : 'destructive'}>
                  {provider.isHealthy ? 'Healthy' : 'Unhealthy'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Name (slug)</Label>
                <Input id="name" name="name" defaultValue={provider.name} required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  defaultValue={provider.displayName}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue={provider.type}>
                <SelectTrigger>
                  <SelectValue />
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
                defaultValue={provider.description ?? ''}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>API keys and secrets (masked for security)</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                placeholder="Leave empty to keep current key"
              />
              <p className="text-xs text-muted-foreground">
                {provider.apiKey ? 'Current key is set (hidden)' : 'No API key configured'}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="apiSecret">API Secret</Label>
              <Input
                id="apiSecret"
                name="apiSecret"
                type="password"
                placeholder="Leave empty to keep current secret"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="webhookSecret">Webhook Secret</Label>
              <Input
                id="webhookSecret"
                name="webhookSecret"
                type="password"
                placeholder="Leave empty to keep current secret"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Base URL and health check settings</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="baseUrl">Base URL (optional)</Label>
              <Input
                id="baseUrl"
                name="baseUrl"
                defaultValue={provider.baseUrl ?? ''}
                placeholder="Leave empty to use SDK defaults"
              />
              <p className="text-xs text-muted-foreground">
                Provider SDKs handle API endpoints automatically. Only set this for custom/self-hosted instances.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="healthCheckUrl">Health Check URL</Label>
              <Input
                id="healthCheckUrl"
                name="healthCheckUrl"
                defaultValue={provider.healthCheckUrl ?? ''}
                placeholder="https://api.provider.com/health"
              />
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
                <Label htmlFor="limits.rpm">Requests per Minute</Label>
                <Input
                  id="limits.rpm"
                  type="number"
                  value={limits.rpm ?? ''}
                  onChange={(e) => setLimits({ ...limits, rpm: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="60"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="limits.rpd">Requests per Day</Label>
                <Input
                  id="limits.rpd"
                  type="number"
                  value={limits.rpd ?? ''}
                  onChange={(e) => setLimits({ ...limits, rpd: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="1000"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="limits.concurrency">Max Concurrency</Label>
                <Input
                  id="limits.concurrency"
                  type="number"
                  value={limits.concurrency ?? ''}
                  onChange={(e) => setLimits({ ...limits, concurrency: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="10"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="limits.costPerRequest">Cost per Request ($)</Label>
                <Input
                  id="limits.costPerRequest"
                  type="number"
                  step="0.001"
                  value={limits.costPerRequest ?? ''}
                  onChange={(e) => setLimits({ ...limits, costPerRequest: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="0.01"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="limits.costPerToken">Cost per Token ($)</Label>
                <Input
                  id="limits.costPerToken"
                  type="number"
                  step="0.000001"
                  value={limits.costPerToken ?? ''}
                  onChange={(e) => setLimits({ ...limits, costPerToken: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="0.00001"
                />
                <p className="text-xs text-muted-foreground">For LLM providers</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="limits.costPerSecond">Cost per Second ($)</Label>
                <Input
                  id="limits.costPerSecond"
                  type="number"
                  step="0.001"
                  value={limits.costPerSecond ?? ''}
                  onChange={(e) => setLimits({ ...limits, costPerSecond: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="0.001"
                />
                <p className="text-xs text-muted-foreground">For video/audio providers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <Card>
            <CardHeader>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <div className="text-left">
                    <CardTitle>Advanced Configuration</CardTitle>
                    <CardDescription>Raw JSON for additional settings</CardDescription>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="grid gap-2">
                  <Label>Additional Configuration (JSON)</Label>
                  <Textarea
                    value={extraConfigJson}
                    onChange={(e) => setExtraConfigJson(e.target.value)}
                    className="font-mono text-sm"
                    rows={6}
                    placeholder='{"customKey": "value"}'
                  />
                  <p className="text-xs text-muted-foreground">
                    Extra configuration that will be merged with limits.
                    Do not include &quot;limits&quot; key here.
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Active</Label>
                <p className="text-sm text-muted-foreground">Enable this provider</p>
              </div>
              <Switch id="isActive" name="isActive" defaultChecked={provider.isActive} />
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
