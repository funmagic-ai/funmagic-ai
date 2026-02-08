'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { TranslationsEditor } from '@/components/translations';
import { updateToolType } from '@/actions/tool-types';
import type { FormState } from '@/lib/form-types';
import type { ToolTypeTranslations } from '@funmagic/shared';

interface ToolType {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  translations?: ToolTypeTranslations;
  isActive: boolean;
}

interface ToolTypeEditFormProps {
  toolType: ToolType;
}

const TOOL_TYPE_TRANSLATION_FIELDS = [
  {
    name: 'displayName',
    label: 'Display Name',
    required: true,
    rows: 1,
    placeholder: 'e.g., Style Transform',
  },
  {
    name: 'description',
    label: 'Description',
    required: false,
    rows: 2,
    placeholder: 'e.g., Transform images with AI styles',
  },
];

export function ToolTypeEditForm({ toolType }: ToolTypeEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<FormState>({
    success: false,
    message: '',
    errors: {},
  });

  // Initialize translations from existing data
  const [translations, setTranslations] = useState<ToolTypeTranslations>(
    toolType.translations ?? {
      en: {
        displayName: toolType.displayName,
        description: toolType.description ?? '',
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Add translations as JSON
    formData.set('translations', JSON.stringify(translations));

    startTransition(async () => {
      const result = await updateToolType(formState, formData);

      if (result.success) {
        toast.success(result.message || 'Tool type updated successfully');
        await new Promise(resolve => setTimeout(resolve, 1500));
        router.push('/dashboard/tool-types');
      } else {
        toast.error(result.message || 'Failed to update tool type');
      }

      setFormState(result);
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={toolType.id} />
      <div className="mx-auto max-w-4xl grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Tool type name and display settings</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Name (slug) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={toolType.name}
                  placeholder="e.g., style-transform"
                  aria-invalid={!!formState.errors?.name}
                />
                {formState.errors?.name && (
                  <p className="text-destructive text-xs">{formState.errors.name[0]}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Unique identifier. Only lowercase letters, numbers, and hyphens.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="displayName">
                  Display Name (Default) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="displayName"
                  name="displayName"
                  placeholder="e.g., Style Transform"
                  value={translations.en?.displayName ?? ''}
                  onChange={(e) => {
                    setTranslations((prev) => ({
                      ...prev,
                      en: { ...prev.en, displayName: e.target.value },
                    }));
                  }}
                  aria-invalid={!!formState.errors?.displayName}
                />
                {formState.errors?.displayName && (
                  <p className="text-destructive text-xs">{formState.errors.displayName[0]}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Default display name (English)
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">
                Description (Default) <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="description"
                name="description"
                placeholder="e.g., Transform images with AI styles"
                value={translations.en?.description ?? ''}
                onChange={(e) => {
                  setTranslations((prev) => ({
                    ...prev,
                    en: { ...prev.en, description: e.target.value },
                  }));
                }}
              />
              <p className="text-muted-foreground text-xs">
                Default description (English)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Translations Editor */}
        <TranslationsEditor
          translations={translations}
          onChange={setTranslations}
          fields={TOOL_TYPE_TRANSLATION_FIELDS}
          title="Localized Content"
          description="Translate display name and description for each language"
        />

        {formState.message && !formState.success && !formState.errors && (
          <p className="text-destructive">{formState.message}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/tool-types')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Update Tool Type'}
          </Button>
        </div>
      </div>
    </form>
  );
}
