'use client';

import React from 'react';

interface SubmissionApiErrorsProps {
  apiErrors?: string[];
  t: (key: string) => string;
}

export const SubmissionApiErrors: React.FC<SubmissionApiErrorsProps> = ({ apiErrors, t }) => {
  if (!Array.isArray(apiErrors) || apiErrors.length === 0) return null;

  return (
    <div className="p-2 mb-2 bg-red-50 border border-red-200 text-red-700 rounded">
      <ul className="list-disc pl-5">
        {apiErrors.map((err, i) => {
          let resolved = err;
          try {
            if (!err.includes(' ') && err.includes('.')) {
              const cleanKey = err.startsWith('quickDataEntry.')
                ? err.replace('quickDataEntry.', '')
                : err;
              resolved = t(cleanKey);
            }
          } catch {
            resolved = err;
          }
          return <li key={i}>{resolved}</li>;
        })}
      </ul>
    </div>
  );
};
