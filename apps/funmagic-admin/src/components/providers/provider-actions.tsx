'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { deleteProvider } from '@/actions/providers';

interface ProviderActionsProps {
  providerId: string;
  providerName?: string;
}

export function ProviderActions({ providerId, providerName }: ProviderActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteProvider(providerId);
      } catch (error) {
        console.error('Failed to delete provider:', error);
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/dashboard/providers/${providerId}`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <DeleteConfirmDialog
        title="Delete provider?"
        description={`Are you sure you want to delete${providerName ? ` "${providerName}"` : ' this provider'}? This action cannot be undone.`}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  );
}
