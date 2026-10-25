'use server';

import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import { getUserProfileCached } from "@/lib/api/user-profile-cache";
import { Service } from "@/types/home/home.types";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import type { UserDepartment, UserProfileDisplayValues } from "@/types/home/user-profile.types";
import type { Department } from "@/types/departmentActivation.types";
import { departmentActivationService } from "@/lib/api/configuration-settings/department-activation/departmentActivation.service";
import { DEPARTMENT_COOKIES, CLIENT_COOKIE_OPTIONS } from '@/components/modules/login/constants';
import { logger } from "@/lib/utils/logger";

/**
 * Response type for listServices
 */
export interface ListServicesResponse {
    services: Service[];
    error?: string;
}

/**
 * Analyzes department name to determine the correct Lucide icon
 */
function getIconByDepartmentName(departmentName: string): string {
    const lowerName = departmentName.toLowerCase().trim();

    if (lowerName.includes('property')) return 'Home';
    if (lowerName.includes('water')) return 'Droplet';
    if (lowerName.includes('trade') || lowerName.includes('license') || lowerName.includes('bajar')) return 'ShoppingCart';
    if (lowerName.includes('birth') || lowerName.includes('death')) return 'FileText';
    if (lowerName.includes('garbage') || lowerName.includes('trash') || lowerName.includes('waste')) return 'Trash2';
    if (lowerName.includes('building') || lowerName.includes('permission')) return 'Building2';
    if (lowerName.includes('grievance') || lowerName.includes('complain')) return 'Megaphone';
    if (lowerName.includes('rts')) return 'Timer';
    if (lowerName.includes('asset')) return 'Landmark';
    if (lowerName.includes('fire') || lowerName.includes('noc')) return 'Flame';

    return 'LayoutGrid';
}

/**
 * Maps user department from API to UI Service interface
 */
function mapDepartmentToService(
    department: UserDepartment,
    iconName: string,
    locale: string,
    moduleId?: number,
    moduleName?: string
): Service {
    const name = department.departmentName;
    const lowerName = name.toLowerCase().trim();

    // Dynamically slugify the route segment using department name
    let routeSegment = lowerName.replace(/[&\s]+/g, '-').replace(/-+/g, '-');
    if (routeSegment === 'asset-management' || lowerName.includes('asset management')) {
        routeSegment = 'assets/municipal-Asset';
    }
    if (routeSegment === 'grievance-management' || lowerName.includes('grievance') || lowerName.includes('complain')) {
        routeSegment = 'grievance/complaints';
    }

    return {
        id: department.departmentId,
        name: department.departmentName,
        title: department.departmentName,
        subtext: `Access ${department.departmentName} services`,
        icon: iconName || getIconByDepartmentName(department.departmentName),
        link: `/${locale}/${routeSegment}`,
        moduleId,
        moduleName,
    };
}

/**
 * Cache master departments globally across all users (1-hour TTL, revalidated on master update)
 */
const getCachedMasterDepartments = unstable_cache(
    async () => departmentActivationService.getDepartments(1, 1000),
    ["global-master-departments"],
    { revalidate: 3600, tags: ["department-master"] }
);

/**
 * Fetches user departments from User Profile API and returns as services
 * Only shows departments the user has active access to
 */
