"use client";

import ErrorPage from "@/components/common/ErrorPage";

export default function DepartmentActivationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage error={error} reset={reset} />;
}
