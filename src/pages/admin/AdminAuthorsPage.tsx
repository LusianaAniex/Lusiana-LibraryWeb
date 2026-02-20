import { useState } from 'react';
import { useAuthors, useDeleteAuthor } from '@/hooks/useAuthorsAdmin';
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
import AuthorFormDialog from '@/components/admin/AuthorFormDialog';
import { Search, Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import type { Author } from '@/types';

export default function AdminAuthorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [authorToDelete, setAuthorToDelete] = useState<Author | null>(null);

  const authorsQuery = useAuthors();
  const deleteAuthor = useDeleteAuthor();

  const authors = authorsQuery.data ?? [];
  const filteredAuthors = authors.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (author: Author) => {
    setSelectedAuthor(author);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (author: Author) => {
    setAuthorToDelete(author);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (authorToDelete) {
      deleteAuthor.mutate(authorToDelete.id, {
        onSuccess: () => setIsDeleteDialogOpen(false),
      });
    }
  };

  const handleCreate = () => {
    setSelectedAuthor(null);
    setIsFormOpen(true);
  };

  return (
    <div className='min-h-screen bg-neutral-50 px-4 py-8 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-7xl'>
        {/* Header */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8'>
          <div>
            <h1 className='text-2xl font-bold text-neutral-900'>
              Authors List
            </h1>
            <p className='text-sm text-neutral-500'>
              Manage the authors available in the library
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl shadow-sm border border-neutral-100'>
          <div className='relative flex-1 max-w-md'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400' />
            <Input
              placeholder='Search authors by name...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9 bg-neutral-50 border-neutral-200'
            />
          </div>
          <Button
            onClick={handleCreate}
            className='bg-primary-600 hover:bg-primary-700 text-white shrink-0'
          >
            <Plus className='mr-2 h-4 w-4' /> Add Author
          </Button>
        </div>

        {/* Table */}
        <div className='rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden'>
          <table className='w-full text-left text-sm'>
            <thead className='bg-neutral-50 border-b border-neutral-200'>
              <tr>
                <th className='px-6 py-4 font-semibold text-neutral-900'>
                  Author Profile
                </th>
                <th className='px-6 py-4 font-semibold text-neutral-900'>
                  Total Books
                </th>
                <th className='px-6 py-4 font-semibold text-neutral-900 text-right'>
                  Action
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-neutral-100'>
              {authorsQuery.isLoading ? (
                <tr>
                  <td colSpan={3} className='p-6'>
                    <div className='flex flex-col gap-2'>
                      <Skeleton className='h-12 w-full' />
                      <Skeleton className='h-12 w-full' />
                      <Skeleton className='h-12 w-full' />
                    </div>
                  </td>
                </tr>
              ) : filteredAuthors.length === 0 ? (
                <tr>
                  <td colSpan={3} className='p-12 text-center text-neutral-500'>
                    No authors found.
                  </td>
                </tr>
              ) : (
                filteredAuthors.map((author) => (
                  <tr
                    key={author.id}
                    className='hover:bg-neutral-50 transition-colors'
                  >
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-4'>
                        <div className='h-12 w-12 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100'>
                          {(author as any).profilePhoto ? (
                            <img
                              src={(author as any).profilePhoto}
                              alt={author.name}
                              className='h-full w-full object-cover'
                            />
                          ) : (
                            <div className='flex h-full w-full items-center justify-center text-neutral-400 font-bold'>
                              {author.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className='font-medium text-neutral-900'>
                            {author.name}
                          </p>
                          <p className='text-xs text-neutral-500 line-clamp-1 max-w-sm'>
                            {author.bio || 'No biography available'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='inline-flex items-center justify-center bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium text-xs border border-blue-200'>
                        {author.bookCount || 0} Books
                      </span>
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
                          <DropdownMenuItem onClick={() => handleEdit(author)}>
                            <Edit className='mr-2 h-4 w-4' /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(author)}
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
      </div>

      {/* Forms & Modals */}
      <AuthorFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        author={selectedAuthor}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Author</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{authorToDelete?.name}"? This
              action cannot be undone and might fail if the author has
              associated books.
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
              {deleteAuthor.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
