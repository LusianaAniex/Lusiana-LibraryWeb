import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { setSearchQuery } from '@/store/uiSlice';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

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

      const endpoint =
        !q && !categoryId ? '/api/books/recommend' : '/api/books';
      const { data } = await api.get(endpoint, { params: searchParams });
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

import { HeroCarousel } from '@/components/home/HeroCarousel';
import { CategoriesCarousel } from '@/components/home/CategoriesCarousel';
import { BookCard } from '@/components/books/BookCard';

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
  const authorsQuery = usePopularAuthors();

  const categories = categoriesQuery.data ?? [];
  const books = booksQuery.data?.books ?? [];
  const totalPages = booksQuery.data?.totalPages ?? 1;
  const popularAuthors = authorsQuery.data ?? [];

  return (
    <div className='bg-white min-h-screen'>
      {/* ── Hero Banner ───────────────────────────────────── */}
      <section className='mx-auto w-full max-w-7xl px-4 pt-6 pb-2 sm:px-6 lg:px-8'>
        <HeroCarousel />
      </section>

      {/* ── Categories ────────────────────────────────────── */}
      <section className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        <CategoriesCarousel
          categories={categories}
          isLoading={categoriesQuery.isLoading}
          onCategorySelect={() => setCurrentPage(1)}
        />
      </section>

      {/* ── Book List (filtered / searched) ───────────────── */}
      <section className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between mb-8'>
          <h2 className='text-xl sm:text-2xl font-bold text-neutral-900'>
            {searchQuery ? `Results for "${searchQuery}"` : 'Recommendation'}
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

            {/* Pagination / Load More */}
            {totalPages > 1 && (
              <div className='mt-12 flex items-center justify-center'>
                <Button
                  variant='outline'
                  size='lg'
                  onClick={() =>
                    setCurrentPage((p) => (p < totalPages ? p + 1 : p))
                  }
                  className='cursor-pointer rounded-full px-12 py-6 text-sm font-semibold border-neutral-200 text-neutral-800 hover:bg-neutral-50 shadow-sm'
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Popular Authors ───────────────────────────────── */}
      {popularAuthors.length > 0 && (
        <section className='mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-6 lg:px-8'>
          <h2 className='text-xl sm:text-2xl font-bold text-neutral-900 mb-8'>
            Popular Authors
          </h2>
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
            {popularAuthors.map((author) => (
              <Link
                to={`/authors/${author.id}`}
                key={author.id}
                className='flex items-center gap-3 rounded-[32px] border border-neutral-100 bg-white p-2 pr-4 transition-all hover:border-neutral-200 hover:shadow-sm cursor-pointer'
              >
                <div className='relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-white font-bold text-lg overflow-hidden border border-neutral-100'>
                  {author.profilePhoto && (
                    <img
                      src={author.profilePhoto}
                      alt={author.name}
                      className='absolute inset-0 h-full w-full object-cover z-10 bg-neutral-800'
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <span className='uppercase text-sm z-0'>
                    {author.name.charAt(0)}
                  </span>
                </div>
                <div className='flex flex-col flex-1 min-w-0'>
                  <span className='text-sm font-semibold text-neutral-900 truncate'>
                    {author.name}
                  </span>
                  <span className='text-xs font-medium text-primary-600 flex items-center gap-1.5 mt-0.5'>
                    <img
                      src='/logos/book-icon.svg'
                      className='w-3 h-3 opacity-80'
                      alt=''
                    />{' '}
                    {author.bookCount || 0} books
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
