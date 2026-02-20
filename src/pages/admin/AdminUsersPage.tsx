import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Search, AlertTriangle, Users } from 'lucide-react';
import { format } from 'date-fns';
import type { User } from '@/types';

function useAdminUsers(params: { q?: string; page?: number }) {
  return useQuery<{ users: User[]; totalPages: number }>({
    queryKey: ['admin-users', params],
    queryFn: async () => {
      const p: Record<string, string> = {
        page: String(params.page ?? 1),
        limit: '20',
      };
      if (params.q) p.q = params.q;
      const { data } = await api.get('/api/admin/users', { params: p });
      const payload = data?.data;
      if (Array.isArray(payload)) return { users: payload, totalPages: 1 };
      return {
        users: Array.isArray(payload?.users) ? payload.users : [],
        totalPages: payload?.pagination?.totalPages ?? 1,
      };
    },
  });
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAdminUsers({
    q: search || undefined,
    page,
  });
  const users = data?.users ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className='max-w-5xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-neutral-900'>Users</h1>
        <p className='text-neutral-500 mt-1'>All registered library members</p>
      </div>

      {/* Search */}
      <div className='mb-4 relative max-w-sm'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400' />
        <Input
          placeholder='Search users…'
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className='pl-9'
        />
      </div>

      <div className='bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden'>
        {isLoading ? (
          <div className='p-6 space-y-3'>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className='flex items-center gap-4'>
                <Skeleton className='h-10 w-10 rounded-full' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-1/4' />
                  <Skeleton className='h-3 w-1/3' />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className='p-12 text-center'>
            <AlertTriangle className='h-8 w-8 text-red-400 mx-auto mb-2' />
            <p className='text-red-600 font-medium'>Failed to load users</p>
          </div>
        ) : users.length === 0 ? (
          <div className='p-16 text-center'>
            <Users className='h-10 w-10 text-neutral-300 mx-auto mb-3' />
            <p className='text-neutral-500'>No users found.</p>
          </div>
        ) : (
          <table className='w-full text-sm'>
            <thead className='bg-neutral-50 border-b border-neutral-200'>
              <tr>
                <th className='px-4 py-3 text-left font-semibold text-neutral-700'>
                  User
                </th>
                <th className='px-4 py-3 text-left font-semibold text-neutral-700 hidden sm:table-cell'>
                  Email
                </th>
                <th className='px-4 py-3 text-left font-semibold text-neutral-700 hidden md:table-cell'>
                  Joined
                </th>
                <th className='px-4 py-3 text-left font-semibold text-neutral-700'>
                  Role
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-neutral-100'>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className='hover:bg-neutral-50 transition-colors'
                >
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-3'>
                      <Avatar className='h-9 w-9 border border-neutral-200'>
                        <AvatarFallback className='bg-primary-50 text-primary-700 font-semibold text-sm'>
                          {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </AvatarFallback>
                      </Avatar>
                      <p className='font-medium text-neutral-900'>
                        {user.name}
                      </p>
                    </div>
                  </td>
                  <td className='px-4 py-3 text-neutral-500 hidden sm:table-cell'>
                    {user.email}
                  </td>
                  <td className='px-4 py-3 text-neutral-500 hidden md:table-cell'>
                    {user.createdAt
                      ? format(new Date(user.createdAt), 'MMM d, yyyy')
                      : '—'}
                  </td>
                  <td className='px-4 py-3'>
                    {user.role === 'ADMIN' ? (
                      <Badge className='bg-primary-100 text-primary-700 border-none'>
                        Admin
                      </Badge>
                    ) : (
                      <Badge className='bg-neutral-100 text-neutral-600 border-none'>
                        Member
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className='mt-4 flex items-center justify-end gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className='text-sm text-neutral-500'>
            Page {page} of {totalPages}
          </span>
          <Button
            variant='outline'
            size='sm'
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
