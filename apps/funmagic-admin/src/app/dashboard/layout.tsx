import { connection } from 'next/server';
import { Suspense } from 'react';
import { auth, type Session } from '@funmagic/auth/server';
import { isAdmin } from '@funmagic/auth/permissions';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { SidebarSkeleton } from '@/components/layout/sidebar-skeleton';

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
  return (
    <Sidebar
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
      }}
    />
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  return (
    <div className="flex h-screen bg-background">
      <Suspense fallback={<SidebarSkeleton />}>
        <SidebarWithAuth />
      </Suspense>
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
