import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { useBookReviews, useCreateReview } from '@/hooks/useBookDetail';
import StarRating from './StarRating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// date-fns import removed as it was unused and causing errors
import { Loader2 } from 'lucide-react';
// Review type import removed as it was unused

// Simple date formatter fallback if date-fns not installed
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

interface ReviewSectionProps {
  bookId: number;
}

export default function ReviewSection({ bookId }: ReviewSectionProps) {
  const { data: reviews = [], isLoading } = useBookReviews(String(bookId));
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const createReview = useCreateReview();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    createReview.mutate(
      { bookId, star: rating, comment },
      {
        onSuccess: () => {
          setRating(0);
          setComment('');
        },
      }
    );
  };

  return (
    <div className='mt-12'>
      <h2 className='text-2xl font-bold text-neutral-900 mb-6'>
        Reviews ({reviews.length})
      </h2>

      {/* Review List */}
      <div className='space-y-6 mb-10'>
        {isLoading ? (
          <p className='text-neutral-500'>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className='text-neutral-500 italic'>
            No reviews yet. Be the first!
          </p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className='flex gap-4 p-4 rounded-xl bg-neutral-50/50 border border-neutral-100'
            >
              <Avatar className='h-10 w-10 border border-neutral-200'>
                <AvatarImage src={review.user?.profilePhoto || undefined} />
                <AvatarFallback>
                  {review.user?.name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className='flex-1'>
                <div className='flex items-center justify-between mb-1'>
                  <h4 className='font-semibold text-neutral-900'>
                    {review.user?.name || 'Anonymous'}
                  </h4>
                  <span className='text-xs text-neutral-400'>
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <div className='mb-2'>
                  <StarRating rating={review.star} readonly size={14} />
                </div>
                <p className='text-neutral-600 text-sm leading-relaxed'>
                  {review.comment}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Review Form */}
      {isAuthenticated ? (
        <div className='bg-white rounded-xl border border-neutral-200 p-6 shadow-sm'>
          <h3 className='text-lg font-semibold mb-4'>Write a Review</h3>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-1'>
                Rating
              </label>
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size={24}
              />
            </div>
            <div>
              <label
                htmlFor='comment'
                className='block text-sm font-medium text-neutral-700 mb-1'
              >
                Comment (Optional)
              </label>
              <Textarea
                id='comment'
                placeholder='What did you think about this book?'
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className='min-h-[100px]'
              />
            </div>
            <Button
              type='submit'
              disabled={rating === 0 || createReview.isPending}
              className='bg-primary-600 hover:bg-primary-700 text-white'
            >
              {createReview.isPending && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Submit Review
            </Button>
          </form>
        </div>
      ) : (
        <div className='bg-neutral-50 rounded-xl p-6 text-center border border-neutral-200'>
          <p className='text-neutral-600 mb-4'>Log in to leave a review.</p>
          <Button variant='outline' asChild>
            <a href='/login'>Log In</a>
          </Button>
        </div>
      )}
    </div>
  );
}
