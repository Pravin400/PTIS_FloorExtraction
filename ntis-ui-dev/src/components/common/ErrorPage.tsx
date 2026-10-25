'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import { logger } from '@/lib/utils/logger';
import { Button } from './ActionButton';
import { Card, CardContent } from './Card';
import { PageContainer } from './PageContainer';

export interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Translation namespace for error messages. Defaults to 'common.error' */
  translationNamespace?: string;
  /** Custom home URL. Defaults to locale root */
  homeUrl?: string;
}

/**
 * Reusable error page component for Next.js error boundaries.
 *
 * @example
 * // In error.tsx file:
 * export default function Error({ error, reset }: ErrorProps) {
 *   return <ErrorPage error={error} reset={reset} />;
 * }
 *
 * @example
 * // With custom translation namespace:
 * <ErrorPage
 *   error={error}
 *   reset={reset}
 *   translationNamespace="construction.constructionType.error"
 * />
 */
export function ErrorPage({
  error,
  reset,
  translationNamespace = 'common.error',
  homeUrl,
}: ErrorPageProps) {
  const t = useTranslations(translationNamespace);
  const locale = useLocale();
  const defaultHomeUrl = `/${locale}`;

  useEffect(() => {
    // Log the error to an error reporting service
    logger.error('Page error occurred', {
      error,
      digest: error.digest,
      namespace: translationNamespace,
    });
  }, [error, translationNamespace]);

  const getCleanedMessage = () => {
    if (!error?.message) return t('description');

    // In production, Next.js masks server component errors with digest / internal URLs
    if (error.digest && process.env.NODE_ENV === 'production') {
      return t('description');
    }

    let cleanMsg = error.message.trim();
    if (cleanMsg.includes(':')) {
      const parts = cleanMsg.split(':');
      cleanMsg = parts.slice(1).join(':').trim();
    }

    // Dynamic pattern identifying internal framework noise, URLs, stack traces, network codes, or minified links
    const TECHNICAL_ERROR_PATTERN = /(?:https?:\/\/|\/\/|react\.dev|webpack|digest|econnrefused|failed to fetch|fetch failed|timeout|internal server error|something went wrong|unexpected error|unknown error|कुछ गलत|काहीतरी चूक)/i;

    if (!cleanMsg || TECHNICAL_ERROR_PATTERN.test(cleanMsg) || /^[/{<[]/.test(cleanMsg)) {
      return t('description');
    }

    return cleanMsg;
  };

  const displayMessage = getCleanedMessage();

  return (
    <PageContainer>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Error Icon */}
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>

              {/* Error Title */}
              <h2 className="text-2xl font-semibold text-gray-900">{t('title')}</h2>

              {/* Error Description */}
              <p className="text-gray-600">{displayMessage}</p>

              {/* Error Details (development only) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="w-full mt-4 p-4 bg-gray-100 rounded-md text-left">
                  <p className="text-sm font-mono text-gray-800 break-words">{displayMessage}</p>
                  {error.digest && (
                    <p className="text-xs text-gray-600 mt-2">
                      {t('errorId', { id: error.digest })}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => (window.location.href = homeUrl || defaultHomeUrl)}
                >
                  {t('goHome')}
                </Button>
                <Button onClick={reset}>{t('tryAgain')}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export default ErrorPage;
