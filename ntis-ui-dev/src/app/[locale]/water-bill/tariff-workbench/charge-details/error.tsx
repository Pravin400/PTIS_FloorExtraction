'use client';

import { ErrorPage, type ErrorPageProps } from "@/components/common";

export default function TariffChargeDetailsError(props: ErrorPageProps) {
  return <ErrorPage {...props} translationNamespace="tariffWorkbench.error" />;
}
