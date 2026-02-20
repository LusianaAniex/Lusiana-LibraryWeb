import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { useBorrowFromCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { addDays, format } from 'date-fns';
import { BookOpen, Loader2 } from 'lucide-react';
import type { CartItem } from '@/types';

function useMyProfile() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/api/me');
      return data?.data?.profile ?? null;
    },
    staleTime: 60_000,
  });
}

type Duration = 3 | 5 | 10;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Items passed from CartPage via navigation state
  const passedItems: CartItem[] = (location.state as any)?.items ?? [];
  const passedItemIds: number[] = (location.state as any)?.itemIds ?? [];

  const { data: profile } = useMyProfile();
  const borrow = useBorrowFromCart();

  // ── Form state ─────────────────────────────────────────────────────────────
  const today = format(new Date(), 'yyyy-MM-dd');
  const [borrowDate, setBorrowDate] = useState(today);
  const [duration, setDuration] = useState<Duration>(3);
  const [agreeReturn, setAgreeReturn] = useState(false);
  const [agreePolicy, setAgreePolicy] = useState(false);

  const returnDate = useMemo(() => {
    try {
      if (!borrowDate) return addDays(new Date(), duration);
      // parse YYYY-MM-DD as local date instead of UTC
      const [year, month, day] = borrowDate.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      return addDays(localDate, duration);
    } catch {
      return addDays(new Date(), duration);
    }
  }, [borrowDate, duration]);

  const canSubmit = agreeReturn && agreePolicy && passedItemIds.length > 0;

  const handleConfirm = () => {
    borrow.mutate(
      { itemIds: passedItemIds, borrowDate, duration },
      { onSuccess: () => navigate('/my-loans') }
    );
  };

  if (passedItemIds.length === 0) {
    return (
      <div className='container mx-auto px-4 py-16 max-w-3xl text-center'>
        <BookOpen className='h-12 w-12 mx-auto mb-4 text-neutral-300' />
        <p className='text-neutral-500 mb-4'>No items selected for checkout.</p>
        <Button onClick={() => navigate('/cart')} variant='outline'>
          Go to Cart
        </Button>
      </div>
    );
  }

  return (
    <div className='bg-white min-h-screen'>
      <div className='container mx-auto px-4 py-8 max-w-4xl'>
        <h1 className='text-2xl font-bold text-neutral-900 mb-8'>Checkout</h1>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* ── Left Column ── */}
          <div className='space-y-6'>
            {/* User Information */}
            <section>
              <h2 className='text-base font-semibold text-neutral-900 mb-3'>
                User Information
              </h2>
              <div className='space-y-0 divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden'>
                <Row label='Name' value={profile?.name ?? '—'} />
                <Row label='Email' value={profile?.email ?? '—'} />
                <Row label='Nomor Handphone' value={profile?.phone ?? '—'} />
              </div>
            </section>

            {/* Book List */}
            <section>
              <h2 className='text-base font-semibold text-neutral-900 mb-3'>
                Book List
              </h2>
              <div className='space-y-3'>
                {passedItems.map((item) => (
                  <div key={item.id} className='flex items-center gap-3'>
                    {item.book?.coverImage ? (
                      <img
                        src={item.book.coverImage}
                        alt={item.book.title}
                        className='h-16 w-11 object-cover rounded-lg shadow-sm shrink-0'
                      />
                    ) : (
                      <div className='h-16 w-11 bg-neutral-100 rounded-lg shrink-0 flex items-center justify-center'>
                        <BookOpen className='h-4 w-4 text-neutral-400' />
                      </div>
                    )}
                    <div className='min-w-0'>
                      <p className='text-[11px] text-neutral-400'>
                        {item.book?.category?.name ?? 'Category'}
                      </p>
                      <p className='text-sm font-semibold text-neutral-900 truncate'>
                        {item.book?.title ?? 'Book Name'}
                      </p>
                      <p className='text-xs text-neutral-500'>
                        {item.book?.author?.name ?? 'Author name'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── Right Column — Borrow Form ── */}
          <div>
            <section className='border border-neutral-200 rounded-xl p-5 space-y-5'>
              <h2 className='text-base font-semibold text-neutral-900'>
                Complete Your Borrow Request
              </h2>

              {/* Borrow Date */}
              <div className='space-y-1.5'>
                <label className='text-sm font-medium text-neutral-700'>
                  Borrow Date
                </label>
                <input
                  type='date'
                  value={borrowDate}
                  min={today}
                  onChange={(e) => setBorrowDate(e.target.value)}
                  className='w-full h-10 rounded-lg border border-neutral-300 px-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              {/* Duration */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-neutral-700'>
                  Borrow Duration
                </label>
                <div className='space-y-2'>
                  {([3, 5, 10] as Duration[]).map((d) => (
                    <label
                      key={d}
                      className='flex items-center gap-2.5 cursor-pointer group'
                    >
                      <input
                        type='radio'
                        id={`duration-${d}`}
                        name='duration'
                        value={d.toString()}
                        checked={duration === d}
                        onChange={(e) =>
                          setDuration(Number(e.target.value) as Duration)
                        }
                        className='h-4 w-4 accent-blue-600'
                      />
                      <span className='text-sm text-neutral-700 group-hover:text-neutral-900'>
                        {d} Days
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Return Date */}
              <div className='space-y-1'>
                <label className='text-sm font-medium text-neutral-700'>
                  Return Date
                </label>
                <p className='text-sm text-neutral-500'>
                  Please return the book no later than{' '}
                  <span className='font-semibold text-red-500'>
                    {format(returnDate, 'd MMMM yyyy')}
                  </span>
                </p>
              </div>

              {/* Agreements */}
              <div className='space-y-2 pt-1'>
                <label className='flex items-start gap-2.5 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={agreeReturn}
                    onChange={(e) => setAgreeReturn(e.target.checked)}
                    className='h-4 w-4 accent-blue-600 mt-0.5 shrink-0'
                  />
                  <span className='text-sm text-neutral-600'>
                    I agree to return the book(s) before the due date.
                  </span>
                </label>
                <label className='flex items-start gap-2.5 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={agreePolicy}
                    onChange={(e) => setAgreePolicy(e.target.checked)}
                    className='h-4 w-4 accent-blue-600 mt-0.5 shrink-0'
                  />
                  <span className='text-sm text-neutral-600'>
                    I accept the library borrowing policy.
                  </span>
                </label>
              </div>

              {/* Submit */}
              <Button
                className='w-full bg-blue-600 hover:bg-blue-700 text-white h-11 font-semibold rounded-lg text-sm disabled:opacity-50'
                disabled={!canSubmit || borrow.isPending}
                onClick={handleConfirm}
              >
                {borrow.isPending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />{' '}
                    Processing…
                  </>
                ) : (
                  'Confirm & Borrow'
                )}
              </Button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helper ─────────────────────────────────────────────────────────────────────
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-center justify-between px-4 py-3 text-sm'>
      <span className='text-neutral-500'>{label}</span>
      <span className='font-medium text-neutral-900 text-right'>{value}</span>
    </div>
  );
}
