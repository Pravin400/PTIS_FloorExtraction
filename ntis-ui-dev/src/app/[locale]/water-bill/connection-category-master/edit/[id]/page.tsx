import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditConnectionCategoryRedirect({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  redirect(`/${locale}/water-bill/connection-type-master/connection-category/edit/${id}`);
}
