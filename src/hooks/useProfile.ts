import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import type { User, Review } from '@/types';

export function useProfileStats() {
  return useQuery({
    queryKey: ['profile-stats'],
    queryFn: async () => {
      const { data } = await api.get('/api/me');
      // Backend: { success, message, data: { ...userWithStats } }
      const user = data?.data;
      return {
        totalBorrowed: user?.totalBorrowed ?? user?.borrowCount ?? 0,
        activeLoans: user?.activeLoans ?? 0,
        reviewsWritten: user?.reviewsWritten ?? user?.reviewCount ?? 0,
        averageRating: user?.averageRating ?? 0,
      };
    },
  });
}

export function useMyReviews() {
  return useQuery<Review[]>({
    queryKey: ['my-reviews'],
    queryFn: async () => {
      const { data } = await api.get('/api/me/reviews');
      // Backend: { success, message, data: { reviews: [...], pagination } }
      //       or: { success, message, data: [...] }
      const payload = data?.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.reviews)) return payload.reviews;
      return [];
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<User>) => {
      return api.patch('/api/me', body);
    },
    onSuccess: (response) => {
      toast.success('Profile updated successfully');
      queryClient.setQueryData(['auth_user'], response.data?.data);
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });
}
