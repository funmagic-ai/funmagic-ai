'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface KeyValueFieldRendererProps {
  name: string;
  description?: string;
  required?: boolean;
  value: Record<string, unknown> | undefined;
  onChange: (value: Record<string, unknown>) => void;
  /** Keys that cannot be renamed or deleted (from definition) */
  lockedKeys?: string[];
}

/**
 * A key-value editor that allows users to add custom options.
 * Used for providerOptions and similar dynamic config fields.
 */
export function KeyValueFieldRenderer({
  name,
  description,
  required,
  value,
  onChange,
  lockedKeys,
}: KeyValueFieldRendererProps) {
  const lockedKeySet = new Set(lockedKeys ?? []);
  const isLocked = (key: string) => lockedKeySet.has(key);
  const fieldLabel = name
    .split(/(?=[A-Z])/)
    .join(' ')
    .replace(/^\w/, (c) => c.toUpperCase());

  const currentValue = value || {};
  const entries = Object.entries(currentValue);

  // Filter out locked keys - they're managed in the Overridable Options section
  const customEntries = entries.filter(([key]) => !isLocked(key));

  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const addEntry = () => {
    if (!newKey.trim()) return;

    // Try to parse as JSON for complex values, otherwise use as string
    let parsedValue: unknown = newValue;
    try {
      parsedValue = JSON.parse(newValue);
    } catch {
      // Keep as string if not valid JSON
    }

    const newData = { ...currentValue, [newKey.trim()]: parsedValue };
    onChange(newData);
    setNewKey('');
    setNewValue('');
  };

  const removeEntry = (key: string) => {
    // Prevent deletion of locked keys
    if (isLocked(key)) return;
    const { [key]: _, ...rest } = currentValue;
    onChange(rest);
  };

  const updateEntry = (oldKey: string, newKeyName: string, newEntryValue: string) => {
    // Prevent renaming locked keys
    if (isLocked(oldKey) && oldKey !== newKeyName) {
      return;
    }

    // Try to parse as JSON for complex values
    let parsedValue: unknown = newEntryValue;
    try {
      parsedValue = JSON.parse(newEntryValue);
    } catch {
      // Keep as string if not valid JSON
    }

    if (oldKey !== newKeyName) {
      // Key changed, need to remove old and add new
      const { [oldKey]: _, ...rest } = currentValue;
      onChange({ ...rest, [newKeyName]: parsedValue });
    } else {
      onChange({ ...currentValue, [oldKey]: parsedValue });
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>
          {fieldLabel} {required && <span className="text-destructive">*</span>}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Custom entries only - locked keys are managed in Overridable Options */}
      {customEntries.length > 0 && (
        <div className="space-y-2">
          {customEntries.map(([key, val]) => (
            <div key={key} className="flex gap-2 items-center">
              <Input
                value={key}
                onChange={(e) => updateEntry(key, e.target.value, JSON.stringify(val))}
                placeholder="Key"
                className="flex-1"
              />
              <Input
                value={typeof val === 'string' ? val : JSON.stringify(val)}
                onChange={(e) => updateEntry(key, key, e.target.value)}
                placeholder="Value"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeEntry(key)}
                className="h-9 w-9 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new entry */}
      <div className="flex gap-2 items-center">
        <Input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="New key"
          className="flex-1"
          onBlur={() => {
            // Auto-add entry when both key and value are filled
            if (newKey.trim() && newValue.trim()) {
              addEntry();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addEntry();
            }
          }}
        />
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Value"
          className="flex-1"
          onBlur={() => {
            // Auto-add entry when both key and value are filled
            if (newKey.trim() && newValue.trim()) {
              addEntry();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addEntry();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addEntry}
          disabled={!newKey.trim()}
          className="h-9 w-9 shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Add custom provider options as key-value pairs. Values can be strings, numbers, or JSON.
      </p>
    </div>
  );
}
