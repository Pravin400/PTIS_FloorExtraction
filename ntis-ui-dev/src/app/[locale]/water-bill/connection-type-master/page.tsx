import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly params: Promise<{ locale: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ConnectionTypeMasterPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const qParams = new URLSearchParams();
  for (const [key, val] of Object.entries(sp || {})) {
    if (typeof val === "string") {
      qParams.set(key, val);
    }
  }
  const query = qParams.toString();
  redirect(`/${locale}/water-bill/connection-type-master/connection-type${query ? `?${query}` : ""}`);
}
