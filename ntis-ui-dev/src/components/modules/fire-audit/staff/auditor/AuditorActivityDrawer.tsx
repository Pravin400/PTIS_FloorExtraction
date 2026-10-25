"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { Radio } from "lucide-react";
import { Button, Drawer } from "@/components/common";
import { cn } from "@/lib/utils/cn";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { AuditorRecentActivity } from "./AuditorRecentActivity";
import type { AuditorRecentActivityItem } from "@/types/fire-audit/auditor.types";

/**
 * Overlay and activities state interface managed by useReducer.
 */
export interface AuditorActivityOverlayState {
  isDesktopSidebarOpen: boolean;
  isMobileDrawerOpen: boolean;
  isMobilePopoverOpen: boolean;
  activities: AuditorRecentActivityItem[];
}

export type AuditorActivityAction =
  | { type: "TOGGLE_DESKTOP_SIDEBAR" }
  | { type: "TOGGLE_MOBILE_DRAWER" }
  | { type: "OPEN_MOBILE_DRAWER" }
  | { type: "CLOSE_MOBILE_DRAWER" }
  | { type: "OPEN_DESKTOP_SIDEBAR" }
  | { type: "CLOSE_DESKTOP_SIDEBAR" }
  | { type: "CLOSE_MOBILE_POPOVER" }
  | { type: "RESET_ACTIVITIES"; payload: AuditorRecentActivityItem[] };

export function auditorActivityReducer(
  state: AuditorActivityOverlayState,
  action: AuditorActivityAction
): AuditorActivityOverlayState {
  switch (action.type) {
    case "TOGGLE_DESKTOP_SIDEBAR":
      return { ...state, isDesktopSidebarOpen: !state.isDesktopSidebarOpen };
    case "TOGGLE_MOBILE_DRAWER":
      return {
        ...state,
        isMobileDrawerOpen: !state.isMobileDrawerOpen,
        isMobilePopoverOpen: false,
      };
    case "OPEN_MOBILE_DRAWER":
      return { ...state, isMobileDrawerOpen: true, isMobilePopoverOpen: false };
    case "CLOSE_MOBILE_DRAWER":
      return { ...state, isMobileDrawerOpen: false };
    case "OPEN_DESKTOP_SIDEBAR":
      return { ...state, isDesktopSidebarOpen: true };
    case "CLOSE_DESKTOP_SIDEBAR":
      return { ...state, isDesktopSidebarOpen: false };
    case "CLOSE_MOBILE_POPOVER":
      return { ...state, isMobilePopoverOpen: false };
    case "RESET_ACTIVITIES":
      return { ...state, activities: action.payload };
    default:
      return state;
  }
}

export interface AuditorActivityContextValue {
  activities: AuditorRecentActivityItem[];
  isDesktop: boolean;
  isDesktopActivityOpen: boolean;
  isMobilePopoverOpen: boolean;
  isMobileDrawerOpen: boolean;
  toggleActivity: () => void;
  toggleDesktopSidebar: () => void;
  toggleMobileDrawer: () => void;
  closeMobilePopover: () => void;
  openMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  closeDesktopSidebar: () => void;
  refreshActivities: () => void;
}

const AuditorActivityContext = createContext<AuditorActivityContextValue | null>(null);

export interface AuditorActivityProviderProps {
  initialActivities?: AuditorRecentActivityItem[];
  children: ReactNode;
}

