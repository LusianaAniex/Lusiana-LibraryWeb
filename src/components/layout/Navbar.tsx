import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { useLogout } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { useCartCount } from '@/hooks/useCart';
import { api } from '@/lib/axios';
import {
  Search,
  X,
  BookOpen,
  User,
  LogOut,
  LayoutDashboard,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setSearchQuery } from '@/store/uiSlice';
import { useDebounce } from '@/hooks/useDebounce';
import type { Book } from '@/types';

// Live profile — same ['me'] key as ProfilePage so the cache is shared
function useLiveProfile() {
  const { token } = useAppSelector((state) => state.auth);
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/api/me');
      return data?.data?.profile ?? null;
    },
    staleTime: 30_000,
    enabled: !!token,
  });
}

export default function Navbar() {
  const { isAuthenticated, user: reduxUser } = useAppSelector(
    (state) => state.auth
  );
  const searchQuery = useAppSelector((state) => state.ui.searchQuery);
  const dispatch = useDispatch();
  const logout = useLogout();
  const navigate = useNavigate();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Live profile for up-to-date avatar / name
  const { data: liveProfile } = useLiveProfile();
  const profile = liveProfile ?? reduxUser;

  // Cart badge
  const cartCount = useCartCount();

  // Search-as-you-type suggestions
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLFormElement>(null);

  const { data: searchResults, isFetching: isSearching } = useQuery<{
    books: Book[];
  }>({
    queryKey: ['search-books', debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery?.trim()) return { books: [] };
      const { data } = await api.get('/api/books', {
        params: { q: debouncedSearchQuery.trim(), limit: 5 },
      });
      const payload = data?.data;
      return {
        books: Array.isArray(payload?.books)
          ? payload.books
          : Array.isArray(payload)
            ? payload
            : [],
      };
    },
    enabled: !!debouncedSearchQuery?.trim() && showSuggestions,
  });

  // Handle clicking outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node) &&
        mobileSearchContainerRef.current &&
        !mobileSearchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(e.target.value));
    setShowSuggestions(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = (searchQuery ?? '').trim();
    if (q) navigate(`/books?q=${encodeURIComponent(q)}`);
  };

  const initial = profile?.name?.charAt(0)?.toUpperCase() ?? 'U';

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
          <div className='relative w-full' ref={searchContainerRef}>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400' />
            <Input
              placeholder='Search books...'
              value={searchQuery}
              onChange={handleSearch}
              onFocus={() => setShowSuggestions(true)}
              className='h-10 pl-9 rounded-lg border-neutral-200 bg-neutral-50 text-sm placeholder:text-neutral-400 focus-visible:ring-primary-600'
            />

            {/* Desktop Suggestions Dropdown */}
            {showSuggestions && debouncedSearchQuery?.trim() && (
              <div className='absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden z-50'>
                {isSearching ? (
                  <div className='p-4 text-sm text-neutral-500 text-center'>
                    Searching...
                  </div>
                ) : searchResults?.books && searchResults.books.length > 0 ? (
                  <div className='max-h-[60vh] overflow-y-auto'>
                    {searchResults.books.map((book) => (
                      <button
                        key={book.id}
                        type='button'
                        onClick={() => {
                          setShowSuggestions(false);
                          setMobileSearchOpen(false);
                          dispatch(setSearchQuery(book.title));
                          navigate(`/books/${book.id}`);
                        }}
                        className='w-full text-left px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-0 flex items-center gap-3 transition-colors cursor-pointer'
                      >
                        {book.coverImage ? (
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className='w-8 h-12 object-cover rounded shadow-sm'
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className='w-8 h-12 bg-neutral-100 rounded flex items-center justify-center shrink-0'>
                            <BookOpen size={14} className='text-neutral-400' />
                          </div>
                        )}
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-medium text-neutral-900 truncate'>
                            {book.title}
                          </p>
                          <p className='text-xs text-neutral-500 truncate'>
                            {book.author?.name || 'Unknown Author'}
                          </p>
                        </div>
                      </button>
                    ))}
                    <button
                      type='submit'
                      className='w-full text-center py-2 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors cursor-pointer'
                    >
                      View all results for "{debouncedSearchQuery}"
                    </button>
                  </div>
                ) : (
                  <div className='p-4 text-sm text-neutral-500 text-center'>
                    No books found.
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Right side */}
        <div className='flex items-center gap-3 sm:gap-2'>
          {/* Mobile search */}
          <button
            className='sm:hidden p-2 text-neutral-500 hover:text-neutral-700 cursor-pointer'
            onClick={() => setMobileSearchOpen(true)}
          >
            <Search size={20} />
          </button>

          {isAuthenticated && (
            /* Cart icon with badge (always visible since mobile now needs it here) */
            <button
              onClick={() => navigate('/cart')}
              className='relative p-2 text-neutral-500 hover:text-neutral-700 transition-colors cursor-pointer mr-2 sm:mr-0'
              title='My Cart'
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className='absolute -top-0.5 -right-0.5 h-4.5 min-w-4.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none'>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          )}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className='flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer'>
                  <Avatar className='h-9 w-9 border-2 border-primary-200 overflow-hidden'>
                    {profile?.profilePhoto && (
                      <AvatarImage
                        src={profile.profilePhoto}
                        alt={profile?.name ?? 'User'}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <AvatarFallback className='bg-primary-50 text-primary-600 font-semibold text-sm'>
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-48'>
                <div className='px-2 py-1.5'>
                  <p className='text-sm font-medium text-neutral-900'>
                    {profile?.name}
                  </p>
                  <p className='text-xs text-neutral-500'>{profile?.email}</p>
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
                <DropdownMenuItem
                  onClick={() => navigate('/cart')}
                  className='cursor-pointer'
                >
                  <ShoppingCart className='mr-2 h-4 w-4' />
                  My Cart
                </DropdownMenuItem>
                {profile?.role === 'ADMIN' && (
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

          {/* Removed Mobile Menu Toggle */}
        </div>
      </div>

      {/* Mobile Search Modal Overlay */}
      {mobileSearchOpen && (
        <div className='absolute inset-0 z-100 h-16 bg-white sm:hidden flex items-center px-4'>
          <form
            ref={mobileSearchContainerRef}
            onSubmit={(e) => {
              handleSearchSubmit(e);
              setMobileSearchOpen(false);
            }}
            className='w-full flex items-center gap-2 relative'
          >
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400' />
              <Input
                autoFocus
                placeholder='Search book...'
                value={searchQuery}
                onChange={(e) => {
                  handleSearch(e);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className='h-10 pl-9 rounded-full border-neutral-200 bg-neutral-50 text-sm'
              />

              {/* Mobile Suggestions Dropdown */}
              {showSuggestions && debouncedSearchQuery?.trim() && (
                <div className='absolute top-full left-0 right-0 mt-3 bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden z-110 mx-[-10px] w-[calc(100%+20px)]'>
                  {isSearching ? (
                    <div className='p-4 text-sm text-neutral-500 text-center'>
                      Searching...
                    </div>
                  ) : searchResults?.books && searchResults.books.length > 0 ? (
                    <div className='max-h-[60vh] overflow-y-auto'>
                      {searchResults.books.map((book) => (
                        <button
                          key={book.id}
                          type='button'
                          onClick={() => {
                            setShowSuggestions(false);
                            setMobileSearchOpen(false);
                            dispatch(setSearchQuery(book.title));
                            navigate(`/books/${book.id}`);
                          }}
                          className='w-full text-left px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-0 flex items-center gap-3 transition-colors cursor-pointer'
                        >
                          {book.coverImage ? (
                            <img
                              src={book.coverImage}
                              alt={book.title}
                              className='w-10 h-14 object-cover rounded shadow-sm'
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className='w-10 h-14 bg-neutral-100 rounded flex items-center justify-center shrink-0'>
                              <BookOpen
                                size={16}
                                className='text-neutral-400'
                              />
                            </div>
                          )}
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium text-neutral-900 truncate'>
                              {book.title}
                            </p>
                            <p className='text-xs text-neutral-500 truncate'>
                              {book.author?.name || 'Unknown Author'}
                            </p>
                          </div>
                        </button>
                      ))}
                      <button
                        type='submit'
                        className='w-full text-center py-3 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors cursor-pointer'
                      >
                        View all results for "{debouncedSearchQuery}"
                      </button>
                    </div>
                  ) : (
                    <div className='p-4 text-sm text-neutral-500 text-center'>
                      No books found.
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type='button'
              onClick={() => {
                setMobileSearchOpen(false);
                setShowSuggestions(false);
              }}
              className='p-2 text-neutral-500 cursor-pointer hover:bg-neutral-100 rounded-full'
            >
              <X size={20} />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
