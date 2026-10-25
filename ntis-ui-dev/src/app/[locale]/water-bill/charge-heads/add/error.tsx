'use client';
import { ErrorPage, type ErrorPageProps } from "@/components/common";

export default function ChargeHeadsAddError(props: ErrorPageProps) {
  return <ErrorPage {...props} translationNamespace="chargeHeads.error" />;
}
