import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AddTapSizeRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/water-bill/connection-type-master/tap-size/add`);
}
