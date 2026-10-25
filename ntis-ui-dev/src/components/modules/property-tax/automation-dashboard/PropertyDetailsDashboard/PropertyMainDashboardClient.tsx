'use client';

import { useState, useMemo, useEffect } from 'react';
import { AutomationTable } from '@/components/common/AutomationTable';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { getPropertyDashboardColumns, getPropertyDashboardHeaderRows } from './PropertyDashboardColumns';
import { PropertyDashboardHeader } from './PropertyDashboardHeader';
import { DocumentViewerModal } from '@/components/common';
import { PropertySubGridDetailsItems, PropertySubGridProperty, WardItem, PropertyTypeMasterItem, PropertyAssessmentStatusItem } from '@/types/automation-dashboard/property-dashboard/property-subgrid-details.type';
import { handleLocationClick } from '@/lib/utils/automation-dashboard/mapUtils';
interface PropertyMainDashboardProps {
    serverData?: PropertySubGridDetailsItems | null;
    wardsData?: WardItem[] | null;
    propertyType?: PropertyTypeMasterItem[] | null;
    assessmentStatus?: PropertyAssessmentStatusItem[] | null;
}

export const propertyTypeOptions = [
    { value: 'All', label: 'All Types' },
    { value: '1', label: 'Residential' },
    { value: '2', label: 'NonResidential' },
    { value: '3', label: 'Mixed' },
    { value: '4', label: 'OpenPlots' },
    { value: '5', label: 'PublicUtility' },
    { value: '6', label: 'UnderConstruction' }
];

