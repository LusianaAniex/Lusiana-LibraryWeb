import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import type { User, Review } from '@/types';

export function useProfileStats() {
  return useQuery({
    queryKey: ['profile-stats'],
    queryFn: async () => {
      const { data } = await api.get('/api/me');
      // Confirmed shape: { data: { profile: {...}, loanStats: { borrowed, late, returned, total }, reviewsCount } }
      const stats = data?.data?.loanStats;
      return {
        totalBorrowed: stats?.total ?? 0,
        activeLoans: stats?.borrowed ?? 0,
        reviewsWritten: data?.data?.reviewsCount ?? 0,
        averageRating: 0,
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
    mutationFn: async (body: Partial<User> & { profilePhoto?: string }) => {
      return api.patch('/api/me', body);
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      // Refresh the ProfilePage live-user query
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });
}
