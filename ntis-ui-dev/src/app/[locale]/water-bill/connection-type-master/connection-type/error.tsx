"use client";

import { ErrorPage } from "@/components/common";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ConnectionTypeError({ error, reset }: ErrorProps) {
  let message = error.message;
  if (
    message?.toLowerCase().includes("fetch failed") ||
    message?.toLowerCase().includes("failed to fetch") ||
    message?.toLowerCase().includes("server is unavailable")
  ) {
    message = "Server is unavailable. Please try again later.";
  }

  const friendlyError = { ...error, message };

  return (
    <ErrorPage
      error={friendlyError}
      reset={reset}
      translationNamespace="connectionTypeMaster.error"
    />
  );
}
