import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMyLoans, useReturnBook } from '@/hooks/useMyLoans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import type { Loan } from '@/types';

export default function MyLoansPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get('status') || 'all';
  const [searchQuery, setSearchQuery] = useState('');

  const { data: loans = [], isLoading } = useMyLoans({
    status: currentStatus as any,
    q: searchQuery,
  });

  const returnBook = useReturnBook();

  const handleStatusChange = (val: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('status', val);
      return newParams;
    });
  };

  const getStatusBadge = (loan: Loan) => {
    const isOverdue =
      new Date(loan.dueAt) < new Date() && loan.status === 'BORROWED';

    if (loan.status === 'RETURNED') {
      return (
        <Badge
          variant='secondary'
          className='bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        >
          Returned
        </Badge>
      );
    }
    if (loan.status === 'LATE' || isOverdue) {
      return (
        <Badge
          variant='destructive'
          className='bg-red-100 text-red-700 hover:bg-red-200 border-red-200'
        >
          Overdue
        </Badge>
      );
    }
    return (
      <Badge className='bg-green-100 text-green-700 hover:bg-green-200 border-green-200'>
        Active
      </Badge>
    );
  };

  return (
    <div className='bg-neutral-50 min-h-screen pb-16'>
      <div className='bg-white border-b border-neutral-200 sticky top-16 z-10'>
        <div className='container mx-auto px-4 py-4 max-w-5xl'>
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
            <h1 className='text-2xl font-bold text-neutral-900'>My Loans</h1>

            <div className='relative w-full md:w-64'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 h-4 w-4' />
              <Input
                placeholder='Search borrowed books...'
                className='pl-9 bg-neutral-50 border-neutral-200'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className='mt-6'>
            <Tabs
              value={currentStatus}
              onValueChange={handleStatusChange}
              className='w-full'
            >
              <TabsList className='bg-transparent p-0 h-auto gap-4 border-b border-white w-full justify-start overflow-x-auto'>
                <TabsTrigger
                  value='all'
                  className='rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:shadow-none px-4 py-2'
                >
                  All Loans
                </TabsTrigger>
                <TabsTrigger
                  value='active'
                  className='rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:shadow-none px-4 py-2'
                >
                  Active
                </TabsTrigger>
                <TabsTrigger
                  value='returned'
                  className='rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:shadow-none px-4 py-2'
                >
                  Returned
                </TabsTrigger>
                <TabsTrigger
                  value='overdue'
                  className='rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:shadow-none px-4 py-2'
                >
                  Overdue
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-8 max-w-5xl'>
        {isLoading ? (
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className='bg-white p-4 rounded-xl border border-neutral-200 flex gap-4'
              >
                <Skeleton className='h-24 w-16 rounded-md' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-5 w-1/3' />
                  <Skeleton className='h-4 w-1/4' />
                </div>
              </div>
            ))}
          </div>
        ) : loans.length === 0 ? (
          <div className='text-center py-16 bg-white rounded-xl border border-neutral-200'>
            <div className='mx-auto h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 mb-3'>
              <Clock className='h-6 w-6' />
            </div>
            <h3 className='text-lg font-medium text-neutral-900'>
              No loans found
            </h3>
            <p className='text-neutral-500 mt-1'>
              You haven't borrowed any books matching this filter.
            </p>
            {currentStatus !== 'all' && (
              <Button
                variant='link'
                onClick={() => handleStatusChange('all')}
                className='mt-2 text-primary-600'
              >
                View all loans
              </Button>
            )}
          </div>
        ) : (
          <div className='grid gap-4'>
            {loans.map((loan) => (
              <div
                key={loan.id}
                className='bg-white p-4 sm:p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row gap-5 transition-shadow hover:shadow-md'
              >
                {/* Cover */}
                <div className='shrink-0'>
                  <div className='h-32 w-24 bg-neutral-100 rounded-md overflow-hidden shadow-inner border border-neutral-100'>
                    {loan.book?.coverImage ? (
                      <img
                        src={loan.book.coverImage}
                        alt={loan.book.title}
                        className='h-full w-full object-cover'
                      />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center text-neutral-300'>
                        <Clock className='h-8 w-8' />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className='flex-1 flex flex-col'>
                  <div className='flex justify-between items-start mb-2'>
                    <div>
                      <h3 className='font-semibold text-lg text-neutral-900 line-clamp-1'>
                        {loan.book?.title}
                      </h3>
                      <p className='text-sm text-neutral-500'>
                        {loan.book?.author?.name}
                      </p>
                    </div>
                    {getStatusBadge(loan)}
                  </div>

                  <div className='grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-neutral-600 mt-2 mb-4'>
                    <div className='flex items-center gap-2'>
                      <Calendar className='h-4 w-4 text-neutral-400' />
                      <span>
                        Borrowed:{' '}
                        <span className='font-medium text-neutral-900'>
                          {format(new Date(loan.borrowedAt), 'MMM d, yyyy')}
                        </span>
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <AlertCircle className='h-4 w-4 text-neutral-400' />
                      <span>
                        Due:{' '}
                        <span
                          className={`font-medium ${new Date(loan.dueAt) < new Date() && loan.status !== 'RETURNED' ? 'text-red-600' : 'text-neutral-900'}`}
                        >
                          {format(new Date(loan.dueAt), 'MMM d, yyyy')}
                        </span>
                      </span>
                    </div>
                    {loan.returnedAt && (
                      <div className='flex items-center gap-2 col-span-2 text-green-700 bg-green-50 px-2 py-1 rounded w-fit'>
                        <CheckCircle className='h-3.5 w-3.5' />
                        <span className='text-xs font-medium'>
                          Returned on{' '}
                          {format(new Date(loan.returnedAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className='mt-auto flex justify-end'>
                    {loan.status !== 'RETURNED' && (
                      <Button
                        size='sm'
                        onClick={() => returnBook.mutate(loan.id)}
                        disabled={returnBook.isPending}
                        className='bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 shadow-sm'
                      >
                        {returnBook.isPending ? 'Processing...' : 'Return Book'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
