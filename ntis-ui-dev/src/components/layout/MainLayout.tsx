import { cache, Suspense } from 'react';
import { cookies, headers } from 'next/headers';
import { getLocale } from 'next-intl/server';
import { getLayoutShellContextFromCookies } from '@/lib/utils/cookie';
import { Header } from './Header';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';
import { type MenuItem } from '@/types/menu.types';
import { sidebarNavigationService } from '@/lib/api/sidebar-navigation.service';
import { userScreenAccessService } from '@/lib/api/user-screen-access.service';
import { getUserIdFromCookies } from '@/lib/utils/auth-session';
import { buildSidebarTree } from '@/lib/utils/sidebar-tree';
import { buildSidebarTreeFromUserScreens } from '@/lib/utils/sidebar-tree-user';
import { PermissionsProvider } from '@/lib/providers/PermissionsProvider';
import { AliasLabelsProvider } from '@/lib/providers/AliasLabelsProvider';
import { getAliasLabelsForLocale } from '@/lib/i18n/alias-labels';
import { LayoutFooterWrapper } from './LayoutFooterWrapper';
import type { UserScreenAccess } from '@/types/user-screen-access.types';
import { getModules } from '@/lib/api/configuration-settings/screenAccess/master-data.service';
import { getUserById } from '@/lib/api/configuration-settings/user-management/user.services';
import {
  applyModuleActivationGate,
  buildActiveModuleIdSet,
  mergeUserScreens,
  filterScreensByAllocatedRoles,
} from '@/lib/utils/module-access-guard';

export interface MainLayoutProps {
  children: React.ReactNode;
  /** Locale segment for sidebar links; optional. */
  locale?: string;
}

function clientIpFromHeaders(h: Headers): string | undefined {
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = h.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return undefined;
}

/**
 * Fetches global menu items (fallback when user-specific screens unavailable)
 */
const fetchGlobalMenuItems = cache(async () => {
  try {
    const [groupsRes, screensRes] = await Promise.all([
      sidebarNavigationService.getScreenGroups(),
      sidebarNavigationService.getScreens(),
    ]);
    if (groupsRes.success && screensRes.success) {
      const groups = Array.isArray(groupsRes.data) ? groupsRes.data : groupsRes.data?.items || [];
      const screens = Array.isArray(screensRes.data)
        ? screensRes.data
        : screensRes.data?.items || [];
      return { menuItems: buildSidebarTree(groups, screens), rawScreens: [] };
    }
  } catch (_error) {
    // Silent fail for global menu fetching
  }
  return { menuItems: [], rawScreens: [] };
});

/**
 * Loads active module ids for ULB-level activation gating.
 */
const fetchActiveModuleIds = cache(async () => {
  try {
    const modules = await getModules();
    return buildActiveModuleIdSet(modules);
  } catch {
    return null;
  }
});

/**
 * Fetches menu entries for a specific user (deduped per request).
 * Falls back to global screens if user-specific screens are unavailable.
 */
const fetchUserMenuItems = cache(async (userId: number, token?: string) => {
  try {
    const [screensRes, activeModuleIds, userProfile, groupsRes] = await Promise.all([
      userScreenAccessService.getScreensForUser(userId, token),
      fetchActiveModuleIds(),
      getUserById(String(userId)).catch(() => null),
      sidebarNavigationService.getScreenGroups().catch(() => null),
    ]);

    // Build a set of inactive screen group names so we can hide their screens in the sidebar
    const inactiveGroupNames = new Set<string>();
    if (groupsRes?.success) {
      const allGroups = Array.isArray(groupsRes.data)
        ? groupsRes.data
        : groupsRes.data?.items || [];
      for (const g of allGroups) {
        if (!g.isActive && g.screenGroupName) {
          inactiveGroupNames.add(g.screenGroupName.trim());
        }
      }
    }

    if (screensRes.success && Array.isArray(screensRes.data) && screensRes.data.length > 0) {
      const filteredScreens = filterScreensByAllocatedRoles(
        screensRes.data,
        userProfile?.roleAccess
      );

      const mergedScreens = mergeUserScreens(filteredScreens);
      const effectiveScreens =
        activeModuleIds != null
          ? applyModuleActivationGate(mergedScreens, activeModuleIds)
          : mergedScreens;

      const userMenuItems = buildSidebarTreeFromUserScreens(
        effectiveScreens,
        inactiveGroupNames.size > 0 ? inactiveGroupNames : undefined
      );
      if (userMenuItems.length > 0) {
        return { menuItems: userMenuItems, rawScreens: effectiveScreens };
      }
    }
  } catch (_error) {
    // Silent fail for user menu fetching, will try fallback
  }

  // Fallback to global screens
  return fetchGlobalMenuItems();
});

