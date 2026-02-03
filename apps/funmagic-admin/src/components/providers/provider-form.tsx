import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProviderFormProps {
  mode: 'create';
  className?: string;
}

export function ProviderForm({ mode, className }: ProviderFormProps) {
  return (
    <Button size="sm" className={cn(className)} asChild>
      <Link href="/dashboard/providers/new">
        <Plus className="mr-2 h-4 w-4" />
        Add Provider
      </Link>
    </Button>
  );
}
