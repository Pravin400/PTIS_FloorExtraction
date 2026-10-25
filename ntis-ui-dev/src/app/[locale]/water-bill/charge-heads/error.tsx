'use client';

import { ErrorPage, type ErrorPageProps } from "@/components/common";

export default function ChargeHeadsError(props: ErrorPageProps) {
  return <ErrorPage {...props} translationNamespace="chargeHeads.error" />;
}
