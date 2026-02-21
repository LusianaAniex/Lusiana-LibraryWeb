import { useState } from 'react';
// Admin Book List Page
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { useDeleteBook } from '@/hooks/useBooksAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import BookFormDialog from '@/components/admin/BookFormDialog';
import { Search, Star } from 'lucide-react';
import type { Book } from '@/types';

function useBooks(params: { q?: string; page?: number }) {
  const { q, page = 1 } = params;
  return useQuery<{ books: Book[]; totalPages: number }>({
    queryKey: ['books', 'admin', q, page],
    queryFn: async () => {
      const searchParams: Record<string, string> = {
        page: String(page),
        limit: '10',
      };
      if (q) searchParams.q = q;
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

export default function BookListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [bookToPreview, setBookToPreview] = useState<Book | null>(null);

  const booksQuery = useBooks({
    q: searchQuery || undefined,
    page: currentPage,
  });

  const deleteBook = useDeleteBook();

  const books = booksQuery.data?.books ?? [];
  const totalPages = booksQuery.data?.totalPages ?? 1;

  const filteredBooks = books.filter((book) => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Available') return book.availableCopies > 0;
    if (statusFilter === 'Borrowed') return book.availableCopies <= 0;
    if (statusFilter === 'Returned')
      return book.borrowCount > 0 && book.availableCopies === book.totalCopies;
    return true;
  });

  const handleEdit = (book: Book) => {
    setSelectedBook(book);
    setIsFormOpen(true);
  };

  const handlePreview = (book: Book) => {
    setBookToPreview(book);
    setIsPreviewOpen(true);
  };

  const handleDeleteClick = (book: Book) => {
    setBookToDelete(book);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (bookToDelete) {
      deleteBook.mutate(bookToDelete.id, {
        onSuccess: () => setIsDeleteDialogOpen(false),
      });
    }
  };

  const handleCreate = () => {
    setSelectedBook(null);
    setIsFormOpen(true);
  };

  return (
    <div className='min-h-screen bg-neutral-50 px-4 py-8 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-7xl'>
        {/* Header */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8'>
          <div>
            <h1 className='text-2xl font-bold text-neutral-900'>Book List</h1>
            <p className='text-sm text-neutral-500'>
              Manage your library inventory
            </p>
          </div>
          <div className='flex items-center gap-3'>
            {/* User profile typically in Navbar, reused here if design demands, skipping for now */}
          </div>
        </div>

        {/* Add Book & Search */}
        <div className='mb-6 flex flex-col gap-4'>
          <div>
            <Button
              onClick={handleCreate}
              className='bg-[#1a4a98] hover:bg-blue-800 text-white rounded-full px-6'
            >
              Add Book
            </Button>
          </div>
          <div className='relative w-full max-w-md'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400' />
            <Input
              placeholder='Search book'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9 bg-neutral-50/50 border-neutral-200 rounded-full'
            />
          </div>
        </div>

        {/* Filters */}
        <div className='mb-6 flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 hide-scrollbar'>
          {['All', 'Available', 'Borrowed', 'Returned'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-full px-3 sm:px-5 py-1.5 text-xs sm:text-sm font-medium transition-colors border whitespace-nowrap ${
                statusFilter === tab
                  ? 'border-blue-200 text-blue-600 bg-blue-50/50'
                  : 'border-neutral-200 text-neutral-600 bg-neutral-50/50 hover:bg-neutral-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Book Cards */}
        <div className='flex flex-col gap-4'>
          {booksQuery.isLoading ? (
            <div className='space-y-4'>
              <Skeleton className='h-32 w-full rounded-2xl' />
              <Skeleton className='h-32 w-full rounded-2xl' />
              <Skeleton className='h-32 w-full rounded-2xl' />
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className='p-12 text-center text-neutral-500 bg-white rounded-2xl border border-neutral-200'>
              No books found.
            </div>
          ) : (
            filteredBooks.map((book) => (
              <div
                key={book.id}
                className='flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-neutral-200 rounded-2xl gap-4 shadow-sm'
              >
                {/* Info block */}
                <div className='flex gap-4'>
                  <div className='h-24 w-16 shrink-0 overflow-hidden rounded bg-neutral-100 border border-neutral-200 shadow-sm'>
                    {book.coverImage ? (
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className='h-full w-full object-cover'
                      />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center text-neutral-300'>
                        📚
                      </div>
                    )}
                  </div>
                  <div className='flex flex-col justify-center'>
                    {book.category?.name && (
                      <Badge className='w-fit bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border-none rounded-md px-2 py-0 mb-1 font-medium'>
                        {book.category.name}
                      </Badge>
                    )}
                    <h3 className='font-semibold text-neutral-900 text-base line-clamp-1'>
                      {book.title}
                    </h3>
                    <p className='text-sm text-neutral-500 mb-1'>
                      {book.author?.name || 'Unknown'}
                    </p>
                    <div className='flex items-center gap-1 mt-auto'>
                      <Star className='h-3.5 w-3.5 fill-yellow-400 text-yellow-400' />
                      <span className='text-xs font-semibold text-neutral-700'>
                        {book.rating ? book.rating.toFixed(1) : '0.0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions block */}
                <div className='flex items-center gap-2 sm:ml-auto self-end sm:self-center'>
                  <Button
                    variant='outline'
                    onClick={() => handlePreview(book)}
                    className='rounded-full px-5 text-sm h-9 border-neutral-200 text-neutral-700'
                  >
                    Preview
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => handleEdit(book)}
                    className='rounded-full px-5 text-sm h-9 border-neutral-200 text-neutral-700'
                  >
                    Edit
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => handleDeleteClick(book)}
                    className='rounded-full px-5 text-sm h-9 border-neutral-200 text-red-600 hover:text-red-700 hover:bg-red-50'
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='mt-6 flex items-center justify-end gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
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
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Forms & Modals */}
      <BookFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        book={selectedBook}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className='sm:max-w-md rounded-3xl p-8 outline-none'>
          <DialogHeader className='text-center space-y-3 mb-4'>
            <DialogTitle className='text-xl font-bold text-center'>
              Delete Data
            </DialogTitle>
            <DialogDescription className='text-center text-neutral-900 font-medium text-base'>
              Once deleted, you won't be able to recover this data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='flex flex-row justify-center sm:justify-center gap-4 border-none mt-2'>
            <Button
              variant='outline'
              onClick={() => setIsDeleteDialogOpen(false)}
              className='rounded-full px-8 py-2 min-w-[120px] font-medium border-neutral-300 text-neutral-700'
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className='rounded-full px-8 py-2 min-w-[120px] font-medium bg-[#ec1f79] hover:bg-[#d5196c] text-white'
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Book Details</DialogTitle>
            <DialogDescription className='sr-only'>
              Detailed information about the selected book.
            </DialogDescription>
          </DialogHeader>
          {bookToPreview && (
            <div className='flex flex-col md:flex-row gap-6 mt-4'>
              <div className='w-full md:w-1/3 shrink-0'>
                <div className='aspect-2/3 w-full overflow-hidden rounded-lg bg-neutral-100 border border-neutral-200'>
                  {bookToPreview.coverImage ? (
                    <img
                      src={bookToPreview.coverImage}
                      alt={bookToPreview.title}
                      className='h-full w-full object-cover'
                    />
                  ) : (
                    <div className='flex h-full w-full items-center justify-center text-neutral-300'>
                      <Star className='h-8 w-8' />
                    </div>
                  )}
                </div>
              </div>
              <div className='flex-1 flex flex-col'>
                <h2 className='text-2xl font-bold text-neutral-900 mb-1'>
                  {bookToPreview.title}
                </h2>
                <p className='text-neutral-500 mb-4'>
                  By{' '}
                  <span className='font-medium text-neutral-700'>
                    {bookToPreview.author?.name || 'Unknown Author'}
                  </span>
                </p>

                <div className='grid grid-cols-2 gap-4 mb-6'>
                  <div className='bg-neutral-50 p-3 rounded-lg border border-neutral-100'>
                    <p className='text-xs text-neutral-500 uppercase tracking-wider mb-1'>
                      Category
                    </p>
                    <p className='font-medium text-neutral-900'>
                      {bookToPreview.category?.name || 'Uncategorized'}
                    </p>
                  </div>
                  <div className='bg-neutral-50 p-3 rounded-lg border border-neutral-100'>
                    <p className='text-xs text-neutral-500 uppercase tracking-wider mb-1'>
                      Rating
                    </p>
                    <div className='flex items-center gap-1'>
                      <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                      <span className='font-medium text-neutral-900'>
                        {bookToPreview.rating
                          ? bookToPreview.rating.toFixed(1)
                          : '0.0'}
                      </span>
                    </div>
                  </div>
                  <div className='bg-neutral-50 p-3 rounded-lg border border-neutral-100'>
                    <p className='text-xs text-neutral-500 uppercase tracking-wider mb-1'>
                      Available
                    </p>
                    <p className='font-medium text-neutral-900'>
                      {bookToPreview.availableCopies} Copies
                    </p>
                  </div>
                  <div className='bg-neutral-50 p-3 rounded-lg border border-neutral-100'>
                    <p className='text-xs text-neutral-500 uppercase tracking-wider mb-1'>
                      Total
                    </p>
                    <p className='font-medium text-neutral-900'>
                      {bookToPreview.totalCopies} Copies
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className='font-semibold text-neutral-900 mb-2'>
                    Description
                  </h3>
                  <p className='text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto pr-2'>
                    {bookToPreview.description ||
                      'No description available for this book.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
