import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  FileText,
  TrendingUp,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function StatCard({
  title,
  label,
  value,
  icon: Icon,
  color,
  href,
}: {
  title: string;
  label: string;
  value?: number | string;
  icon: React.ElementType;
  color: string;
  href: string;
}) {
  return (
    <Link
      to={href}
      className='bg-white rounded-xl border border-neutral-200 p-6 flex items-center gap-4 hover:shadow-md transition-shadow'
    >
      <div
        className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center ${color}`}
      >
        <Icon className='h-6 w-6' />
      </div>
      <div>
        <h3 className='text-lg font-bold text-neutral-900'>{title}</h3>
        <div className='text-sm text-neutral-500 mt-1 flex items-center gap-2'>
          {value === undefined ? (
            <Skeleton className='h-4 w-8 inline-block' />
          ) : (
            <span className='font-semibold text-neutral-900'>{value}</span>
          )}
          <span>{label}</span>
        </div>
      </div>
    </Link>
  );
}

function useAdminOverview() {
  return useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const { data } = await api.get('/api/admin/overview');
      // Shape: { data: { totalBooks, totalLoans, totalUsers, overdueLoans, ... } }
      return data?.data ?? {};
    },
  });
}

export default function AdminDashboardPage() {
  const { data: overview, isLoading } = useAdminOverview();

  return (
    <div className='max-w-5xl mx-auto'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-neutral-900'>Dashboard</h1>
        <p className='text-neutral-500 mt-1'>Library overview at a glance</p>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10'>
        <StatCard
          title='Book List'
          label='Total Books'
          value={isLoading ? undefined : overview?.totalBooks}
          icon={BookOpen}
          color='bg-blue-50 text-blue-600'
          href='/admin/books'
        />
        <StatCard
          title='Borrowed List'
          label='Total Loans'
          value={isLoading ? undefined : overview?.totalLoans}
          icon={FileText}
          color='bg-emerald-50 text-emerald-600'
          href='/admin/loans'
        />
        <StatCard
          title='User'
          label='Registered Users'
          value={isLoading ? undefined : overview?.totalUsers}
          icon={Users}
          color='bg-violet-50 text-violet-600'
          href='/admin/users'
        />
        <StatCard
          title='Overdue Loans'
          label='Overdue Loans'
          value={isLoading ? undefined : overview?.overdueLoans}
          icon={AlertTriangle}
          color='bg-red-50 text-red-600'
          href='/admin/loans?status=LATE'
        />
      </div>

      {/* Quick links */}
      <div className='bg-white rounded-xl border border-neutral-200 p-6'>
        <h2 className='text-base font-semibold text-neutral-900 mb-4'>
          Quick Actions
        </h2>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          <Link
            to='/admin/books'
            className='flex items-center gap-3 p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors'
          >
            <TrendingUp className='h-5 w-5 text-primary-600' />
            <div>
              <p className='font-medium text-neutral-900 text-sm'>
                Manage Books
              </p>
              <p className='text-xs text-neutral-500'>
                Add, edit, or remove books
              </p>
            </div>
          </Link>
          <Link
            to='/admin/loans'
            className='flex items-center gap-3 p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors'
          >
            <Clock className='h-5 w-5 text-primary-600' />
            <div>
              <p className='font-medium text-neutral-900 text-sm'>
                Manage Loans
              </p>
              <p className='text-xs text-neutral-500'>
                View and manage all loans
              </p>
            </div>
          </Link>
          <Link
            to='/admin/users'
            className='flex items-center gap-3 p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors'
          >
            <Users className='h-5 w-5 text-primary-600' />
            <div>
              <p className='font-medium text-neutral-900 text-sm'>View Users</p>
              <p className='text-xs text-neutral-500'>
                Browse registered users
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
