'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/common';
import { logger } from '@/lib/utils/logger';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Functional wrapper for Error Boundary to provide translations and locale
 */
export const FloorSubmissionErrorBoundary: React.FC<Props> = ({ children }) => {
  const t = useTranslations('quickDataEntry');
  const locale = useLocale();

  return (
    <ErrorBoundaryInner t={t} locale={locale}>
      {children}
    </ErrorBoundaryInner>
  );
};

interface InnerProps extends Props {
  t: (key: string) => string;
  locale: string;
}

/**
 * Error Boundary Inner Class Component
 * 
 * Provides graceful error handling and recovery for the floor submission form.
 * Catches React component errors and displays user-friendly fallback UI.
 */
class ErrorBoundaryInner extends React.Component<InnerProps, State> {
  constructor(props: InnerProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    logger.error('FloorSubmission Error', {
      error,
      stack: error.stack,
      componentStack: errorInfo.componentStack ?? undefined,
      timestamp: new Date().toISOString(),
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  reloadPage = () => {
    window.location.reload();
  };

  goHome = () => {
    // Navigate to locale-aware home using current pathname segments
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const localeAwareHome = pathSegments.length > 0 ? `/${pathSegments[0]}` : `/${this.props.locale}`;
    window.location.href = localeAwareHome;
  };

  render() {
    const { t } = this.props;

    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-8 bg-slate-50">
          <div className="text-center max-w-md bg-white rounded-lg shadow-lg p-8">
            <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('errorBoundary.title')}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {t('errorBoundary.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.resetError}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                {t('errorBoundary.tryAgain')}
              </Button>
              
              <Button 
                onClick={this.reloadPage}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                {t('errorBoundary.reloadPage')}
              </Button>
              
              <Button
                onClick={this.goHome}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Home className="h-4 w-4" />
                {t('errorBoundary.goHome')}
              </Button>
            </div>

            {/* Show error details in development mode */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 font-medium">
                  {t('errorBoundary.errorDetails')}
                </summary>
                <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="text-sm font-semibold text-red-600 mb-2">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  <pre className="text-xs text-gray-700 overflow-auto max-h-40 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
