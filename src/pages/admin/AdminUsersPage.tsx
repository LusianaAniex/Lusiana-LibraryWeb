import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
  const limit = 10;

  const { data, isLoading, isError } = useAdminUsers({
    q: search || undefined,
    page,
  });
  const users = data?.users ?? [];
  const totalPages = data?.totalPages ?? 1;

  // Since the backend paginates but doesn't explicitly return totalItems,
  // we do our best estimation for the display string.
  const startEntry = users.length === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = startEntry + users.length - 1;

  // Pagination helper
  const renderPaginationRange = () => {
    const range = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        range.push(i);
      } else if (range[range.length - 1] !== '...') {
        range.push('...');
      }
    }
    return range;
  };

  return (
    <div className='max-w-6xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-xl sm:text-2xl font-bold text-neutral-900'>User</h1>
      </div>

      <div className='bg-white rounded-xl border border-neutral-200 shadow-sm p-4 sm:p-6'>
        {/* Search */}
        <div className='mb-6 relative w-full max-w-sm'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400' />
          <Input
            placeholder='Search user'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className='pl-9 rounded-full bg-neutral-50 border-neutral-200'
          />
        </div>

        {/* Content states */}
        {isLoading ? (
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className='h-12 w-full rounded-md' />
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
          <>
            {/* Desktop Table View */}
            <div className='hidden md:block overflow-x-auto'>
              <table className='w-full text-sm text-left whitespace-nowrap'>
                <thead>
                  <tr className='border-b border-neutral-200 text-neutral-900'>
                    <th className='py-4 font-semibold w-16 px-2'>No</th>
                    <th className='py-4 font-semibold px-4'>Name</th>
                    <th className='py-4 font-semibold px-4'>Nomor Handphone</th>
                    <th className='py-4 font-semibold px-4'>Email</th>
                    <th className='py-4 font-semibold px-4'>Created at</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-neutral-100'>
                  {users.map((user, idx) => (
                    <tr key={user.id} className='hover:bg-neutral-50'>
                      <td className='py-4 px-2 text-neutral-600 font-medium'>
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className='py-4 px-4 text-neutral-900'>
                        {user.name}
                      </td>
                      <td className='py-4 px-4 text-neutral-900'>
                        {user.phone || '-'}
                      </td>
                      <td className='py-4 px-4 text-neutral-900'>
                        {user.email}
                      </td>
                      <td className='py-4 px-4 text-neutral-900'>
                        {user.createdAt
                          ? format(
                              new Date(user.createdAt),
                              'dd MMM yyyy, HH:mm'
                            )
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className='md:hidden space-y-4'>
              {users.map((user, idx) => (
                <div
                  key={user.id}
                  className='p-4 border border-neutral-200 rounded-lg text-sm space-y-3'
                >
                  <div className='flex justify-between items-center'>
                    <span className='font-medium text-neutral-600'>No</span>
                    <span className='font-semibold text-neutral-900 text-right'>
                      {(page - 1) * limit + idx + 1}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='font-medium text-neutral-600'>Name</span>
                    <span className='text-neutral-900 text-right'>
                      {user.name}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='font-medium text-neutral-600'>Email</span>
                    <span className='text-neutral-900 text-right'>
                      {user.email}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='font-medium text-neutral-600'>
                      Nomor Handphone
                    </span>
                    <span className='text-neutral-900 text-right'>
                      {user.phone || '-'}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='font-medium text-neutral-600'>
                      Created at
                    </span>
                    <span className='text-neutral-900 text-right'>
                      {user.createdAt
                        ? format(new Date(user.createdAt), 'dd MMM yyyy, HH:mm')
                        : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination & Summary */}
            <div className='mt-8 pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm'>
              <div className='text-neutral-500'>
                {/* Because we don't have exactly total items, we approximate if needed, but we output standard. */}
                Showing {startEntry} to {endEntry}
              </div>

              <div className='flex items-center gap-1'>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className='px-2 py-1 flex items-center gap-1 hover:text-neutral-900 disabled:opacity-50 disabled:hover:text-neutral-500 text-neutral-500 transition-colors'
                >
                  <span className='mr-1'>&lt;</span> Previous
                </button>

                <div className='flex items-center gap-1 mx-2'>
                  {renderPaginationRange().map((p, i) =>
                    p === '...' ? (
                      <span key={`dots-${i}`} className='px-2 text-neutral-400'>
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`min-w-[28px] h-7 rounded flex items-center justify-center transition-colors ${
                          page === p
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'hover:bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className='px-2 py-1 flex items-center gap-1 hover:text-neutral-900 disabled:opacity-50 disabled:hover:text-neutral-500 text-neutral-500 transition-colors'
                >
                  Next <span className='ml-1'>&gt;</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
