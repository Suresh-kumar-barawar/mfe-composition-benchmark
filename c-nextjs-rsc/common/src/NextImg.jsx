import Image from 'next/image';

/**
 * next/image adapter for the image experiment (C_NEXT_IMAGE=1). Takes the same props the shared
 * components give a plain <img> and lets Next.js resize the image, serve WebP/AVIF, lazy-load
 * off-screen images and preload the important one.
 */
export default function NextImg({ src, alt, width, height, loading, fetchpriority, ...rest }) {
  const w = Number(width);
  const priority = fetchpriority === 'high' || loading === 'eager';
  const sizes = w >= 500 ? '(max-width: 800px) 100vw, 50vw' : '(max-width: 800px) 50vw, 25vw';
  return <Image src={src} alt={alt} width={w} height={Number(height)} sizes={sizes} priority={priority} {...rest} />;
}
