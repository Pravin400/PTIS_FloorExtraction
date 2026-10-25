'use client';

/**
 * DeleteButton - Minimal Client Component
 * Uses React 19 useTransition for optimized server action calls
 * Receives translations as props from server component
 */

import { useTransition } from 'react';
// Note: [locale] is the actual folder name (Next.js dynamic route segment), not a variable
import { deleteRoute } from '@/app/[locale]/dashboard/actions';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteButtonProps {
  routeId: string;
  deleteLabel: string;
  errorMessage: string;
}

export function DeleteButton({ routeId, deleteLabel, errorMessage }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteRoute(routeId);
      // Error handling could be added here with toast notifications
      if (!result.success) {
        alert(result.error || errorMessage);
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
      title={deleteLabel}
    >
      {isPending ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
    </button>
  );
}
