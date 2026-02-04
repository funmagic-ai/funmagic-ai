'use client';

import { useActionState, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Upload } from 'lucide-react';
import { updateToolConfig } from '@/actions/tools';
import { FigmeStyleEditor } from './figme-style-editor';

interface Tool {
  id: string;
  slug: string;
  title: string;
  toolTypeId: string;
  config?: unknown;
  toolType?: {
    id: string;
    name: string;
    displayName: string;
  };
}

interface Provider {
  id: string;
  name: string;
  displayName: string;
}

interface ToolConfigFormProps {
  tool: Tool;
  providers: Provider[];
}

interface FigmeStep {
  id: string;
  name: string;
  type: 'image-gen' | '3d-gen';
  providerId: string;
  providerModel: string;
  cost: number;
}

interface StyleReference {
  id: string;
  name: string;
  imageUrl: string;
  prompt: string;
}

interface FigmeConfig {
  steps: FigmeStep[];
  styleReferences: StyleReference[];
  maxStyleReferences: number;
  defaultPrompt?: string;
}

interface BgRemoveStep {
  id: string;
  name: string;
  type: 'background-remove';
  providerId: string;
  providerModel: string;
  cost: number;
}

interface BgRemoveConfig {
  steps: BgRemoveStep[];
}

export function ToolConfigForm({ tool, providers }: ToolConfigFormProps) {
  const toolTypeName = tool.toolType?.name;

  if (toolTypeName === 'figme') {
    return <FigmeConfigForm tool={tool} providers={providers} />;
  }

  if (toolTypeName === 'background-remove') {
    return <BgRemoveConfigForm tool={tool} providers={providers} />;
  }

  return <GenericConfigForm tool={tool} />;
}

function FigmeConfigForm({ tool, providers }: { tool: Tool; providers: Provider[] }) {
  const existingConfig = (tool.config as FigmeConfig) || {
    steps: [
      { id: 'image-gen', name: 'Image Generation', type: 'image-gen', providerId: '', providerModel: '', cost: 20 },
      { id: '3d-gen', name: '3D Generation', type: '3d-gen', providerId: '', providerModel: '', cost: 30 },
    ],
    styleReferences: [],
    maxStyleReferences: 8,
    defaultPrompt: '',
  };

  const [config, setConfig] = useState<FigmeConfig>(existingConfig);
  const [state, action, isPending] = useActionState(updateToolConfig, {
    success: false,
    message: '',
  });

  const imageGenProviders = providers.filter((p) => p.name.includes('openai') || p.name.includes('replicate'));
  const threeDProviders = providers.filter((p) => p.name.includes('tripo') || p.name.includes('replicate'));

  const updateStep = (index: number, field: keyof FigmeStep, value: string | number) => {
    const newSteps = [...config.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setConfig({ ...config, steps: newSteps });
  };

  return (
    <form action={action}>
      <input type="hidden" name="id" value={tool.id} />
      <input type="hidden" name="config" value={JSON.stringify(config)} />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Steps Configuration</CardTitle>
            <CardDescription>Configure provider and model for each step</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {config.steps.map((step, index) => (
              <div key={step.id} className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{step.name}</h4>
                  <span className="text-sm text-muted-foreground">Step {index + 1}</span>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label>Provider</Label>
                    <Select
                      value={step.providerId}
                      onValueChange={(value) => updateStep(index, 'providerId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {(step.type === 'image-gen' ? imageGenProviders : threeDProviders).map(
                          (provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              {provider.displayName}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Model</Label>
                    <Input
                      value={step.providerModel}
                      onChange={(e) => updateStep(index, 'providerModel', e.target.value)}
                      placeholder="e.g., gpt-image-1.5"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Cost (credits)</Label>
                    <Input
                      type="number"
                      value={step.cost}
                      onChange={(e) => updateStep(index, 'cost', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Style References</CardTitle>
            <CardDescription>
              Configure up to {config.maxStyleReferences} style options for users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FigmeStyleEditor
              styles={config.styleReferences}
              maxStyles={config.maxStyleReferences}
              onChange={(styles) => setConfig({ ...config, styleReferences: styles })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default Prompt</CardTitle>
            <CardDescription>Optional default prompt template</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={config.defaultPrompt || ''}
              onChange={(e) => setConfig({ ...config, defaultPrompt: e.target.value })}
              placeholder="Enter default prompt template..."
              rows={3}
            />
          </CardContent>
        </Card>

        {state.message && (
          <p className={state.success ? 'text-green-600' : 'text-destructive'}>
            {state.message}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </form>
  );
}

function BgRemoveConfigForm({ tool, providers }: { tool: Tool; providers: Provider[] }) {
  const existingConfig = (tool.config as BgRemoveConfig) || {
    steps: [
      {
        id: 'remove-bg',
        name: 'Remove Background',
        type: 'background-remove',
        providerId: '',
        providerModel: 'fal-ai/bria-rmbg',
        cost: 5,
      },
    ],
  };

  const [config, setConfig] = useState<BgRemoveConfig>(existingConfig);
  const [state, action, isPending] = useActionState(updateToolConfig, {
    success: false,
    message: '',
  });

  const bgRemoveProviders = providers.filter((p) => p.name.includes('fal') || p.name.includes('replicate'));

  const updateStep = (field: keyof BgRemoveStep, value: string | number) => {
    const newSteps = [...config.steps];
    newSteps[0] = { ...newSteps[0], [field]: value };
    setConfig({ ...config, steps: newSteps });
  };

  const step = config.steps[0];

  return (
    <form action={action}>
      <input type="hidden" name="id" value={tool.id} />
      <input type="hidden" name="config" value={JSON.stringify(config)} />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Background Remove Configuration</CardTitle>
            <CardDescription>Configure the background removal provider</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label>Provider</Label>
                <Select
                  value={step.providerId}
                  onValueChange={(value) => updateStep('providerId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {bgRemoveProviders.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Model</Label>
                <Input
                  value={step.providerModel}
                  onChange={(e) => updateStep('providerModel', e.target.value)}
                  placeholder="e.g., fal-ai/bria-rmbg"
                />
              </div>

              <div className="grid gap-2">
                <Label>Cost (credits)</Label>
                <Input
                  type="number"
                  value={step.cost}
                  onChange={(e) => updateStep('cost', parseInt(e.target.value) || 0)}
                />
              </div>
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
            {isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </form>
  );
}

function GenericConfigForm({ tool }: { tool: Tool }) {
  const [configJson, setConfigJson] = useState(
    JSON.stringify(tool.config || {}, null, 2)
  );
  const [state, action, isPending] = useActionState(updateToolConfig, {
    success: false,
    message: '',
  });

  return (
    <form action={action}>
      <input type="hidden" name="id" value={tool.id} />
      <input type="hidden" name="config" value={configJson} />

      <Card>
        <CardHeader>
          <CardTitle>Configuration JSON</CardTitle>
          <CardDescription>Edit the raw configuration JSON for this tool</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={configJson}
            onChange={(e) => setConfigJson(e.target.value)}
            className="font-mono text-sm"
            rows={15}
          />

          {state.message && (
            <p className={state.success ? 'text-green-600' : 'text-destructive'}>
              {state.message}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
