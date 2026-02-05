'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { BooleanField } from '@funmagic/shared';

interface BooleanFieldRendererProps {
  name: string;
  field: BooleanField;
  value: boolean | undefined;
  onChange: (value: boolean) => void;
}

export function BooleanFieldRenderer({
  name,
  field,
  value,
  onChange,
}: BooleanFieldRendererProps) {
  const fieldLabel = name
    .split(/(?=[A-Z])/)
    .join(' ')
    .replace(/^\w/, (c) => c.toUpperCase());

  return (
    <div className="flex items-center justify-between">
      <div className="grid gap-1">
        <Label>
          {fieldLabel} {field.required && <span className="text-destructive">*</span>}
        </Label>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
      </div>
      <Switch
        checked={value ?? field.default ?? false}
        onCheckedChange={onChange}
      />
    </div>
  );
}
