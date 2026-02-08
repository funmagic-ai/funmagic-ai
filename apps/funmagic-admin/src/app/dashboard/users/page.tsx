import { Suspense } from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { formatDate } from '@/lib/date-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Eye, Users as UsersIcon } from 'lucide-react';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

interface UserWithCredits {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  image: string | null;
  role: string;
  createdAt: string;
  credits: {
    balance: number;
    lifetimePurchased: number;
    lifetimeUsed: number;
  } | null;
}

export default function UsersPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Users</h1>
        <p className="text-muted-foreground">Manage user accounts and permissions</p>
      </div>

      <Suspense fallback={<TableSkeleton columns={6} rows={10} />}>
        <UserTableData />
      </Suspense>
    </div>
  );
}

async function UserTableData() {
  // TODO: After regenerating API types with `bun run api:generate`, use:
  // const { data } = await api.GET('/api/admin/users');
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${baseUrl}/api/admin/users`, {
    headers: { cookie: cookieHeader },
  });
  const data = (await res.json()) as { users: UserWithCredits[] };
  const allUsers = data?.users ?? [];

  if (allUsers.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersIcon />
          </EmptyMedia>
          <EmptyTitle>No users found</EmptyTitle>
          <EmptyDescription>
            Users will appear here once they sign up.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const roleColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
    user: 'secondary',
    admin: 'default',
    super_admin: 'destructive',
  };

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Credits</TableHead>
            <TableHead className="hidden sm:table-cell">Created</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-2 md:gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image ?? undefined} />
                    <AvatarFallback>
                      {(user.name ?? user.email).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.name ?? 'No name'}</span>
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">{user.email}</TableCell>
              <TableCell>
                <Badge variant={roleColors[user.role] ?? 'secondary'}>{user.role}</Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                {(user.credits?.balance ?? 0).toLocaleString()}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {formatDate(user.createdAt)}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/dashboard/users/${user.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
