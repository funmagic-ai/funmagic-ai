import { connection } from 'next/server';
import { Suspense } from 'react';
import { auth, type Session } from '@funmagic/auth/server';
import { isAdmin } from '@funmagic/auth/permissions';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { SidebarSkeleton } from '@/components/layout/sidebar-skeleton';
import { MobileHeader } from '@/components/layout/mobile-header';

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  }) as Session | null;
  if (!session || !isAdmin(session.user.role)) {
    redirect('/unauthorized');
  }
  return session;
}

async function SidebarWithAuth() {
  const session = await requireAdmin();
  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    role: session.user.role,
  };
  return (
    <>
      <MobileHeader user={user} />
      <Sidebar user={user} />
    </>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Suspense fallback={<SidebarSkeleton />}>
        <SidebarWithAuth />
      </Suspense>
      <main className="ml-0 flex-1 overflow-auto px-4 pb-4 pt-16 md:ml-64 md:px-8 md:pb-8 md:pt-8">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
