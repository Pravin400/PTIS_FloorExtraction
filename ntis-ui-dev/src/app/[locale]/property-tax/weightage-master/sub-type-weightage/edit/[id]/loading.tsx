"use client";

import { LoadingPage } from "@/components/common";
import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("useCategoryFactorMaster.defaults");
  return (
    <LoadingPage 
      translationNamespace="useCategoryFactorMaster.loading" 
      aliases={{ use: t("use"), category: t("category") }}
    />
  );
}
