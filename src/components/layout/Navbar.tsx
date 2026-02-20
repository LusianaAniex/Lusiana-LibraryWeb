import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { useLogout } from '@/hooks/useAuth';
import {
  Search,
  Menu,
  X,
  BookOpen,
  User,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { setSearchQuery } from '@/store/uiSlice';

export default function Navbar() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const searchQuery = useAppSelector((state) => state.ui.searchQuery);
  const dispatch = useAppDispatch();
  const logout = useLogout();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(e.target.value));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className='sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/80'>
      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8'>
        {/* Logo */}
        <Link to='/' className='flex items-center gap-2 shrink-0'>
          <img src='/logos/main-logo.svg' alt='Booky' className='h-7 w-7' />
          <span className='text-xl font-bold text-primary-600'>Booky</span>
        </Link>

        {/* Search – Desktop */}
        <form
          onSubmit={handleSearchSubmit}
          className='hidden sm:flex flex-1 max-w-md mx-4'
        >
          <div className='relative w-full'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400' />
            <Input
              placeholder='Search books...'
              value={searchQuery}
              onChange={handleSearch}
              className='h-10 pl-9 rounded-lg border-neutral-200 bg-neutral-50 text-sm placeholder:text-neutral-400 focus-visible:ring-primary-600'
            />
          </div>
        </form>

        {/* Right side */}
        <div className='flex items-center gap-3'>
          {/* Mobile search button */}
          <button className='sm:hidden p-2 text-neutral-500 hover:text-neutral-700'>
            <Search size={20} />
          </button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className='flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer'>
                  <Avatar className='h-9 w-9 border-2 border-primary-200'>
                    <AvatarFallback className='bg-primary-50 text-primary-600 font-semibold text-sm'>
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-48'>
                <div className='px-2 py-1.5'>
                  <p className='text-sm font-medium text-neutral-900'>
                    {user?.name}
                  </p>
                  <p className='text-xs text-neutral-500'>{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate('/profile')}
                  className='cursor-pointer'
                >
                  <User className='mr-2 h-4 w-4' />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/my-loans')}
                  className='cursor-pointer'
                >
                  <BookOpen className='mr-2 h-4 w-4' />
                  My Loans
                </DropdownMenuItem>
                {user?.role === 'ADMIN' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate('/admin')}
                      className='cursor-pointer text-primary-600'
                    >
                      <LayoutDashboard className='mr-2 h-4 w-4' />
                      Admin Dashboard
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className='cursor-pointer text-accent-red'
                >
                  <LogOut className='mr-2 h-4 w-4' />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className='flex items-center gap-2'>
              <Button
                variant='ghost'
                onClick={() => navigate('/login')}
                className='text-sm font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer'
              >
                Login
              </Button>
              <Button
                onClick={() => navigate('/register')}
                className='bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-600/90 cursor-pointer'
              >
                Join Now
              </Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className='sm:hidden p-2 text-neutral-500 hover:text-neutral-700'
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className='sm:hidden border-t border-neutral-200 bg-white px-4 py-3 space-y-3'>
          <form onSubmit={handleSearchSubmit}>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400' />
              <Input
                placeholder='Search books...'
                value={searchQuery}
                onChange={handleSearch}
                className='h-10 pl-9 rounded-lg border-neutral-200 bg-neutral-50 text-sm'
              />
            </div>
          </form>
          {isAuthenticated && (
            <div className='space-y-1'>
              <button
                onClick={() => {
                  navigate('/profile');
                  setMobileMenuOpen(false);
                }}
                className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50'
              >
                <User size={16} /> My Profile
              </button>
              <button
                onClick={() => {
                  navigate('/my-loans');
                  setMobileMenuOpen(false);
                }}
                className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50'
              >
                <BookOpen size={16} /> My Loans
              </button>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-accent-red hover:bg-red-50'
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
