import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({ params }: { params: { locale: string } }) {
  const { locale } = params;
  redirect(`/${locale}/property-tax/floormaster/floor`);
}
