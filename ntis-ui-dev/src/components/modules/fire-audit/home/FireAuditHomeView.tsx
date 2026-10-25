import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/common";

const staffLinks = [
  { href: "/fire-audit/clerk", titleKey: "clerk", textKey: "clerk" },
  { href: "/fire-audit/surveyor", titleKey: "surveyor", textKey: "surveyor" },
  { href: "/fire-audit/auditor", titleKey: "auditor", textKey: "auditor" },
  { href: "/fire-audit/certificates", titleKey: "certificates", textKey: "certificates" },
] as const;

const citizenLinks = [
  { href: "/fire-audit/citizen", titleKey: "citizenHome", textKey: "citizenHome" },
  { href: "/fire-audit/citizen/login", titleKey: "citizenLogin", textKey: "citizenLogin" },
  { href: "/fire-audit/citizen/register", titleKey: "citizenRegister", textKey: "citizenRegister" },
] as const;

export async function FireAuditHomeView({ locale }: { locale: string }) {
  const t = await getTranslations("fireAudit");

  return (
    <PageContainer className="!bg-transparent">
      <section className="rounded-2xl border border-[#e6e8ec] bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#e24b2a]">
          {t("home.kicker")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[#16324f]">{t("home.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#586E7C]">{t("home.subtitle")}</p>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <LinkGroup
          heading={t("home.staffHeading")}
          locale={locale}
          links={staffLinks.map((link) => ({
            href: link.href,
            label: t(`routes.${link.titleKey}.title`),
          }))}
        />
        <LinkGroup
          heading={t("home.citizenHeading")}
          locale={locale}
          links={citizenLinks.map((link) => ({
            href: link.href,
            label: t(`routes.${link.titleKey}.title`),
          }))}
        />
        <div className="rounded-2xl border border-[#e6e8ec] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#16324f]">{t("home.mastersHeading")}</h2>
          <Link
            href={`/${locale}/fire-audit/masters/jurisdiction`}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#16324f] px-4 py-2 text-sm font-semibold text-white sm:w-auto"
          >
            {t("home.openMasters")}
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}

function LinkGroup({
  heading,
  locale,
  links,
}: {
  heading: string;
  locale: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="rounded-2xl border border-[#e6e8ec] bg-white p-5">
      <h2 className="text-sm font-semibold text-[#16324f]">{heading}</h2>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={`/${locale}${link.href}`}
              className="flex min-h-11 items-center text-sm font-medium text-[#16324f] underline decoration-[#e6e8ec] underline-offset-4 hover:decoration-[#e24b2a]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
