import { useState, useEffect } from 'react';

const heroImages = [
  '/images/hero-image.png',
  '/images/hero-image-carousel.jpg',
  '/images/hero-image-carousel2.jpeg',
  '/images/hero-image-carousel3.jpg',
];

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000); // 5 seconds autoplay

    return () => clearInterval(timer);
  }, []);

  return (
    <div className='relative w-full flex flex-col items-center'>
      {/* Carousel Image container */}
      <div className='relative w-full overflow-hidden rounded-xl bg-primary-100 flex items-center justify-center min-h-[250px] sm:min-h-[350px]'>
        {heroImages.map((src, index) => (
          <div
            key={src}
            className={`absolute top-0 left-0 w-full h-full transition-opacity duration-700 ease-in-out flex items-center justify-center ${
              index === currentIndex
                ? 'opacity-100 relative'
                : 'opacity-0 absolute'
            }`}
          >
            <img
              src={src}
              alt={`Welcome to Booky slide ${index + 1}`}
              className='max-h-full max-w-full object-contain drop-shadow-lg'
            />
          </div>
        ))}
        {/* Keeping original Text over default image if it was overlaid, but looking at design it seems the image HAS text built-in or text is separate. 
            The current HomePage code had text separate then an image on the right. 
            But the new design shows the whole Hero banner IS an image with text "Welcome to Booky" inside the graphic, 
            or text superimposed on a background. We'll assume the hero images provided are the full banners.
        */}
      </div>

      {/* Pagination Dots */}
      <div className='mt-4 flex gap-2'>
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2.5 rounded-full transition-all cursor-pointer ${
              index === currentIndex
                ? 'w-6 bg-primary-600'
                : 'w-2.5 bg-neutral-300 hover:bg-neutral-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
