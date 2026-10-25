import { useCallback, useState } from 'react';

export type MediaType = 'front-photo' | 'plan' | 'satellite' | 'change-detection' | 'additional';

export interface DrawerState {
  open: boolean;
  type: MediaType | null;
  categoryIndex: number;
  selectedImageIndex?: number | null;
  viewMode?: 'grid' | 'viewer' | 'compare';
  action?: string | null;
}

const INITIAL_DRAWER_STATE: DrawerState = {
  open: false,
  type: null,
  categoryIndex: 0,
  selectedImageIndex: null,
  viewMode: undefined,
  action: null,
};

/**
 * Pure client-side, click-driven drawer state management.
 * 
 * Rules:
 * 1. Initial state is ALWAYS closed. Never initialized from URL params or server props.
 * 2. Opens ONLY when user clicks a media card or button.
 * 3. Closes ONLY on user close action (X button, overlay click, ESC key) and stays closed across tab switches and re-renders.
 */
export function useMediaDrawerState() {
  const [drawerState, setDrawerState] = useState<DrawerState>(INITIAL_DRAWER_STATE);

  const openDrawer = useCallback(
    (
      idx: number = 0,
      selectedImageIndex?: number,
      action?: string,
      type: MediaType = 'additional'
    ) => {
      setDrawerState({
        open: true,
        type,
        categoryIndex: idx >= 0 ? idx : 0,
        selectedImageIndex: selectedImageIndex !== undefined ? selectedImageIndex : null,
        viewMode: selectedImageIndex !== undefined ? 'viewer' : 'grid',
        action: action || null,
      });
    },
    []
  );

  const closeDrawer = useCallback(() => {
    setDrawerState(INITIAL_DRAWER_STATE);
  }, []);

  const resetDrawer = useCallback(() => {
    setDrawerState(INITIAL_DRAWER_STATE);
  }, []);

  return {
    isDrawerOpen: drawerState.open,
    drawerType: drawerState.type,
    drawerInitialCategoryIndex: drawerState.categoryIndex,
    drawerState,
    openDrawer,
    closeDrawer,
    resetDrawer,
  };
}
