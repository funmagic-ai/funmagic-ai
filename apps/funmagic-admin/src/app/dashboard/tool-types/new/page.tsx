import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ToolTypeGeneralForm } from '@/components/tool-types/tool-type-general-form';

export default function NewToolTypePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/tool-types">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Tool Type</h1>
          <p className="text-muted-foreground">Add a new tool category</p>
        </div>
      </div>

      <ToolTypeGeneralForm />
    </div>
  );
}
