'use client';

import { useActionState, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getToolDefinition, type StepConfig, type SavedToolConfig } from '@funmagic/shared';
import { updateToolConfig } from '@/actions/tools';
import type { Provider } from './field-renderers';
import { ConfigFieldsSection } from './config-fields-section';

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

interface DynamicConfigFormProps {
  tool: Tool;
  providers: Provider[];
}

/**
 * Dynamic configuration form that auto-generates from tool definition
 * Uses the tool's slug (or toolType.name) to look up the definition
 */
export function DynamicConfigForm({ tool, providers }: DynamicConfigFormProps) {
  // Look up definition by tool slug (which is selected from the definition dropdown)
  const definition = getToolDefinition(tool.slug);

  // If no definition found, fall back to generic JSON editor
  if (!definition) {
    return <GenericConfigForm tool={tool} />;
  }

  return (
    <DefinitionBasedForm
      tool={tool}
      providers={providers}
      definition={definition}
    />
  );
}

interface DefinitionBasedFormProps {
  tool: Tool;
  providers: Provider[];
  definition: NonNullable<ReturnType<typeof getToolDefinition>>;
}

function DefinitionBasedForm({ tool, providers, definition }: DefinitionBasedFormProps) {
  // Initialize config from existing tool config or create empty structure
  const existingConfig = (tool.config as SavedToolConfig) || { steps: [] };

  // Build initial state from definition merged with existing config
  const buildInitialSteps = (): StepConfig[] => {
    return definition.steps.map((stepDef) => {
      // Find existing step config
      const existingStep = existingConfig.steps?.find((s) => s.id === stepDef.id);

      // Start with step ID
      const stepConfig: StepConfig = { id: stepDef.id };

      // Populate fields from definition with existing values or defaults
      for (const [fieldName, fieldDef] of Object.entries(stepDef.fields)) {
        if (existingStep && fieldName in existingStep) {
          stepConfig[fieldName] = existingStep[fieldName];
        } else if ('default' in fieldDef) {
          stepConfig[fieldName] = fieldDef.default;
        }
      }

      // Preserve providerOptions if it exists in the existing config
      if (existingStep?.providerOptions) {
        stepConfig.providerOptions = existingStep.providerOptions;
      }

      return stepConfig;
    });
  };

  const [config, setConfig] = useState<SavedToolConfig>({
    ...existingConfig,
    steps: buildInitialSteps(),
  });

  const [state, action, isPending] = useActionState(updateToolConfig, {
    success: false,
    message: '',
  });

  return (
    <form action={action}>
      <input type="hidden" name="id" value={tool.id} />
      <input type="hidden" name="config" value={JSON.stringify(config)} />

      <div className="grid gap-6">
        <ConfigFieldsSection
          definition={definition}
          config={config}
          setConfig={setConfig}
          providers={providers}
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
          <CardDescription>
            No definition found for tool &quot;{tool.slug}&quot;.
            Edit the raw configuration JSON.
          </CardDescription>
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
