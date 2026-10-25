/* eslint-disable @typescript-eslint/no-explicit-any */
import { valuationApiService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/valuation.service";
import { fetchStandardFloorsList } from "./valuation-data-common.utils";

export async function fetchBuildingValuationData(
  assetId: number
): Promise<{ floorsList: any[]; buildingCVData: any; plotCVData: any }> {
  let floorsList: any[] = [];
  let buildingCVData: any = null;
  let plotCVData: any = null;

  // Building CV and the building's own open-plot CV are calculated concurrently —
  // a building asset can have both a constructed-area valuation and an open-plot valuation.
  const [cvRes, plotCvRes] = await Promise.all([
    valuationApiService.calculateBuildingCV(assetId),
    valuationApiService.calculatePlotCV(assetId),
  ]);

  if (cvRes.success && cvRes.data) {
    buildingCVData = cvRes.data;

    // Include building's own floor details plus child asset floor details
    const buildingFloorDetails = cvRes.data.buildingFloorDetails ?? [];
    const childFloorDetails = (cvRes.data.childAssets ?? []).flatMap(
      (child: any) => child.floorDetails ?? []
    );
    floorsList = buildingFloorDetails.length > 0 ? buildingFloorDetails : childFloorDetails;
  } else {
    floorsList = await fetchStandardFloorsList(assetId);
  }

  if (plotCvRes.success && plotCvRes.data) {
    plotCVData = plotCvRes.data;
  }

  return { floorsList, buildingCVData, plotCVData };
}

export async function fetchLandValuationData(
  assetId: number
): Promise<{ floorsList: any[]; plotCVData: any }> {
  let plotCVData: any = null;

  const cvRes = await valuationApiService.calculatePlotCV(assetId);
  if (cvRes.success && cvRes.data) {
    plotCVData = cvRes.data;
  }

  const floorsList = await fetchStandardFloorsList(assetId);

  return { floorsList, plotCVData };
}
