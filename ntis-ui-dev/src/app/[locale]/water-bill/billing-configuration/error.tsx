'use client';

import { ErrorPage, type ErrorPageProps } from "@/components/common";

export default function BillingConfigurationError(props: ErrorPageProps) {
  return <ErrorPage {...props} translationNamespace="billingFrequencyMaster.billingConfiguration.error" />;
}
