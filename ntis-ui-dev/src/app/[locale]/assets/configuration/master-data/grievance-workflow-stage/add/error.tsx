"use client";

import { ErrorPage } from "@/components/common";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GrievanceWorkflowStageMasterAddError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      reset={reset}
      translationNamespace="grievanceWorkflowStageMaster.error"
    />
  );
}
