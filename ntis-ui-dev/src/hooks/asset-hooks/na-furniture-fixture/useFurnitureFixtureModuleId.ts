/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getFallbackModuleIdAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/furniture-fixture/module-id.actions";

export function useFurnitureFixtureModuleId() {
  const [assetModuleId, setAssetModuleId] = useState<number>(0);
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;
    getFallbackModuleIdAction(pathname)
      .then((id: number) => {
        if (isMounted && id > 0) setAssetModuleId(id);
      })
      .catch((e: any) => {
        console.warn("Failed to get module ID:", e);
      });
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  return { assetModuleId, pathname };
}
