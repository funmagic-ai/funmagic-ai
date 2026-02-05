'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { deletePackage } from '@/actions/billing';

interface CreditPackage {
  id: string;
  name: string;
}

interface PackageActionsProps {
  pkg: CreditPackage;
}

export function PackageActions({ pkg }: PackageActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deletePackage(pkg.id);
      } catch (error) {
        console.error('Failed to delete package:', error);
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
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
