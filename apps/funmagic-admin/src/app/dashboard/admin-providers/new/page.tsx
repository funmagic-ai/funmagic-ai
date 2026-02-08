import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AdminProviderCreateForm } from '@/components/admin-providers/admin-provider-create-form';

export default function NewAdminProviderPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin-providers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add AI Provider</h1>
          <p className="text-muted-foreground">Configure a new AI provider for AI Studio</p>
        </div>
      </div>

      <AdminProviderCreateForm />
    </div>
  );
}
