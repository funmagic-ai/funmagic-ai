import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PackageGeneralForm } from '@/components/billing/package-general-form';

export default function NewPackagePage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/billing">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Create Package</h1>
          <p className="text-muted-foreground">Add a new credit package</p>
        </div>
      </div>

      <PackageGeneralForm />
    </div>
  );
}
