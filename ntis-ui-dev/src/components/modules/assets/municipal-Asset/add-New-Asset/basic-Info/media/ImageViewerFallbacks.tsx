import React from 'react';

/** Skeleton shown while the main image is loading. */
export function ImageLoadingSkeleton(): React.ReactElement {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-100/60 animate-pulse">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-lg bg-slate-200/80" />
        <div className="w-32 h-3 rounded bg-slate-200/80" />
      </div>
    </div>
  );
}

/** Fallback shown when the main image fails to load. */
export function ImageErrorFallback({
  alt,
  errorLabel,
}: {
  alt: string;
  errorLabel: string;
}): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-slate-500">
      <svg className="w-16 h-16 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <span className="text-sm font-medium opacity-60 text-center">
        {errorLabel}: {alt}
      </span>
    </div>
  );
}

/** Shimmer skeleton shown while an image is loading. */
export function ImageSkeleton({ className }: { className: string }): React.ReactElement {
  return (
    <div
      className={`bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Placeholder shown when there is no image/document to display at all, or when a
 * present source failed to load. `variant` controls which of the two it is so the
 * user can tell "nothing was ever uploaded" apart from "something is broken":
 * - "missing" (default): no src was provided — neutral slate styling, outline icon.
 * - "error": a src was provided but failed to load (404, corrupt file, network) —
 *   amber/warning styling with a broken-image icon, indicating a real failure.
 */
export function ImagePlaceholder({
  alt,
  isSmall,
  label,
  variant = 'missing',
}: {
  alt: string;
  isSmall: boolean;
  label: string;
  variant?: 'missing' | 'error';
}): React.ReactElement {
  const isError = variant === 'error';
  return (
    <div
      className={`flex items-center justify-center w-full h-full ${
        isError
          ? 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600'
          : 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500'
      }`}
      aria-label={alt}
      title={label}
    >
      <div className="flex flex-col items-center justify-center gap-1 p-1">
        {isError ? (
          <svg
            className={`${isSmall ? 'w-5 h-5' : 'w-8 h-8'} opacity-70`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        ) : (
          <svg
            className={`${isSmall ? 'w-5 h-5' : 'w-8 h-8'} opacity-40`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )}
        {!isSmall && <span className="text-xs font-medium opacity-70 text-center">{label}</span>}
      </div>
    </div>
  );
}
