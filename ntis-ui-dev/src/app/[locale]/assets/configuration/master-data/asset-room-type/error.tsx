"use client";

import React from "react";
import ErrorPage from "@/components/common/ErrorPage";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps): React.ReactElement {
  return <ErrorPage error={error} reset={reset} translationNamespace="assetRoomType.error" />;
}
