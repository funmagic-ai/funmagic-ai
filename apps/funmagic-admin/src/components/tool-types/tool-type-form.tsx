'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolTypeFormProps {
  className?: string;
}

export function ToolTypeForm({ className }: ToolTypeFormProps) {
  return (
    <Button size="sm" className={cn(className)} asChild>
      <Link href="/dashboard/tool-types/new">
        <Plus className="mr-2 h-4 w-4" />
        Add Tool Type
      </Link>
    </Button>
  );
}
