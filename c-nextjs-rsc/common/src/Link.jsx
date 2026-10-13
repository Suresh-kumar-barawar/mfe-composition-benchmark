import NextLink from 'next/link';

/**
 * Adapter so shared components can use `href` with Next.js client-side navigation.
 * prefetch={false}: A and B do not prefetch other pages, so background prefetching
 * is switched off in the main benchmark to keep request counts comparable.
 */
export default function Link(props) {
  return <NextLink prefetch={false} {...props} />;
}
