"use client";

import { ErrorPage } from "@/components/common";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function WaterConnectionMasterError({ error, reset }: ErrorProps) {
  // Map technical error to user-friendly message
  let message = error.message;
  if (
    message?.toLowerCase().includes("fetch failed") ||
    message?.toLowerCase().includes("failed to fetch") ||
    message?.toLowerCase().includes("server is unavailable")
  ) {
    message = "Server is unavailable. Please try again later.";
  }

  // Create a new error object with the friendly message
  const friendlyError = { ...error, message };

  return (
    <ErrorPage
      error={friendlyError}
      reset={reset}
      translationNamespace="waterConnectionMaster.error"
    />
  );
}
