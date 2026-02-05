'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { NumberField } from '@funmagic/shared';

interface NumberFieldRendererProps {
  name: string;
  field: NumberField;
  value: number | undefined;
  onChange: (value: number) => void;
}

export function NumberFieldRenderer({
  name,
  field,
  value,
  onChange,
}: NumberFieldRendererProps) {
  const fieldLabel = name
    .split(/(?=[A-Z])/)
    .join(' ')
    .replace(/^\w/, (c) => c.toUpperCase());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value);
    if (!isNaN(numValue)) {
      // Clamp to min/max if defined
      let clampedValue = numValue;
      if (field.min !== undefined && clampedValue < field.min) {
        clampedValue = field.min;
      }
      if (field.max !== undefined && clampedValue > field.max) {
        clampedValue = field.max;
      }
      onChange(clampedValue);
    }
  };

  return (
    <div className="grid gap-2">
      <Label>
        {fieldLabel}
        {field.description && (
          <span className="text-muted-foreground font-normal"> - {field.description}</span>
        )}
        {field.required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        type="number"
        value={value ?? field.default ?? ''}
        onChange={handleChange}
      />
    </div>
  );
}
