'use client';

import { ErrorPage } from "@/components/common/ErrorPage";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return <ErrorPage error={error} reset={reset} translationNamespace="taxZoning.error" />;
}
