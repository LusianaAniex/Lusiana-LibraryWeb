import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import type { RootState } from '@/store/store';
import { api } from '@/lib/axios';
import { useMyReviews } from '@/hooks/useProfile';
import { useMyLoans, useReturnBook } from '@/hooks/useMyLoans';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Clock, Calendar } from 'lucide-react';
import StarRating from '@/components/books/StarRating';
import type { Loan } from '@/types';

export default function ProfilePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const handleTabChange = (val: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', val);
      return newParams;
    });
  };

  // Fetch live profile from /api/me so the page works even after a hard refresh
  // where Redux state is restored from localStorage but the user object might be stale.
  const { data: liveUser, isLoading: profileLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/api/me');
      return data?.data ?? null;
    },
    // Use the stored Redux user as placeholder while fetching
    placeholderData: user,
  });

  const displayUser = liveUser ?? user;

  if (profileLoading && !displayUser) {
    return (
      <div className='bg-white min-h-screen pb-16 pt-8'>
        <div className='container mx-auto px-4 max-w-5xl space-y-6'>
          <Skeleton className='h-40 w-full rounded-2xl' />
          <Skeleton className='h-10 w-64 mx-auto rounded-full' />
          <Skeleton className='h-64 w-full rounded-2xl' />
        </div>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className='flex min-h-screen items-center justify-center flex-col gap-3 text-neutral-500'>
        <p className='text-lg font-medium'>Unable to load profile.</p>
        <p className='text-sm'>Please log out and log in again.</p>
      </div>
    );
  }

  return (
    <div className='bg-white min-h-screen pb-16 pt-8'>
      <div className='container mx-auto px-4 max-w-5xl'>
        {/* Tabs - Centered/Pill style as per screenshot suggestion */}
        <div className='flex justify-center mb-8'>
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className='w-full max-w-3xl'
          >
            <TabsList className='bg-neutral-100 p-1 rounded-xl w-full grid grid-cols-3 h-auto'>
              <TabsTrigger
                value='profile'
                className='rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm'
              >
                Profile
              </TabsTrigger>
              <TabsTrigger
                value='borrowed'
                className='rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm'
              >
                Borrowed List
              </TabsTrigger>
              <TabsTrigger
                value='reviews'
                className='rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm'
              >
                Reviews
              </TabsTrigger>
            </TabsList>

            <div className='mt-8'>
              <TabsContent value='profile' className='focus:outline-none'>
                <ProfileTabContent user={displayUser} />
              </TabsContent>

              <TabsContent value='borrowed' className='focus:outline-none'>
                <BorrowedListTabContent />
              </TabsContent>

              <TabsContent value='reviews' className='focus:outline-none'>
                <ReviewsTabContent />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTabContent({ user }: { user: any }) {
  return (
    <div className='max-w-3xl mx-auto'>
      <h2 className='text-2xl font-bold text-neutral-900 mb-6'>Profile</h2>

      <div className='bg-white rounded-2xl border border-neutral-200 shadow-sm p-8'>
        <div className='flex flex-col gap-8'>
          {/* User Info Rows */}

          {/* Avatar Row */}
          <div className='flex flex-col md:flex-row gap-6 items-start'>
            <div className='shrink-0'>
              <Avatar className='h-24 w-24 border-4 border-white shadow-md'>
                <AvatarImage src={user.profilePhoto} />
                <AvatarFallback className='bg-neutral-900 text-white text-2xl'>
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className='space-y-6 max-w-2xl'>
            {/* Name */}
            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-neutral-50 last:border-0'>
              <span className='text-neutral-500 font-medium'>Name</span>
              <span className='text-neutral-900 font-semibold text-right'>
                {user.name}
              </span>
            </div>

            {/* Email */}
            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-neutral-50 last:border-0'>
              <span className='text-neutral-500 font-medium'>Email</span>
              <span className='text-neutral-900 font-semibold text-right'>
                {user.email}
              </span>
            </div>

            {/* Phone (Mocked if missing) */}
            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center py-2'>
              <span className='text-neutral-500 font-medium'>Phone Number</span>
              <span className='text-neutral-900 font-semibold text-right'>
                {user.phone || '081234567890'}
              </span>
            </div>
          </div>

          {/* Update Button */}
          <div className='pt-4'>
            <Button className='w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl text-base font-semibold shadow-sm shadow-blue-200'>
              Update Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Borrowed List Tab ───────────────────────────────────────────────────────

function BorrowedListTabContent() {
  const { data: loans = [], isLoading } = useMyLoans({ status: 'all' }); // Fetch all for this view
  const returnBook = useReturnBook();

  const getStatusBadge = (loan: Loan) => {
    const isOverdue =
      new Date(loan.dueAt) < new Date() && loan.status === 'BORROWED';
    if (loan.status === 'RETURNED')
      return (
        <Badge variant='secondary' className='bg-neutral-100 text-neutral-600'>
          Returned
        </Badge>
      );
    if (loan.status === 'LATE' || isOverdue)
      return (
        <Badge
          variant='destructive'
          className='bg-red-100 text-red-700 hover:bg-red-100'
        >
          Overdue
        </Badge>
      );
    return (
      <Badge className='bg-green-100 text-green-700 hover:bg-green-100'>
        Active
      </Badge>
    );
  };

  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      {/* Filter/Search could go here if needed, keeping it simple for now */}

      {isLoading ? (
        <div className='space-y-4'>
          {[1, 2].map((i) => (
            <Skeleton key={i} className='h-32 w-full rounded-xl' />
          ))}
        </div>
      ) : loans.length === 0 ? (
        <div className='text-center py-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-300'>
          <p className='text-neutral-500'>No borrowed books found.</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {loans.map((loan) => (
            <div
              key={loan.id}
              className='bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex gap-4'
            >
              <div className='h-28 w-20 bg-neutral-100 rounded-lg overflow-hidden shrink-0 border border-neutral-100'>
                {loan.book?.coverImage ? (
                  <img
                    src={loan.book.coverImage}
                    className='h-full w-full object-cover'
                  />
                ) : (
                  <div className='h-full flex items-center justify-center'>
                    <Clock className='text-neutral-300' />
                  </div>
                )}
              </div>

              <div className='flex-1 flex flex-col justify-between'>
                <div>
                  <div className='flex justify-between items-start'>
                    <h3 className='font-semibold text-neutral-900'>
                      {loan.book?.title}
                    </h3>
                    {getStatusBadge(loan)}
                  </div>
                  <p className='text-sm text-neutral-500'>
                    {loan.book?.author?.name}
                  </p>
                </div>

                <div className='flex items-center gap-4 text-xs text-neutral-500 mt-2'>
                  <div className='flex items-center gap-1'>
                    <Calendar className='h-3.5 w-3.5' />
                    <span>
                      Due: {format(new Date(loan.dueAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>

                <div className='flex justify-end mt-2'>
                  {loan.status !== 'RETURNED' && (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => returnBook.mutate(loan.id)}
                      disabled={returnBook.isPending}
                      className='h-8 text-xs'
                    >
                      Return Book
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Reviews Tab ─────────────────────────────────────────────────────────────

function ReviewsTabContent() {
  const { data: reviews, isLoading } = useMyReviews();

  return (
    <div className='max-w-3xl mx-auto space-y-4'>
      {isLoading ? (
        <p className='text-neutral-500 text-center'>Loading reviews...</p>
      ) : reviews && reviews.length > 0 ? (
        reviews.map((review) => (
          <div
            key={review.id}
            className='bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex gap-4'
          >
            <div className='h-20 w-14 bg-neutral-100 rounded overflow-hidden shrink-0'>
              {review.book?.coverImage && (
                <img
                  src={review.book.coverImage}
                  className='h-full w-full object-cover'
                />
              )}
            </div>
            <div className='flex-1'>
              <h4 className='font-medium text-neutral-900'>
                {review.book?.title}
              </h4>
              <div className='flex items-center gap-2 mb-2 mt-1'>
                <StarRating rating={review.star} readonly size={14} />
                <span className='text-xs text-neutral-400'>
                  {format(new Date(review.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
              <p className='text-neutral-600 text-sm leading-relaxed'>
                {review.comment}
              </p>
            </div>
          </div>
        ))
      ) : (
        <div className='text-center py-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-300'>
          <p className='text-neutral-500'>
            You haven't written any reviews yet.
          </p>
        </div>
      )}
    </div>
  );
}
