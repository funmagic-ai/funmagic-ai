'use client';

import { useState } from 'react';
import { useUploadFiles } from '@better-upload/client';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UploadDropzone } from '@/components/ui/upload-dropzone';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { getS3PublicUrl } from '@/lib/s3-url';
import type { StringField } from '@funmagic/shared';
import type { Provider } from './types';

interface StringFieldRendererProps {
  name: string;
  field: StringField;
  value: string | undefined;
  onChange: (value: string) => void;
  providers?: Provider[];
  uploadRoute?: string;
}

export function StringFieldRenderer({
  name,
  field,
  value,
  onChange,
  providers,
  uploadRoute = 'tool-config',
}: StringFieldRendererProps) {
  const fieldLabel = name
    .split(/(?=[A-Z])/)
    .join(' ')
    .replace(/^\w/, (c) => c.toUpperCase());

  // Special handling for providerId fields
  if (name === 'providerId' && providers) {
    return (
      <div className="grid gap-2">
        <Label>
          Provider {field.required && <span className="text-destructive">*</span>}
        </Label>
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
      </div>
    );
  }

  // File upload field
  if (field.upload) {
    return (
      <UploadFieldRenderer
        name={name}
        field={field}
        value={value}
        onChange={onChange}
        uploadRoute={uploadRoute}
      />
    );
  }

  // Select dropdown
  if (field.options && field.options.length > 0) {
    return (
      <div className="grid gap-2">
        <Label>
          {fieldLabel} {field.required && <span className="text-destructive">*</span>}
        </Label>
        <Select value={value || field.default || ''} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder || `Select ${fieldLabel.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
      </div>
    );
  }

  // Default text input - use Textarea with 3 rows
  return (
    <div className="grid gap-2">
      <Label>
        {fieldLabel} {field.required && <span className="text-destructive">*</span>}
      </Label>
      <Textarea
        value={value || field.default || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={3}
      />
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
    </div>
  );
}

interface UploadFieldRendererProps {
  name: string;
  field: StringField;
  value: string | undefined;
  onChange: (value: string) => void;
  uploadRoute: string;
}

function UploadFieldRenderer({
  name,
  field,
  value,
  onChange,
  uploadRoute,
}: UploadFieldRendererProps) {
  const fieldLabel = name
    .split(/(?=[A-Z])/)
    .join(' ')
    .replace(/^\w/, (c) => c.toUpperCase());

  const uploadControl = useUploadFiles({
    route: uploadRoute,
    api: `/api/admin/tools/${uploadRoute}/upload`,
    onUploadComplete: ({ files }) => {
      if (files.length > 0) {
        const file = files[0];
        const s3BaseUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || '';
        const imageUrl = s3BaseUrl ? `${s3BaseUrl}/${file.objectInfo.key}` : file.objectInfo.key;
        onChange(imageUrl);
      }
    },
  });

  return (
    <div className="grid gap-2">
      <Label>
        {fieldLabel} {field.required && <span className="text-destructive">*</span>}
      </Label>
      {value ? (
        <div className="relative">
          <img
            src={getS3PublicUrl(value)}
            alt={fieldLabel}
            className="h-32 w-full rounded-md object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={() => onChange('')}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <UploadDropzone
          control={uploadControl}
          accept="image/jpeg,image/png,image/webp"
          description={{
            fileTypes: 'JPEG, PNG, WebP',
            maxFileSize: '5MB',
            maxFiles: 1,
          }}
        />
      )}
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
    </div>
  );
}
