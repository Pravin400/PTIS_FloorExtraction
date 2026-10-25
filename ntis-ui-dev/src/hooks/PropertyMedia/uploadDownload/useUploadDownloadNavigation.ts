"use client";

import { useState, useCallback, startTransition } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";

interface UseUploadDownloadNavigationProps {
  locale: string;
}

export function useUploadDownloadNavigation({ locale }: UseUploadDownloadNavigationProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    startTransition(() => {
      router.push(`/${locale}${ROUTES.PROPERTY_TAX.PROPERTY_MEDIA}`);
    });
  }, [router, locale]);

  const handleCancel = useCallback(() => {
    closeAndRoute();
  }, [closeAndRoute]);

  return {
    open,
    setOpen,
    closeAndRoute,
    handleCancel,
  };
}
