import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateReview } from '@/hooks/useBookDetail';
import { Star, Loader2 } from 'lucide-react';
import type { Book } from '@/types';

interface GiveReviewModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
}

export function GiveReviewModal({
  book,
  isOpen,
  onClose,
}: GiveReviewModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');

  const createReview = useCreateReview();

  const handleSubmit = () => {
    if (rating === 0) return; // Wait for rating to be selected

    createReview.mutate(
      {
        bookId: book.id,
        star: rating,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          setRating(0);
          setComment('');
          onClose();
        },
      }
    );
  };

  // Close handler to reset state
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setRating(0);
      setHoverRating(0);
      setComment('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md w-[400px] p-6 rounded-2xl'>
        <DialogHeader className='mb-2'>
          <DialogTitle className='text-xl font-bold text-neutral-900'>
            Give Review
          </DialogTitle>
          <DialogDescription className='sr-only'>
            Leave a rating and comment for {book.title}
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col items-center gap-6 py-4'>
          <div className='text-center'>
            <p className='text-xs font-bold text-neutral-900 mb-3'>
              Give Rating
            </p>
            <div className='flex items-center justify-center gap-1.5'>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type='button'
                  className='focus:outline-none transition-transform hover:scale-110'
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-neutral-300 text-neutral-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder='Please share your thoughts about this book'
            className='min-h-[140px] w-full resize-none border-neutral-200 rounded-xl placeholder:text-neutral-400 text-sm py-3 px-4 focus-visible:ring-primary-600'
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || createReview.isPending}
          className='w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full h-12 font-semibold text-base'
        >
          {createReview.isPending ? (
            <Loader2 className='mr-2 h-5 w-5 animate-spin' />
          ) : (
            'Send'
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
