import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, useRemoveCartItem } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Trash2, BookOpen } from 'lucide-react';
import type { CartItem } from '@/types';

// ── Loan Summary Component ───────────────────────────────────────────────────
interface LoanSummaryProps {
  selectedCount: number;
  onBorrow: () => void;
}

const LoanSummary = ({ selectedCount, onBorrow }: LoanSummaryProps) => (
  <div className='rounded-xl border border-neutral-200 bg-white p-5 space-y-4'>
    <h3 className='font-semibold text-neutral-900 text-base'>Loan Summary</h3>
    <div className='flex items-center justify-between text-sm'>
      <span className='text-neutral-500'>Total Book</span>
      <span className='font-semibold text-neutral-900'>
        {selectedCount} {selectedCount === 1 ? 'Item' : 'Items'}
      </span>
    </div>
    <Button
      className='w-full bg-blue-600 hover:bg-blue-700 text-white h-11 font-semibold rounded-lg text-sm'
      disabled={selectedCount === 0}
      onClick={onBorrow}
    >
      Borrow Book
    </Button>
  </div>
);

export default function CartPage() {
  const navigate = useNavigate();
  const { data: cart, isLoading } = useCart();
  const removeItem = useRemoveCartItem();

  const items: CartItem[] = useMemo(() => cart?.items ?? [], [cart]);

  // ── Selection state ────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Keep selection valid when items change
  const validSelected = useMemo(
    () => new Set([...selected].filter((id) => items.some((i) => i.id === id))),
    [selected, items]
  );

  const allSelected = items.length > 0 && validSelected.size === items.length;

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  }, [allSelected, items]);

  const toggleItem = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBorrow = useCallback(() => {
    const itemIds = [...validSelected];
    if (itemIds.length === 0) return;
    navigate('/checkout', {
      state: { itemIds, items: items.filter((i) => itemIds.includes(i.id)) },
    });
  }, [validSelected, items, navigate]);

  if (isLoading) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-5xl'>
        <Skeleton className='h-9 w-40 mb-6' />
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 space-y-3'>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className='h-28 w-full rounded-xl' />
            ))}
          </div>
          <Skeleton className='h-40 w-full rounded-xl' />
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8 max-w-5xl pb-28 lg:pb-8'>
      <h1 className='text-2xl font-bold text-neutral-900 mb-6'>My Cart</h1>

      {items.length === 0 ? (
        <div className='flex flex-col items-center gap-4 py-24 text-neutral-400'>
          <ShoppingCart className='h-12 w-12' />
          <p className='text-base font-medium'>Your cart is empty</p>
          <Button variant='outline' onClick={() => navigate('/')}>
            Browse books
          </Button>
        </div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Book list */}
          <div className='lg:col-span-2'>
            {/* Select All */}
            <label className='flex items-center gap-2.5 mb-4 cursor-pointer select-none'>
              <input
                type='checkbox'
                checked={allSelected}
                onChange={toggleAll}
                className='h-4 w-4 accent-blue-600 rounded cursor-pointer'
              />
              <span className='text-sm font-medium text-neutral-700'>
                Select All
              </span>
            </label>

            <div className='space-y-3'>
              {items.map((item) => {
                const isChecked = validSelected.has(item.id);
                return (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-blue-400 bg-blue-50/40'
                        : 'border-neutral-200 bg-white'
                    }`}
                  >
                    <input
                      type='checkbox'
                      checked={isChecked}
                      onChange={() => toggleItem(item.id)}
                      className='h-4 w-4 accent-blue-600 rounded shrink-0 cursor-pointer'
                    />

                    {/* Cover */}
                    {item.book?.coverImage ? (
                      <img
                        src={item.book.coverImage}
                        alt={item.book.title}
                        className='h-20 w-14 object-cover rounded-lg shrink-0 shadow-sm'
                      />
                    ) : (
                      <div className='h-20 w-14 rounded-lg bg-neutral-100 shrink-0 flex items-center justify-center'>
                        <BookOpen className='h-5 w-5 text-neutral-400' />
                      </div>
                    )}

                    {/* Info */}
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs text-neutral-400 mb-0.5'>
                        {item.book?.category?.name ?? 'Category'}
                      </p>
                      <p className='font-semibold text-neutral-900 text-sm truncate'>
                        {item.book?.title ?? 'Book Name'}
                      </p>
                      <p className='text-xs text-neutral-500 mt-0.5'>
                        {item.book?.author?.name ?? 'Author name'}
                      </p>
                    </div>

                    {/* Remove */}
                    <button
                      type='button'
                      onClick={(e) => {
                        e.preventDefault();
                        removeItem.mutate(item.id);
                        setSelected((prev) => {
                          const next = new Set(prev);
                          next.delete(item.id);
                          return next;
                        });
                      }}
                      className='ml-auto p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0'
                      title='Remove'
                    >
                      <Trash2 className='h-4 w-4' />
                    </button>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Desktop Loan Summary */}
          <div className='hidden lg:block'>
            <LoanSummary
              selectedCount={validSelected.size}
              onBorrow={handleBorrow}
            />
          </div>
        </div>
      )}

      {/* Mobile Sticky Loan Summary */}
      {items.length > 0 && (
        <div className='lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 flex items-center justify-between gap-4 z-40'>
          <div>
            <p className='text-xs text-neutral-500'>Total Book</p>
            <p className='font-bold text-neutral-900 text-sm'>
              {validSelected.size} {validSelected.size === 1 ? 'Item' : 'Items'}
            </p>
          </div>
          <Button
            className='bg-blue-600 hover:bg-blue-700 text-white h-10 px-8 font-semibold rounded-lg text-sm'
            disabled={validSelected.size === 0}
            onClick={handleBorrow}
          >
            Borrow Book
          </Button>
        </div>
      )}
    </div>
  );
}
