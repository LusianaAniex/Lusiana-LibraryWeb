import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import type { Loan, LoanFilters } from '@/types';

export function useMyLoans(filters: LoanFilters) {
  return useQuery<Loan[]>({
    queryKey: ['my-loans', filters],
    queryFn: async () => {
      const { data } = await api.get('/api/loans/my', { params: filters });
      // Backend: { success, message, data: { loans: [...], pagination } }
      //       or: { success, message, data: [...] }
      const payload = data?.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.loans)) return payload.loans;
      return [];
    },
  });
}

export function useReturnBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (loanId: number) => {
      return api.patch(`/api/loans/${loanId}/return`);
    },
    onSuccess: () => {
      toast.success('Book returned successfully');
      queryClient.invalidateQueries({ queryKey: ['my-loans'] });
    },
    onError: (error: Error) => {
      const axiosError = error as import('axios').AxiosError<{
        message?: string;
      }>;
      toast.error(
        axiosError.response?.data?.message || 'Failed to return book'
      );
    },
  });
}
