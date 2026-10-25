import React from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Input, AnimatedDigitInput, SearchSelect, Button, CancelButton, Label, ValidationMessage } from '@/components/common';
import { useFloorSubmissionForm } from '@/hooks/apartmentQc/useFloorSubmissionForm';
import { useEnterKeyNavigation } from '@/hooks/apartmentQc/useEnterKeyNavigation';
import type { FloorSubmissionRow } from '@/types/apartmentQC.types';
import { LayoutGrid, Save } from 'lucide-react';
import { toast } from 'sonner';
import RoomWiseSubmission from '@/components/modules/property-tax/ptis/appartmentQC/roomSubmission/RoomWiseSubmission';
import type { RoomAPIResponse } from '@/types/room-details.types';
import type { DrawerFloorDataRow } from '@/types/propertyEditScreenDrawer.types';

import type { Floor } from '@/types/floor.types';
import type { ConstructionType } from '@/types/construction.types';
import type { UseType, UseSubType } from '@/types/typeOfUse.types';

interface FloorSubmissionFormProps {
    initialRow: FloorSubmissionRow;
    onCancel: () => void;
    onSaveSuccess: () => void;
    floorOptions?: Floor[];
    constructionTypeOptions?: ConstructionType[];
    useOptions?: UseType[];
    subUseTypeOptions?: UseSubType[];
    subFloorOptions?: Array<{ id?: string | number; subFloorId?: string | number; subFloorCode?: string; description?: string }>;
    isEditMode?: boolean;
    initialRoomData?: unknown[];
}

