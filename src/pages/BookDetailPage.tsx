import { useParams, useNavigate } from 'react-router-dom';
import { useBookDetail, useBorrowBook } from '@/hooks/useBookDetail';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  BookOpen,
  User as UserIcon,
  Calendar,
} from 'lucide-react';
import StarRating from '@/components/books/StarRating';
import ReviewSection from '@/components/books/ReviewSection';

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const { data: book, isLoading, error } = useBookDetail(id);
  const borrowBook = useBorrowBook();

  const handleBorrow = () => {
    if (!book) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    borrowBook.mutate(book.id);
  };

  if (isLoading) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-5xl'>
        <Skeleton className='h-8 w-32 mb-8' />
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          <Skeleton className='aspect-2/3 w-full rounded-xl' />
          <div className='md:col-span-2 space-y-4'>
            <Skeleton className='h-10 w-3/4' />
            <Skeleton className='h-6 w-1/2' />
            <Skeleton className='h-32 w-full mt-4' />
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className='min-h-[50vh] flex flex-col items-center justify-center text-center px-4'>
        <h2 className='text-2xl font-bold text-neutral-900 mb-2'>
          Book Not Found
        </h2>
        <p className='text-neutral-500 mb-6'>
          The book you are looking for does not exist or has been removed.
        </p>
        <Button onClick={() => navigate('/')} variant='outline'>
          <ChevronLeft className='mr-2 h-4 w-4' /> Back to Home
        </Button>
      </div>
    );
  }

  const isAvailable = book.availableCopies > 0;

  return (
    <div className='bg-white min-h-screen pb-16'>
      {/* Breadcrumb / Back */}
      <div className='border-b border-neutral-100 bg-neutral-50/50'>
        <div className='container mx-auto px-4 py-4 max-w-6xl'>
          <button
            onClick={() => navigate(-1)}
            className='flex items-center text-sm text-neutral-500 hover:text-primary-600 transition-colors'
          >
            <ChevronLeft className='mr-1 h-4 w-4' /> Back
          </button>
        </div>
      </div>

      <div className='container mx-auto px-4 py-8 max-w-6xl'>
        <div className='grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] gap-8 lg:gap-12'>
          {/* Left Column: Cover & Action */}
          <div className='flex flex-col gap-6'>
            <div className='relative aspect-2/3 w-full overflow-hidden rounded-xl bg-neutral-100 shadow-xl ring-1 ring-neutral-900/5'>
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className='h-full w-full object-cover transition-transform hover:scale-105 duration-500'
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center text-neutral-300'>
                  <BookOpen size={64} />
                </div>
              )}
              {/* Dynamic status badge overlay */}
              <div className='absolute top-4 right-4'>
                {isAvailable ? (
                  <Badge className='bg-green-500/90 text-white hover:bg-green-600 border-0 backdrop-blur-md shadow-sm'>
                    Available
                  </Badge>
                ) : (
                  <Badge className='bg-orange-500/90 text-white hover:bg-orange-600 border-0 backdrop-blur-md shadow-sm'>
                    Out of Stock
                  </Badge>
                )}
              </div>
            </div>

            <div className='p-6 bg-neutral-50 rounded-xl border border-neutral-100 text-center space-y-4'>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-neutral-500'>Total Copies</span>
                <span className='font-medium text-neutral-900'>
                  {book.totalCopies}
                </span>
              </div>
              <Separator />
              <div className='flex justify-between items-center text-sm'>
                <span className='text-neutral-500'>Available</span>
                <span
                  className={`font-bold ${isAvailable ? 'text-green-600' : 'text-orange-600'}`}
                >
                  {book.availableCopies}
                </span>
              </div>

              <Button
                size='lg'
                className={`w-full font-semibold shadow-lg shadow-primary-500/20 active:scale-95 transition-all ${
                  !isAvailable ? 'opacity-80' : ''
                }`}
                disabled={!isAvailable || borrowBook.isPending}
                onClick={handleBorrow}
              >
                {borrowBook.isPending
                  ? 'Processing...'
                  : isAvailable
                    ? 'Borrow Book'
                    : 'Unavailable'}
              </Button>
              {!isAuthenticated && (
                <p className='text-xs text-neutral-400'>
                  Sign in to borrow this book
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Details */}
          <div>
            <div className='mb-2 flex items-center gap-2'>
              <Badge
                variant='outline'
                className='text-primary-600 border-primary-200 bg-primary-50'
              >
                {book.category?.name || 'General'}
              </Badge>
              {book.publishedYear && (
                <span className='text-sm text-neutral-400 flex items-center gap-1'>
                  <Calendar size={14} /> {book.publishedYear}
                </span>
              )}
            </div>

            <h1 className='text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight leading-tight mb-4'>
              {book.title}
            </h1>

            <div className='flex items-center gap-4 mb-8'>
              <div className='flex items-center gap-2 text-neutral-700 font-medium'>
                <div className='h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500'>
                  <UserIcon size={16} />
                </div>
                {book.author?.name || 'Unknown Author'}
              </div>
              <div className='w-px h-4 bg-neutral-300' />
              <div className='flex items-center gap-2'>
                <StarRating rating={book.rating} readonly size={18} />
                <span className='text-sm text-neutral-500 font-medium pt-0.5'>
                  ({book.reviewCount} reviews)
                </span>
              </div>
            </div>

            <div className='prose prose-neutral max-w-none mb-10 text-neutral-600 leading-relaxed'>
              <h3 className='text-lg font-semibold text-neutral-900 mb-2'>
                About this book
              </h3>
              <p>
                {book.description || 'No description available for this book.'}
              </p>
            </div>

            <Separator className='my-8' />

            <ReviewSection bookId={book.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
