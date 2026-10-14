import { Suspense } from 'react';
import { ErrorBoundary } from '@mfe/shared/react';

/**
 * Same isolation wrapper as A's shell: an error boundary and a Suspense boundary per
 * micro frontend, so one failing MFE does not take down the header, footer or other MFEs.
 * The Suspense boundary also matters for SSR: an error inside it is retried on the client
 * and caught by the boundary instead of failing the whole HTML response.
 */
export default function Mfe({ name, children }) {
  return (
    <ErrorBoundary name={name}>
      <Suspense fallback={<div className="mfe-loading" aria-busy="true" />}>{children}</Suspense>
    </ErrorBoundary>
  );
}
