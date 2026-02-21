import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import type { RootState } from '@/store/store';
import { setCredentials } from '@/store/authSlice';
import { api } from '@/lib/axios';
import { useMyReviews, useUpdateProfile } from '@/hooks/useProfile';
import { useMyLoans, useReturnBook } from '@/hooks/useMyLoans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Camera, Clock, Calendar, Loader2 } from 'lucide-react';
import StarRating from '@/components/books/StarRating';
import { GiveReviewModal } from '@/components/books/GiveReviewModal';
import { Search } from 'lucide-react';
import type { Loan, Book } from '@/types';

// ── Fetch current user from /api/me (with Redux user as stable placeholder) ──
function useMe() {
  const { user: reduxUser, token } = useSelector(
    (state: RootState) => state.auth
  );

  // Best-effort placeholder: Redux user OR whatever was saved to localStorage
  const placeholder =
    reduxUser ??
    (() => {
      try {
        const raw = localStorage.getItem('user');
        if (!raw || raw === 'null' || raw === 'undefined') return null;
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })();

  return useQuery({
    queryKey: ['me'],
    staleTime: 0, // always re-fetch on mount
    queryFn: async () => {
      const { data } = await api.get('/api/me');
      // Confirmed shape: { success, message, data: { profile: {...user}, loanStats: {...}, reviewsCount } }
      return data?.data?.profile ?? null;
    },
    placeholderData: placeholder,
    enabled: !!token,
  });
}

// ── Canvas image compression (for avatar) ────────────────────────────────────
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 256;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        const ratio = Math.min(MAX / width, MAX / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const handleTabChange = (val: string) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', val);
      return p;
    });
  };

  const { data: liveUser, isLoading } = useMe();

  if (isLoading && !liveUser) {
    return (
      <div className='bg-white min-h-screen pb-16 pt-8'>
        <div className='container mx-auto px-4 max-w-3xl space-y-4'>
          <Skeleton className='h-10 w-64 mx-auto rounded-full' />
          <Skeleton className='h-56 w-full rounded-xl' />
        </div>
      </div>
    );
  }

  if (!liveUser) {
    return (
      <div className='flex min-h-screen items-center justify-center flex-col gap-3 text-neutral-500'>
        <p className='text-lg font-medium'>Unable to load profile.</p>
        <p className='text-sm'>Please log out and log in again.</p>
      </div>
    );
  }

  return (
    <div className='bg-white min-h-screen pb-16 pt-8'>
      <div className='container mx-auto px-4 max-w-3xl'>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className='w-full'
        >
          <TabsList className='bg-neutral-100 p-1 rounded-xl w-full grid grid-cols-3 h-auto mb-8'>
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

          <TabsContent value='profile' className='focus:outline-none'>
            <ProfileTabContent user={liveUser} />
          </TabsContent>
          <TabsContent value='borrowed' className='focus:outline-none'>
            <BorrowedListTabContent />
          </TabsContent>
          <TabsContent value='reviews' className='focus:outline-none'>
            <ReviewsTabContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTabContent({ user }: { user: any }) {
  const dispatch = useDispatch();
  const updateProfile = useUpdateProfile();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState(''); // compressed base64 preview
  const [compressing, setCompressing] = useState(false);

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? '?';

  const startEdit = () => {
    setName(user?.name ?? '');
    setPhone(user?.phone ?? '');
    setAvatar('');
    setEditing(true);
  };

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      setAvatar(compressed);
    } finally {
      setCompressing(false);
      e.target.value = '';
    }
  };

  const handleSave = () => {
    const body: Record<string, any> = {};
    if (name.trim() && name.trim() !== user?.name) body.name = name.trim();
    if (phone.trim() !== (user?.phone ?? '')) body.phone = phone.trim();
    if (avatar) body.profilePhoto = avatar;

    if (Object.keys(body).length === 0) {
      setEditing(false);
      return;
    }

    updateProfile.mutate(body as any, {
      onSuccess: (response) => {
        // Update Redux + localStorage so Navbar reflects new name/avatar
        const updated = response.data?.data?.user ?? response.data?.data ?? {};
        if (updated?.id) {
          const token = localStorage.getItem('token') ?? '';
          dispatch(setCredentials({ user: updated, token }));
        }
        setEditing(false);
      },
    });
  };

  const previewPhoto = avatar || user?.profilePhoto;

  return (
    <div className='max-w-2xl'>
      <h2 className='text-xl font-bold text-neutral-900 mb-5'>Profile</h2>

      <div className='border border-neutral-200 rounded-xl overflow-hidden'>
        {/* Avatar section */}
        <div className='px-6 pt-6 pb-4 border-b border-neutral-100'>
          <div className='relative w-fit'>
            <Avatar className='h-16 w-16 border-2 border-neutral-200 shadow-sm overflow-hidden'>
              <AvatarImage
                src={previewPhoto ?? undefined}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <AvatarFallback className='bg-neutral-800 text-white text-xl font-bold'>
                {initial}
              </AvatarFallback>
            </Avatar>
            {editing && (
              <>
                <button
                  type='button'
                  onClick={() => fileRef.current?.click()}
                  className='absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow hover:bg-blue-700 transition'
                  title='Change avatar'
                >
                  {compressing ? (
                    <Loader2 className='h-3 w-3 animate-spin' />
                  ) : (
                    <Camera className='h-3 w-3' />
                  )}
                </button>
                <input
                  ref={fileRef}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={handleAvatarPick}
                />
              </>
            )}
          </div>
        </div>

        {/* Info / Edit rows */}
        {editing ? (
          <div className='px-6 py-4 space-y-4'>
            <div className='space-y-1'>
              <Label htmlFor='edit-name'>Name</Label>
              <Input
                id='edit-name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Your name'
              />
            </div>
            <div className='space-y-1'>
              <Label htmlFor='edit-phone'>Phone Number</Label>
              <Input
                id='edit-phone'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder='e.g. 081234567890'
              />
            </div>
            {/* Email is read-only */}
            <div className='space-y-1'>
              <Label className='text-neutral-400'>Email (read-only)</Label>
              <Input
                value={user?.email ?? ''}
                disabled
                className='bg-neutral-50'
              />
            </div>
          </div>
        ) : (
          <div className='divide-y divide-neutral-100'>
            <div className='flex items-center justify-between px-6 py-3'>
              <span className='text-sm text-neutral-500'>Name</span>
              <span className='text-sm font-semibold text-neutral-900'>
                {user?.name ?? '—'}
              </span>
            </div>
            <div className='flex items-center justify-between px-6 py-3'>
              <span className='text-sm text-neutral-500'>Email</span>
              <span className='text-sm font-semibold text-neutral-900'>
                {user?.email ?? '—'}
              </span>
            </div>
            <div className='flex items-center justify-between px-6 py-3'>
              <span className='text-sm text-neutral-500'>Phone Number</span>
              <span className='text-sm font-semibold text-neutral-900'>
                {user?.phone ?? '—'}
              </span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className='px-6 py-5 flex gap-3'>
          {editing ? (
            <>
              <Button
                variant='outline'
                className='flex-1'
                onClick={() => setEditing(false)}
                disabled={updateProfile.isPending}
              >
                Cancel
              </Button>
              <Button
                className='flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-lg font-semibold text-sm'
                onClick={handleSave}
                disabled={updateProfile.isPending || compressing}
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Saving…
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </>
          ) : (
            <Button
              className='w-full bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-lg font-semibold text-sm'
              onClick={startEdit}
            >
              Update Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Borrowed List Tab ───────────────────────────────────────────────────────

function BorrowedListTabContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get('loanStatus') || 'all';
  const [searchQuery, setSearchQuery] = useState('');

  const { data: loans = [], isLoading } = useMyLoans({
    status: currentStatus as any,
    q: searchQuery,
  });

  const returnBook = useReturnBook();
  const [reviewBook, setReviewBook] = useState<Book | null>(null);

  const handleStatusChange = (val: string) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('loanStatus', val);
      return p;
    });
  };

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
      <Badge className='bg-emerald-100 text-emerald-700 hover:bg-emerald-100'>
        Active
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className='space-y-4 pt-4'>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className='bg-white p-4 rounded-xl border border-neutral-200 flex gap-4'
          >
            <Skeleton className='h-24 w-16 rounded-md shrink-0' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-5 w-1/3' />
              <Skeleton className='h-4 w-1/4' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className='flex flex-col items-center gap-3 py-20 bg-white border border-neutral-200 rounded-xl text-neutral-400'>
        <div className='mx-auto h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 mb-3'>
          <Clock className='h-6 w-6' />
        </div>
        <p className='text-sm font-medium'>
          No borrowed books found matching your filter
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <h2 className='text-xl font-bold text-neutral-900'>Borrowed List</h2>
        <div className='relative w-full sm:w-64'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 h-4 w-4' />
          <Input
            placeholder='Search book'
            className='pl-9 rounded-full h-10 border-neutral-200 focus-visible:ring-primary-600'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs
        value={currentStatus}
        onValueChange={handleStatusChange}
        className='w-full'
      >
        <TabsList className='bg-transparent p-0 h-auto gap-3 flex flex-wrap justify-start'>
          {['all', 'active', 'returned', 'overdue'].map((status) => (
            <TabsTrigger
              key={status}
              value={status}
              className='rounded-full border border-neutral-200 px-4 py-1.5 text-xs font-semibold capitalize data-[state=active]:bg-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 hover:bg-neutral-50 shadow-none data-[state=active]:shadow-none'
            >
              {status}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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
                    {loan.book?.title ?? 'Unknown book'}
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
                  <Clock className='h-4 w-4 text-neutral-400' />
                  <span>
                    Due:{' '}
                    <span
                      className={`font-medium ${new Date(loan.dueAt) < new Date() && loan.status !== 'RETURNED' ? 'text-red-600' : 'text-neutral-900'}`}
                    >
                      {format(new Date(loan.dueAt), 'MMM d, yyyy')}
                    </span>
                  </span>
                </div>
              </div>

              <div className='mt-auto flex justify-end gap-2'>
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
                {loan.book && (
                  <Button
                    size='sm'
                    variant='default'
                    className='h-9 px-4 text-sm bg-blue-600 text-white hover:bg-blue-700'
                    onClick={() => setReviewBook(loan.book!)}
                  >
                    Give Review
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {reviewBook && (
        <GiveReviewModal
          book={reviewBook}
          isOpen={!!reviewBook}
          onClose={() => setReviewBook(null)}
        />
      )}
    </div>
  );
}

// ─── Reviews Tab ─────────────────────────────────────────────────────────────

function ReviewsTabContent() {
  const { data: reviews = [], isLoading } = useMyReviews();

  if (isLoading) {
    return (
      <div className='space-y-3'>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className='h-28 w-full rounded-xl' />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className='flex flex-col items-center gap-3 py-20 text-neutral-400'>
        <p className='text-sm font-medium'>No reviews written yet</p>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {reviews.map((review) => (
        <div
          key={review.id}
          className='bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-sm transition-shadow'
        >
          <div className='flex items-start gap-3'>
            {review.book?.coverImage && (
              <img
                src={review.book.coverImage}
                alt={review.book.title}
                className='h-14 w-10 object-cover rounded shrink-0'
              />
            )}
            <div className='flex-1 min-w-0'>
              <p className='font-semibold text-neutral-900 text-sm truncate'>
                {review.book?.title ?? 'Unknown book'}
              </p>
              <StarRating rating={review.star} size={14} readonly />
              {review.comment && (
                <p className='text-sm text-neutral-600 mt-1 line-clamp-2'>
                  {review.comment}
                </p>
              )}
              <p className='text-xs text-neutral-400 mt-1.5'>
                {format(new Date(review.createdAt), 'dd MMM yyyy')}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
