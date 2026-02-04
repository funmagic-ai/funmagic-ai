'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { createPackage } from '@/actions/billing';
import type { FormState } from '@/lib/form-types';

export function PackageGeneralForm() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (prevState: FormState, formData: FormData) => {
      const result = await createPackage(prevState, formData);

      if (result.success) {
        toast.success(result.message || 'Package created successfully');
        await new Promise(resolve => setTimeout(resolve, 1500));
        router.push('/dashboard/billing');
      }

      return result;
    },
    { success: false, message: '', errors: {} as Record<string, string[]> }
  );

  return (
    <form action={formAction}>
      <div className="mx-auto max-w-2xl grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Package name and description</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Starter Pack"
                aria-invalid={!!state.errors?.name}
              />
              {state.errors?.name && (
                <p className="text-destructive text-xs">{state.errors.name[0]}</p>
              )}
              <p className="text-muted-foreground text-xs">
                Unique identifier for the package
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">
                Description <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="description"
                name="description"
                placeholder="e.g., Perfect for getting started"
              />
              <p className="text-muted-foreground text-xs">
                Brief description of the package
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credits & Pricing</CardTitle>
            <CardDescription>Configure credit amounts and price</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="credits">
                  Credits <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="credits"
                  name="credits"
                  type="number"
                  min="1"
                  defaultValue={100}
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
                  defaultValue={0}
                />
                <p className="text-muted-foreground text-xs">
                  Extra credits added as a bonus
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  defaultValue="9.99"
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
                  defaultValue={0}
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
                <Label htmlFor="isPopular">
                  Mark as Popular <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <p className="text-sm text-muted-foreground">Highlight this package as recommended</p>
              </div>
              <Switch id="isPopular" name="isPopular" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">
                  Active <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <p className="text-sm text-muted-foreground">Available for purchase</p>
              </div>
              <Switch id="isActive" name="isActive" defaultChecked />
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
            {isPending ? 'Creating...' : 'Create Package'}
          </Button>
        </div>
      </div>
    </form>
  );
}