const getLayoutChromeData = cache(async () => {
  const headerList = await headers();
  const clientIp = clientIpFromHeaders(headerList);
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token')?.value;
  const userId = getUserIdFromCookies(cookieStore);

  let menuItems: MenuItem[] = [];
  let rawScreens: UserScreenAccess[] = [];
  if (authToken && userId != null) {
    // Try user-specific screens with fallback to global
    const result = await fetchUserMenuItems(userId, authToken);
    menuItems = result.menuItems;
    rawScreens = result.rawScreens;
  } else if (authToken) {
    // Logged in but no user_id cookie - use global screens
    const result = await fetchGlobalMenuItems();
    menuItems = result.menuItems;
    rawScreens = result.rawScreens;
  }

  return {
    clientIp,
    menuItems,
    rawScreens,
    ...getLayoutShellContextFromCookies(cookieStore),
  };
});
async function SidebarWithData({ locale }: { locale: string }) {
  const { menuItems } = await getLayoutChromeData();
  return <Sidebar menuItems={menuItems} locale={locale} />;
}
async function HeaderWithRequestContext() {
  const { ulbData, userDisplayName, clientIp, menuItems } = await getLayoutChromeData();
  return (
    <Header
      ulbData={ulbData}
      userDisplayName={userDisplayName}
      clientIp={clientIp}
      menuItems={menuItems}
    />
  );
}
async function FooterWithUlb() {
  const { ulbData } = await getLayoutChromeData();
  return <Footer ulbData={ulbData} />;
}
function HeaderSkeleton() {
  return (
    <div
      className="fixed inset-x-0 top-0 z-40 h-20 w-full border-b border-white/10 shadow-2xl bg-[#0B132B]"
      aria-hidden
    />
  );
}
function FooterSkeleton() {
  return <div className="mt-auto h-16 w-full shrink-0 bg-slate-100" aria-hidden />;
}

/**
 * Main layout: header, collapsible sidebar, footer.
 */
export async function MainLayout({ children, locale: localeProp }: MainLayoutProps) {
  const locale = localeProp ?? (await getLocale());

  const headerList = await headers();
  const pathname = headerList.get('x-pathname') || '';
  const isPtisRoute = pathname.includes('/property-tax/ptis');
  const isReportRoute = pathname.split('/').some((segment) => segment === 'reports');

  const { rawScreens } = await getLayoutChromeData();
  const aliasLabels = await getAliasLabelsForLocale(locale);

  return (
    <PermissionsProvider screens={rawScreens}>
      <AliasLabelsProvider labels={aliasLabels}>
        <div className="flex min-h-screen flex-col bg-[#f8fafc]">
          <Suspense fallback={null}>
            <SidebarWithData locale={locale} />
          </Suspense>
          <Suspense fallback={<HeaderSkeleton />}>
            <HeaderWithRequestContext />
          </Suspense>
          <main className="flex-1 transition-all duration-300 pt-20 flex flex-col layout-content-shifted">
            <div className={`flex-1 w-full py-3 ${isPtisRoute ? 'px-1 md:px-2' : 'px-3 md:px-4'}`}>
              {children}
            </div>
          </main>

          <LayoutFooterWrapper>
            <Suspense fallback={<FooterSkeleton />}>
              <div className={isReportRoute ? '' : 'layout-content-shifted'}>
                <FooterWithUlb />
              </div>
            </Suspense>
          </LayoutFooterWrapper>
        </div>
      </AliasLabelsProvider>
    </PermissionsProvider>
  );
}
