"use client";

import { ErrorPage } from "@/components/common";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TapStatusError({ error, reset }: ErrorProps) {
  return <ErrorPage error={error} reset={reset} />;
}
