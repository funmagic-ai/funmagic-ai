'use client';

import { useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { TranslationsEditor } from '@/components/translations/translations-editor';
import { updatePackage } from '@/actions/billing';
import type { FormState } from '@/lib/form-types';
import type { CreditPackageTranslations } from '@funmagic/shared';

const PACKAGE_TRANSLATION_FIELDS = [
  { name: 'name', label: 'Name', required: true, placeholder: 'e.g., Starter Pack' },
  { name: 'description', label: 'Description', required: false, placeholder: 'e.g., Perfect for getting started', rows: 2 },
];

interface CreditPackage {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  bonusCredits: number | null;
  price: string;
  sortOrder: number | null;
  isPopular: boolean | null;
  isActive: boolean;
  translations?: CreditPackageTranslations;
}

interface PackageEditFormProps {
  pkg: CreditPackage;
}

export function PackageEditForm({ pkg }: PackageEditFormProps) {
  const router = useRouter();

  // Initialize translations state
  const [translations, setTranslations] = useState<CreditPackageTranslations>(
    pkg.translations ?? {
      en: {
        name: pkg.name,
        description: pkg.description ?? '',
      },
    }
  );

  const [state, formAction, isPending] = useActionState(
    async (prevState: FormState, formData: FormData) => {
      // Add translations to formData
      formData.set('translations', JSON.stringify(translations));

      const result = await updatePackage(prevState, formData);

      if (result.success) {
        toast.success(result.message || 'Package updated successfully');
        await new Promise(resolve => setTimeout(resolve, 1500));
        router.push('/dashboard/billing');
      }

      return result;
    },
    { success: false, message: '', errors: {} as Record<string, string[]> }
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={pkg.id} />
      {/* Sync English translations to legacy fields */}
      <input type="hidden" name="name" value={(translations.en as { name?: string })?.name ?? pkg.name} />
      <input type="hidden" name="description" value={(translations.en as { description?: string })?.description ?? ''} />

      <div className="mx-auto max-w-4xl grid gap-4 md:gap-6">
        <TranslationsEditor
          translations={translations}
          onChange={setTranslations}
          fields={PACKAGE_TRANSLATION_FIELDS}
          title="Package Content"
          description="Name and description displayed in each language"
        />

        <Card>
          <CardHeader>
            <CardTitle>Credits & Pricing</CardTitle>
            <CardDescription>Configure credit amounts and price</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="credits">
                  Credits <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="credits"
                  name="credits"
                  type="number"
                  min="1"
                  defaultValue={pkg.credits}
                  aria-invalid={!!state.errors?.credits}
                />
                {state.errors?.credits && (
                  <p className="text-destructive text-xs">{state.errors.credits[0]}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Number of credits included (min: 1)
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bonusCredits">
                  Bonus Credits <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="bonusCredits"
                  name="bonusCredits"
                  type="number"
                  min="0"
                  defaultValue={pkg.bonusCredits ?? 0}
                />
                <p className="text-muted-foreground text-xs">
                  Extra credits added as a bonus
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="price">
                  Price (USD) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={pkg.price}
                  aria-invalid={!!state.errors?.price}
                />
                {state.errors?.price && (
                  <p className="text-destructive text-xs">{state.errors.price[0]}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Price in dollars (min: 0)
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sortOrder">
                  Sort Order <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  min="0"
                  defaultValue={pkg.sortOrder ?? 0}
                />
                <p className="text-muted-foreground text-xs">
                  Lower numbers appear first
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
            <CardDescription>Control visibility and highlighting</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isPopular">Mark as Popular</Label>
                <p className="text-sm text-muted-foreground">Highlight this package as recommended</p>
              </div>
              <Switch
                id="isPopular"
                name="isPopular"
                defaultChecked={pkg.isPopular ?? false}
              />
            </div>
          </CardContent>
        </Card>

        {state.message && !state.success && !state.errors && (
          <p className="text-destructive">{state.message}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/billing')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Update Package'}
          </Button>
        </div>
      </div>
    </form>
  );
}
