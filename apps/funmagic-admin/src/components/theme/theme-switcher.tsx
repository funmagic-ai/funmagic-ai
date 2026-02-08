'use client';

import { Check, Moon, Palette, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { THEMES, type ColorMode } from '@/lib/theme';
import { useTheme } from './theme-provider';
import { useMounted } from '@/hooks/use-mounted';
import { cn } from '@/lib/utils';

const MODE_OPTIONS: { id: ColorMode; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Palette },
];

export function ThemeSwitcher() {
  const mounted = useMounted();
  const { theme, mode, setTheme, setMode } = useTheme();

  // Show placeholder during SSR to avoid Radix ID hydration mismatch
  if (!mounted) {
    return (
      <div className="h-8 w-full rounded-md border border-input bg-transparent" />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-full justify-start gap-2 px-2"
        >
          <div
            className="h-4 w-4 rounded-full border"
            style={{
              backgroundColor: THEMES.find((t) => t.id === theme)?.swatch,
            }}
          />
          <span className="flex-1 text-left text-xs">Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right" className="w-48">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Color Theme
        </DropdownMenuLabel>
        <div className="grid grid-cols-4 gap-1 p-1">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                'group relative flex h-8 w-8 items-center justify-center rounded-md border transition-transform hover:scale-110',
                theme === t.id && 'ring-2 ring-ring ring-offset-2'
              )}
              style={{ backgroundColor: t.swatch }}
              title={t.name}
              aria-label={`Select ${t.name} theme`}
              aria-pressed={theme === t.id}
            >
              {theme === t.id && (
                <Check className="h-4 w-4 text-white drop-shadow-md" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Appearance
        </DropdownMenuLabel>
        <div className="flex gap-1 p-1">
          {MODE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => setMode(option.id)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 rounded-md border p-2 text-xs transition-colors hover:bg-accent',
                  mode === option.id && 'border-primary bg-accent'
                )}
                title={option.label}
              >
                <Icon className="h-4 w-4" />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
