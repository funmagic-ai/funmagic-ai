'use client';

import type { Field } from '@funmagic/shared';
import type { Provider } from './types';
import { StringFieldRenderer } from './string-field';
import { NumberFieldRenderer } from './number-field';
import { BooleanFieldRenderer } from './boolean-field';
import { ArrayFieldRenderer } from './array-field';
import { ObjectFieldRenderer } from './object-field';

interface FieldRendererProps {
  name: string;
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
  providers?: Provider[];
}

/**
 * Main field renderer that dispatches to specific field type components
 */
export function FieldRenderer({
  name,
  field,
  value,
  onChange,
  providers,
}: FieldRendererProps) {
  switch (field.type) {
    case 'string':
      return (
        <StringFieldRenderer
          name={name}
          field={field}
          value={value as string | undefined}
          onChange={onChange as (value: string) => void}
          providers={providers}
        />
      );

    case 'number':
      return (
        <NumberFieldRenderer
          name={name}
          field={field}
          value={value as number | undefined}
          onChange={onChange as (value: number) => void}
        />
      );

    case 'boolean':
      return (
        <BooleanFieldRenderer
          name={name}
          field={field}
          value={value as boolean | undefined}
          onChange={onChange as (value: boolean) => void}
        />
      );

    case 'array':
      return (
        <ArrayFieldRenderer
          name={name}
          field={field}
          value={value as Record<string, unknown>[] | undefined}
          onChange={onChange as (value: Record<string, unknown>[]) => void}
          providers={providers}
        />
      );

    case 'object':
      return (
        <ObjectFieldRenderer
          name={name}
          field={field}
          value={value as Record<string, unknown> | undefined}
          onChange={onChange as (value: Record<string, unknown>) => void}
          providers={providers}
        />
      );

    default:
      return (
        <div className="text-sm text-muted-foreground">
          Unknown field type for {name}
        </div>
      );
  }
}
