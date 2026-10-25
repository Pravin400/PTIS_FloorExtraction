'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ShieldAlert } from 'lucide-react';
import { Button } from './ActionButton';
import { Card, CardContent } from './Card';
import { PageContainer } from './PageContainer';

export function UnauthorizedPage() {
  const t = useTranslations('common');
  const locale = useLocale();
  const defaultHomeUrl = `/${locale}/home`;

  return (
    <PageContainer>
      <div className="flex items-center justify-center min-h-[60vh] py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
        <Card className="w-full max-w-md border border-red-100/50 shadow-2xl relative overflow-hidden bg-white/85 backdrop-blur-md">
          {/* Top aesthetic gradient accent strip */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-600" />

          <CardContent className="p-8 md:p-10">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Shield Alert Icon with Premium Pulse Ripple effect */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-red-100/60 animate-ping opacity-75 scale-125" />
                <div className="relative rounded-full bg-red-50 p-4 border border-red-100">
                  <ShieldAlert className="h-10 w-10 text-red-600 animate-pulse" />
                </div>
              </div>

              {/* Message Header */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
                  {t('errors.noAccess') ||
                    'You do not have the required permissions to view this screen. Please contact your system administrator.'}
                </h2>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-gray-100/80 my-2" />

              {/* Action Buttons */}
              <div className="w-full pt-2">
                <Button
                  className="w-full bg-[#4b70a6] hover:bg-[#3b5984] text-white font-medium py-2.5 px-4 rounded-lg shadow-sm hover:shadow transition-all duration-200"
                  onClick={() => (window.location.href = defaultHomeUrl)}
                >
                  {t('error.goHome') || 'Go Back Home'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export default UnauthorizedPage;
