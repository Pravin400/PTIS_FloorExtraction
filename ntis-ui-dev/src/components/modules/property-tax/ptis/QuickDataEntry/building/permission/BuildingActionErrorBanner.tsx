import React from 'react';
import { AlertCircle } from 'lucide-react';

interface BuildingActionErrorBannerProps {
  actionError: string | null;
  onDismiss: () => void;
}

export function BuildingActionErrorBanner({
  actionError,
  onDismiss,
}: BuildingActionErrorBannerProps): React.ReactElement | null {
  if (!actionError) return null;

  return (
    <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-xs text-red-700 flex-shrink-0">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
        <span className="font-semibold">{actionError}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer"
        aria-label="Dismiss error"
      >
        ×
      </button>
    </div>
  );
}
