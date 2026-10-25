'use client';

import { QueryClient, QueryClientContext } from '@tanstack/react-query';
import { useCallback, createContext, useContext, ReactNode, useState } from 'react';

export const QDE_SAVED_CHANGES_KEY = (propertyId?: string | number | null) => [
    'qde-has-saved-changes',
    String(propertyId || 'active')
];

export const QDE_INCOMPATIBLE_FLOOR_KEY = (propertyId?: string | number | null) => [
    'has-incompatible-floor',
    String(propertyId || 'active')
];

export interface QdeSaveContextType {
    markChangesSaved: () => void;
    hasSavedChanges: () => boolean;
    resetSavedChanges: () => void;
}

export const QdeSaveContext = createContext<QdeSaveContextType | null>(null);

export function useQdeSaveContext() {
    return useContext(QdeSaveContext);
}

/**
 * Hook to track whether data has been successfully saved in Quick Data Entry
 * using TanStack Query cache.
 */
export function useQdeSaveTracker(propertyId?: string | number | null) {
    const existingClient = useContext(QueryClientContext);
    const [fallbackClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
        },
    }));
    const queryClient = existingClient || fallbackClient;
    const queryKey = QDE_SAVED_CHANGES_KEY(propertyId);

    const markChangesSaved = useCallback(() => {
        queryClient.setQueryData(queryKey, true);
        if (propertyId) {
            queryClient.invalidateQueries({
                queryKey: ['ptis-property', String(propertyId)]
            });
        }
    }, [queryClient, queryKey, propertyId]);

    const resetSavedChanges = useCallback(() => {
        queryClient.setQueryData(queryKey, false);
    }, [queryClient, queryKey]);

    const hasSavedChanges = useCallback((): boolean => {
        return Boolean(queryClient.getQueryData<boolean>(queryKey));
    }, [queryClient, queryKey]);

    return {
        isSaved: hasSavedChanges(),
        markChangesSaved,
        resetSavedChanges,
        hasSavedChanges,
        queryClient,
    };
}

export function QdeSaveProvider({
    children,
    propertyId,
}: {
    children: ReactNode;
    propertyId?: string | number | null;
}) {
    const tracker = useQdeSaveTracker(propertyId);

    return (
        <QdeSaveContext.Provider
            value={{
                markChangesSaved: tracker.markChangesSaved,
                hasSavedChanges: tracker.hasSavedChanges,
                resetSavedChanges: tracker.resetSavedChanges,
            }}
        >
            {children}
        </QdeSaveContext.Provider>
    );
}
