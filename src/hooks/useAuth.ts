import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setCredentials, logout as logoutAction } from '@/store/authSlice';
import { api } from '@/lib/axios';
import type { LoginRequest, RegisterRequest, LoginResponse } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

export function useLogin() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await api.post('/api/auth/login', data);
      // Backend: { success, message, data: { user, token } }
      const payload = response.data?.data ?? response.data;
      return payload as LoginResponse;
    },
    onSuccess: (data) => {
      dispatch(setCredentials({ user: data.user, token: data.token }));
      const from =
        (location.state as { from?: { pathname: string } })?.from?.pathname ||
        '/';
      navigate(from, { replace: true });
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await api.post('/api/auth/register', data);
      return response.data;
    },
    onSuccess: () => {
      // After registration, redirect to login
      navigate('/login');
    },
  });
}

export function useLogout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return () => {
    dispatch(logoutAction());
    queryClient.clear();
    navigate('/login', { replace: true });
  };
}
