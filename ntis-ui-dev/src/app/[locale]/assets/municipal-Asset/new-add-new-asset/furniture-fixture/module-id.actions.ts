/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { getModules } from "@/lib/api/configuration-settings/screenAccess/master-data.service";

/**
 * Server action to fetch the Asset module ID dynamically if screens are empty
 */
export async function getFallbackModuleIdAction(pathname?: string): Promise<number> {
  try {
    const modules = await getModules();

    if (pathname) {
      const pathLower = pathname.toLowerCase();
      const exactMatch = modules.find((m: any) => {
        const mName = m.moduleName || m.ModuleName;
        return mName && pathLower.includes(mName.toLowerCase().replace(/\s+/g, '-'));
      });
      if (exactMatch) {
        return exactMatch.moduleId || (exactMatch as any).ModuleId || 0;
      }
    }

    // Prefer Asset Management specifically
    const assetManagement = modules.find((m: any) => {
      const mName = m.moduleName || m.ModuleName;
      return mName && mName.toLowerCase().includes("asset management");
    });
    if (assetManagement) {
      return assetManagement.moduleId || (assetManagement as any).ModuleId || 0;
    }

    // Ultimate fallback
    const assetModule = modules.find((m: any) => {
      const mName = m.moduleName || m.ModuleName;
      return mName && mName.toLowerCase().includes("asset");
    });
    if (assetModule) {
      return assetModule.moduleId || (assetModule as any).ModuleId || 0;
    }
    return 0;
  } catch (err) {
    console.error("Failed to fetch fallback module ID", err);
    return 0;
  }
}
