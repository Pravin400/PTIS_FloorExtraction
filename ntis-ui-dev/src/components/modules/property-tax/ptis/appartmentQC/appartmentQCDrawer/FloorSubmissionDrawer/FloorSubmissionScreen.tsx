'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ApartmentQCDetail } from '@/types/apartmentQC.types';
import type { Column } from '@/components/common/MasterTable';
import { FloorQCTable } from './FloorSubmissionTable';
import { useFloorSubmissionColumns } from './FloorSubmissionColumns';
import { FloorSubmissionForm } from './FloorSubmissionForm';
import { useFloorSubmissionState } from '@/hooks/apartmentQc/useFloorSubmissionState';
import type { FloorSubmissionRow } from '@/types/apartmentQC.types';
import type { Floor } from '@/types/floor.types';
import type { ConstructionType } from '@/types/construction.types';
import type { UseType, UseSubType } from '@/types/typeOfUse.types';
import { PropertyPhotoViewer } from './PropertyPhotoViewer';
import { PropertyPhotoToggle } from './PropertyPhotoToggle';

interface FloorSubmissionScreenProps {
    initialFloorData: ApartmentQCDetail[];
    initialSubTab: string;
    floorOptions?: Floor[];
    constructionTypeOptions?: ConstructionType[];
    useOptions?: UseType[];
    subUseTypeOptions?: UseSubType[];
    subFloorOptions?: Array<{ id?: string | number; subFloorId?: string | number; subFloorCode?: string; description?: string }>;
    propertyId?: string | number | null;
    initialRoomData?: unknown[];
}

export const FloorSubmissionScreen = ({
    initialFloorData,
    initialSubTab,
    floorOptions = [],
    constructionTypeOptions = [],
    useOptions = [],
    subUseTypeOptions = [],
    subFloorOptions = [],
    propertyId: propPropertyId = null,
    initialRoomData = []
}: FloorSubmissionScreenProps) => {
    const t = useTranslations('appartmentQC');
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const hook = useFloorSubmissionState(initialFloorData, initialSubTab);
    
    const editRowId = searchParams.get('editRowId');
    const editingRow = React.useMemo(() => {
        if (!editRowId) return null;
        return hook.floorData.find(row => row.id === editRowId) || null;
    }, [editRowId, hook.floorData]);

    const setEditingRow = (row: FloorSubmissionRow | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (row) {
            params.set('editRowId', row.id);
        } else {
            params.delete('editRowId');
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
        if (!row) {
            router.refresh();
        }
    };

    const isPhotoViewerOpen = searchParams.get('photo') === 'true';
    const setIsPhotoViewerOpen = (open: boolean) => {
        const params = new URLSearchParams(searchParams.toString());
        if (open) {
            params.set('photo', 'true');
        } else {
            params.delete('photo');
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };
    
    // Use propertyId from props, fallback to pdnId from the first row of data
    const resolvedPropertyId = propPropertyId ?? initialFloorData?.[0]?.pdnId ?? null;
    const numericPropertyId = resolvedPropertyId ? Number(resolvedPropertyId) : null;

    const floorColumns = useFloorSubmissionColumns({
        subTab: hook.subTab,
        dualMethodTab: hook.dualMethodTab,
        onEdit: (row) => {
            setEditingRow(row);
        },
    });

    const tableStyle = (col: Column<FloorSubmissionRow>): Column<FloorSubmissionRow> => ({
        ...col,
        cellClassName: `${col.cellClassName || ''} whitespace-nowrap`,
        headerClassName: `${col.headerClassName || ''} !px-1 !py-0.5 border-l !border-gray-300`,
    });

    return (
        <div className="flex gap-4 w-full">
            <div className={`relative space-y-6 p-3 bg-slate-50 rounded-xl transition-all duration-300 ${isPhotoViewerOpen ? 'w-[80%]' : 'w-full'}`}>
                <div className='rounded-xl border border-slate-200 bg-white shadow-blue-200 shadow-sm p-2'>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 px-2">
                    {t('floorQC.title')}
                </h3>
                <div className="rounded-xl overflow-hidden bg-white shadow-sm">
                    <FloorQCTable
                        hook={hook}
                        t={t}
                        floorColumns={floorColumns}
                        tableStyle={tableStyle}
                        onRowClick={(row) => setEditingRow(row)}
                        editRowId={editRowId}
                    />
                </div>
            </div>

            {editingRow && (
                <div className="space-y-2">
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {t('floorQC.columns.editFloorQC')}
                        </h3>
                        <FloorSubmissionForm
                            key={editingRow.id}
                            initialRow={editingRow}
                            onCancel={() => setEditingRow(null)}
                            onSaveSuccess={() => {
                                router.refresh();
                            }}
                            floorOptions={floorOptions}
                            constructionTypeOptions={constructionTypeOptions}
                            useOptions={useOptions}
                            subUseTypeOptions={subUseTypeOptions}
                            subFloorOptions={subFloorOptions}
                            initialRoomData={initialRoomData}
                            isEditMode={true}
                        />
                    </div>
                </div>
            )}
            </div>

            {isPhotoViewerOpen && (
                <div className="w-[20%] sticky top-3 self-start">
                    <PropertyPhotoViewer
                        open={isPhotoViewerOpen}
                        propertyId={numericPropertyId}
                        onClose={() => setIsPhotoViewerOpen(false)}
                    />
                </div>
            )}

            {!isPhotoViewerOpen && (
                <PropertyPhotoToggle onClick={() => setIsPhotoViewerOpen(true)} />
            )}
        </div>
    );
};
