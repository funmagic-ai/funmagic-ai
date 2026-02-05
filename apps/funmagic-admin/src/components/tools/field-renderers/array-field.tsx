'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, X, Image as ImageIcon, Trash2 } from 'lucide-react';
import { UploadDropzone } from '@/components/ui/upload-dropzone';
import { getS3PublicUrl } from '@/lib/s3-url';
import type { ArrayField } from '@funmagic/shared';
import type { Provider } from './types';
import { FieldRenderer } from './field-renderer';
import { registerPendingFile, removePendingFile, isPendingUrl, getPendingFile } from './pending-files-registry';
import { toast } from 'sonner';

interface ArrayFieldRendererProps {
  name: string;
  field: ArrayField;
  value: Record<string, unknown>[] | undefined;
  onChange: (value: Record<string, unknown>[]) => void;
  providers?: Provider[];
}

/**
 * Check if this array field is a simple image upload gallery
 * (has only one field which is a string with upload: true)
 */
function isImageGalleryField(field: ArrayField): { isGallery: true; fieldName: string } | { isGallery: false } {
  const entries = Object.entries(field.itemFields);
  if (entries.length !== 1) return { isGallery: false };

  const [fieldName, fieldDef] = entries[0];
  if (fieldDef.type === 'string' && 'upload' in fieldDef && fieldDef.upload) {
    return { isGallery: true, fieldName };
  }
  return { isGallery: false };
}

export function ArrayFieldRenderer({
  name,
  field,
  value,
  onChange,
  providers,
}: ArrayFieldRendererProps) {
  const fieldLabel = name
    .split(/(?=[A-Z])/)
    .join(' ')
    .replace(/^\w/, (c) => c.toUpperCase());

  const items = value || [];
  const canAddMore = field.maxItems === undefined || items.length < field.maxItems;
  const galleryCheck = isImageGalleryField(field);

  // If it's a simple image gallery, render compact version
  if (galleryCheck.isGallery) {
    return (
      <ImageGalleryField
        name={name}
        fieldLabel={fieldLabel}
        imageFieldName={galleryCheck.fieldName}
        field={field}
        items={items}
        onChange={onChange}
        canAddMore={canAddMore}
      />
    );
  }

  // Standard array field with cards
  const addItem = () => {
    if (!canAddMore) return;

    const newItem: Record<string, unknown> = {};
    for (const [fieldName, fieldDef] of Object.entries(field.itemFields)) {
      if ('default' in fieldDef) {
        newItem[fieldName] = fieldDef.default;
      } else {
        newItem[fieldName] = fieldDef.type === 'string' ? '' :
                            fieldDef.type === 'number' ? 0 :
                            fieldDef.type === 'boolean' ? false :
                            fieldDef.type === 'array' ? [] : {};
      }
    }
    onChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItemField = (index: number, fieldName: string, fieldValue: unknown) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [fieldName]: fieldValue };
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>
          {fieldLabel} {field.required && <span className="text-destructive">*</span>}
        </Label>
        {field.maxItems && (
          <span className="text-xs text-muted-foreground">
            {items.length}/{field.maxItems}
          </span>
        )}
      </div>

      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No items yet</p>
          <Button onClick={addItem} className="mt-4" variant="outline" type="button">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item, index) => (
              <Card key={index} className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-6 w-6"
                  onClick={() => removeItem(index)}
                >
                  <X className="h-4 w-4" />
                </Button>

                <CardContent className="space-y-4 pt-6">
                  {Object.entries(field.itemFields).map(([itemFieldName, itemField]) => (
                    <FieldRenderer
                      key={itemFieldName}
                      name={itemFieldName}
                      field={itemField}
                      value={item[itemFieldName]}
                      onChange={(newValue) => updateItemField(index, itemFieldName, newValue)}
                      providers={providers}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {canAddMore && (
            <Button onClick={addItem} variant="outline" className="w-full" type="button">
              <Plus className="mr-2 h-4 w-4" />
              Add Item {field.maxItems && `(${items.length}/${field.maxItems})`}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Compact image gallery for upload-only array fields
 * Shows local preview immediately, deferred upload on form submit
 */
interface ImageGalleryFieldProps {
  name: string;
  fieldLabel: string;
  imageFieldName: string;
  field: ArrayField;
  items: Record<string, unknown>[];
  onChange: (value: Record<string, unknown>[]) => void;
  canAddMore: boolean;
}

function ImageGalleryField({
  name,
  fieldLabel,
  imageFieldName,
  field,
  items,
  onChange,
  canAddMore,
}: ImageGalleryFieldProps) {
  // Handle file selection - show local preview, store for deferred upload
  const handleFileSelect = useCallback((file: File) => {
    const remainingSlots = field.maxItems ? field.maxItems - items.length : Infinity;
    if (remainingSlots <= 0) return;

    // Check for duplicate file by name and size
    const existingPendingFiles = items
      .map(item => item[imageFieldName] as string)
      .filter(url => isPendingUrl(url))
      .map(url => getPendingFile(url))
      .filter((f): f is File => f !== undefined);

    const isDuplicate = existingPendingFiles.some(
      existingFile => existingFile.name === file.name && existingFile.size === file.size
    );

    if (isDuplicate) {
      toast.error('This file has already been added');
      return;
    }

    // Create blob URL for local preview
    const blobUrl = URL.createObjectURL(file);

    // Register file for deferred upload
    registerPendingFile(blobUrl, file);

    // Add to items with blob URL (will be replaced with real URL on submit)
    onChange([...items, { [imageFieldName]: blobUrl }]);
  }, [field.maxItems, items, onChange, imageFieldName]);

  const removeItem = (index: number) => {
    const item = items[index];
    const imageUrl = item[imageFieldName] as string;

    // If it's a pending blob URL, clean up
    if (isPendingUrl(imageUrl)) {
      removePendingFile(imageUrl);
      URL.revokeObjectURL(imageUrl);
    }

    onChange(items.filter((_, i) => i !== index));
  };

  const totalCount = items.length;
  const canAddMoreNow = field.maxItems === undefined || totalCount < field.maxItems;

  // Count pending files for indicator
  const pendingCount = items.filter((item) => isPendingUrl(item[imageFieldName] as string)).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>
          {fieldLabel} {field.required && <span className="text-destructive">*</span>}
        </Label>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {pendingCount} pending upload
            </span>
          )}
          {field.maxItems && (
            <span className="text-xs text-muted-foreground">
              {totalCount}/{field.maxItems}
            </span>
          )}
        </div>
      </div>

      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}

      {/* Image thumbnails grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {items.map((item, index) => {
            const imageUrl = item[imageFieldName] as string;
            const isPending = isPendingUrl(imageUrl);
            // For pending: use blob URL directly, for uploaded: use S3 URL
            const displayUrl = isPending ? imageUrl : getS3PublicUrl(imageUrl);

            return (
              <div key={`img-${index}`} className="relative group aspect-square">
                <img
                  src={displayUrl}
                  alt={`${fieldLabel} ${index + 1}`}
                  className="w-full h-full object-cover rounded-md border"
                />
                {/* Pending indicator - subtle border */}
                {isPending && (
                  <div className="absolute inset-0 rounded-md border-2 border-dashed border-primary/50" />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload area */}
      {canAddMoreNow && (
        <UploadDropzone
          accept="image/jpeg,image/png,image/webp"
          onFileSelect={handleFileSelect}
          description={{
            fileTypes: 'JPEG, PNG, WebP',
            maxFileSize: '5MB',
            maxFiles: field.maxItems ? field.maxItems - totalCount : undefined,
          }}
        />
      )}
    </div>
  );
}
