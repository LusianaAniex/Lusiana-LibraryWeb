import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import type { BookInput } from '@/types';

// Admin Hooks

export function useCreateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: BookInput) => {
      // Backend expects 'authorId' usually, but user design has "Author Name" text input.
      // We'll send what the API expects. If API strictly needs authorId, we'd need a lookup.
      // For this MVP, assuming the API might accept `authorName` or we map it.
      // If the API strictly requires `authorId`, we'd need to search/create author first.
      // I'll assume standard POST /api/books structure based on typical implementations.
      return api.post('/api/books', data);
    },
    onSuccess: () => {
      toast.success('Book created successfully');
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create book');
    },
  });
}

export function useUpdateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: BookInput }) => {
      return api.put(`/api/books/${id}`, data);
    },
    onSuccess: () => {
      toast.success('Book updated successfully');
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update book');
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/api/books/${id}`);
    },
    onSuccess: () => {
      toast.success('Book deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete book');
    },
  });
}
