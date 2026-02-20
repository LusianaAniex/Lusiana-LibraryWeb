import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import type { Cart } from '@/types';

// ── Fetch cart ────────────────────────────────────────────────────────────────
export function useCart() {
  return useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await api.get('/api/cart');
      // Shape: { success, message, data: { cartId, items: [...], itemCount } }
      return data?.data ?? { cartId: 0, items: [], itemCount: 0 };
    },
  });
}

// ── Cart item count (for Navbar badge) ────────────────────────────────────────
export function useCartCount(): number {
  const { data } = useCart();
  return data?.itemCount ?? data?.items?.length ?? 0;
}

// ── Add book to cart ──────────────────────────────────────────────────────────
export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookId: number) => {
      return api.post('/api/cart/items', { bookId });
    },
    onSuccess: () => {
      toast.success('Added to cart');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    },
  });
}

// ── Remove item from cart ─────────────────────────────────────────────────────
export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: number) => {
      return api.delete(`/api/cart/items/${itemId}`);
    },
    onSuccess: () => {
      toast.success('Removed from cart');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove item');
    },
  });
}

// ── Clear entire cart ─────────────────────────────────────────────────────────
export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return api.delete('/api/cart');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to clear cart');
    },
  });
}

// ── Borrow from cart (checkout) ────────────────────────────────────────────────
export function useBorrowFromCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      itemIds: number[];
      borrowDate: string; // YYYY-MM-DD
      duration: 3 | 5 | 10;
    }) => {
      return api.post('/api/loans/from-cart', {
        itemIds: payload.itemIds,
        borrowDate: payload.borrowDate,
        days: payload.duration,
      });
    },
    onSuccess: () => {
      toast.success('Books borrowed successfully!');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['my-loans'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to confirm borrow');
    },
  });
}
