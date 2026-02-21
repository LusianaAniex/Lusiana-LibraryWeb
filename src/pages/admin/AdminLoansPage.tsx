import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import {
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  BookOpen,
} from 'lucide-react';
import type { Loan } from '@/types';

const STATUS_OPTIONS = ['all', 'active', 'returned', 'overdue'];

function useAdminLoans(params: { status?: string; q?: string; page?: number }) {
  return useQuery<{ loans: Loan[]; totalPages: number }>({
    queryKey: ['admin-loans', params],
    queryFn: async () => {
      const p: Record<string, string> = {
        page: String(params.page ?? 1),
        limit: '15',
      };
      if (params.status && params.status !== 'all') p.status = params.status;
      if (params.q) p.q = params.q;
      const { data } = await api.get('/api/admin/loans', { params: p });
      const payload = data?.data;
      if (Array.isArray(payload)) return { loans: payload, totalPages: 1 };
      return {
        loans: Array.isArray(payload?.loans)
          ? payload.loans
          : Array.isArray(payload?.data)
            ? payload.data
            : [],
        totalPages: payload?.pagination?.totalPages ?? 1,
      };
    },
  });
}

function useReturnLoanAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (loanId: number) =>
      api.patch(`/api/admin/loans/${loanId}`, { status: 'RETURNED' }),
    onSuccess: () => {
      toast.success('Loan marked as returned');
      qc.invalidateQueries({ queryKey: ['admin-loans'] });
    },
    onError: (e: Error) => {
      const axiosError = e as import('axios').AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Failed');
    },
  });
}

function statusBadge(loan: Loan) {
  if (loan.status === 'RETURNED')
    return (
      <Badge className='bg-neutral-100 text-neutral-600 border-none'>
        Returned
      </Badge>
    );
  if (loan.status === 'LATE')
    return (
      <Badge className='bg-red-100 text-red-700 border-none'>Overdue</Badge>
    );
  const overdue = new Date(loan.dueAt) < new Date();
  if (overdue)
    return (
      <Badge className='bg-orange-100 text-orange-700 border-none'>
        Overdue
      </Badge>
    );
  return (
    <Badge className='bg-green-100 text-green-700 border-none'>Active</Badge>
  );
}

export default function AdminLoansPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const statusFilter = searchParams.get('status') ?? 'all';
  const page = Number(searchParams.get('page') ?? 1);

  const { data, isLoading, isError } = useAdminLoans({
    status: statusFilter === 'all' ? undefined : statusFilter,
    q: search || undefined,
    page,
  });

  const returnLoan = useReturnLoanAdmin();
  const loans = data?.loans ?? [];
  const totalPages = data?.totalPages ?? 1;

  const setStatus = (s: string) =>
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('status', s);
      p.set('page', '1');
      return p;
    });
  const setPage = (n: number) =>
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('page', String(n));
      return p;
    });

  return (
    <div className='max-w-6xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-neutral-900'>Loan Management</h1>
        <p className='text-neutral-500 mt-1'>
          View and manage all library loans
        </p>
      </div>

      {/* Toolbar */}
      <div className='mb-4 flex flex-col sm:flex-row gap-3'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400' />
          <Input
            placeholder='Search by book or user…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>
        <div className='flex gap-2 flex-wrap'>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className='rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden'>
        {isLoading ? (
          <div className='p-6 space-y-3'>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className='h-14 w-full rounded-lg' />
            ))}
          </div>
        ) : isError ? (
          <div className='p-12 text-center'>
            <AlertTriangle className='h-8 w-8 text-red-400 mx-auto mb-2' />
            <p className='text-red-600 font-medium'>Failed to load loans</p>
          </div>
        ) : loans.length === 0 ? (
          <div className='p-16 text-center'>
            <Clock className='h-10 w-10 text-neutral-300 mx-auto mb-3' />
            <p className='text-neutral-500'>No loans found for this filter.</p>
          </div>
        ) : (
          <table className='w-full text-sm'>
            <thead className='bg-neutral-50 border-b border-neutral-200'>
              <tr>
                <th className='px-2 sm:px-4 py-3 text-left font-semibold text-neutral-700'>
                  Book
                </th>
                <th className='px-2 sm:px-4 py-3 text-left font-semibold text-neutral-700 hidden sm:table-cell'>
                  Borrower
                </th>
                <th className='px-2 sm:px-4 py-3 text-left font-semibold text-neutral-700 hidden md:table-cell'>
                  Borrowed
                </th>
                <th className='px-2 sm:px-4 py-3 text-left font-semibold text-neutral-700'>
                  Due
                </th>
                <th className='px-2 sm:px-4 py-3 text-left font-semibold text-neutral-700'>
                  Status
                </th>
                <th className='px-2 sm:px-4 py-3 text-right font-semibold text-neutral-700'>
                  Action
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-neutral-100'>
              {loans.map((loan) => (
                <tr
                  key={loan.id}
                  className='hover:bg-neutral-50 transition-colors'
                >
                  <td className='px-2 sm:px-4 py-3 min-w-0'>
                    <div className='flex items-center gap-2 sm:gap-3'>
                      <div className='hidden xs:block h-12 w-9 shrink-0 rounded overflow-hidden bg-neutral-100 border border-neutral-200'>
                        {loan.book?.coverImage ? (
                          <img
                            src={loan.book.coverImage}
                            alt=''
                            className='h-full w-full object-cover'
                          />
                        ) : (
                          <div className='h-full flex items-center justify-center'>
                            <BookOpen className='h-4 w-4 text-neutral-300' />
                          </div>
                        )}
                      </div>
                      <div className='min-w-0 wrap-break-word'>
                        <p className='font-medium text-neutral-900 line-clamp-2 md:line-clamp-1 wrap-break-word'>
                          {loan.book?.title ?? `Loan #${loan.id}`}
                        </p>
                        <p className='text-[10px] sm:text-xs text-neutral-500 line-clamp-1'>
                          {loan.book?.author?.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className='px-2 sm:px-4 py-3 text-neutral-600 hidden sm:table-cell min-w-[100px]'>
                    {loan.borrower?.name ?? `User #${loan.userId}`}
                  </td>
                  <td className='px-2 sm:px-4 py-3 text-neutral-500 hidden md:table-cell whitespace-nowrap'>
                    {format(new Date(loan.borrowedAt), 'MMM d, yyyy')}
                  </td>
                  <td
                    className={`px-2 sm:px-4 py-3 font-medium whitespace-nowrap ${new Date(loan.dueAt) < new Date() && loan.status !== 'RETURNED' ? 'text-red-600' : 'text-neutral-700'}`}
                  >
                    {format(new Date(loan.dueAt), 'MMM d, yyyy')}
                  </td>
                  <td className='px-2 sm:px-4 py-3'>
                    <div className='scale-[0.85] origin-left sm:scale-100 sm:origin-center'>
                      {statusBadge(loan)}
                    </div>
                  </td>
                  <td className='px-2 sm:px-4 py-3 text-right'>
                    {loan.status !== 'RETURNED' && (
                      <Button
                        size='sm'
                        variant='outline'
                        className='h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3 gap-1 whitespace-nowrap'
                        disabled={returnLoan.isPending}
                        onClick={() => returnLoan.mutate(loan.id)}
                      >
                        <CheckCircle className='h-3 w-3 shrink-0' />
                        <span className='hidden xs:inline'>Return</span>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='mt-4 flex items-center justify-end gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
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
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
