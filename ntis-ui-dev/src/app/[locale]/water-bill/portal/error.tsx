"use client";

import { ErrorPage, type ErrorPageProps } from "@/components/common";

export default function PortalError(props: ErrorPageProps) {
  return <ErrorPage {...props} translationNamespace="common.error" />;
}
