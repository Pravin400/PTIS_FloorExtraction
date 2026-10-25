"use client";

import { useEffect } from "react";
import { logger } from "@/lib/utils/logger";
import { PageContainer } from "@/components/common";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ErrorBoundary({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const tCommon = useTranslations('common');

  useEffect(() => {
    logger.error("Financial Year Master route error:", { error });
  }, [error]);

  const errorMsg = error.message?.toLowerCase() || '';
  const isUnauthorized = errorMsg.includes('unauthorized') || errorMsg.includes('token');
  const messageKey = isUnauthorized ? 'errors.unauthorized' : 'errors.noAccess';

  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-white rounded-xl border border-gray-200/80 shadow-sm animate-in fade-in duration-300">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4 animate-bounce" />
        <h3 className="text-lg font-semibold text-gray-900">{tCommon(messageKey)}</h3>
      </div>
    </PageContainer>
  );
}
