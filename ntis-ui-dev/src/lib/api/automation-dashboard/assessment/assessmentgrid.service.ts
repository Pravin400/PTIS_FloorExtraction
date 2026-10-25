import { apiClient } from "@/services/api.service";
import { handleApiResponse } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";
import {
  AssessmentGridItems,
  AssessmentGridResponse,
  AssessmentGridType,
  PendingAssessmentItems,
  PendingAssessmentResponse,
  SendToApprovePayload,
  SendToApproveResponse
} from "@/types/automation-dashboard/assessment/assessmentgrid.type";

export async function automationGetAssessmentGrid(
  workflowStageId?: string | number,
  type: AssessmentGridType = "Total",
  propertyTypeId?: string | number,
  propertyTypeCategoryId?: string | number
): Promise<AssessmentGridItems | null> {
  const params = new URLSearchParams();
  params.append("type", type);
  
  if (workflowStageId !== undefined && workflowStageId !== null) {
    params.append("workflowStageId", workflowStageId.toString());
  }
  if (propertyTypeId !== undefined && propertyTypeId !== null && propertyTypeId !== 'All') {
    params.append("PropertyTypeId", propertyTypeId.toString());
  }
  if (propertyTypeCategoryId !== undefined && propertyTypeCategoryId !== null && propertyTypeCategoryId !== 'All') {
    params.append("PropertyTypeCategoryId", propertyTypeCategoryId.toString());
  }

  const url = `/AutomationDashboard/AssessmentGrid?${params.toString()}`;

  const response = await apiClient.get<AssessmentGridResponse>(url, { cache: "force-cache" });
  const t = await getTranslations("automationDashboard");

  const responseData = handleApiResponse(response, t("errors.fetchAssessmentGrid") || "Failed to fetch assessment grid data");
  return responseData.items?.[0] ?? null;
}

export interface FetchPendingAssessmentPropsParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  surveyTypeId?: string | number;
  zoneId?: string | number;
  zoneNo?: string;
  wardId?: string | number;
  wardNo?: string;
  PropertyTypeCategoryId?: string | number;
  PropertyTypeId?: string | number;
}

export async function automationGetPendingAssessmentProps(
  params: FetchPendingAssessmentPropsParams
): Promise<PendingAssessmentItems | null> {
  const urlParams = new URLSearchParams();
  if (params.pageNumber !== undefined) urlParams.append("pageNumber", params.pageNumber.toString());
  if (params.pageSize !== undefined) urlParams.append("pageSize", params.pageSize.toString());
  if (params.searchTerm) urlParams.append("SearchTerm", params.searchTerm);
  if (params.surveyTypeId !== undefined && params.surveyTypeId !== null && params.surveyTypeId !== 'All') urlParams.append("SurveyTypeId", params.surveyTypeId.toString());
  if (params.zoneId !== undefined && params.zoneId !== null && params.zoneId !== 'All') urlParams.append("ZoneId", params.zoneId.toString());
  if (params.zoneNo) urlParams.append("ZoneNo", params.zoneNo);
  if (params.wardId !== undefined && params.wardId !== null && params.wardId !== 'All') urlParams.append("WardId", params.wardId.toString());
  if (params.wardNo) urlParams.append("WardNo", params.wardNo);
  if (params.PropertyTypeCategoryId !== undefined && params.PropertyTypeCategoryId !== null && params.PropertyTypeCategoryId !== 'All') urlParams.append("PropertyTypeCategoryId", params.PropertyTypeCategoryId.toString());
  if (params.PropertyTypeId !== undefined && params.PropertyTypeId !== null && params.PropertyTypeId !== 'All') urlParams.append("PropertyTypeId", params.PropertyTypeId.toString());

  const response = await apiClient.get<PendingAssessmentResponse>(
    `/AutomationDashboard/GetPendingAssessmentProps?${urlParams.toString()}`
  ,{ cache: "force-cache" });
  const t = await getTranslations("automationDashboard");

  const responseData = handleApiResponse(response, t("errors.fetchPendingAssessmentProps") || "Failed to fetch pending assessment properties");
  return responseData.items?.[0] ?? null;
}

export async function automationSendToApprove(payload: SendToApprovePayload): Promise<SendToApproveResponse> {
  const url = `/AutomationDashboard/SendToApprove`;
 
  const response = await apiClient.post<SendToApproveResponse>(url, payload);
  const t = await getTranslations("automationDashboard");
  return handleApiResponse(response, t("errors.sendToApprove") || "Failed to send for approval");
}
