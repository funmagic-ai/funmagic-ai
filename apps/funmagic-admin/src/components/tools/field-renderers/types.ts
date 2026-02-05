import type { Field } from '@funmagic/shared';

export interface Provider {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
}

export interface FieldRendererProps {
  name: string;
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
  providers?: Provider[];
  uploadRoute?: string;
}
