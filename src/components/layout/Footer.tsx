export default function Footer() {
  return (
    <footer className='border-t border-neutral-200 bg-white'>
      <div className='mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8'>
        <div className='flex flex-col items-center text-center'>
          {/* Logo */}
          <div className='flex items-center gap-2 mb-4'>
            <img src='/logos/main-logo.svg' alt='Booky' className='h-7 w-7' />
            <span className='text-xl font-bold text-primary-600'>Booky</span>
          </div>

          {/* Description */}
          <p className='text-sm text-neutral-500 max-w-md mb-6'>
            Discover books, grow your knowledge, reach far beyond. This library
            is open for everyone to read & learn.
          </p>

          <p className='text-xs text-neutral-400 mb-4'>
            Follow us on Social Media
          </p>

          {/* Social links */}
          <div className='flex items-center gap-4'>
            {[
              { label: 'Facebook', icon: '/logos/facebook-icon.svg' },
              { label: 'Instagram', icon: '/logos/instagram-icon.svg' },
              { label: 'LinkedIn', icon: '/logos/linkedin-icon.svg' },
              { label: 'TikTok', icon: '/logos/tiktok-icon.svg' },
            ].map((social) => (
              <a
                key={social.label}
                href='#'
                className='flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 transition-colors hover:border-primary-600'
                aria-label={social.label}
              >
                <img src={social.icon} alt={social.label} className='h-4 w-4' />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
