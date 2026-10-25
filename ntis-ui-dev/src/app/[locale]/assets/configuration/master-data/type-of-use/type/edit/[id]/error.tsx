"use client";

import { ErrorPage } from "@/components/common";

export default function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorPage error={error} reset={reset} />;
}
