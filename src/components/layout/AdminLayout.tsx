import { Link, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  Tag,
  PenTool,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Authors', href: '/admin/authors', icon: PenTool },
  { label: 'Books', href: '/admin/books', icon: BookOpen },
  { label: 'Loans', href: '/admin/loans', icon: FileText },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Categories', href: '/admin/categories', icon: Tag },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className='min-h-screen flex bg-neutral-50'>
      {/* Sidebar */}
      <aside className='hidden md:flex w-60 shrink-0 bg-white border-r border-neutral-200 flex-col'>
        <div className='h-16 flex items-center px-6 border-b border-neutral-100'>
          <Link to='/' className='flex items-center gap-2'>
            <BookOpen className='h-5 w-5 text-primary-600' />
            <span className='font-bold text-neutral-900'>Booky Admin</span>
          </Link>
        </div>
        <nav className='flex-1 p-4 space-y-1'>
          {navItems.map((item) => {
            const active = item.exact
              ? location.pathname === item.href
              : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                )}
              >
                <item.icon className='h-4 w-4 shrink-0' />
                {item.label}
                {active && <ChevronRight className='ml-auto h-4 w-4' />}
              </Link>
            );
          })}
        </nav>
        <div className='p-4 border-t border-neutral-100'>
          <Link
            to='/'
            className='flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700'
          >
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className='flex-1 flex flex-col min-w-0'>
        {/* Mobile top bar */}
        <div className='md:hidden h-14 bg-white border-b border-neutral-200 flex items-center gap-4 px-4'>
          {navItems.map((item) => {
            const active = item.exact
              ? location.pathname === item.href
              : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-1 text-xs font-medium py-1 border-b-2 transition-colors',
                  active
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                )}
              >
                <item.icon className='h-3.5 w-3.5' />
                {item.label}
              </Link>
            );
          })}
        </div>

        <main className='flex-1 p-6 lg:p-8'>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
