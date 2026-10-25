"use client";

import { LoadingPage } from "@/components/common";
import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("ageFactorMaster.defaults");
  return (
    <LoadingPage 
      translationNamespace="ageFactorMaster.loading" 
      aliases={{ assessment: t("assessment"), constructionType: t("constructionType") }}
    />
  );
}
