import { Link, useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Book } from '@/types';

// ── Star rating display ──────────────────────────────────
function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className='flex items-center gap-0.5'>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= Math.round(rating)
              ? 'fill-accent-yellow text-accent-yellow'
              : 'text-neutral-300'
          }
        />
      ))}
    </div>
  );
}

// ── Book card ────────────────────────────────────────────
export function BookCard({ book }: { book: Book }) {
  const navigate = useNavigate();

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (book.authorId) {
      navigate(`/authors/${book.authorId}`);
    }
  };

  return (
    <Link
      to={`/books/${book.id}`}
      className='group flex flex-col rounded-xl border border-neutral-200 bg-white overflow-hidden transition-shadow hover:shadow-lg'
    >
      {/* Cover */}
      <div className='aspect-3/4 w-full overflow-hidden bg-neutral-100'>
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className='h-full w-full object-cover transition-transform group-hover:scale-105'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center text-neutral-400'>
            <img
              src='/logos/book-icon.svg'
              alt='Book'
              className='h-12 w-12 opacity-40'
            />
          </div>
        )}
      </div>
      {/* Info */}
      <div className='flex flex-1 flex-col p-3'>
        <h3 className='text-sm font-semibold text-neutral-900 line-clamp-2 mb-1'>
          {book.title}
        </h3>
        {book.authorId ? (
          <button
            onClick={handleAuthorClick}
            className='text-xs text-primary-600 hover:text-primary-700 hover:underline mb-2 text-left z-10'
          >
            {book.author?.name || 'Unknown Author'}
          </button>
        ) : (
          <p className='text-xs text-neutral-500 mb-2'>
            {book.author?.name || 'Unknown Author'}
          </p>
        )}
        <div className='mt-auto flex items-center justify-between'>
          <StarRating rating={book.rating} size={12} />
          <span className='text-xs text-neutral-400'>
            {book.reviewCount} reviews
          </span>
        </div>
      </div>
    </Link>
  );
}
