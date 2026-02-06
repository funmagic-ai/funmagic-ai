'use client';

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
import { registerPendingFile, removePendingFile, isPendingUrl } from './pending-files-registry';

interface StringFieldRendererProps {
  name: string;
  field: StringField;
  value: string | undefined;
  onChange: (value: string) => void;
  providers?: Provider[];
}

export function StringFieldRenderer({
  name,
  field,
  value,
  onChange,
  providers,
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

  // File upload field (deferred upload pattern)
  if (field.upload) {
    return (
      <UploadFieldRenderer
        name={name}
        field={field}
        value={value}
        onChange={onChange}
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
}

/**
 * Deferred upload field renderer - shows local blob preview, registers file
 * for upload on form submit via the pending files registry
 */
function UploadFieldRenderer({
  name,
  field,
  value,
  onChange,
}: UploadFieldRendererProps) {
  const fieldLabel = name
    .split(/(?=[A-Z])/)
    .join(' ')
    .replace(/^\w/, (c) => c.toUpperCase());

  // Handle file selection - show local preview, register for deferred upload
  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      const blobUrl = URL.createObjectURL(file);
      registerPendingFile(blobUrl, file);
      onChange(blobUrl); // Set blob URL as value
    }
  };

  // Determine if this is a pending blob URL
  const isPending = value ? isPendingUrl(value) : false;
  // Get display URL - for pending files show blob URL, otherwise get S3 public URL
  const displayUrl = isPending ? value : getS3PublicUrl(value || '');

  return (
    <div className="grid gap-2">
      <Label>
        {fieldLabel} {field.required && <span className="text-destructive">*</span>}
      </Label>
      {value ? (
        <div className="relative">
          <img
            src={displayUrl}
            alt={fieldLabel}
            className={`h-32 w-full rounded-md object-cover ${isPending ? 'border-2 border-dashed border-primary/50' : ''}`}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={() => {
              if (isPending && value) {
                removePendingFile(value);
                URL.revokeObjectURL(value);
              }
              onChange('');
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <UploadDropzone
          onFileSelect={handleFileSelect}
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
