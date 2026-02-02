'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Wrench,
  Users,
  ListTodo,
  CreditCard,
  Server,
  Layers,
  Image,
  Activity,
  LogOut,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { signOut } from '@/lib/auth-client';

interface SidebarProps {
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
    role: string;
  };
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tools', href: '/dashboard/tools', icon: Wrench },
  { name: 'Users', href: '/dashboard/users', icon: Users },
  { name: 'Tasks', href: '/dashboard/tasks', icon: ListTodo },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Providers', href: '/dashboard/providers', icon: Server },
  { name: 'Tool Types', href: '/dashboard/tool-types', icon: Layers },
  { name: 'Content', href: '/dashboard/content', icon: Image },
  { name: 'Queue', href: '/dashboard/queue', icon: Activity },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r bg-sidebar">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wrench className="h-4 w-4" />
          </div>
          <span className="text-sidebar-foreground">Funmagic Admin</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="p-4 space-y-3">
        <ThemeSwitcher />
        <Separator />
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? user.email} />
            <AvatarFallback>
              {(user.name ?? user.email).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {user.name ?? user.email}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user.role}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
