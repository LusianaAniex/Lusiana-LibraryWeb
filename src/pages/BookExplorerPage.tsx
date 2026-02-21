import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BookCard } from '@/components/books/BookCard';
import { BookFilters } from '@/components/books/BookFilters';
import { SlidersHorizontal, Search } from 'lucide-react';
import type { Book, Category } from '@/types';

// Hooks
function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/api/categories');
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
  minRating?: number | null;
  page?: number;
  limit?: number;
}) {
  const { q, categoryId, minRating, page = 1, limit = 12 } = params;
  return useQuery<{ books: Book[]; totalPages: number }>({
    queryKey: ['books', q, categoryId, minRating, page, limit],
    queryFn: async () => {
      const searchParams: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (q) searchParams.q = q;
      if (categoryId) searchParams.categoryId = String(categoryId);
      if (minRating) searchParams.minRating = String(minRating);

      const { data } = await api.get('/api/books', { params: searchParams });
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

export default function BookExplorerPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read state from URL
  const qURL = searchParams.get('q') || '';
  const categoryIdURL = searchParams.get('categoryId')
    ? Number(searchParams.get('categoryId'))
    : null;
  const ratingURL = searchParams.get('minRating')
    ? Number(searchParams.get('minRating'))
    : null;

  const [q, setQ] = useState(qURL);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync back to URL
  const updateParams = (
    newQ: string,
    cat: number | null,
    rating: number | null
  ) => {
    const params = new URLSearchParams();
    if (newQ) params.set('q', newQ);
    if (cat) params.set('categoryId', String(cat));
    if (rating) params.set('minRating', String(rating));
    // Reset page on filter changes
    setCurrentPage(1);
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams(q, categoryIdURL, ratingURL);
  };

  const handleCategoryChange = (id: number | null) => {
    updateParams(qURL, id, ratingURL);
  };

  const handleRatingChange = (rating: number | null) => {
    updateParams(qURL, categoryIdURL, rating);
  };

  // Queries
  const categoriesQuery = useCategories();
  const booksQuery = useBooks({
    q: qURL,
    categoryId: categoryIdURL,
    minRating: ratingURL,
    page: currentPage,
    limit: 12,
  });

  const categories = categoriesQuery.data ?? [];
  const books = booksQuery.data?.books ?? [];
  const totalPages = booksQuery.data?.totalPages ?? 1;

  return (
    <div className='bg-neutral-50 min-h-screen'>
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between mb-8'>
          <h1 className='text-3xl font-bold text-neutral-900'>Book List</h1>

          {/* Mobile Filter Trigger */}
          <div className='lg:hidden'>
            <Dialog
              open={isMobileFilterOpen}
              onOpenChange={setIsMobileFilterOpen}
            >
              <DialogTrigger asChild>
                <Button variant='outline' className='flex items-center gap-2'>
                  <SlidersHorizontal className='h-4 w-4' />
                  <span>FILTER</span>
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-md max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                  <DialogTitle>Filters</DialogTitle>
                </DialogHeader>
                <div className='py-4'>
                  <BookFilters
                    categories={categories}
                    selectedCategoryId={categoryIdURL}
                    onCategoryChange={(val) => {
                      handleCategoryChange(val);
                      setIsMobileFilterOpen(false);
                    }}
                    selectedRating={ratingURL}
                    onRatingChange={(val) => {
                      handleRatingChange(val);
                      setIsMobileFilterOpen(false);
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className='flex gap-8'>
          {/* Desktop Sidebar Filters */}
          <div className='hidden lg:block w-64 shrink-0'>
            <div className='bg-white rounded-2xl border border-neutral-200 p-6 sticky top-24'>
              <BookFilters
                categories={categories}
                selectedCategoryId={categoryIdURL}
                onCategoryChange={handleCategoryChange}
                selectedRating={ratingURL}
                onRatingChange={handleRatingChange}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className='flex-1'>
            {/* Search Bar - local to page */}
            <form onSubmit={handleSearch} className='mb-8 relative'>
              <Search className='absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 h-5 w-5' />
              <input
                type='text'
                placeholder='Search book that you want...'
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className='w-full rounded-2xl border border-neutral-200 py-3 pl-12 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white shadow-sm'
              />
            </form>

            {/* Results Grid */}
            {booksQuery.isError ? (
              <div className='py-12 text-center text-red-500 rounded-xl bg-red-50'>
                Failed to load books. Please try again.
              </div>
            ) : booksQuery.isLoading && currentPage === 1 ? (
              <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4'>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className='rounded-xl border border-neutral-200 overflow-hidden bg-white'
                  >
                    <Skeleton className='aspect-3/4 w-full' />
                    <div className='p-3 space-y-2'>
                      <Skeleton className='h-4 w-3/4' />
                      <Skeleton className='h-3 w-1/2' />
                    </div>
                  </div>
                ))}
              </div>
            ) : books.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-neutral-200'>
                <p className='text-lg font-medium text-neutral-500'>
                  No books found
                </p>
                <p className='text-sm text-neutral-400 mt-1'>
                  Try adjusting your search or filters.
                </p>
              </div>
            ) : (
              <>
                <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4'>
                  {books.map((book: Book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className='mt-12 flex items-center justify-center'>
                    <Button
                      variant='outline'
                      size='lg'
                      onClick={() =>
                        setCurrentPage((p) => Math.min(p + 1, totalPages))
                      }
                      disabled={currentPage >= totalPages}
                      className='rounded-full px-12 py-6 text-sm font-semibold border-neutral-200 text-neutral-800 hover:bg-neutral-50 shadow-sm'
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
