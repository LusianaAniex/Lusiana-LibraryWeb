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
    <div className='relative w-full overflow-hidden pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 group'>
      <div
        ref={scrollContainerRef}
        className='flex gap-4 overflow-x-auto hide-scrollbar scroll-smooth'
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className='flex flex-col gap-2 rounded-2xl border border-neutral-100 bg-white p-2 animate-pulse w-[100px] h-[100px] md:w-[150px] md:h-[120px]'
              >
                <div className='flex-1 w-full rounded-xl bg-neutral-100'></div>
                <div className='h-4 w-16 mx-auto md:mx-1 rounded bg-neutral-200 mt-1'></div>
              </div>
            ))
          : categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSelect(cat.id)}
                className={`flex-none flex flex-col gap-2 rounded-2xl border transition-all cursor-pointer p-2 w-[100px] h-[100px] md:w-[150px] md:h-[120px] ${
                  selectedCategoryId === cat.id
                    ? 'border-primary-600 bg-white shadow-sm ring-1 ring-primary-600'
                    : 'border-neutral-100 bg-white hover:border-primary-200 hover:shadow-sm'
                }`}
              >
                <div className='flex flex-1 w-full items-center justify-center rounded-xl bg-blue-50/50 group-hover:bg-blue-50 transition-colors'>
                  <img
                    src={getCategoryIcon(cat.name)}
                    alt={cat.name}
                    className='h-8 w-8 md:h-10 md:w-10 object-contain drop-shadow-sm transition-transform group-hover:scale-105'
                  />
                </div>
                <span className='text-xs font-semibold text-neutral-800 text-center md:text-left leading-tight w-full px-1 mb-1 truncate'>
                  {cat.name}
                </span>
              </button>
            ))}
      </div>
      {/* Navigation arrows (visible on mobile, and on hover for desktop) */}
      <div className='flex items-center justify-between w-full absolute top-1/2 -translate-y-1/2 left-0 right-0 px-2 pointer-events-none opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200'>
        <button
          onClick={() => scroll('left')}
          className='pointer-events-auto h-8 w-8 rounded-full bg-white/90 shadow text-neutral-700 flex items-center justify-center hover:bg-white hover:scale-105 transition-all'
        >
          <ChevronLeft className='w-5 h-5' />
        </button>
        <button
          onClick={() => scroll('right')}
          className='pointer-events-auto h-8 w-8 rounded-full bg-white/90 shadow text-neutral-700 flex items-center justify-center hover:bg-white hover:scale-105 transition-all'
        >
          <ChevronRight className='w-5 h-5' />
        </button>
      </div>
    </div>
  );
}
