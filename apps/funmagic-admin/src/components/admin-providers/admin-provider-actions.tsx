'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { deleteAdminProvider } from '@/actions/admin-providers';
import { toast } from 'sonner';

interface AdminProviderActionsProps {
  providerId: string;
  providerName?: string;
}

export function AdminProviderActions({ providerId, providerName }: AdminProviderActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteAdminProvider(providerId);
        toast.success('Provider deleted');
      } catch (error) {
        console.error('Failed to delete admin provider:', error);
        toast.error('Failed to delete provider');
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/dashboard/admin-providers/${providerId}`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <DeleteConfirmDialog
        title="Delete AI provider?"
        description={`Are you sure you want to delete${providerName ? ` "${providerName}"` : ' this AI provider'}? This will remove it from AI Studio. This action cannot be undone.`}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  );
}
