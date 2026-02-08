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
  Sparkles,
  Key,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from '@/components/layout/logo';
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

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  requiredRole?: 'admin' | 'super_admin';
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navigationGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Tools', href: '/dashboard/tools', icon: Wrench },
      { name: 'Users', href: '/dashboard/users', icon: Users },
      { name: 'Tasks', href: '/dashboard/tasks', icon: ListTodo },
    ],
  },
  {
    label: 'Content & Billing',
    items: [
      { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
      { name: 'Content', href: '/dashboard/content', icon: Image },
      { name: 'AI Studio', href: '/dashboard/ai-studio', icon: Sparkles },
      { name: 'AI Tasks', href: '/dashboard/admin-tasks', icon: Zap },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Providers', href: '/dashboard/providers', icon: Server, requiredRole: 'super_admin' },
      { name: 'AI Providers', href: '/dashboard/admin-providers', icon: Key, requiredRole: 'super_admin' },
      { name: 'Tool Types', href: '/dashboard/tool-types', icon: Layers, requiredRole: 'super_admin' },
      { name: 'Queue', href: '/dashboard/queue', icon: Activity, requiredRole: 'super_admin' },
    ],
  },
];

function hasAccess(userRole: string, requiredRole?: 'admin' | 'super_admin'): boolean {
  if (!requiredRole || requiredRole === 'admin') {
    return userRole === 'admin' || userRole === 'super_admin';
  }
  if (requiredRole === 'super_admin') {
    return userRole === 'super_admin';
  }
  return false;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r bg-sidebar md:flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:rounded focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Logo className="h-4 w-4" />
          </div>
          <span className="text-sidebar-foreground">Funmagic Admin</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        {navigationGroups.map((group) => {
          const visibleItems = group.items.filter((item) =>
            hasAccess(user.role, item.requiredRole)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="mb-6">
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h3>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive =
                    item.href === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
              </div>
            </div>
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
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
