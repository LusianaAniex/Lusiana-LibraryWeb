import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0 to 5
  maxStars?: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
}

export default function StarRating({
  rating,
  maxStars = 5,
  onRatingChange,
  readonly = false,
  size = 16,
}: StarRatingProps) {
  return (
    <div className='flex items-center gap-0.5'>
      {Array.from({ length: maxStars }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= rating;

        return (
          <button
            key={index}
            type='button'
            disabled={readonly}
            onClick={() => !readonly && onRatingChange?.(starValue)}
            className={`${
              readonly
                ? 'cursor-default'
                : 'cursor-pointer hover:scale-110 transition-transform'
            } text-yellow-400 focus:outline-none`}
            title={`${starValue} Stars`}
          >
            <Star
              size={size}
              className={isFilled ? 'fill-current' : 'text-neutral-300'}
              strokeWidth={isFilled ? 0 : 2}
            />
          </button>
        );
      })}
    </div>
  );
}
