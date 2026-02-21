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
          <p className='text-sm md:text-md font-semibold text-neutral-950 max-w-sm md:max-w-4xl mb-6'>
            Discover inspiring stories & timeless knowledge, ready to borrow
            anytime. Explore online or visit our nearest library branch.
          </p>

          <h3 className='text-md font-bold text-neutral-950 mb-6'>
            Follow on Social Media
          </h3>

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
                className='flex h-14 w-14 items-center justify-center rounded-full border-2 border-neutral-200 transition-colors hover:border-neutral-300 hover:bg-neutral-50'
                aria-label={social.label}
              >
                <img
                  src={social.icon}
                  alt={social.label}
                  className='h-6 w-6 brightness-0'
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
