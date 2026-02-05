import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getToolTypeById } from '@/actions/tool-types';
import { ToolTypeEditForm } from '@/components/tool-types/tool-type-edit-form';
import type { ToolTypeTranslations } from '@funmagic/shared';

interface EditToolTypePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditToolTypePage({ params }: EditToolTypePageProps) {
  const { id } = await params;
  const toolType = await getToolTypeById(id);

  if (!toolType) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/tool-types">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Tool Type</h1>
          <p className="text-muted-foreground">Update tool type details</p>
        </div>
      </div>

      <ToolTypeEditForm toolType={{
        ...toolType,
        translations: toolType.translations as ToolTypeTranslations | undefined,
      }} />
    </div>
  );
}
