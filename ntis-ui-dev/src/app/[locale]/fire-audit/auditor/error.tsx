"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";
import { logger } from "@/lib/utils/logger";

export default function AuditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("fireAudit.error");

  useEffect(() => {
    logger.error("Auditor route error", { error });
  }, [error]);

  return (
    <div className="m-4 flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center">
      <h2 className="text-xl font-semibold text-slate-800">{t("title")}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        {t("message")}
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-[11px] text-slate-400">
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
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
