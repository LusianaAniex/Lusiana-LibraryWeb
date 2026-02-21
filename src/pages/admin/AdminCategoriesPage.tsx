import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import type { Category } from '@/types';

// ── Hooks ────────────────────────────────────────────────────────────────────

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
  });
}

function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post('/api/categories', { name }),
    onSuccess: () => {
      toast.success('Category created');
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: Error) => {
      const axiosError = err as import('axios').AxiosError<{
        message?: string;
      }>;
      toast.error(
        axiosError.response?.data?.message || 'Failed to create category'
      );
    },
  });
}

function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      api.put(`/api/categories/${id}`, { name }),
    onSuccess: () => {
      toast.success('Category updated');
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: Error) => {
      const axiosError = err as import('axios').AxiosError<{
        message?: string;
      }>;
      toast.error(
        axiosError.response?.data?.message || 'Failed to update category'
      );
    },
  });
}

function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/categories/${id}`),
    onSuccess: () => {
      toast.success('Category deleted');
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: Error) => {
      // Backend blocks delete when category still has books
      const axiosError = err as import('axios').AxiosError<{
        message?: string;
      }>;
      toast.error(
        axiosError.response?.data?.message ||
          'Cannot delete — category still has books'
      );
    },
  });
}

// ── Edit Dialog ───────────────────────────────────────────────────────────────

function EditCategoryDialog({
  category,
  onClose,
}: {
  category: Category;
  onClose: () => void;
}) {
  const [name, setName] = useState(category.name);
  const update = useUpdateCategory();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    update.mutate(
      { id: category.id, name: name.trim() },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>Rename the category below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4 pt-2'>
          <div className='space-y-2'>
            <Label htmlFor='cat-name'>Name</Label>
            <Input
              id='cat-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. Science Fiction'
              autoFocus
            />
          </div>
          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={update.isPending || !name.trim()}>
              {update.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminCategoriesPage() {
  const { data: categories = [], isLoading, isError } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createCategory.mutate(newName.trim(), {
      onSuccess: () => setNewName(''),
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteCategory.mutate(confirmDelete.id, {
      onSuccess: () => setConfirmDelete(null),
      onError: () => setConfirmDelete(null),
    });
  };

  return (
    <div className='max-w-3xl mx-auto'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-neutral-900'>Categories</h1>
        <p className='text-neutral-500 mt-1'>
          Manage book categories available in the library
        </p>
      </div>

      {/* Create form */}
      <div className='bg-white rounded-xl border border-neutral-200 p-6 mb-6'>
        <h2 className='text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2'>
          <Plus className='h-4 w-4 text-primary-600' />
          Add New Category
        </h2>
        <form onSubmit={handleCreate} className='flex gap-3'>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder='e.g. Science Fiction'
            className='flex-1'
          />
          <Button
            type='submit'
            disabled={createCategory.isPending || !newName.trim()}
          >
            {createCategory.isPending ? 'Adding…' : 'Add Category'}
          </Button>
        </form>
      </div>

      {/* Category list */}
      <div className='bg-white rounded-xl border border-neutral-200 overflow-hidden'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-neutral-100'>
          <h2 className='text-sm font-semibold text-neutral-700 flex items-center gap-2'>
            <Tag className='h-4 w-4 text-neutral-400' />
            All Categories
          </h2>
          {!isLoading && <Badge variant='secondary'>{categories.length}</Badge>}
        </div>

        {isLoading ? (
          <div className='p-6 space-y-3'>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className='h-10 w-full rounded-lg' />
            ))}
          </div>
        ) : isError ? (
          <div className='flex flex-col items-center gap-3 py-16 text-neutral-400'>
            <AlertTriangle className='h-8 w-8' />
            <p className='text-sm'>Failed to load categories</p>
          </div>
        ) : categories.length === 0 ? (
          <div className='flex flex-col items-center gap-3 py-16 text-neutral-400'>
            <Tag className='h-8 w-8' />
            <p className='text-sm'>No categories yet — add one above</p>
          </div>
        ) : (
          <ul className='divide-y divide-neutral-100'>
            {categories.map((cat) => (
              <li
                key={cat.id}
                className='flex items-center justify-between px-6 py-3 hover:bg-neutral-50 transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <span className='h-7 w-7 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 text-xs font-bold'>
                    {cat.name.charAt(0).toUpperCase()}
                  </span>
                  <span className='text-sm font-medium text-neutral-800'>
                    {cat.name}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => setEditing(cat)}
                    className='h-8 w-8 p-0 text-neutral-500 hover:text-primary-700'
                  >
                    <Pencil className='h-3.5 w-3.5' />
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => setConfirmDelete(cat)}
                    className='h-8 w-8 p-0 text-neutral-500 hover:text-red-600'
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Edit dialog */}
      {editing && (
        <EditCategoryDialog
          category={editing}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <Dialog open onOpenChange={(o) => !o && setConfirmDelete(null)}>
          <DialogContent className='sm:max-w-sm'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2 text-red-600'>
                <Trash2 className='h-5 w-5' />
                Delete Category
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{' '}
                <strong>&ldquo;{confirmDelete.name}&rdquo;</strong>? This cannot
                be undone. The operation will fail if books still belong to this
                category.
              </DialogDescription>
            </DialogHeader>
            <div className='flex justify-end gap-2 pt-2'>
              <Button
                variant='outline'
                onClick={() => setConfirmDelete(null)}
                disabled={deleteCategory.isPending}
              >
                Cancel
              </Button>
              <Button
                variant='destructive'
                onClick={handleDelete}
                disabled={deleteCategory.isPending}
              >
                {deleteCategory.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
