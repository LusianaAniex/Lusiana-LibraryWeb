import { Star } from 'lucide-react';
import type { Category } from '@/types';

interface BookFiltersProps {
  categories: Category[];
  selectedCategoryId: number | null;
  onCategoryChange: (id: number | null) => void;
  selectedRating: number | null;
  onRatingChange: (rating: number | null) => void;
}

export function BookFilters({
  categories,
  selectedCategoryId,
  onCategoryChange,
  selectedRating,
  onRatingChange,
}: BookFiltersProps) {
  return (
    <div className='w-full'>
      <div className='mb-8'>
        <h3 className='text-sm font-bold text-neutral-900 mb-4 uppercase tracking-wider'>
          Category
        </h3>
        <div className='space-y-3'>
          {categories.map((category) => (
            <label
              key={category.id}
              className='flex items-center gap-3 cursor-pointer group'
            >
              <input
                type='checkbox'
                className='w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-600 cursor-pointer accent-primary-600'
                checked={selectedCategoryId === category.id}
                onChange={() =>
                  onCategoryChange(
                    selectedCategoryId === category.id ? null : category.id
                  )
                }
              />
              <span className='text-sm text-neutral-600 group-hover:text-neutral-900 transition-colors'>
                {category.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className='text-sm font-bold text-neutral-900 mb-4 uppercase tracking-wider'>
          Rating
        </h3>
        <div className='space-y-3'>
          {[5, 4, 3, 2, 1].map((rating) => (
            <label
              key={rating}
              className='flex items-center gap-3 cursor-pointer group'
            >
              <input
                type='checkbox'
                className='w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-600 cursor-pointer accent-primary-600'
                checked={selectedRating === rating}
                onChange={() =>
                  onRatingChange(selectedRating === rating ? null : rating)
                }
              />
              <span className='flex items-center gap-1.5 text-sm text-neutral-600 group-hover:text-neutral-900 transition-colors'>
                <Star className='w-4 h-4 fill-amber-400 text-amber-400' />
                <span className='font-medium'>{rating}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
