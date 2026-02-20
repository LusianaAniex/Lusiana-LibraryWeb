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
import type { Loan } from '@/types';

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
            <Avatar className='h-16 w-16 border-2 border-neutral-200 shadow-sm'>
              <AvatarImage src={previewPhoto ?? undefined} />
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
  const { data: loans = [], isLoading } = useMyLoans({ status: 'all' });
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
      <Badge className='bg-emerald-100 text-emerald-700 hover:bg-emerald-100'>
        Active
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className='space-y-3'>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className='h-24 w-full rounded-xl' />
        ))}
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className='flex flex-col items-center gap-3 py-20 text-neutral-400'>
        <Clock className='h-10 w-10' />
        <p className='text-sm font-medium'>No borrowed books yet</p>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {loans.map((loan) => (
        <div
          key={loan.id}
          className='flex items-start gap-4 bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-sm transition-shadow'
        >
          {loan.book?.coverImage ? (
            <img
              src={loan.book.coverImage}
              alt={loan.book.title}
              className='h-20 w-14 object-cover rounded-lg shrink-0 shadow-sm'
            />
          ) : (
            <div className='h-20 w-14 rounded-lg bg-neutral-100 shrink-0 flex items-center justify-center text-neutral-400 text-xs font-medium'>
              No cover
            </div>
          )}
          <div className='flex-1 min-w-0'>
            <p className='font-semibold text-neutral-900 truncate'>
              {loan.book?.title ?? 'Unknown book'}
            </p>
            <p className='text-xs text-neutral-500 mt-0.5'>
              {loan.book?.author?.name}
            </p>
            <div className='flex items-center gap-3 mt-2 text-xs text-neutral-500'>
              <span className='flex items-center gap-1'>
                <Calendar className='h-3 w-3' />
                {format(new Date(loan.borrowedAt), 'dd MMM yyyy')}
              </span>
              <span className='flex items-center gap-1'>
                <Clock className='h-3 w-3' />
                Due {format(new Date(loan.dueAt), 'dd MMM yyyy')}
              </span>
            </div>
            <div className='flex items-center justify-between mt-2'>
              {getStatusBadge(loan)}
              {loan.status === 'BORROWED' && (
                <Button
                  size='sm'
                  variant='outline'
                  className='h-7 text-xs'
                  disabled={returnBook.isPending}
                  onClick={() => returnBook.mutate(loan.id)}
                >
                  Return
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
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
