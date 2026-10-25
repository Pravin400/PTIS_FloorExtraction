"use client";

import { useLocale, useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Button, Card, CardContent, PageContainer } from "@/components/common";
import { resolveSearchErrorMessage } from "@/lib/api/property-search/resolve-search-error-message";
import type { PropertySearchErrorProps } from "@/types/property-search";

export default function Error({ error, reset }: PropertySearchErrorProps) {
  const t = useTranslations("propertySearch.error");
  const locale = useLocale();
  const reason = resolveSearchErrorMessage(error);

  return (
    <PageContainer>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>

              <h2 className="text-xl font-semibold text-gray-900">
                {t("loadFailedTitle")}
              </h2>

              <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-4 py-3 w-full">
                {reason}
              </p>

              <p className="text-sm text-gray-600">{t("description")}</p>

              {error.digest && (
                <p className="text-xs text-gray-500">{t("errorId", { id: error.digest })}</p>
              )}

              <div className="flex gap-3 mt-2">
                <Button variant="secondary" onClick={() => (window.location.href = `/${locale}`)}>
                  {t("goHome")}
                </Button>
                <Button onClick={reset}>{t("tryAgain")}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
