'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
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
    if (!confirm('Are you sure you want to delete this package?')) return;

    startTransition(async () => {
      await deletePackage(pkg.id);
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/dashboard/billing/packages/${pkg.id}/edit`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isPending}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
