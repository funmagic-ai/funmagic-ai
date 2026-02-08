'use client';

import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { ToolDefinition, StepConfig, SavedToolConfig, Field, StepProvider, NumberField } from '@funmagic/shared';
import { FieldRenderer, KeyValueFieldRenderer, type Provider } from './field-renderers';

interface ConfigFieldsSectionProps {
  definition: ToolDefinition;
  config: SavedToolConfig;
  setConfig: React.Dispatch<React.SetStateAction<SavedToolConfig>>;
  providers: Provider[];
}

/**
 * Reusable component that renders config fields for a tool definition.
 * Shows provider info (read-only), admin fields, overridable options, and custom options.
 */
export function ConfigFieldsSection({
  definition,
  config,
  setConfig,
  providers,
}: ConfigFieldsSectionProps) {
  const updateStepField = (stepId: string, fieldName: string, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      steps: prev.steps.map((step) =>
        step.id === stepId ? { ...step, [fieldName]: value } : step
      ),
    }));
  };

  const updateProviderOption = (stepId: string, optionName: string, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => {
        if (step.id !== stepId) return step;
        const existingProvider = step.provider ?? { name: '', model: '' };
        return {
          ...step,
          provider: {
            ...existingProvider,
            providerOptions: {
              ...(existingProvider.providerOptions ?? {}),
              [optionName]: value,
            },
          },
        };
      }),
    }));
  };

  const updateProviderOptions = (stepId: string, providerOptions: Record<string, unknown>) => {
    setConfig((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => {
        if (step.id !== stepId) return step;
        const existingProvider = step.provider ?? { name: '', model: '' };
        return {
          ...step,
          provider: {
            ...existingProvider,
            providerOptions,
          },
        };
      }),
    }));
  };

  const updateCustomProviderOptions = (stepId: string, customProviderOptions: Record<string, unknown>) => {
    setConfig((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => {
        if (step.id !== stepId) return step;
        const existingProvider = step.provider ?? { name: '', model: '' };
        return {
          ...step,
          provider: {
            ...existingProvider,
            customProviderOptions,
          },
        };
      }),
    }));
  };

  const updateProviderModel = (stepId: string, model: string) => {
    setConfig((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => {
        if (step.id !== stepId) return step;
        const existingProvider = step.provider ?? { name: '', model: '' };
        return {
          ...step,
          provider: {
            ...existingProvider,
            model,
          },
        };
      }),
    }));
  };

  const getStepConfig = (stepId: string): StepConfig => {
    return config.steps.find((s) => s.id === stepId) || { id: stepId };
  };

  // Case-insensitive provider lookup by name column (slug)
  const findProvider = (providerName: string): Provider | undefined => {
    const lowerName = providerName.toLowerCase();
    return providers.find((p) => p.name.toLowerCase() === lowerName);
  };

  return (
    <div className="space-y-6">
      {definition.steps.map((stepDef, index) => {
        const stepConfig = getStepConfig(stepDef.id);
        const matchedProvider = findProvider(stepDef.provider.name);
        const hasOverridableOptions = stepDef.overridableOptions && Object.keys(stepDef.overridableOptions).length > 0;

        // Provider status
        const providerStatus: 'active' | 'inactive' | 'not_found' = matchedProvider
          ? matchedProvider.isActive
            ? 'active'
            : 'inactive'
          : 'not_found';

        return (
          <div key={stepDef.id} className="space-y-4 rounded-lg border bg-muted/30 p-4">
            {/* Step Header - Highlighted */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold">
                  Step {index + 1}: {stepDef.name}
                </h3>
                {stepDef.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{stepDef.description}</p>
                )}
              </div>
            </div>

            {/* Provider Info + Model + Cost - on same row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Provider:</span>
                <Badge
                  variant={providerStatus === 'active' ? 'default' : 'outline'}
                  className={`font-normal ${
                    providerStatus === 'active'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : providerStatus === 'inactive'
                        ? 'text-amber-600 border-amber-600'
                        : 'text-destructive border-destructive'
                  }`}
                >
                  {matchedProvider?.displayName || stepDef.provider.name}
                  {providerStatus === 'active' && ' ✓'}
                </Badge>
                {providerStatus === 'inactive' && (
                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                    Inactive
                  </Badge>
                )}
                {providerStatus === 'not_found' && (
                  <Badge variant="outline" className="text-destructive border-destructive">
                    Not Configured
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Model:</span>
                <Input
                  value={(stepConfig.provider as StepProvider)?.model ?? stepDef.provider.model}
                  onChange={(e) => updateProviderModel(stepDef.id, e.target.value)}
                  className="h-7 w-64 text-xs"
                  placeholder={stepDef.provider.model}
                />
              </div>
              {stepDef.fields.cost && (
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Cost:</span>
                  <Input
                    type="number"
                    value={stepConfig.cost ?? (stepDef.fields.cost as NumberField).default ?? ''}
                    onChange={(e) => updateStepField(stepDef.id, 'cost', e.target.value ? Number(e.target.value) : undefined)}
                    className="h-7 w-20 text-xs"
                    min={(stepDef.fields.cost as NumberField).min}
                  />
                </div>
              )}
            </div>

            {/* Admin-Editable Fields (excluding cost - rendered above) */}
            <div className="space-y-4">
              {Object.entries(stepDef.fields)
                .filter(([fieldName]) => fieldName !== 'cost')
                .map(([fieldName, fieldDef]) => (
                  <FieldRenderer
                    key={fieldName}
                    name={fieldName}
                    field={fieldDef}
                    value={stepConfig[fieldName]}
                    onChange={(value) => updateStepField(stepDef.id, fieldName, value)}
                    providers={providers}
                  />
                ))}
            </div>

            {/* Overridable Options - compact grid layout */}
            {hasOverridableOptions && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Provider Options</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(stepDef.overridableOptions!).map(([optionName, optionDef]) => {
                    // Read from providerOptions instead of optionOverrides
                    const currentValue = (stepConfig.provider as StepProvider)?.providerOptions?.[optionName]
                      ?? getDefaultValue(optionDef);
                    return (
                      <CompactFieldRenderer
                        key={optionName}
                        name={optionName}
                        field={optionDef}
                        value={currentValue}
                        onChange={(value) => updateProviderOption(stepDef.id, optionName, value)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Options - for adding extra provider options beyond the definition */}
            <KeyValueFieldRenderer
              name="customOptions"
              description="Add custom key-value options to pass to the provider API"
              value={(stepConfig.provider as StepProvider)?.customProviderOptions ?? {}}
              onChange={(value) => updateCustomProviderOptions(stepDef.id, value)}
              lockedKeys={[]}
            />
          </div>
        );
      })}
    </div>
  );
}

function getDefaultValue(field: Field): unknown {
  if ('default' in field) {
    return field.default;
  }
  return undefined;
}

/**
 * Compact field renderer for provider options - no description, smaller layout
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface CompactFieldRendererProps {
  name: string;
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
}

function CompactFieldRenderer({ name, field, value, onChange }: CompactFieldRendererProps) {
  const fieldLabel = name
    .split(/(?=[A-Z])/)
    .join(' ')
    .replace(/^\w/, (c) => c.toUpperCase());

  // String field with options - compact select
  if (field.type === 'string' && 'options' in field && field.options && field.options.length > 0) {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{fieldLabel}</Label>
        <Select value={String(value ?? field.default ?? '')} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Number field - compact input
  if (field.type === 'number') {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{fieldLabel}</Label>
        <Input
          type="number"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          className="h-8 text-sm"
          min={'min' in field ? field.min : undefined}
          max={'max' in field ? field.max : undefined}
        />
      </div>
    );
  }

  // Boolean field - compact checkbox-like
  if (field.type === 'boolean') {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{fieldLabel}</Label>
        <Select value={String(value ?? field.default ?? false)} onValueChange={(v) => onChange(v === 'true')}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Default string field - compact input
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{fieldLabel}</Label>
      <Input
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm"
        placeholder={'placeholder' in field ? field.placeholder : undefined}
      />
    </div>
  );
}
