'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { deletePackage, togglePackageStatus } from '@/actions/billing';

interface CreditPackage {
  id: string;
  name: string;
  isActive: boolean;
}

interface PackageActionsProps {
  pkg: CreditPackage;
}

export function PackageActions({ pkg }: PackageActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [isToggling, startToggleTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deletePackage(pkg.id);
        toast.success('Package deleted successfully');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to delete package');
      }
    });
  };

  const handleToggle = () => {
    startToggleTransition(async () => {
      try {
        await togglePackageStatus(pkg.id);
        toast.success(pkg.isActive ? 'Package deactivated' : 'Package activated');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to toggle status');
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={pkg.isActive}
        onCheckedChange={handleToggle}
        disabled={isToggling}
        aria-label="Toggle active status"
      />
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/dashboard/billing/packages/${pkg.id}/edit`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <DeleteConfirmDialog
        title="Delete package?"
        description={`Are you sure you want to delete "${pkg.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  );
}