export const FloorSubmissionForm = ({
    initialRow,
    onCancel,
    onSaveSuccess,
    floorOptions = [],
    constructionTypeOptions = [],
    useOptions = [],
    subUseTypeOptions = [],
    subFloorOptions = [],
    isEditMode = false,
    initialRoomData = []
}: FloorSubmissionFormProps) => {
    const t = useTranslations('appartmentQC');
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const {
        formData,
        errors,
        isSaving,
        handleFieldChange,
        handleSave,
        handleOpenDropdown,
        floors,
        isLoadingFloors,
        conTypes,
        isLoadingConTypes,
        useTypes,
        isLoadingUseTypes,
        subTypes,
        isLoadingSubTypes,
        isSubTypeDisabled,
        subFloors,
        isLoadingSubFloors
    } = useFloorSubmissionForm(initialRow, onSaveSuccess, t, floorOptions, constructionTypeOptions, useOptions, subUseTypeOptions, subFloorOptions);

    const [isRoomDrawerOpen, setIsRoomDrawerOpen] = React.useState(false);
    // const [isLoadingRooms, setIsLoadingRooms] = React.useState(false);
    const [existingRooms, setExistingRooms] = React.useState<RoomAPIResponse[]>([]);
    const [areaUnit, setAreaUnit] = React.useState<'sq.m' | 'sq.ft'>('sq.m');

    const handleToggleUnit = () => {
        setAreaUnit((prev) => (prev === 'sq.m' ? 'sq.ft' : 'sq.m'));
    };

    const resolvedPropertyId = React.useMemo(() => {
        const rowPropertyId = (initialRow as Record<string, unknown>).propertyId;
        if (typeof rowPropertyId === 'number' || typeof rowPropertyId === 'string') {
            const parsed = Number(rowPropertyId);
            if (!Number.isNaN(parsed) && parsed > 0) return parsed;
        }

        const fromQuery = searchParams.get('editPropertyId') || searchParams.get('propertyId');
        const parsedQuery = Number(fromQuery || 0);
        return Number.isNaN(parsedQuery) ? 0 : parsedQuery;
    }, [initialRow, searchParams]);

    React.useEffect(() => {
        const isOpen = searchParams.get('roomDrawerOpen') === 'true';
        const currentRoomPdnId = searchParams.get('roomPdnId');
        
        let timeoutId: NodeJS.Timeout;
        if (isOpen && currentRoomPdnId === String(initialRow.pdnId)) {
            timeoutId = setTimeout(() => {
                setIsRoomDrawerOpen(true);
                
                try {
                    const rooms = Array.isArray(initialRoomData) ? initialRoomData : [];
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const mappedRooms: RoomAPIResponse[] = rooms.map((r: any) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const offsets = (r.roomWiseMinusData || []).map((minus: any) => ({
                            id: minus.id || 0,
                        roomWiseSubmissionId: minus.roomWiseSubmissionId || 0,
                        lengthMtr: minus.lengthMtr || 0,
                        length: minus.lengthMtr || 0,
                        widthMtr: minus.widthMtr || 0,
                        breadth: minus.widthMtr || 0,
                        heightMtr: minus.heightMtr || 0,
                        height: minus.heightMtr || 0,
                        areaSqMtr: minus.areaSqMtr || 0,
                        area: minus.areaSqMtr || 0,
                        shape: minus.shape || 'Rectangle',
                        base1Mtr: minus.base1Mtr || 0,
                        base2Mtr: minus.base2Mtr || 0,
                        operation: minus.operation || 'subtract',
                        remark: minus.remark || 'SUB',
                        isOffset: minus.isOffset ?? false,
                    })) as RoomAPIResponse['offsets'];

                    return {
                        id: r.id || 0,
                        roomWiseSubmissionId: r.id || 0,
                        roomNo: String(r.roomNo || ''),
                        roomType: r.roomTypeDescription || r.roomType || '',
                        utilities: r.roomTypeDescription || r.roomType || '',
                        roomTypeId: r.roomTypeId || 0,
                        lengthMtr: r.lengthMtr || 0,
                        length: r.lengthMtr || 0,
                        widthMtr: r.widthMtr || 0,
                        breadth: r.widthMtr || 0,
                        width: r.widthMtr || 0,
                        heightMtr: r.heightMtr || 0,
                        height: r.heightMtr || 0,
                        areaSqMtr: r.areaSqMtr || 0,
                        area: r.areaSqMtr || 0,
                        noOfRooms: r.noOfRooms || 1,
                        roomCount: r.noOfRooms || 1,
                        totalAreaSqMtr: r.totalAreaSqMtr || 0,
                        total: r.totalAreaSqMtr || 0,
                        shape: r.shape || 'Rectangle',
                        shapeType: r.shape || 'Rectangle',
                        outerYesNo: r.outerYesNo || false,
                        OuterYesNo: r.outerYesNo || false,
                        outer: r.outerYesNo ? 'Yes' : 'No',
                        minusYesNo: r.minusYesNo || false,
                        MinusYesNo: r.minusYesNo || false,
                        offsetMinus: r.minusYesNo ? 'Yes' : 'No',
                        submissionType: r.submissionType || 'room',
                        base1Mtr: r.base1Mtr || 0,
                        base2Mtr: r.base2Mtr || 0,
                        offsets,
                        minusRooms: offsets,
                        roomWiseMinusData: r.roomWiseMinusData || [],
                        shapeParameters: {
                            length: String(r.lengthMtr || 0),
                            width: String(r.widthMtr || 0),
                            radius: '',
                            base: '',
                            height: String(r.heightMtr || 0),
                            side: '',
                            base1: String(r.base1Mtr || 0),
                            base2: String(r.base2Mtr || 0),
                        },
                    };
                });

                setExistingRooms(mappedRooms);
            } catch {
                setExistingRooms([]);
            }
            }, 0);
        } else {
            timeoutId = setTimeout(() => {
                setIsRoomDrawerOpen(false);
            }, 0);
        }
        
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [searchParams, initialRoomData, initialRow.pdnId]);

    const handleOpenRoomDrawer = async () => {
        const propertyDetailsId = Number(initialRow.pdnId || 0);
        if (!resolvedPropertyId || !propertyDetailsId) {
            toast.error(t('messages.propertyIdMissing'));
            return;
        }

        const params = new URLSearchParams(searchParams.toString());
        params.set('roomDrawerOpen', 'true');
        params.set('roomPdnId', String(propertyDetailsId));
        params.set('roomPropertyId', String(resolvedPropertyId));
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handleCloseRoomDrawer = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('roomDrawerOpen');
        params.delete('roomPdnId');
        params.delete('roomPropertyId');
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });

        setIsRoomDrawerOpen(false);
        router.refresh();
    };

    const selectedFloorRow = React.useMemo<DrawerFloorDataRow>(() => ({
        id: String(initialRow.id || ''),
        pdnId: initialRow.pdnId,
        floorId: String(formData.floorId || initialRow.floorId || ''),
        conYear: String(formData.conYear || initialRow.conYear || ''),
        asstYear: String(formData.asstYear || initialRow.asstYear || ''),
        constructionTypeId: String(formData.constructionTypeId || initialRow.constructionTypeId || ''),
        typeOfUseId: String(formData.typeOfUseId || initialRow.typeOfUseId || ''),
        subTypeOfUseId: String(formData.subTypeOfUseId || initialRow.subTypeOfUseId || ''),
        noOfRooms: String(formData.noOfRooms || initialRow.noOfRooms || ''),
        area: String(formData.area || initialRow.area || ''),
        rentMY: String(initialRow.rentMY || ''),
        rateMY: String(initialRow.rateMY || ''),
        rentalValue: String(initialRow.rentalValue || ''),
        depreciation: String(initialRow.depreciation || ''),
        alv: String(initialRow.alv || ''),
        mr: String(initialRow.mr || ''),
        rv: String(initialRow.rv || ''),
        sdrr: String(initialRow.sdrr || ''),
        baseValue: String(initialRow.baseValue || ''),
        floorFactor: String(initialRow.floorFactor || ''),
        ageFactor: String(initialRow.ageFactor || ''),
        ntbFactor: String(initialRow.ntbFactor || ''),
        useFactor: String(initialRow.useFactor || ''),
        capitalValue: String(initialRow.capitalValue || ''),
    }), [formData, initialRow]);

    // TO REMOVE ENTER KEY FUNCTIONALITY: 
    // 1. Remove this line and the `useEnterKeyNavigation` import at the top.
    // 2. Remove the `onKeyDownCapture={handleKeyDown}` prop from the wrapping `<div className="p-4 bg-white...` below.
    const handleKeyDown = useEnterKeyNavigation();

    return (
        <div className="p-4 bg-white border-t-2 border-blue-200 transition-all duration-300" onKeyDownCapture={handleKeyDown}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Dropdown: Taxable */}
                <div className="flex flex-col gap-1">
                    <Label>{t('floorQC.columns.taxable')}</Label>
                    <SearchSelect
                        options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]}
                        name="taxable"
                        value={String(formData.taxable || 'Yes')}
                        onChange={(_, val) => handleFieldChange('taxable', val)}
                        placeholder="Select"
                        disabled={true}
                        className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                    />
                </div>

                {/* 2. Dropdown: Floor */}
                <div className="flex flex-col gap-1 [&_ul[role='listbox']]:!max-h-45">
                    <Label required>{t('floorQC.columns.floor')}</Label>
                    <div onFocusCapture={() => handleOpenDropdown('loadFloor')}>
                        <SearchSelect
                            options={floors}
                            name="floor"
                            value={String(formData.floorId || '')}
                            onChange={(_, val) => handleFieldChange('floorId', val)}
                            placeholder={isLoadingFloors ? t('floorQC.form.loading') : t('floorQC.form.selectFloor')}
                            className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                            autoFocus={true}
                        />
                    </div>
                    {errors.floorId && <ValidationMessage message={t(errors.floorId)} />}
                </div>

                {/* 3. Dropdown: Sub Floor */}
                <div className="flex flex-col gap-1 [&_ul[role='listbox']]:!max-h-45">
                    <Label>{t('floorQC.columns.subFloor')}</Label>
                    <div onFocusCapture={() => handleOpenDropdown('loadSubFloor')}>
                        <SearchSelect
                            options={subFloors}
                            name="subFloorId"
                            value={String(formData.subFloorId || '')}
                            onChange={(_, val) => handleFieldChange('subFloorId', val)}
                            placeholder={isLoadingSubFloors ? t('floorQC.form.loading') : "Select sub floor"}
                            disabled={true}
                            className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                        />
                    </div>
                </div>

                {/* 4. Editable: Con Year */}
                <div className="flex flex-col gap-1">
                    <Label required>{t('floorQC.columns.conYear')}</Label>
                    <AnimatedDigitInput
                        id="conYear"
                        maxLength={4}
                        value={String(formData.conYear || '')}
                        onChange={(val) => handleFieldChange('conYear', val)}
                        placeholder={t('floorQC.form.yearPlaceholder')}
                        className="h-9 text-sm border-blue-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 rounded-lg"
                    />
                    {errors.conYear && <ValidationMessage message={t(errors.conYear)} />}
                </div>

                {/* 5. Editable: Asst Year */}
                <div className="flex flex-col gap-1">
                    <Label required>{t('floorQC.columns.asstYear')}</Label>
                    <AnimatedDigitInput
                        id="asstYear"
                        maxLength={4}
                        value={String(formData.asstYear || '')}
                        onChange={(val) => handleFieldChange('asstYear', val)}
                        placeholder={t('floorQC.form.yearPlaceholder')}
                        className="h-9 text-sm border-blue-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 rounded-lg"
                    />
                    {errors.asstYear && <ValidationMessage message={t(errors.asstYear)} />}
                </div>

                {/* 6. Dropdown: Construction Type */}
                <div className="flex flex-col gap-1 [&_ul[role='listbox']]:!max-h-45">
                    <Label required>{t('floorQC.columns.conType')}</Label>
                    <div onFocusCapture={() => handleOpenDropdown('loadConstruction')}>
                        <SearchSelect
                            options={conTypes}
                            name="constructionType"
                            value={String(formData.constructionTypeId || '')}
                            onChange={(_, val) => handleFieldChange('constructionTypeId', val)}
                            placeholder={isLoadingConTypes ? t('floorQC.form.loading') : t('floorQC.form.selectConType')}
                            className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                        />
                    </div>
                    {errors.constructionTypeId && <ValidationMessage message={t(errors.constructionTypeId)} />}
                </div>

                {/* 7. Dropdown: Use */}
                <div className="flex flex-col gap-1 [&_ul[role='listbox']]:!max-h-45">
                    <Label required>{t('floorQC.columns.use')}</Label>
                    <div onFocusCapture={() => handleOpenDropdown('loadUsage')}>
                        <SearchSelect
                            options={useTypes}
                            name="typeOfUse"
                            value={String(formData.typeOfUseId || '')}
                            onChange={(_, val) => {
                                handleFieldChange('typeOfUseId', val);
                                handleFieldChange('subTypeOfUseId', '');
                                if (val) {
                                    handleOpenDropdown('loadSubType', val);
                                }
                            }}
                            placeholder={isLoadingUseTypes ? t('floorQC.form.loading') : t('floorQC.form.selectUse')}
                            className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                        />
                    </div>
                    {errors.typeOfUseId && <ValidationMessage message={t(errors.typeOfUseId)} />}
                </div>

                {/* 8. Dropdown: Sub Type of Use */}
                <div className="flex flex-col gap-1 [&_ul[role='listbox']]:!max-h-45">
                    <Label>{t('floorQC.columns.subTypeOfUse')}</Label>
                    <div onFocusCapture={() => {
                        if (formData.typeOfUseId) {
                            handleOpenDropdown('loadSubType', String(formData.typeOfUseId));
                        }
                    }}>
                        <SearchSelect
                            options={subTypes}
                            name="subTypeOfUse"
                            value={String(formData.subTypeOfUseId || '')}
                            onChange={(_, val) => handleFieldChange('subTypeOfUseId', val)}
                            disabled={isSubTypeDisabled}
                            placeholder={isLoadingSubTypes ? t('floorQC.form.loading') : t('floorQC.form.selectSubType')}
                            className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                        />
                    </div>
                    {errors.subTypeOfUseId && <ValidationMessage message={t(errors.subTypeOfUseId)} />}
                </div>

                {/* 9. Dropdown: Renter */}
                <div className="flex flex-col gap-1">
                    <Label>{t('floorQC.columns.renter')}</Label>
                    <SearchSelect
                        options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]}
                        name="renter"
                        value={String(formData.renter || 'No')}
                        onChange={(_, val) => handleFieldChange('renter', val)}
                        placeholder="Select"
                        disabled={true}
                        className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                {/* 10. Editable: No of Rooms */}
                <div className="flex flex-col gap-1">
                    <Label>{t('floorQC.columns.noOfRooms')}</Label>
                    <Input
                        type="number"
                        value={formData.noOfRooms || ''}
                        onChange={(e) => handleFieldChange('noOfRooms', e.target.value)}
                        placeholder={t('floorQC.form.roomsPlaceholder')}
                    />
                    {errors.noOfRooms && <ValidationMessage message={t(errors.noOfRooms)} />}
                </div>

                {/* 11. Area (Sq Ft) */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                        <Label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                            {t('floorQC.columns.areaSqFt')} <span className="text-red-500">*</span>
                        </Label>
                        <span className="flex items-center shrink-0 gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-full">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            <span className="text-[9px] text-blue-700 font-bold uppercase tracking-tight">
                                {t('floorQC.form.auto')}
                            </span>
                        </span>
                    </div>
                    <div className="group relative">
                        <Input
                            type="text"
                            value={formData.areaSqFt || formData.area || ''}
                            readOnly
                            className="h-9 text-sm pr-24 border-gray-300 focus:border-blue-500 focus:ring-blue-200 transition-colors bg-gray-50 cursor-default group-hover:bg-blue-50/30"
                        />
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-slate-100/90 hover:bg-slate-200/90 px-2 py-1 rounded-md border border-slate-300 shadow-sm transition-all duration-200 group-hover:shadow group-focus-within:border-blue-400 group-focus-within:ring-1 group-focus-within:ring-blue-100">
                            <Button 
                                variant="ghost" 
                                className="!p-0 !h-auto !bg-transparent text-[10px] font-black text-slate-700 uppercase tracking-wider" 
                                onClick={handleToggleUnit}
                            >
                                {t('drawer.units.sqFt')}
                            </Button>
                            <div className="w-[1px] h-3.5 bg-slate-400 mx-0.5 opacity-60" />
                            <Button 
                                variant="ghost" 
                                onClick={handleOpenRoomDrawer} 
                                data-enter-navigable="true"
                                className="!p-1 !h-auto !min-h-0 flex items-center justify-center rounded hover:!bg-blue-600 hover:!text-white focus:outline-none focus:!bg-blue-600 focus:!text-white text-blue-600 transition-all active:scale-90"
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 12. Area (Sq Mtr) */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                        <Label className="text-xs font-semibold text-gray-700">
                            {t('floorQC.columns.areaSqMtr')}
                        </Label>
                        <span className="ml-auto shrink-0 text-[9px] text-blue-600 font-semibold bg-blue-100 px-1.5 py-0.5 rounded">
                            {t('floorQC.form.autoCalculated')}
                        </span>
                    </div>
                    <Input
                        type="text"
                        value={formData.areaSqMtr || ''}
                        readOnly
                        className="h-9 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-semibold text-blue-700 bg-gray-50 border-blue-200"
                    />
                </div>

                {/* 13. Buildup Area (Sq Ft) */}
                <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-gray-700">{t('floorQC.columns.buildupAreaSqFt')}</Label>
                    <Input
                        type="text"
                        value={formData.buildupAreaSqFt || ''}
                        readOnly
                        className="h-9 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-semibold text-blue-700 bg-gray-50 border-blue-200"
                    />
                </div>

                {/* 14. Buildup Area (Sq Mtr) */}
                <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-gray-700">{t('floorQC.columns.buildupAreaSqMtr')}</Label>
                    <Input
                        type="text"
                        value={formData.buildupAreaSqMtr || ''}
                        readOnly
                        className="h-9 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-semibold text-blue-700 bg-gray-50 border-blue-200"
                    />
                </div>
            </div>


            <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                    <CancelButton onClick={onCancel} disabled={isSaving}>
                        {t('drawer.cancel')}
                    </CancelButton>
                    <Button
                        variant="primary"
                        icon={Save}
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isEditMode ? t('drawer.update') : t('buttons.save')}
                    </Button>
                </div>
            </div>

            {isRoomDrawerOpen && (
                <RoomWiseSubmission
                    isOpen={isRoomDrawerOpen}
                    onClose={handleCloseRoomDrawer}
                    onUpdate={(data) => {
                        handleFieldChange('area', String(data.totalAreaSqM));
                        handleFieldChange('noOfRooms', String(data.roomCount));
                    }}
                    displayMode="modal"
                    initialPropertyID={resolvedPropertyId}
                    initialFloorId={initialRow.pdnId ?? undefined}
                    floorNumber={String(initialRow.floorId || '')}
                    existingRooms={existingRooms}
                    selectedFloorRow={selectedFloorRow}
                    floorLookup={floors}
                    constructionLookup={conTypes}
                    useLookup={useTypes}
                    subTypeLookup={subTypes}
                    t={t}
                    externalAreaUnit={areaUnit}
                    onExternalToggleUnit={handleToggleUnit}
                    maxRooms={100}
                />
            )}
        </div>
    );
};
