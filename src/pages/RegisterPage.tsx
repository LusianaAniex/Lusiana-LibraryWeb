import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegister } from '@/hooks/useAuth';
import { type AxiosError } from 'axios';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const registerMutation = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    registerMutation.mutate(
      { name, email, password, phone: phone || undefined },
      {
        onSuccess: () => {
          toast.success('Account created! Please login.');
        },
        onError: (error: Error) => {
          const axiosError = error as AxiosError<{ message?: string }>;
          toast.error(
            axiosError.response?.data?.message ||
              'Registration failed. Please try again.'
          );
        },
      }
    );
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-white px-4'>
      <div className='w-full max-w-[400px]'>
        {/* Logo */}
        <div className='mb-8 flex items-center gap-2'>
          <img src='/logos/main-logo.svg' alt='Booky' className='h-8 w-8' />
          <span className='text-display-xs font-bold text-primary-600'>
            Booky
          </span>
        </div>

        {/* Heading */}
        <h1 className='text-display-sm font-bold text-neutral-900 mb-2'>
          Create Account
        </h1>
        <p className='text-md text-neutral-500 mb-8'>
          Sign up to start borrowing books.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-5'>
          <div className='space-y-1.5'>
            <Label
              htmlFor='name'
              className='text-sm font-medium text-neutral-700'
            >
              Full Name
            </Label>
            <Input
              id='name'
              type='text'
              placeholder='Enter your full name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='h-11 rounded-lg border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-primary-600'
              disabled={registerMutation.isPending}
            />
          </div>

          <div className='space-y-1.5'>
            <Label
              htmlFor='email'
              className='text-sm font-medium text-neutral-700'
            >
              Email
            </Label>
            <Input
              id='email'
              type='email'
              placeholder='Enter your email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='h-11 rounded-lg border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-primary-600'
              disabled={registerMutation.isPending}
            />
          </div>

          <div className='space-y-1.5'>
            <Label
              htmlFor='phone'
              className='text-sm font-medium text-neutral-700'
            >
              Phone <span className='text-neutral-400'>(optional)</span>
            </Label>
            <Input
              id='phone'
              type='tel'
              placeholder='Enter your phone number'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className='h-11 rounded-lg border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-primary-600'
              disabled={registerMutation.isPending}
            />
          </div>

          <div className='space-y-1.5'>
            <Label
              htmlFor='password'
              className='text-sm font-medium text-neutral-700'
            >
              Password
            </Label>
            <div className='relative'>
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                placeholder='Minimum 6 characters'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='h-11 rounded-lg border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-primary-600 pr-10'
                disabled={registerMutation.isPending}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors'
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type='submit'
            disabled={registerMutation.isPending}
            className='w-full h-11 rounded-lg bg-primary-600 text-white font-semibold text-md hover:bg-primary-600/90 transition-colors cursor-pointer'
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Creating account...
              </>
            ) : (
              'Sign Up'
            )}
          </Button>
        </form>

        {/* Login link */}
        <p className='mt-6 text-center text-sm text-neutral-500'>
          Already have an account?{' '}
          <Link
            to='/login'
            className='font-semibold text-primary-600 hover:underline'
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
