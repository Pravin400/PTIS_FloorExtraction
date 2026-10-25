'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

export interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  return <ErrorPage error={error} reset={reset} />;
}
