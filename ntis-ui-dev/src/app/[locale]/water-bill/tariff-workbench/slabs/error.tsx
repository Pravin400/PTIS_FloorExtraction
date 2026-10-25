'use client';

import { ErrorPage, type ErrorPageProps } from "@/components/common";

export default function TariffSlabsError(props: ErrorPageProps) {
  return <ErrorPage {...props} translationNamespace="tariffWorkbench.error" />;
}
