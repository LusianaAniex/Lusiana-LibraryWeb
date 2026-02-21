import { useParams, useNavigate } from 'react-router-dom';
import { useBookDetail, useBorrowBook } from '@/hooks/useBookDetail';
import { useAddToCart } from '@/hooks/useCart';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import StarRating from '@/components/books/StarRating';
import ReviewSection from '@/components/books/ReviewSection';
import { BookCard } from '@/components/books/BookCard';
import type { Book } from '@/types';

function useRelatedBooks(categoryId?: number, currentBookId?: number) {
  return useQuery<Book[]>({
    queryKey: ['related-books', categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      const res = await api.get('/api/books', {
        params: { categoryId, limit: 5 },
      });
      const payload = res.data?.data;
      const booksList = Array.isArray(payload) ? payload : payload?.books || [];
      // Exclude current book
      return booksList.filter((b: Book) => b.id !== currentBookId).slice(0, 4);
    },
    enabled: !!categoryId,
  });
}

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const { data: book, isLoading, error } = useBookDetail(id);
  const borrowBook = useBorrowBook();
  const addToCart = useAddToCart();

  // Fetch related books based on current book's category
  const { data: relatedBooks = [] } = useRelatedBooks(
    book?.categoryId,
    book?.id
  );

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

      <div className='container mx-auto px-4 py-8 max-w-5xl'>
        <div className='flex flex-col md:flex-row gap-8 lg:gap-16'>
          {/* Left Column: Cover */}
          <div className='w-full md:w-[320px] max-w-[360px] mx-auto md:mx-0 shrink-0'>
            <div className='relative w-full overflow-hidden rounded-xl shadow-md border border-neutral-200 bg-white p-2'>
              <div className='aspect-2/3 w-full bg-neutral-100 rounded-lg overflow-hidden relative'>
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
              </div>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className='flex-1 flex flex-col'>
            {/* Category / Year */}
            <div className='mb-3 flex items-center gap-2'>
              <Badge
                variant='outline'
                className='text-xs text-neutral-600 bg-neutral-100 border-neutral-200 uppercase tracking-wider font-semibold'
              >
                {book.category?.name || 'General'}
              </Badge>
              {book.publishedYear && (
                <span className='text-sm text-neutral-400 flex items-center gap-1 font-medium'>
                  • {book.publishedYear}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className='text-3xl md:text-5xl font-extrabold text-neutral-900 tracking-tight leading-tight mb-2'>
              {book.title}
            </h1>

            {/* Author */}
            <div className='mb-6'>
              {book.authorId ? (
                <Link
                  to={`/authors/${book.authorId}`}
                  className='text-base font-semibold text-neutral-600 hover:text-primary-600 hover:underline transition-colors'
                >
                  {book.author?.name || 'Unknown Author'}
                </Link>
              ) : (
                <span className='text-base font-semibold text-neutral-600'>
                  {book.author?.name || 'Unknown Author'}
                </span>
              )}
              <div className='mt-2 flex items-center gap-1 text-accent-yellow'>
                <StarRating rating={book.rating} readonly size={16} />
                <span className='text-sm text-neutral-800 font-bold ml-1'>
                  {book.rating.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Stats Row */}
            <div className='flex items-center gap-8 mb-8 pb-8 border-b border-neutral-100'>
              <div className='flex flex-col'>
                <span className='text-2xl font-bold text-neutral-900'>
                  {(book as any).pages || 330}
                </span>
                <span className='text-xs text-neutral-500 uppercase tracking-wider font-medium'>
                  Page
                </span>
              </div>
              <div className='w-px h-10 bg-neutral-200' />
              <div className='flex flex-col'>
                <span className='text-2xl font-bold text-neutral-900'>
                  {book.reviewCount || 212}
                </span>
                <span className='text-xs text-neutral-500 uppercase tracking-wider font-medium'>
                  Rating
                </span>
              </div>
              <div className='w-px h-10 bg-neutral-200' />
              <div className='flex flex-col'>
                <span className='text-2xl font-bold text-neutral-900'>
                  {book.reviewCount || 179}
                </span>
                <span className='text-xs text-neutral-500 uppercase tracking-wider font-medium'>
                  Reviews
                </span>
              </div>
            </div>

            {/* Description */}
            <div className='mb-10'>
              <h3 className='text-base font-bold text-neutral-900 mb-3'>
                Description
              </h3>
              <p className='text-neutral-600 leading-relaxed text-sm md:text-base'>
                {book.description || 'No description available for this book.'}
              </p>
            </div>

            {/* Actions */}
            <div className='flex flex-col sm:flex-row gap-4 mb-12 max-w-lg'>
              <Button
                size='lg'
                variant='outline'
                className='flex-1 h-12 md:h-14 rounded-full border-2 border-primary-600 text-primary-600 font-bold hover:bg-primary-50 transition-colors'
                disabled={
                  addToCart.isPending || !isAuthenticated || !isAvailable
                }
                onClick={() => book && addToCart.mutate(book.id)}
              >
                {addToCart.isPending ? 'Adding…' : 'Add to Cart'}
              </Button>
              <Button
                size='lg'
                className={`flex-1 h-12 md:h-14 rounded-full font-bold shadow-lg shadow-primary-500/30 active:scale-95 transition-all text-white ${
                  !isAvailable
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
                disabled={
                  !isAvailable || borrowBook.isPending || !isAuthenticated
                }
                onClick={handleBorrow}
              >
                {borrowBook.isPending
                  ? 'Processing...'
                  : isAvailable
                    ? 'Borrow Book'
                    : 'Out of Stock'}
              </Button>

              {!isAuthenticated && (
                <p className='text-xs text-center text-neutral-400 mt-2 sm:hidden'>
                  Sign in to interact with this book
                </p>
              )}
            </div>

            {!isAuthenticated && (
              <p className='text-sm text-neutral-500 hidden sm:block mb-8'>
                <Link to='/login' className='text-primary-600 hover:underline'>
                  Sign in
                </Link>{' '}
                to borrow or add to cart.
              </p>
            )}

            {/* Reviews Section */}
            <ReviewSection bookId={book.id} />

            {/* Related Books */}
            {relatedBooks.length > 0 && (
              <div className='mt-16'>
                <h2 className='text-2xl font-bold text-neutral-900 mb-6'>
                  Related Books
                </h2>
                <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
                  {relatedBooks.map((relatedBook) => (
                    <BookCard key={relatedBook.id} book={relatedBook} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
