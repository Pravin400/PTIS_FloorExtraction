
import SendToApproveDashboard from "@/components/modules/property-tax/automation-dashboard/Assessment/send-to-approve/SendToApproveDashboard";
import { 
    getPendingAssessmentPropsAction,
    getZonesAction,
    getWardsAction,
    getPropertyTypeMasterAction,
    getPropertyAssessmentStatusAction
} from "../action";

export const propertyTypeStaticOptions = [
    { value: 'All', label: 'All Types' },
    { value: '1', label: 'Residential' },
    { value: '2', label: 'NonResidential' },
    { value: '3', label: 'Mixed' },
    { value: '4', label: 'OpenPlots' },
    { value: '5', label: 'PublicUtility' },
    { value: '6', label: 'UnderConstruction' }
];

interface PageProps {
    searchParams: Promise<{
        pageNumber?: string;
        pageSize?: string;
        SearchTerm?: string;
        surveyType?: string;
        zoneName?: string;
        wardNumber?: string;
        PropertyTypeCategoryId?: string;
        PropertyTypeId?: string;
    }>;
}

export default async function SendToApprovePage({ searchParams }: PageProps) {
    const search = await searchParams;
    const pageNumber = search.pageNumber ? parseInt(search.pageNumber, 10) : 1;
    const pageSize = search.pageSize ? parseInt(search.pageSize, 10) : 10;
    const SearchTerm = search.SearchTerm || '';
    const surveyType = search.surveyType || 'All';
    const zoneName = search.zoneName || 'All';
    const wardNumber = search.wardNumber || 'All';
    const propertyType = search.PropertyTypeCategoryId || 'All';
    const propertyDescription = search.PropertyTypeId || 'All';

    // 1. Fetch metadata first (Zones, Wards, Property Types, Survey Types)
    const [
        zonesRes,
        wardsRes,
        propTypeRes,
        surveyTypeRes
    ] = await Promise.all([
        getZonesAction(-1, -1),
        getWardsAction(-1, -1),
        getPropertyTypeMasterAction(-1, -1),
        getPropertyAssessmentStatusAction(-1, -1)
    ]);

    const zones = zonesRes.success && zonesRes.data ? zonesRes.data : [];
    const wards = wardsRes.success && wardsRes.data ? wardsRes.data : [];

    // 2. Fetch pending assessment properties with all queries mapped
    const response = await getPendingAssessmentPropsAction({
        pageNumber,
        pageSize,
        searchTerm: SearchTerm,
        surveyTypeId: surveyType,
        zoneId: zoneName,
        wardId: wardNumber,
        PropertyTypeCategoryId: propertyType,
        PropertyTypeId: propertyDescription
    });

    const serverData = response.success ? (response.data ?? null) : null;

    const zoneOptions = zones.map(z => ({ value: z.id.toString(), label: z.zoneNo || '' }));
    const wardOptions = wards.map(w => ({ value: w.id.toString(), label: w.wardNo || w.description || '' }));
    const propDescOptions = (propTypeRes.success && propTypeRes.data ? propTypeRes.data : []).map(p => ({ value: p.id.toString(), label: p.propertyDescription || p.type || '' }));
    const surveyTypeOptions = (surveyTypeRes.success && surveyTypeRes.data ? surveyTypeRes.data : []).map(s => ({ value: s.id.toString(), label: s.statusName || '' }));

    // Add 'All' options at the top
    zoneOptions.unshift({ value: 'All', label: 'All Zones' });
    wardOptions.unshift({ value: 'All', label: 'All Wards' });
    propDescOptions.unshift({ value: 'All', label: 'All Descriptions' });
    surveyTypeOptions.unshift({ value: 'All', label: 'All Survey Types' });

    return (
        <SendToApproveDashboard
            serverData={serverData}
            pageNumber={pageNumber}
            pageSize={pageSize}
            zoneOptions={zoneOptions}
            wardOptions={wardOptions}
            propertyTypeOptions={propertyTypeStaticOptions}
            propertyDescriptionOptions={propDescOptions}
            surveyTypeOptions={surveyTypeOptions}
            initialSearchTerm={SearchTerm}
        />
    );
}