export async function listServices(locale: string): Promise<ListServicesResponse> {
    let currentUserId: number | null | undefined;
    try {
        const cookieStore = await cookies();
        const userId = getUserIdFromCookies(cookieStore);
        currentUserId = userId;

        if (!userId) {
            return { services: [], error: "User not authenticated" };
        }

        // Fetch both user profile and globally active departments list in parallel
        const [profileResponse, departmentsResponse] = await Promise.all([
            getUserProfileCached(userId),
            getCachedMasterDepartments().catch(() => ({ success: false, data: [] }))
        ]);

        if (!profileResponse.success || !profileResponse.data) {
            return { services: [], error: profileResponse.error || "Failed to load user profile" };
        }

        // Map globally active department IDs to their respective Department objects for quick lookup
        const activeDeptsMap = new Map<number, Department>();
        let hasGlobalDepartments = false;

        if (departmentsResponse.success && departmentsResponse.data && departmentsResponse.data.length > 0) {
            hasGlobalDepartments = true;
            departmentsResponse.data.forEach(dept => {
                if (dept.isActive) {
                    activeDeptsMap.set(dept.departmentId, dept);
                }
            });
        }

        // Get active departments only: active user allocation AND globally active department
        const activeDepartments = profileResponse.data.departments?.filter(d => {
            const isUserAllocationActive = d.isActive;
            const isGlobalDeptActive = !hasGlobalDepartments || activeDeptsMap.has(d.departmentId);
            return isUserAllocationActive && isGlobalDeptActive;
        }) ?? [];

        if (activeDepartments.length === 0) {
            return { services: [] };
        }

        // Remove duplicates based on departmentId
        const uniqueDepartments = activeDepartments.reduce((acc, current) => {
            const exists = acc.find(d => d.departmentId === current.departmentId);
            if (!exists) {
                acc.push(current);
            }
            return acc;
        }, [] as UserDepartment[]);

        // Build a map: departmentId -> first active module for that department
        const modulesByDept = new Map<number, { moduleId: number; moduleName: string }>();
        const activeModules = profileResponse.data.moduleAccess?.filter(m => m.isActive) ?? [];
        for (const mod of activeModules) {
            if (!modulesByDept.has(mod.departmentId)) {
                modulesByDept.set(mod.departmentId, {
                    moduleId: mod.moduleId,
                    moduleName: mod.moduleName,
                });
            }
        }

        // Map departments to services using dynamic icon resolved from global list
        const services = uniqueDepartments
            .map(dept => {
                const globalDept = activeDeptsMap.get(dept.departmentId);
                const iconName = globalDept?.departmentIcon || '';
                const moduleInfo = modulesByDept.get(dept.departmentId);
                return mapDepartmentToService(
                    dept,
                    iconName,
                    locale,
                    moduleInfo?.moduleId,
                    moduleInfo?.moduleName
                );
            });

        return { services };
    } catch (error) {
        logger.error("Failed to load user services on home screen", {
            error: error instanceof Error ? error : new Error(String(error)),
            userId: currentUserId,
            locale,
        });
        return {
            services: [],
            error: "Failed to load services. Please try refreshing the page."
        };
    }
}

/**
 * Server action to get formatted display values for user profile
 * Used by UserProfilePopup component
 */
