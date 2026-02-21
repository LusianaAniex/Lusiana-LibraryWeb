import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import type { Author } from '@/types';

// Admin Hooks

export function useAuthors() {
  return useQuery<Author[]>({
    queryKey: ['authors'],
    queryFn: async () => {
      // Fetch authors and books concurrently to compute book counts
      const [authorsRes, booksRes] = await Promise.all([
        api.get('/api/authors'),
        api.get('/api/books', { params: { pageSize: 100 } }).catch(() => null),
      ]);

      let authorsList: Author[] = [];
      const authorsPayload = authorsRes.data?.data;
      if (Array.isArray(authorsPayload)) authorsList = authorsPayload;
      else if (Array.isArray(authorsPayload?.authors))
        authorsList = authorsPayload.authors;

      const booksPayload = booksRes?.data?.data;
      const booksList = Array.isArray(booksPayload)
        ? booksPayload
        : Array.isArray(booksPayload?.books)
          ? booksPayload.books
          : [];

      const authorCounts = new Map<number, number>();
      booksList.forEach((b: import('@/types').Book) => {
        const authorId = b.author?.id || b.authorId;
        if (authorId) {
          authorCounts.set(authorId, (authorCounts.get(authorId) || 0) + 1);
        }
      });

      return authorsList.map((author) => ({
        ...author,
        bookCount: authorCounts.get(author.id) || 0,
      }));
    },
  });
}

export function useCreateAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Author>) => {
      return api.post('/api/authors', data);
    },
    onSuccess: () => {
      toast.success('Author created successfully');
      queryClient.invalidateQueries({ queryKey: ['authors'] });
    },
    onError: (error: Error) => {
      const axiosError = error as import('axios').AxiosError<{
        message?: string;
      }>;
      toast.error(
        axiosError.response?.data?.message || 'Failed to create author'
      );
    },
  });
}

export function useUpdateAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Author> }) => {
      return api.put(`/api/authors/${id}`, data);
    },
    onSuccess: () => {
      toast.success('Author updated successfully');
      queryClient.invalidateQueries({ queryKey: ['authors'] });
    },
    onError: (error: Error) => {
      const axiosError = error as import('axios').AxiosError<{
        message?: string;
      }>;
      toast.error(
        axiosError.response?.data?.message || 'Failed to update author'
      );
    },
  });
}

export function useDeleteAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/api/authors/${id}`);
    },
    onSuccess: () => {
      toast.success('Author deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['authors'] });
    },
    onError: (error: Error) => {
      const axiosError = error as import('axios').AxiosError<{
        message?: string;
      }>;
      toast.error(
        axiosError.response?.data?.message || 'Failed to delete author'
      );
    },
  });
}
