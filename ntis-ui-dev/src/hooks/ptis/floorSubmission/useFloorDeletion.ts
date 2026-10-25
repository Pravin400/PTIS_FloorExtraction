'use client';

import { useCallback, useRef, useState } from 'react';
import { type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { toast } from 'sonner';
import { FloorData } from '@/types/room-details.types';
import { ConfirmOptions } from '@/components/common';
import { deleteFloorSubmissionNoRedirectAction } from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/FloorSubmission/actions';
import { useQdeSaveTracker } from '@/hooks/ptis/QuickDataEntry/useQdeSaveTracker';

// Threshold for distinguishing temporary IDs from persistent database IDs
const TEMP_ID_THRESHOLD = 1_000_000_000_000;

/**
 * Hook for floor deletion logic
 * Extracted from useFloorDataHandlers to reduce file size
 */
export const useFloorDeletion = (params: {
  localFloors: FloorData[];
  setLocalFloors: (val: FloorData[]) => void;
  setSelectedFloor: (val: FloorData | null) => void;
  setEditingFloorForm: (val: FloorData) => void;
  router: AppRouterInstance;
  startTransition: React.TransitionStartFunction;
  locale: string;
  propertyId: string;
  confirm: (payload: ConfirmOptions) => void;
  t: (key: string) => string;
  INITIAL_FORM_STATE: FloorData;
}) => {
  const {
    localFloors,
    setLocalFloors,
    setSelectedFloor,
    setEditingFloorForm,
    router,
    startTransition,
    locale,
    propertyId,
    confirm,
    t,
    INITIAL_FORM_STATE,
  } = params;

  const [isDeleting, setIsDeleting] = useState(false);
  const isDeletingRef = useRef<Set<string | number>>(new Set());
  const { markChangesSaved } = useQdeSaveTracker(propertyId);

  const handleDeleteFloor = useCallback(
    (floor: FloorData) => {
      const floorId = floor.id;
      if (floorId !== undefined && isDeletingRef.current.has(floorId)) return;

      const isPersistentId =
        floorId !== undefined && floorId !== null && Number(floorId) < TEMP_ID_THRESHOLD;

      confirm({
        variant: 'delete',
        title: t('floor.deleteConfirmTitle'),
        description: t('floor.deleteConfirmText'),
        confirmText: t('floor.deleteConfirmButton'),
        onConfirm: async () => {
          if (floorId !== undefined) isDeletingRef.current.add(floorId);
          setIsDeleting(true);
          try {
            if (!isPersistentId) {
              setLocalFloors(localFloors.filter((f) => f.id !== floor.id));
              setSelectedFloor(null);
              setEditingFloorForm(INITIAL_FORM_STATE);
              toast.success(t('floor.floorDeletedSuccess'));
              markChangesSaved();
              // Remove floorId from URL if present
              const params = new URLSearchParams(window.location.search);
              params.delete('floorId');
              window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
              return;
            }

            const previousFloors = [...localFloors];
            try {
              setLocalFloors(localFloors.filter((f) => f.id !== floor.id));
              const response = await deleteFloorSubmissionNoRedirectAction(
                String(floor.id),
                locale,
                propertyId
              );
              if (!response.success) {
                setLocalFloors(previousFloors);
                toast.error(
                  `Delete Error: ${response.error ? response.error : t('floor.floorDeletedError')}`
                );
                return;
              }
              // Clear floorId from URL and refresh the page
              setSelectedFloor(null);
              setEditingFloorForm(INITIAL_FORM_STATE);
              toast.success(t('floor.floorDeletedSuccess'));
              markChangesSaved();
              // Use router.replace to properly update URL and trigger server re-fetch
              const params = new URLSearchParams(window.location.search);
              params.delete('floorId');
              startTransition(() => {
                router.replace(`${window.location.pathname}?${params.toString()}`);
              });
            } catch (error: unknown) {
              setLocalFloors(previousFloors);
              toast.error(
                `Delete Error: ${error instanceof Error ? error.message : t('floor.floorDeletedError')}`
              );
            }
          } finally {
            if (floorId !== undefined) isDeletingRef.current.delete(floorId);
            setIsDeleting(false);
          }
        },
      });
    },
    [
      confirm,
      t,
      router,
      startTransition,
      localFloors,
      setLocalFloors,
      locale,
      propertyId,
      INITIAL_FORM_STATE,
      setEditingFloorForm,
      setSelectedFloor,
    ]
  );

  return {
    handleDeleteFloor,
    isDeleting,
  };
};
