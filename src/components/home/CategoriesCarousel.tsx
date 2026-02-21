import { type Category } from '@/types';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { setCategoryFilter } from '@/store/uiSlice';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ── Category icon map ────────────────────────────────────
const categoryIcons: Record<string, string> = {
  education: '/logos/education-icon.svg',
  fiction: '/logos/fiction-icon.svg',
  'non-fiction': '/logos/nonfiction-icon.svg',
  nonfiction: '/logos/nonfiction-icon.svg',
  finance: '/logos/finance-icon.svg',
  science: '/logos/science-icon.svg',
  'self-improvement': '/logos/selfimprovement-icon.svg',
  selfimprovement: '/logos/selfimprovement-icon.svg',
  'self improvement': '/logos/selfimprovement-icon.svg',
};

function getCategoryIcon(name: string) {
  return categoryIcons[name.toLowerCase()] || '/logos/book-icon.svg';
}

interface CategoriesCarouselProps {
  categories: Category[];
  isLoading: boolean;
  onCategorySelect?: () => void;
}

export function CategoriesCarousel({
  categories,
  isLoading,
  onCategorySelect,
}: CategoriesCarouselProps) {
  const dispatch = useAppDispatch();
  const { selectedCategoryId } = useAppSelector((state) => state.ui);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleSelect = (categoryId: number | null) => {
    dispatch(
      setCategoryFilter(selectedCategoryId === categoryId ? null : categoryId)
    );
    if (onCategorySelect) onCategorySelect();
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className='relative w-full overflow-hidden pb-4 -mx-4 px-4 sm:mx-0 sm:px-0'>
      <div
        ref={scrollContainerRef}
        className='flex gap-4 min-w-max overflow-x-auto hide-scrollbar'
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className='flex flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 px-6 py-4 w-[140px] animate-pulse'
              >
                <div className='h-12 w-12 rounded-lg bg-neutral-200'></div>
                <div className='h-4 w-16 rounded bg-neutral-200'></div>
              </div>
            ))
          : categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSelect(cat.id)}
                className={`flex flex-col items-center justify-center gap-3 rounded-2xl border transition-all cursor-pointer px-6 py-4 w-[140px] md:w-[160px] ${
                  selectedCategoryId === cat.id
                    ? 'border-primary-600 bg-primary-50 shadow-sm'
                    : 'border-neutral-100 bg-white hover:border-primary-200 hover:bg-neutral-50 hover:shadow-sm'
                }`}
              >
                <div className='flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50/50'>
                  <img
                    src={getCategoryIcon(cat.name)}
                    alt={cat.name}
                    className='h-10 w-10 object-contain drop-shadow-sm'
                  />
                </div>
                <span className='text-sm font-semibold text-neutral-800 text-center leading-tight'>
                  {cat.name}
                </span>
              </button>
            ))}
      </div>
      {/* Mobile-only visible arrows */}
      <div className='flex sm:hidden items-center justify-between w-full absolute top-1/2 -translate-y-1/2 left-0 right-0 px-2 pointer-events-none'>
        <button
          onClick={() => scroll('left')}
          className='pointer-events-auto h-8 w-8 rounded-full bg-white/90 shadow text-neutral-700 flex items-center justify-center'
        >
          <ChevronLeft className='w-5 h-5' />
        </button>
        <button
          onClick={() => scroll('right')}
          className='pointer-events-auto h-8 w-8 rounded-full bg-white/90 shadow text-neutral-700 flex items-center justify-center'
        >
          <ChevronRight className='w-5 h-5' />
        </button>
      </div>
    </div>
  );
}
