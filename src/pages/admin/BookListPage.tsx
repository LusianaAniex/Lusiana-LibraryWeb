import { useState } from 'react';
// Admin Book List Page
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { useDeleteBook } from '@/hooks/useBooksAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Search, Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
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

  const booksQuery = useBooks({
    q: searchQuery || undefined,
    page: currentPage,
  });

  const deleteBook = useDeleteBook();

  const books = booksQuery.data?.books ?? [];
  const totalPages = booksQuery.data?.totalPages ?? 1;

  const handleEdit = (book: Book) => {
    setSelectedBook(book);
    setIsFormOpen(true);
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

        {/* Toolbar */}
        <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl shadow-sm border border-neutral-100'>
          <div className='relative flex-1 max-w-md'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400' />
            <Input
              placeholder='Search book...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9 bg-neutral-50 border-neutral-200'
            />
          </div>
          <Button
            onClick={handleCreate}
            className='bg-primary-600 hover:bg-primary-700 text-white shrink-0'
          >
            <Plus className='mr-2 h-4 w-4' /> Add Book
          </Button>
        </div>

        {/* Tabs (Visual only for MVP if backend doesn't support status filter) */}
        <div className='mb-6 flex gap-2 overflow-x-auto pb-2'>
          {['All', 'Available', 'Borrowed', 'Returned'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === tab
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className='rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden'>
          <table className='w-full text-left text-sm'>
            <thead className='bg-neutral-50 border-b border-neutral-200'>
              <tr>
                <th className='px-6 py-4 font-semibold text-neutral-900'>
                  Book Name
                </th>
                <th className='px-6 py-4 font-semibold text-neutral-900'>
                  Status
                </th>
                <th className='px-6 py-4 font-semibold text-neutral-900 text-right'>
                  Action
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-neutral-100'>
              {booksQuery.isLoading ? (
                <tr>
                  <td colSpan={3} className='p-6'>
                    <div className='flex flex-col gap-2'>
                      <Skeleton className='h-12 w-full' />
                      <Skeleton className='h-12 w-full' />
                      <Skeleton className='h-12 w-full' />
                    </div>
                  </td>
                </tr>
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={3} className='p-12 text-center text-neutral-500'>
                    No books found.
                  </td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr
                    key={book.id}
                    className='hover:bg-neutral-50 transition-colors'
                  >
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-4'>
                        <div className='h-16 w-12 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100'>
                          {book.coverImage ? (
                            <img
                              src={book.coverImage}
                              alt=''
                              className='h-full w-full object-cover'
                            />
                          ) : (
                            <div className='flex h-full w-full items-center justify-center text-neutral-300'>
                              📚
                            </div>
                          )}
                        </div>
                        <div>
                          <p className='font-medium text-neutral-900 line-clamp-1'>
                            {book.title}
                          </p>
                          <p className='text-xs text-neutral-500'>
                            {book.author?.name || 'Unknown'}
                          </p>
                          <p className='text-xs text-neutral-400 mt-1'>
                            {book.category?.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      {book.availableCopies > 0 ? (
                        <Badge className='bg-green-100 text-green-700 hover:bg-green-100 border-none shadow-none font-medium'>
                          Available
                        </Badge>
                      ) : (
                        <Badge className='bg-orange-100 text-orange-700 hover:bg-orange-100 border-none shadow-none font-medium'>
                          Borrowed
                        </Badge>
                      )}
                    </td>
                    <td className='px-6 py-4 text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            className='h-8 w-8 p-0 text-neutral-500'
                          >
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => handleEdit(book)}>
                            <Edit className='mr-2 h-4 w-4' /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(book)}
                            className='text-red-600 focus:text-red-700'
                          >
                            <Trash2 className='mr-2 h-4 w-4' /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Book</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{bookToDelete?.title}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant='destructive' onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
