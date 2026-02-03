import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ProviderGeneralForm } from '@/components/providers/provider-general-form';

export default function NewProviderPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/providers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Provider</h1>
          <p className="text-muted-foreground">Add a new AI service provider</p>
        </div>
      </div>

      <ProviderGeneralForm />
    </div>
  );
}
