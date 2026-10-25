"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";
import { logger } from "@/lib/utils/logger";

export default function FireAuditError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("fireAudit.error");

  useEffect(() => {
    logger.error("Fire Audit route error", { error });
  }, [error]);

  return (
    <div className="m-4 flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-[#e6e8ec] bg-white p-6 text-center">
      <h2 className="text-xl font-semibold text-[#16324f]">{t("title")}</h2>
      <p className="mt-2 max-w-md text-sm text-[#586E7C]">{error.message || t("message")}</p>
      {error.digest ? (
        <p className="mt-3 font-mono text-[11px] text-[#586E7C]">
          {t("digest", { digest: error.digest })}
        </p>
      ) : null}
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-[#16324f] px-4 py-2 text-sm font-semibold text-white cursor-pointer"
        >
          {t("tryAgain")}
        </button>
        <Link
          href={ROUTES.FIRE_AUDIT.ROOT}
          className="rounded-full border border-[#e6e8ec] px-4 py-2 text-sm font-semibold text-[#16324f]"
        >
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
