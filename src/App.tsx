import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import MainLayout from '@/components/layout/MainLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import HomePage from '@/pages/HomePage';
import './App.css';

// Lazy-loaded pages
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const BookExplorerPage = lazy(() => import('@/pages/BookExplorerPage'));
const BookDetailPage = lazy(() => import('@/pages/BookDetailPage'));
const AuthorDetailPage = lazy(() => import('@/pages/AuthorDetailPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));

// Admin pages
const AdminDashboardPage = lazy(
  () => import('@/pages/admin/AdminDashboardPage')
);
const BookListPage = lazy(() => import('@/pages/admin/BookListPage'));
const AdminLoansPage = lazy(() => import('@/pages/admin/AdminLoansPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminCategoriesPage = lazy(
  () => import('@/pages/admin/AdminCategoriesPage')
);
const AdminAuthorsPage = lazy(() => import('@/pages/admin/AdminAuthorsPage'));

function PageLoader() {
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600' />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public auth routes */}
          <Route path='/login' element={<LoginPage />} />
          <Route path='/register' element={<RegisterPage />} />

          {/* Main app routes */}
          <Route element={<MainLayout />}>
            <Route path='/' element={<HomePage />} />
            <Route path='/books' element={<BookExplorerPage />} />
            <Route path='/books/:id' element={<BookDetailPage />} />
            <Route path='/authors/:id' element={<AuthorDetailPage />} />
            <Route
              path='/profile'
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path='/cart'
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path='/checkout'
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Admin routes — own layout, admin-only */}
          <Route
            path='/admin'
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path='authors' element={<AdminAuthorsPage />} />
            <Route path='books' element={<BookListPage />} />
            <Route path='loans' element={<AdminLoansPage />} />
            <Route path='users' element={<AdminUsersPage />} />
            <Route path='categories' element={<AdminCategoriesPage />} />
          </Route>

          {/* Catch-all */}
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </Suspense>
      <Toaster position='top-right' richColors />
    </ErrorBoundary>
  );
}

export default App;