const PropertyMainDashboardClient = ({ serverData, wardsData, propertyType, assessmentStatus }: PropertyMainDashboardProps) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('automationDashboard.propertyDetailsDashboard');
    const params = useParams();
    const pathZoneId = params?.zoneId as string;

    const stage = serverData?.workflowStageName || searchParams.get('stage') || 'geoSequencing';
    const workflowStageId = serverData?.workflowStageId?.toString() || searchParams.get('workflowStageId');
    const source = searchParams.get('source') || 'division';

    const zoneNo = searchParams.get('zoneNo');

    const displayDivision = useMemo(() => {
        let name = '';
        if (serverData && 'wardNo' in serverData && typeof serverData.wardNo === 'string') {
            name = serverData.wardNo;
        } else if (serverData && 'zoneName' in serverData && typeof serverData.zoneName === 'string') {
            name = serverData.zoneName;
        } else {
            name = pathZoneId || '';
        }

        if (zoneNo && name && !name.startsWith(`${zoneNo} - `)) {
            return `${zoneNo} - ${name}`;
        }
        return name;
    }, [serverData, pathZoneId, zoneNo]);

    const backUrl = useMemo(() => {
        const returnUrl = searchParams.get('returnUrl');
        if (returnUrl) {
            return decodeURIComponent(returnUrl);
        }
        return `/${locale}/property-tax/automation-dashboard`;
    }, [locale, searchParams]);

    const pageNumber = parseInt(searchParams.get('pageNumber') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const initialSearch = searchParams.get('Search') || searchParams.get('PropertyNo') || '';
    const [searchTerm, setSearchTerm] = useState(initialSearch);

    const handleSearchTermChange = (val: string) => {
        setSearchTerm(val);
        const params = new URLSearchParams(searchParams.toString());
        if (val.trim()) {
            params.set('Search', val.trim());
        } else {
            params.delete('Search');
        }
        params.delete('PropertyNo');
        params.set('pageNumber', '1');
        router.push(`?${params.toString()}`);
    };

    const handleSearch = () => {
        // Fallback for Enter key if needed
        handleSearchTermChange(searchTerm);
    };

    const isWardWise = searchParams.get('wardWise') === 'true' || searchParams.get('source') === 'ward';

    const actualZoneId = searchParams.get('zoneId') || pathZoneId;

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedZone, setSelectedZone] = useState(serverData?.zoneId?.toString() || actualZoneId);

    useEffect(() => {
        if (serverData && 'zoneId' in serverData && serverData.zoneId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedZone(serverData.zoneId.toString());
        }
    }, [serverData]);

    const selectedWard = isWardWise ? pathZoneId : (searchParams.get('wardId') || 'All');
    const setSelectedWard = (val: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('wardId', val);
        params.set('pageNumber', '1');
        router.push(`?${params.toString()}`);
    };

    const selectedDescription = searchParams.get('propertyTypeId') || 'All';
    const setSelectedDescription = (val: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (val && val !== 'All') {
            params.set('propertyTypeId', val);
        } else {
            params.delete('propertyTypeId');
        }
        params.set('pageNumber', '1');
        router.push(`?${params.toString()}`);
    };

    const selectedPropertyType = searchParams.get('propertyTypeCategoryId') || 'All';
    const setSelectedPropertyType = (val: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (val && val !== 'All') params.set('propertyTypeCategoryId', val);
        else params.delete('propertyTypeCategoryId');

        params.set('pageNumber', '1');
        router.push(`?${params.toString()}`);
    };

    const selectedAssessmentType = searchParams.get('assessmentTypeId') || 'All';
    const setSelectedAssessmentType = (val: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (val && val !== 'All') params.set('assessmentTypeId', val);
        else params.delete('assessmentTypeId');
        params.set('pageNumber', '1');
        router.push(`?${params.toString()}`);
    };

    const zoneOptions = useMemo(() => {
        let label = actualZoneId;
        if (serverData && 'zoneName' in serverData && typeof serverData.zoneName === 'string') {
            label = serverData.zoneName;
        }
        return [{ value: serverData?.zoneId?.toString() || actualZoneId, label: label }];
    }, [serverData, actualZoneId]);

    const formattedWardsData = useMemo(() => {
        if (!wardsData) return [{ value: 'All', label: 'All Wards' }];
        const mapped = wardsData.map(ward => ({
            value: ward.id.toString(),
            label: ward.wardNo
        }));

        if (isWardWise) {
            const currentWard = mapped.find(w => w.value === pathZoneId);
            return currentWard ? [currentWard] : [{ value: pathZoneId, label: displayDivision }];
        }

        return [{ value: 'All', label: 'All Wards' }]?.concat(mapped);
    }, [wardsData, isWardWise, pathZoneId, displayDivision]);

    const formattedAssessmentStatus = useMemo(() => {
        if (!assessmentStatus) return [{ value: 'All', label: 'All' }];
        const mapped = assessmentStatus.map(status => ({
            value: status.id.toString(),
            label: status.statusName
        }));
        return [{ value: 'All', label: 'All' }]?.concat(mapped);
    }, [assessmentStatus]);

    const descriptionOptions = useMemo(() => {
        const mapped = (propertyType || [])?.map((item) => ({ label: item?.propertyDescription, value: String(item?.id) }));
        return [{ value: 'All', label: 'All Descriptions' }]?.concat(mapped);
    }, [propertyType]);

    const handleClearFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('wardId');
        params.delete('propertyTypeId');
        params.delete('propertyTypeCategoryId');
        params.delete('assessmentTypeId');
        params.delete('Search');
        params.delete('PropertyNo');
        params.set('pageNumber', '1');
        router.push(`?${params.toString()}`);
        setSelectedZone(serverData?.zoneId?.toString() || actualZoneId);
        setSearchTerm('');
    };

    const headerRows = getPropertyDashboardHeaderRows(t);

    const handleImageClick = (row: PropertySubGridProperty) => {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
        currentParams.set('imageId', row.propertyId.toString());
        router.push(`?${currentParams.toString()}`);
    };

    const closeViewer = () => {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
        currentParams.delete('imageId');
        router.push(`?${currentParams.toString()}`);
    };

    const imageId = searchParams.get('imageId');
    const selectedPropertyForImage = useMemo(() => {
        if (!serverData || !serverData.properties) return null;
        return serverData.properties.find(p => p.propertyId.toString() === imageId) || null;
    }, [imageId, serverData]);

    const isViewerOpen = !!selectedPropertyForImage;
    const imageUrl = selectedPropertyForImage?.documentGuid || 'https://images.unsplash.com/photo-1546412414-e1885259563a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

    const columns = getPropertyDashboardColumns(t, handleImageClick, pageNumber, pageSize);

    const totalCount = serverData?.totalCount || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const paginatedData = serverData?.properties || [];

    const handlePageChange = (newPageNumber: number) => {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
        currentParams.set('pageNumber', newPageNumber.toString());
        currentParams.set('pageSize', pageSize.toString());
        router.push(`?${currentParams.toString()}`);
    };

    const handlePageSizeChange = (newSize: number) => {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
        currentParams.set('pageNumber', '1');
        currentParams.set('pageSize', newSize.toString());
        router.push(`?${currentParams.toString()}`);
    };

    const renderActions = (row: PropertySubGridProperty) => {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
        currentParams.set('zoneId', pathZoneId);
        if (stage) currentParams.set('stage', stage);
        if (source) currentParams.set('source', source);
        if (workflowStageId) currentParams.set('workflowStageId', workflowStageId.toString());

        return (
            <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                <button
                    onClick={() => router.push(`/${locale}/property-tax/automation-dashboard/property-details-dashboard/${pathZoneId}/PropertyReport/${row.propertyId}?${currentParams.toString()}`)}
                    className="h-6 w-[70px] rounded-full text-xs flex items-center justify-center font-bold bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200 transition-colors cursor-pointer select-none"
                >
                    {t('actions.report')}
                </button>
                <button
                    onClick={() => router.push(`/${locale}/property-tax/automation-dashboard/property-details-dashboard/${pathZoneId}/PropertyTracking/${row.propertyId}?${currentParams.toString()}`)}
                    className="h-6 w-[70px] rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 transition-colors flex items-center justify-center cursor-pointer select-none"
                >
                    {t('actions.tracking')}
                </button>
                <div
                    className="h-8 w-8 mt-0.5 hover:bg-slate-100 transition-colors flex items-center justify-center rounded-full animate-shimmer cursor-pointer"
                    title="Location"
                    onClick={() => handleLocationClick(row)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/39/Google_Maps_icon_%282015-2020%29.svg" alt="Location" className="h-6 w-6" />
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full flex-col gap-4 overflow-hidden bg-gray-50 p-2">
            <PropertyDashboardHeader
                backUrl={backUrl}
                division={displayDivision}
                searchTerm={searchTerm}
                setSearchTerm={handleSearchTermChange}
                onSearch={handleSearch}
                stage={stage}
                columnName={searchParams.get('columnName') || undefined}

                isFilterOpen={isFilterOpen}
                onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
                onClearFilters={handleClearFilters}

                selectedZone={selectedZone}
                setSelectedZone={setSelectedZone}
                zoneOptions={zoneOptions}

                selectedWard={selectedWard}
                setSelectedWard={setSelectedWard}
                wardOptions={formattedWardsData}
                isWardDisabled={isWardWise}

                selectedDescription={selectedDescription}
                setSelectedDescription={setSelectedDescription}
                descriptionOptions={descriptionOptions}

                selectedPropertyType={selectedPropertyType}
                setSelectedPropertyType={setSelectedPropertyType}
                propertyTypeOptions={propertyTypeOptions}

                selectedAssessmentType={selectedAssessmentType}
                setSelectedAssessmentType={setSelectedAssessmentType}
                assessmentTypeOptions={formattedAssessmentStatus}
            />

            {/* Main Table */}
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0">
                <AutomationTable
                    columns={columns}
                    headerRows={headerRows}
                    data={paginatedData}
                    renderActions={renderActions}
                    tableClassName="border-collapse w-full border border-slate-300 [&_tbody>tr>td]:border [&_tbody>tr>td]:border-slate-300 hover:[&_tbody>tr]:bg-slate-50"
                    theadClassName="[&>tr>th]:border [&>tr>th]:border-slate-300"
                    paginationConfig={{ enabled: true, showPageSizeSelector: true }}
                    pageNumber={pageNumber}
                    pageSize={pageSize}
                    totalCount={totalCount}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    getRowKey={(row) => row.propertyId}
                />
            </div>

            <DocumentViewerModal
                isOpen={isViewerOpen}
                onClose={closeViewer}
                fileUrl={imageUrl}
                fileName={selectedPropertyForImage ? `Property_Image_${selectedPropertyForImage.propertyNo}.jpg` : ''}
                propertyNo={selectedPropertyForImage?.propertyNo || '-'}
                wardNo={'-'}
            />
        </div>
    );
};

export default PropertyMainDashboardClient;