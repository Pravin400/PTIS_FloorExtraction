import { PageContainer } from "@/components/common";

interface FireAuditRouteFrameProps {
  title: string;
  purpose: string;
  /** Citizen and public pages already sit in their own shell. */
  plain?: boolean;
}

export function FireAuditRouteFrame({
  title,
  purpose,
  plain = false,
}: FireAuditRouteFrameProps) {
  const body = (
    <section className="rounded-2xl border border-[#e6e8ec] bg-white p-6">
      <h1 className="text-2xl font-semibold text-[#16324f]">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#586E7C]">{purpose}</p>
    </section>
  );

  if (plain) {
    return body;
  }

  return <PageContainer className="!bg-transparent">{body}</PageContainer>;
}
