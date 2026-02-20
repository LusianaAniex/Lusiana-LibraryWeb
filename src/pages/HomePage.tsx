import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { setSearchQuery, setCategoryFilter } from '@/store/uiSlice';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import type { Book, Category, Author } from '@/types';

// ── Data hooks (inline for now, will extract later) ──────
function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/api/categories');
      // Backend: { success, message, data: [...] } or { data: { categories: [...] } }
      const payload = data?.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.categories)) return payload.categories;
      return [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

function useBooks(params: {
  q?: string;
  categoryId?: number | null;
  page?: number;
  limit?: number;
}) {
  const { q, categoryId, page = 1, limit = 10 } = params;
  return useQuery<{ books: Book[]; totalPages: number }>({
    queryKey: ['books', q, categoryId, page, limit],
    queryFn: async () => {
      const searchParams: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (q) searchParams.q = q;
      if (categoryId) searchParams.categoryId = String(categoryId);
      const { data } = await api.get('/api/books', { params: searchParams });
      // Backend: { success, message, data: { books: [...], pagination: { totalPages } } }
      const payload = data?.data;
      return {
        books: Array.isArray(payload?.books)
          ? payload.books
          : Array.isArray(payload)
            ? payload
            : [],
        totalPages: payload?.pagination?.totalPages ?? 1,
      };
    },
  });
}

function useRecommendedBooks(page = 1) {
  return useQuery<Book[]>({
    queryKey: ['books', 'recommended', page],
    queryFn: async () => {
      const { data } = await api.get('/api/books/recommend', {
        params: { page, limit: 10 },
      });
      // Backend: { success, message, data: { books: [...] } } or data: [...]
      const payload = data?.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.books)) return payload.books;
      return [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

function usePopularAuthors() {
  return useQuery<Author[]>({
    queryKey: ['authors', 'popular'],
    queryFn: async () => {
      const { data } = await api.get('/api/authors/popular');
      // Backend: { success, message, data: [...] } or { data: { authors: [...] } }
      const payload = data?.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.authors)) return payload.authors;
      return [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

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
function BookCard({ book }: { book: Book }) {
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
        <p className='text-xs text-neutral-500 mb-2'>
          {book.author?.name || 'Unknown Author'}
        </p>
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

// ── Main HomePage ────────────────────────────────────────
export default function HomePage() {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { searchQuery, selectedCategoryId } = useAppSelector(
    (state) => state.ui
  );
  const [currentPage, setCurrentPage] = useState(1);

  // Sync URL search param with Redux
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) dispatch(setSearchQuery(q));
  }, [searchParams, dispatch]);

  const categoriesQuery = useCategories();
  const booksQuery = useBooks({
    q: searchQuery || undefined,
    categoryId: selectedCategoryId,
    page: currentPage,
    limit: 10,
  });
  const recommendedQuery = useRecommendedBooks();
  const authorsQuery = usePopularAuthors();

  const categories = categoriesQuery.data ?? [];
  const books = booksQuery.data?.books ?? [];
  const totalPages = booksQuery.data?.totalPages ?? 1;
  const recommendedBooks = recommendedQuery.data ?? [];
  const popularAuthors = authorsQuery.data ?? [];

  return (
    <div className='bg-white'>
      {/* ── Hero Banner ───────────────────────────────────── */}
      <section className='bg-primary-50'>
        <div className='mx-auto flex max-w-7xl flex-col-reverse items-center gap-8 px-4 py-12 sm:flex-row sm:px-6 sm:py-16 lg:px-8 lg:py-20'>
          {/* Text */}
          <div className='flex-1 text-center sm:text-left'>
            <h1 className='text-display-lg font-bold text-neutral-900 sm:text-display-xl lg:text-display-2xl'>
              Welcome to <span className='text-primary-600'>Booky</span>
            </h1>
            <p className='mt-4 text-md text-neutral-600 max-w-lg sm:text-lg'>
              Discover books, grow your knowledge, reach far beyond. This
              library is open for everyone to read & learn.
            </p>
            <div className='mt-6 flex flex-wrap gap-3 justify-center sm:justify-start'>
              <Button className='bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-600/90 cursor-pointer px-6 h-11'>
                Browse Books
              </Button>
              <Button
                variant='outline'
                className='border-primary-600 text-primary-600 font-semibold rounded-lg hover:bg-primary-50 cursor-pointer px-6 h-11'
              >
                Learn More
              </Button>
            </div>
          </div>
          {/* Hero image */}
          <div className='flex-1 flex justify-center'>
            <img
              src='/images/hero-image.png'
              alt='Welcome to Booky'
              className='w-full max-w-md drop-shadow-lg'
            />
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────── */}
      <section className='mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8'>
        <h2 className='text-display-xs font-bold text-neutral-900 mb-6'>
          Browse by Category
        </h2>
        <div className='flex flex-wrap gap-3'>
          {/* "All" pill */}
          <button
            onClick={() => {
              dispatch(setCategoryFilter(null));
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
              selectedCategoryId === null
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            All
          </button>

          {categoriesQuery.isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-10 w-28 rounded-full' />
              ))
            : categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    dispatch(
                      setCategoryFilter(
                        selectedCategoryId === cat.id ? null : cat.id
                      )
                    );
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    selectedCategoryId === cat.id
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  <img
                    src={getCategoryIcon(cat.name)}
                    alt=''
                    className='h-4 w-4'
                  />
                  {cat.name}
                </button>
              ))}
        </div>
      </section>

      {/* ── Recommendation Section ────────────────────────── */}
      {!searchQuery &&
        selectedCategoryId === null &&
        recommendedBooks.length > 0 && (
          <section className='mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-display-xs font-bold text-neutral-900'>
                Recommended for You
              </h2>
            </div>
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
              {recommendedBooks.slice(0, 5).map((book: Book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </section>
        )}

      {/* ── Book List (filtered / searched) ───────────────── */}
      <section className='mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-display-xs font-bold text-neutral-900'>
            {searchQuery ? `Results for "${searchQuery}"` : 'All Books'}
          </h2>
        </div>

        {booksQuery.isError ? (
          <div className='flex flex-col items-center justify-center py-12 text-center bg-red-50 rounded-xl border border-red-100'>
            <p className='text-red-600 font-semibold mb-2'>
              Failed to load books
            </p>
            <p className='text-sm text-red-500 mb-6 max-w-md'>
              {booksQuery.error instanceof Error
                ? booksQuery.error.message
                : 'An unexpected error occurred while connecting to the server.'}
            </p>
            <Button
              variant='outline'
              onClick={() => booksQuery.refetch()}
              className='border-red-200 text-red-700 hover:bg-red-100'
            >
              Try Again
            </Button>
          </div>
        ) : booksQuery.isLoading ? (
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className='rounded-xl border border-neutral-200 overflow-hidden'
              >
                <Skeleton className='aspect-3/4 w-full' />
                <div className='p-3 space-y-2'>
                  <Skeleton className='h-4 w-3/4' />
                  <Skeleton className='h-3 w-1/2' />
                  <Skeleton className='h-3 w-full' />
                </div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <img
              src='/logos/book-icon.svg'
              alt=''
              className='h-16 w-16 opacity-30 mb-4'
            />
            <p className='text-lg font-medium text-neutral-500'>
              No books found
            </p>
            <p className='text-sm text-neutral-400 mt-1'>
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <>
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
              {books.map((book: Book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='mt-8 flex items-center justify-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className='cursor-pointer'
                >
                  Previous
                </Button>
                <span className='text-sm text-neutral-500'>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className='cursor-pointer'
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Popular Authors ───────────────────────────────── */}
      {popularAuthors.length > 0 && (
        <section className='mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8'>
          <h2 className='text-display-xs font-bold text-neutral-900 mb-6'>
            Popular Authors
          </h2>
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'>
            {popularAuthors.map((author) => (
              <div
                key={author.id}
                className='flex flex-col items-center rounded-xl border border-neutral-200 bg-white p-4 text-center transition-shadow hover:shadow-md'
              >
                <div className='flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600 font-bold text-lg mb-3'>
                  {author.name.charAt(0)}
                </div>
                <p className='text-sm font-semibold text-neutral-900 line-clamp-1'>
                  {author.name}
                </p>
                <p className='text-xs text-neutral-500 mt-0.5'>
                  {author.bookCount || 0} books
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
