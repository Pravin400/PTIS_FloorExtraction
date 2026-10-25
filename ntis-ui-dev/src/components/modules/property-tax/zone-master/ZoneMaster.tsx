"use client";

import { PageContainer } from "@/components/common/PageContainer";
import ZoneWardContent from "./ZoneContent";
import {
  ZonePaginationData,
  WardPaginationData,
  DashboardStats,
  SSRData,
  EditData,
  SelectionState,
  PropertyPaginationData,
  PropertyLookupMaps,
  RightPanelTab,
  CreatePropertyData,
  CreatePartitionData,
  DeletePropertyData,
} from "@/types/zoneMaster.types";

export interface ZoneMasterProps {
  zonePagination: ZonePaginationData;
  wardPagination: WardPaginationData;
  dashboardStats: DashboardStats;
  selection: SelectionState;
  editData?: EditData;
  ssrData?: SSRData;
  propertyPagination?: PropertyPaginationData;
  propertyLookups?: PropertyLookupMaps;
  activeRightTab?: RightPanelTab;
  createPropertyData?: CreatePropertyData;
  createPartitionData?: CreatePartitionData;
  deletePropertyData?: DeletePropertyData;
}

export default function ZoneMaster({
  zonePagination,
  wardPagination,
  dashboardStats,
  selection,
  editData,
  ssrData,
  propertyPagination,
  propertyLookups,
  activeRightTab = "wards",
  createPropertyData,
  createPartitionData,
  deletePropertyData,
}: ZoneMasterProps) {
  return (
    <PageContainer>
      <ZoneWardContent
        zonePagination={zonePagination}
        wardPagination={wardPagination}
        dashboardStats={dashboardStats}
        selection={selection}
        editData={editData}
        ssrData={ssrData}
        propertyPagination={propertyPagination}
        propertyLookups={propertyLookups}
        activeRightTab={activeRightTab}
        createPropertyData={createPropertyData}
        createPartitionData={createPartitionData}
        deletePropertyData={deletePropertyData}
      />
    </PageContainer>
  );
}
