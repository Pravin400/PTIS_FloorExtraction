'use client';

import { ErrorPage, type ErrorPageProps } from "@/components/common";

export default function ChargeHeadsEditError(props: ErrorPageProps) {
  return <ErrorPage {...props} translationNamespace="chargeHeads.error" />;
}
