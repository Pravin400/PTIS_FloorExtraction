import { setRequestLocale } from "next-intl/server";

import Portal from "@/components/modules/water-bill/portal/Portal";
import {
  fetchActivePortalConfigServerAction,
  fetchCitizenServicesServerAction,
  fetchPortalContentServerAction,
} from "./action";

interface PortalPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PortalPage({ params }: PortalPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [config, content, citizenServices] = await Promise.all([
    fetchActivePortalConfigServerAction(),
    fetchPortalContentServerAction(),
    fetchCitizenServicesServerAction(),
  ]);

  return <Portal config={config} content={content} citizenServices={citizenServices} />;
}
