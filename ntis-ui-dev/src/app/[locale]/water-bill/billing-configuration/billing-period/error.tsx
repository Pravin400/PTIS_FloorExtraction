'use client';

import { ErrorPage, type ErrorPageProps } from "@/components/common";

export default function BillingPeriodMasterError(props: ErrorPageProps) {
  return <ErrorPage {...props} translationNamespace="billingPeriodMaster.error" />;
}
