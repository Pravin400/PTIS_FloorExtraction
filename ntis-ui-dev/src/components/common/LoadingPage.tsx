'use client';

import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { PageContainer } from './PageContainer';
import { Card, CardContent } from './Card';

export interface LoadingPageProps {
  /** Translation namespace for loading messages. Defaults to 'common.loading' */
  translationNamespace?: string;
  /** Custom loading message key. Defaults to 'message' */
  messageKey?: string;
  /** Custom description key. Defaults to 'description' */
  descriptionKey?: string;
  /** Translation aliases for dynamically formatted messages */
  aliases?: Record<string, string>;
}

/**
 * Reusable loading page component for Next.js loading.tsx files.
 *
 * @example
 * // In loading.tsx file:
 * export default function Loading() {
 *   return <LoadingPage />;
 * }
 *
 * @example
 * // With custom translation namespace:
 * export default function Loading() {
 *   return (
 *     <LoadingPage
 *       translationNamespace="taxZone.loading"
 *     />
 *   );
 * }
 */
export function LoadingPage({
  translationNamespace = 'common.loading',
  messageKey = 'message',
  descriptionKey = 'description',
  aliases,
}: LoadingPageProps) {
  const t = useTranslations(translationNamespace);

  return (
    <PageContainer>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Loading Spinner */}
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />

              {/* Loading Message */}
              <h2 className="text-xl font-semibold text-gray-900">
                {t(messageKey, aliases)}
              </h2>

              {/* Loading Description */}
              <p className="text-gray-600 text-sm">
                {t(descriptionKey, aliases)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export default LoadingPage;
