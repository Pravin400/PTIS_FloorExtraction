import DataEntryQualityCheck from "@/components/modules/property-tax/automation-dashboard/DataEntryQualityCheck/DataEntryQualityCheck";
import { getDataEntryGridAction } from "./action";
import { getPropertyTypeMasterAction } from "../assessment/action";
import { PropertyTypeMasterItem } from '@/types/automation-dashboard/property-dashboard/property-subgrid-details.type';

interface Props {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ workflowStageId?: string, isFilter?: string, propertyTypeId?: string, propertyTypeCategoryId?: string }>;
}

export default async function QualityCheckPageServer(props: Props) {    
    const resolvedParams = await props.searchParams;
    const workflowStageId = resolvedParams?.workflowStageId;
    const propertyTypeId = resolvedParams?.propertyTypeId;
    const propertyTypeCategoryId = resolvedParams?.propertyTypeCategoryId;

    const [dataResult] = await Promise.all([
        getDataEntryGridAction(workflowStageId, propertyTypeId, propertyTypeCategoryId)
    ]);

    let propertyDescriptions: PropertyTypeMasterItem[] = [];
    if (resolvedParams?.isFilter === 'true') {
        const descResponse = await getPropertyTypeMasterAction();
        if (descResponse.success && descResponse.data) {
            propertyDescriptions = descResponse.data;
        }
    }

    return (
       <DataEntryQualityCheck 
            serverData={dataResult?.data ?? null} 
            propertyDescriptions={propertyDescriptions}
       />  
    );
}
