import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import type { Book, Review, CreateReviewRequest } from '@/types';

// Fetch single book details
export function useBookDetail(bookId: string | undefined) {
  return useQuery<Book>({
    queryKey: ['book', bookId],
    queryFn: async () => {
      if (!bookId) throw new Error('Book ID is required');
      const { data } = await api.get(`/api/books/${bookId}`);
      // Backend: { success, message, data: { ...bookObj } }
      return data?.data;
    },
    enabled: !!bookId,
  });
}

// Fetch reviews for a book
export function useBookReviews(bookId: string | undefined) {
  return useQuery<Review[]>({
    queryKey: ['reviews', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      const { data } = await api.get(`/api/reviews/book/${bookId}`);
      // Backend: { success, message, data: { bookId, reviews: [...], pagination } }
      const payload = data?.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.reviews)) return payload.reviews;
      return [];
    },
    enabled: !!bookId,
  });
}

// Add a review
export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateReviewRequest) => {
      return api.post('/api/reviews', payload);
    },
    onSuccess: (_, variables) => {
      toast.success('Review submitted successfully');
      queryClient.invalidateQueries({
        queryKey: ['reviews', String(variables.bookId)],
      });
      queryClient.invalidateQueries({
        queryKey: ['book', String(variables.bookId)],
      });
    },
    onError: (error: Error) => {
      const axiosError = error as import('axios').AxiosError<{
        message?: string;
      }>;
      toast.error(
        axiosError.response?.data?.message || 'Failed to submit review'
      );
    },
  });
}

// Borrow a book
export function useBorrowBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookId: number) => {
      return api.post('/api/loans', { bookId });
    },
    onMutate: async (bookId: number) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['book', String(bookId)] });

      // Snapshot previous data
      const previousBook = queryClient.getQueryData<Book>([
        'book',
        String(bookId),
      ]);

      // Optimistically update
      if (previousBook) {
        queryClient.setQueryData<Book>(['book', String(bookId)], {
          ...previousBook,
          availableCopies: Math.max(0, previousBook.availableCopies - 1),
        });
      }

      return { previousBook };
    },
    onSuccess: () => {
      toast.success('Book borrowed successfully!');
      queryClient.invalidateQueries({ queryKey: ['my-loans'] });
    },
    onError: (error: Error, bookId, context) => {
      const axiosError = error as import('axios').AxiosError<{
        message?: string;
      }>;
      toast.error(
        axiosError.response?.data?.message || 'Failed to borrow book'
      );

      // Rollback if error
      if (context?.previousBook) {
        queryClient.setQueryData(
          ['book', String(bookId)],
          context.previousBook
        );
      }
    },
    onSettled: (_, __, bookId) => {
      // sync with server
      queryClient.invalidateQueries({ queryKey: ['book', String(bookId)] });
    },
  });
}