export function AuditorActivityProvider({
  initialActivities = [],
  children,
}: AuditorActivityProviderProps) {
  const [state, dispatch] = useReducer(auditorActivityReducer, {
    isDesktopSidebarOpen: true,
    isMobileDrawerOpen: false,
    isMobilePopoverOpen: false,
    activities: initialActivities,
  });

  // Responsive media query hook instead of JS window.innerWidth
  const isDesktop = useMediaQuery("(min-width: 1024px)", true);

  const refreshActivities = useCallback(() => {
    dispatch({ type: "RESET_ACTIVITIES", payload: [...initialActivities] });
  }, [initialActivities]);

  const toggleDesktopSidebar = useCallback(() => {
    dispatch({ type: "TOGGLE_DESKTOP_SIDEBAR" });
  }, []);

  const toggleMobileDrawer = useCallback(() => {
    dispatch({ type: "TOGGLE_MOBILE_DRAWER" });
  }, []);

  const toggleActivity = useCallback(() => {
    if (isDesktop) {
      dispatch({ type: "TOGGLE_DESKTOP_SIDEBAR" });
    } else {
      dispatch({ type: "TOGGLE_MOBILE_DRAWER" });
    }
  }, [isDesktop]);

  const closeMobilePopover = useCallback(() => {
    dispatch({ type: "CLOSE_MOBILE_POPOVER" });
  }, []);

  const openMobileDrawer = useCallback(() => {
    dispatch({ type: "OPEN_MOBILE_DRAWER" });
  }, []);

  const closeMobileDrawer = useCallback(() => {
    dispatch({ type: "CLOSE_MOBILE_DRAWER" });
  }, []);

  const closeDesktopSidebar = useCallback(() => {
    dispatch({ type: "CLOSE_DESKTOP_SIDEBAR" });
  }, []);

  return (
    <AuditorActivityContext.Provider
      value={{
        activities: state.activities,
        isDesktop,
        isDesktopActivityOpen: state.isDesktopSidebarOpen,
        isMobilePopoverOpen: state.isMobilePopoverOpen,
        isMobileDrawerOpen: state.isMobileDrawerOpen,
        toggleActivity,
        toggleDesktopSidebar,
        toggleMobileDrawer,
        closeMobilePopover,
        openMobileDrawer,
        closeMobileDrawer,
        closeDesktopSidebar,
        refreshActivities,
      }}
    >
      {children}
    </AuditorActivityContext.Provider>
  );
}

export function AuditorActivityTrigger() {
  const ctx = useContext(AuditorActivityContext);
  const t = useTranslations("fireAudit.auditorDashboard");
  if (!ctx) return null;

  const {
    activities,
    isDesktop,
    isDesktopActivityOpen,
    isMobileDrawerOpen,
    toggleActivity,
  } = ctx;

  const isOpen = isDesktop ? isDesktopActivityOpen : isMobileDrawerOpen;

  return (
    <div className="relative shrink-0">
      <Button
        variant={isOpen ? "primary" : "outline"}
        size="xs"
        onClick={toggleActivity}
        aria-expanded={isOpen}
        aria-label={t("recentActivity")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs h-auto",
          isOpen
            ? "!border-sky-300 !bg-sky-50 !text-[#153746]"
            : "!border-slate-200 !bg-white hover:!bg-slate-50 !text-slate-700"
        )}
      >
        <Radio className="h-3.5 w-3.5 text-slate-500 animate-pulse" />
        <span>{t("recentActivity")}</span>
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
          {activities.length}
        </span>
      </Button>
    </div>
  );
}

export function AuditorActivitySidebar() {
  const ctx = useContext(AuditorActivityContext);
  if (!ctx) return null;

  const {
    activities,
    isDesktopActivityOpen,
    isMobileDrawerOpen,
    closeDesktopSidebar,
    closeMobileDrawer,
    refreshActivities,
  } = ctx;

  return (
    <>
      {/* Desktop Sidebar Panel (>= lg) */}
      {isDesktopActivityOpen && (
        <div className="hidden lg:block w-80 shrink-0 border-l border-slate-200 bg-slate-50/70">
          <div className="sticky top-0 h-screen overflow-y-auto p-4">
            <AuditorRecentActivity
              activities={activities}
              onClose={closeDesktopSidebar}
              onRefresh={refreshActivities}
              isFullColumn={true}
            />
          </div>
        </div>
      )}

      {/* Mobile Activity Drawer (< lg) using common Drawer */}
      <Drawer
        open={isMobileDrawerOpen}
        onClose={closeMobileDrawer}
        width="sm"
        hideHeader
        className="lg:hidden"
        bodyClassName="p-4 flex flex-col h-full bg-slate-50/70"
      >
        <AuditorRecentActivity
          activities={activities}
          onClose={closeMobileDrawer}
          onRefresh={refreshActivities}
          isFullColumn={true}
        />
      </Drawer>
    </>
  );
}