export async function getUserProfileDisplayAction(): Promise<{
    success: boolean;
    data?: {
        fullName: string;
        email: string;
        roles: string[];
        departments: string[];
        modules: string[];
        userId: string;
        userCode: string;
        mobileNo: string;
        address: string;
        language: string;
        primaryRole: string;
        primaryDepartment: string;
    };
    error?: string;
}> {
    try {
        const cookieStore = await cookies();
        const userId = getUserIdFromCookies(cookieStore);
        if (!userId) {
            return {
                success: false,
                error: 'User not authenticated',
            };
        }
        // Use cached fetch for deduplication
        const response = await getUserProfileCached(userId);
        if (!response.success || !response.data) {
            return {
                success: false,
                error: response.error || 'Failed to fetch user profile',
            };
        }
        const profile = response.data;
        // Format profile for display
        const fullName = [profile.firstName, profile.middleName, profile.lastName]
            .filter(Boolean)
            .join(' ');
        const roles = [...new Set(
            profile.roleAllocations
                .filter(r => r.isActive)
                .map(r => r.userRoleName)
        )];
        const departments = [...new Set(
            profile.departments
                .filter(d => d.isActive)
                .map(d => d.departmentName)
        )];
        const modules = [...new Set(
            profile.moduleAccess
                .filter(m => m.isActive)
                .map(m => m.moduleName)
        )];
        return {
            success: true,
            data: {
                fullName,
                email: profile.email,
                roles,
                departments,
                modules,
                userId: profile.id.toString(),
                userCode: profile.userCode,
                mobileNo: profile.mobileNo,
                address: profile.address,
                language: profile.language,
                primaryRole: roles[0] || 'User',
                primaryDepartment: departments[0] || '',
            },
        };
    } catch (error) {
        logger.error("Failed to get user profile display action", {
            error: error instanceof Error ? error : new Error(String(error)),
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch user profile',
        };
    }
}

/**
 * Server-side function to get user profile for SSR
 * Reads userId from cookies and fetches profile data
 * Called from page.tsx server component
 */
export async function getUserProfileSSR(): Promise<{
    data: UserProfileDisplayValues | null;
    error?: string;
}> {
    try {
        const cookieStore = await cookies();
        const userId = getUserIdFromCookies(cookieStore);

        if (!userId) {
            return { data: null, error: "User not authenticated" };
        }

        const response = await getUserProfileCached(userId);

        if (!response.success || !response.data) {
            return {
                data: null,
                error: response.error || "Failed to fetch user profile"
            };
        }

        const profile = response.data;

        const fullName = [profile.firstName, profile.middleName, profile.lastName]
            .filter(Boolean)
            .join(' ');

        const roles = [...new Set(
            profile.roleAllocations
                .filter(r => r.isActive)
                .map(r => r.userRoleName)
        )];

        const departments = [...new Set(
            profile.departments
                .filter(d => d.isActive)
                .map(d => d.departmentName)
        )];

        const modules = [...new Set(
            profile.moduleAccess
                .filter(m => m.isActive)
                .map(m => m.moduleName)
        )];

        // Check directly from cached profile role allocations without full screen matrix scan
        const hasSettingsAccess = roles.some(role =>
            /admin|superadmin|commissioner|head/i.test(role)
        ) || (Array.isArray(profile.roleAllocations) && profile.roleAllocations.some(ra =>
            ra.isActive && /config|admin|setting/i.test(ra.userRoleName)
        ));

        const data: UserProfileDisplayValues = {
            fullName,
            email: profile.email,
            roles,
            departments,
            modules,
            userId: profile.id.toString(),
            userCode: profile.userCode,
            mobileNo: profile.mobileNo,
            address: profile.address,
            language: profile.language,
            primaryRole: roles[0] || 'User',
            primaryDepartment: departments[0] || '',
            hasSettingsAccess,
        };

        return { data };
    } catch (error) {
        logger.error("Failed to synchronize profile details on SSR", {
            error: error instanceof Error ? error : new Error(String(error)),
        });
        return {
            data: null,
            error: error instanceof Error ? error.message : "Failed to synchronize profile details"
        };
    }
}

// ---------------------------------------------------------------------------
// Department Context Cookie Action
// ---------------------------------------------------------------------------

/**
 * Sets department and module context cookies when the user clicks a department card.
 * Uses the same client-readable cookie pattern as ULB cookies set at login.
 *
 * @param departmentId - The selected department ID
 * @param departmentName - The selected department name
 * @param moduleId - (Optional) The module ID associated with this department
 * @param moduleName - (Optional) The module name associated with this department
 */
export async function setDepartmentContextAction(
    departmentId: number,
    departmentName: string,
    moduleId?: number,
    moduleName?: string
): Promise<{ success: boolean }> {
    try {
        const cookieStore = await cookies();
        // No maxAge — session cookie: removed when browser closes or session expires
        const cookieOpts = { ...CLIENT_COOKIE_OPTIONS };

        cookieStore.set(DEPARTMENT_COOKIES.DEPARTMENT_ID, String(departmentId), cookieOpts);
        cookieStore.set(DEPARTMENT_COOKIES.DEPARTMENT_NAME, encodeURIComponent(departmentName), cookieOpts);

        if (moduleId && moduleId > 0) {
            cookieStore.set(DEPARTMENT_COOKIES.MODULE_ID, String(moduleId), cookieOpts);
        }
        if (moduleName) {
            cookieStore.set(DEPARTMENT_COOKIES.MODULE_NAME, encodeURIComponent(moduleName), cookieOpts);
        }

        return { success: true };
    } catch {
        return { success: false };
    }
}

