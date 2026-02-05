'use client';

import { Label } from '@/components/ui/label';
import type { ObjectField } from '@funmagic/shared';
import type { Provider } from './types';
import { FieldRenderer } from './field-renderer';

interface ObjectFieldRendererProps {
  name: string;
  field: ObjectField;
  value: Record<string, unknown> | undefined;
  onChange: (value: Record<string, unknown>) => void;
  providers?: Provider[];
}

export function ObjectFieldRenderer({
  name,
  field,
  value,
  onChange,
  providers,
}: ObjectFieldRendererProps) {
  const fieldLabel = name
    .split(/(?=[A-Z])/)
    .join(' ')
    .replace(/^\w/, (c) => c.toUpperCase());

  const currentValue = value || {};

  const updateProperty = (propName: string, propValue: unknown) => {
    onChange({ ...currentValue, [propName]: propValue });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>
          {fieldLabel} {field.required && <span className="text-destructive">*</span>}
        </Label>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-4">
        {Object.entries(field.properties).map(([propName, propField]) => (
          <FieldRenderer
            key={propName}
            name={propName}
            field={propField}
            value={currentValue[propName]}
            onChange={(newValue) => updateProperty(propName, newValue)}
            providers={providers}
          />
        ))}
      </div>
    </div>
  );
}
