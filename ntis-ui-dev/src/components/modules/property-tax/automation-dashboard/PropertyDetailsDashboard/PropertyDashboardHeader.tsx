
import { Button } from '@/components/common/ActionButton';
import { ClearButton } from '@/components/common/ActionButtons';
import { SearchInput } from '@/components/common/SearchInput';
import { SearchSelect } from '@/components/common/SearchSelect';
import { ArrowLeft, Filter, Download } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface PropertyDashboardHeaderProps {
    backUrl: string;
    division: string;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onSearch: () => void;
    stage?: string;
    columnName?: string;

    // Filters integration props
    isFilterOpen: boolean;
    onToggleFilter: () => void;
    onClearFilters: () => void;

    selectedZone: string;
    setSelectedZone: (val: string) => void;
    zoneOptions: { value: string; label: string }[];

    selectedWard: string;
    setSelectedWard: (val: string) => void;
    wardOptions: { value: string; label: string }[];
    isWardDisabled?: boolean;

    selectedDescription: string;
    setSelectedDescription: (val: string) => void;
    descriptionOptions: { value: string; label: string }[];

    selectedPropertyType: string;
    setSelectedPropertyType: (val: string) => void;
    propertyTypeOptions: { value: string; label: string }[];

    selectedAssessmentType: string;
    setSelectedAssessmentType: (val: string) => void;
    assessmentTypeOptions: { value: string; label: string }[];
}

export const PropertyDashboardHeader = ({
    backUrl,
    division,
    searchTerm,
    setSearchTerm,
    onSearch,
    stage = 'geoSequencing',
    columnName,

    isFilterOpen,
    onToggleFilter,
    onClearFilters,

    selectedZone,
    setSelectedZone,
    zoneOptions,

    selectedWard,
    setSelectedWard,
    wardOptions,
    isWardDisabled,

    selectedDescription,
    setSelectedDescription,
    descriptionOptions,

    selectedPropertyType,
    setSelectedPropertyType,
    propertyTypeOptions,

    selectedAssessmentType,
    setSelectedAssessmentType,
    assessmentTypeOptions
}: PropertyDashboardHeaderProps) => {
    const router = useRouter();
    const t = useTranslations('automationDashboard.propertyDetailsDashboard');

    const formattedStage = useMemo(() => {
        switch (stage) {
            case 'geoSequencing': return 'Geo-sequencing';
            case 'dataEntryQC': return 'Data Entry QC';
            case 'sendToApprove': return 'Send to Approve';
            default:
                return stage.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        }
    }, [stage]);

    const titleText = useMemo(() => {
        if (columnName) {
            return `${division} - ${formattedStage} ${columnName} Properties`;
        }
        return `${division} - ${t('header.mainProperties')}`;
    }, [division, columnName, formattedStage, t]);

    return (
        <div className="flex flex-col rounded-lg border border-slate-200 shadow-sm overflow-visible bg-white flex-shrink-0">
            {/* Top Header Section */}
            <div className="flex items-center justify-between bg-[#f0f5ff] p-3 border-b border-blue-100">
                <Button
                    variant="secondary"
                    icon={ArrowLeft}
                    onClick={() => router.push(backUrl)}
                    className="h-7 px-3 text-xs font-semibold flex items-center gap-1.5 text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 transition-colors rounded-md shadow-sm"
                >
                    {t('header.backToDivisions')}
                </Button>

                <div className="text-center flex-1">
                    <h2 className="text-[13px] font-bold text-slate-900 leading-tight">
                        {titleText}
                    </h2>
                    <p className="text-[11px] text-slate-700 font-medium leading-tight mt-0.5">
                        {t('header.stage')} {formattedStage}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        {t('header.subtitle')}
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        icon={Download}
                        className="h-7 px-3 text-xs font-semibold flex items-center gap-1.5 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors rounded-md shadow-sm"
                    >
                        {t('header.export')}
                    </Button>
                </div>
            </div>

            {/* Toolbar Section */}
            <div className="px-4 py-3 flex items-center justify-between bg-white">
                <div className="w-[30%]">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        onEnter={onSearch}
                        placeholder={t('header.searchPlaceholder')}
                        className="w-full mb-0"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        variant="secondary" 
                        icon={Filter}
                        onClick={onToggleFilter}
                        className={`h-7 px-3 text-xs font-semibold flex items-center gap-1.5 transition-colors rounded-md shadow-sm border ${
                            isFilterOpen 
                                ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100' 
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                        {t('header.filter')}
                    </Button>
                    <ClearButton onClick={onClearFilters} />
                </div>
            </div>

            {/* Collapsible Filter Section */}
            {isFilterOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 bg-slate-50 px-4 py-3 border-t border-slate-200">
                    <div>
                        <label className="text-[9px] font-bold text-slate-500 tracking-wider uppercase block mb-1">
                            {t('filters.zone')}
                        </label>
                        <SearchSelect
                            id="filter-zone"
                            name="zone"                            
                            options={zoneOptions}
                            value={selectedZone}                            
                            onChange={(_, val) => setSelectedZone(val)}
                            placeholder={t('filters.selectZone')}
                            disabled={true}
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-bold text-slate-500 tracking-wider uppercase block mb-1">
                            {t('filters.ward')}
                        </label>
                        <SearchSelect
                            id="filter-ward"
                            name="ward"
                            options={wardOptions}
                            value={selectedWard}
                            onChange={(_, val) => setSelectedWard(val)}
                            placeholder={t('filters.selectWard')}
                            disabled={isWardDisabled}
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-bold text-slate-500 tracking-wider uppercase block mb-1">
                            {t('filters.propertyDescriptions')}
                        </label>
                        <SearchSelect
                            id="filter-description"
                            name="description"
                            options={descriptionOptions}
                            value={selectedDescription}
                            onChange={(_, val) => setSelectedDescription(val)}
                            placeholder={t('filters.selectDescription')}
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-bold text-slate-500 tracking-wider uppercase block mb-1">
                            {t('filters.propertyType')}
                        </label>
                        <SearchSelect
                            id="filter-property-type"
                            name="propertyType"
                            options={propertyTypeOptions}
                            value={selectedPropertyType}
                            onChange={(_, val) => setSelectedPropertyType(val)}
                            placeholder={t('filters.selectPropertyType')}
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-bold text-slate-500 tracking-wider uppercase block mb-1">
                            {t('filters.assessmentType')}
                        </label>
                        <SearchSelect
                            id="filter-assessment-type"
                            name="assessmentType"
                            options={assessmentTypeOptions}
                            value={selectedAssessmentType}
                            onChange={(_, val) => setSelectedAssessmentType(val)}
                            placeholder={t('filters.selectAssessmentType')}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
