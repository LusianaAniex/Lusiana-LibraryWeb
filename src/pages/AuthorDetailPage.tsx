import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Skeleton } from '@/components/ui/skeleton';
import { BookCard } from '@/components/books/BookCard';
import { Book as BookIcon } from 'lucide-react';
import type { Author, Book } from '@/types';

function useAuthorProfile(authorId: string) {
  return useQuery<{ author: Author; books: Book[] }>({
    queryKey: ['author', authorId],
    queryFn: async () => {
      // Typically backends provide an author by ID.
      // E.g. /api/authors/:id  and /api/books?authorId=:id
      const res = await api.get(`/api/authors/${authorId}/books`);
      const payload = res.data?.data;

      const author = payload?.author || null;
      const books = Array.isArray(payload?.books) ? payload.books : [];

      return { author, books };
    },
    enabled: !!authorId,
  });
}

export default function AuthorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useAuthorProfile(id || '');

  if (isLoading) {
    return (
      <div className='min-h-screen bg-neutral-50 p-6 lg:p-12'>
        <div className='max-w-4xl mx-auto'>
          <Skeleton className='h-48 w-full rounded-2xl mb-8' />
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='aspect-3/4 w-full rounded-xl' />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data?.author) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center p-6'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-neutral-900'>
            Author Not Found
          </h2>
          <p className='text-neutral-500 mt-2'>
            The author you are looking for does not exist.
          </p>
        </div>
      </div>
    );
  }

  const { author, books } = data;

  return (
    <div className='min-h-screen bg-neutral-50 pb-12'>
      {/* Header Profile Section */}
      <div className='bg-white border-b border-neutral-200'>
        <div className='max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8'>
          <div className='flex flex-col md:flex-row items-center md:items-start gap-6'>
            <div className='h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-white shadow-md bg-neutral-100'>
              {(author as any).profilePhoto ? (
                <img
                  src={(author as any).profilePhoto}
                  alt={author.name}
                  className='h-full w-full object-cover'
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center text-primary-600 bg-primary-50 font-bold text-4xl'>
                  {author.name.charAt(0)}
                </div>
              )}
            </div>
            <div className='flex-1 text-center md:text-left mt-2 md:mt-4'>
              <h1 className='text-3xl font-bold text-neutral-900'>
                {author.name}
              </h1>
              <div className='flex items-center justify-center md:justify-start gap-2 mt-2 text-neutral-500'>
                <BookIcon className='h-4 w-4' />
                <span className='font-medium text-sm'>
                  {books.length} {books.length === 1 ? 'book' : 'books'}
                </span>
              </div>
              {author.bio && (
                <p className='mt-4 text-sm text-neutral-600 max-w-2xl leading-relaxed'>
                  {author.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Book List Section */}
      <div className='max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8'>
        <h2 className='text-xl font-bold text-neutral-900 mb-6'>Book List</h2>
        {books.length === 0 ? (
          <div className='text-center py-12 bg-white rounded-xl border border-neutral-200'>
            <p className='text-neutral-500'>No books found for this author.</p>
          </div>
        ) : (
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4'>
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
