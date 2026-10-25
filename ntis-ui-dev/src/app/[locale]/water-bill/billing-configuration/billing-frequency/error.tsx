'use client';

import { ErrorPage, type ErrorPageProps } from "@/components/common";

export default function BillingFrequencyMasterError(props: ErrorPageProps) {
  return <ErrorPage {...props} translationNamespace="billingFrequencyMaster.error" />;
}
