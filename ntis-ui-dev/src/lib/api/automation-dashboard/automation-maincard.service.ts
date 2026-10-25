import { apiClient } from "@/services/api.service";
import { handleApiResponse } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";
import { MainCardsData, MainCardsResponse, WorkflowCardData, WorkflowCardsResponse } from "@/types/automation-dashboard/automation-maincard/automation-maincart.type";

export async function automationgetMainCards(): Promise<MainCardsData | null> {

  const url = `/AutomationDashboard/MainCards`;
  const response = await apiClient.get<MainCardsResponse>(url);

  // We can use a namespace like "automationDashboard" for translations. 
  // Make sure this namespace exists in your localization files (e.g., en.json, etc.)
  const t = await getTranslations("automationDashboard");

  const responseData = handleApiResponse(response, t("errors.fetchMainCards"));
  return responseData.items?.[0] ?? null;
}

export async function automationGetWorkflowCards(): Promise<WorkflowCardData[] | null> {
  const url = `/AutomationDashboard/WorkFlowStages`;

  const response = await apiClient.get<WorkflowCardsResponse>(url);
  const t = await getTranslations("automationDashboard");

  return handleApiResponse(response, t("errors.fetchWorkflowCards")).items ?? null;
}
