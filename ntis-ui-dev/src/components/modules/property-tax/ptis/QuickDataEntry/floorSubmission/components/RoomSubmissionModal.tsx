'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Layers, MapPin, Hash, Building, DoorOpen } from 'lucide-react';
import { MasterTable, type Column, Tooltip, Drawer, Button } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import type { FloorData, RoomSubmissionSidebarProps } from '@/types/floor-details.types';
import RoomWiseSubmission from '../RoomSubmission/RoomWiseSubmission';
import { convertSqFtToSqM, convertSqMToSqFt } from '@/lib/utils/RoomSubmission/conversions';
import { checkIsUtilityCategory } from '@/lib/utils/floorSubmission/floor-utility-checks';
import { isRecordOpenPlot } from '@/hooks/ptis/floorSubmission/useFloorAreaValidation';

export default function RoomSubmissionSidebar(props: RoomSubmissionSidebarProps) {
    const isUtilityCategory = checkIsUtilityCategory(props.floorData?.typeOfUseCategoryId);
    const isOpenPlot = isRecordOpenPlot(props.floorData);
    let lastFilledRoomIndex = -1;
    if (Array.isArray(props.existingRooms)) {
        for (let i = props.existingRooms.length - 1; i >= 0; i--) {
            const r = props.existingRooms[i];
            const hasArea = Number(r.area || r.areaSqMtr || r.totalAreaSqMtr || r.total || r.carpetArea || 0) > 0;
            const hasUseOrShape = (r.utilities && r.utilities !== "-Select-") || (r.shape && r.shape !== "-Select-");
            if (hasArea || hasUseOrShape) {
                lastFilledRoomIndex = i;
                break;
            }
        }
    }
    const requiredRoomsCount = lastFilledRoomIndex !== -1 ? lastFilledRoomIndex + 1 : 0;
    const maxRoomsCount = isUtilityCategory ? (props.existingRooms?.length || 0) : Math.max(props.maxRooms || 0, requiredRoomsCount);
    const [areaUnit, setAreaUnit] = useState<"sq.m" | "sq.ft">("sq.m");

    const handleToggleUnit = () => {
        setAreaUnit(prev => prev === "sq.m" ? "sq.ft" : "sq.m");
    };

    // Removed direct document.body.style.overflow handling.
    // Drawer component manages scroll lock globally.

    const ROOM_DRAWER_CLASSNAME = cn(
        "[&>div.fixed.right-0]:!w-[98vw]",
        "md:[&>div.fixed.right-0]:!w-[90vw]",
        "lg:[&>div.fixed.right-0]:!w-[800px]",
        "xl:[&>div.fixed.right-0]:!w-[1350px]"
    );


    const t = useTranslations('quickDataEntry');
    const floorDetailsColumns = useMemo<Column<FloorData & Record<string, unknown>>[]>(() => [
        {
            key: 'floor',
            label: t('roomSubmission.table.floor'),
            headerClassName: "text-blue-900 text-sm text-center",
            cellClassName: "font-medium text-blue-900 text-sm",
            render: (val) => (
                <Tooltip content={String(val || '-')} placement="top">
                    <div className="max-w-[80px] truncate cursor-default text-center mx-auto">
                        {String(val || '-')}
                    </div>
                </Tooltip>
            )
        },
        {
            key: 'subFloor',
            label: t('roomSubmission.table.subFloor'),
            headerClassName: "text-blue-900 text-sm text-center",
            cellClassName: "text-blue-900 text-sm",
            render: (val) => (
                <Tooltip content={String(val || '-')} placement="top">
                    <div className="max-w-[70px] truncate cursor-default text-center mx-auto">
                        {String(val || '-')}
                    </div>
                </Tooltip>
            )
        },
        ...(!isOpenPlot ? [
            {
                key: 'conYr',
                label: t('roomSubmission.table.conYr'),
                headerClassName: "text-blue-900 text-sm text-center",
                cellClassName: "text-center",
                render: (_: unknown, row: FloorData & Record<string, unknown>) => <span className="text-sm">{row.conYr || row.constructionYear || '-'}</span>
            }
        ] : []),
        {
            key: 'asstYr',
            label: t('roomSubmission.table.asstYr'),
            headerClassName: "text-blue-900 text-sm text-center",
            cellClassName: "text-center",
            render: (_, row) => <span className="text-sm">{row.asstYr || row.assessmentYear || '-'}</span>
        },
        {
            key: 'conTyp',
            label: t('roomSubmission.table.conTyp'),
            headerClassName: "text-blue-900 text-sm text-center",
            cellClassName: "text-center",
            render: (_, row) => {
                const text = row.conTyp || row.constructionType || '-';
                return (
                    <Tooltip content={String(text)} placement="top">
                        <div className="max-w-[120px] truncate cursor-default text-center mx-auto text-sm">
                            {String(text)}
                        </div>
                    </Tooltip>
                );
            }
        },
        {
            key: 'use',
            label: t('roomSubmission.table.use'),
            headerClassName: "text-blue-900 text-sm text-center",
            cellClassName: "text-center",
            render: (_, row) => {
                const text = row.use || row.typeOfUseId || '-';
                return (
                    <Tooltip content={String(text)} placement="top">
                        <div className="max-w-[100px] truncate cursor-default text-center mx-auto text-sm">
                            {String(text)}
                        </div>
                    </Tooltip>
                );
            }
        },
        {
            key: 'subTyp',
            label: t('roomSubmission.table.subTyp'),
            headerClassName: "text-blue-900 text-sm text-center",
            cellClassName: "text-center",
            render: (_, row) => {
                const text = row.subTyp || row.subType || '-';
                return (
                    <Tooltip content={String(text)} placement="top">
                        <div className="max-w-[80px] truncate cursor-default text-center mx-auto text-sm">
                            {String(text)}
                        </div>
                    </Tooltip>
                );
            }
        },
        {
            key: 'renter',
            label: t('roomSubmission.table.renter'),
            headerClassName: "text-blue-900 text-sm text-center",
            cellClassName: "text-center",
            render: (_, row) => (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${row.renter === 'Yes' || row.renterYesNO
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    {row.renter || (row.renterYesNO ? t('roomSubmission.table.yes') : t('roomSubmission.table.no'))}
                </span>
            )
        },
        {
            key: 'rooms',
            label: t('roomSubmission.table.rooms'),
            headerClassName: "text-blue-900 text-sm text-center",
            cellClassName: 'text-center text-gray-700 text-sm'
        },
        {
            key: 'areaSqM',
            label: areaUnit === "sq.m" ? t('roomSubmission.table.areaSqM') : t('roomSubmission.table.areaSqFt'),
            headerClassName: "text-blue-900 text-sm text-center",
            cellClassName: 'font-medium text-gray-700 text-sm text-center',
            render: (_, row) => {
                const area = areaUnit === "sq.m"
                    ? (row.areaSqM || convertSqFtToSqM(String(row.areaSqFt || "0")).toFixed(2))
                    : (row.areaSqFt || convertSqMToSqFt(String(row.areaSqM || "0")).toFixed(2));
                return <span className="text-sm">{area}</span>;
            }
        }
    ], [areaUnit, isOpenPlot, t]);

    const drawerTitle = (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <h2 className="text-base font-bold flex items-center gap-2 text-white shrink-0">
                <Layers className="w-4 h-4 text-white" />
                {isOpenPlot
                    ? 'OPEN SPACE SUBMISSION'
                    : isUtilityCategory
                        ? 'UTILITY WISE SUBMISSION'
                        : t('roomSubmission.title')} ({areaUnit === "sq.m" ? t('roomSubmission.table.sqMeter') : t('roomSubmission.table.sqFeet')})
            </h2>
            <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/20 bg-white/10 text-[11px] font-medium text-white shadow-sm">
                    <MapPin className="w-4 h-4 text-emerald-300 animate-pulse-slow" />
                    <span>{t('roomSubmission.table.ward')}: <strong className="font-bold">{props.wardNo || '—'}</strong></span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/20 bg-white/10 text-[11px] font-medium text-white shadow-sm">
                    <Hash className="w-4 h-4 text-amber-300" />
                    <span>{t('roomSubmission.table.property')}: <strong className="font-bold">{props.propertyNo || '—'}</strong></span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/20 bg-white/10 text-[11px] font-medium text-white shadow-sm">
                    <Layers className="w-4 h-4 text-cyan-300" />
                    <span>{t('roomSubmission.table.partition')}: <strong className="font-bold">{props.partitionNo || '—'}</strong></span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/20 bg-white/10 text-[11px] font-medium text-white shadow-sm">
                    <Building className="w-4 h-4 text-fuchsia-300" />
                    <span>{t('roomSubmission.table.floor')}: <strong className="font-bold">{props.floorNumber || '—'}</strong></span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/20 bg-white/10 text-[11px] font-medium text-white shadow-sm">
                    <DoorOpen className="w-4 h-4 text-pink-300" />
                    <span>{t('roomSubmission.table.rooms')}: <strong className="font-bold">{maxRoomsCount}</strong></span>
                </div>
            </div>

            {/* Unit Toggle Pill - Hidden on UI */}

            <div className="flex items-center bg-blue-50/50 rounded-full p-0.5 border border-blue-100 shadow-inner ml-2">
                <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => areaUnit === "sq.ft" && handleToggleUnit()}
                    className={`px-4 py-1 rounded-full text-[10px] font-bold transition-all duration-300 ${areaUnit === "sq.m"
                        ? "bg-white text-blue-600 shadow-sm scale-105"
                        : "text-blue-400/70 hover:text-blue-600"
                        }`}
                >
                    {t('roomSubmission.input.buttons.sqm')}
                </Button>

                <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => areaUnit === "sq.m" && handleToggleUnit()}
                    className={`px-4 py-1 rounded-full text-[10px] font-bold transition-all duration-300 ${areaUnit === "sq.ft"
                        ? "bg-white text-blue-600 shadow-sm scale-105"
                        : "text-blue-400/70 hover:text-blue-600"
                        }`}
                >
                    {t('roomSubmission.input.buttons.sqft')}
                </Button>
            </div>

        </div>
    );


    return (
        <div className={ROOM_DRAWER_CLASSNAME}>
            <Drawer
                open={props.isOpen}
                onClose={props.onClose}
                title={drawerTitle}
                width="md"
            >
                <div className="p-6">
                    {/* Floor Details Table using MasterTable */}
                    {props.floorData && (
                        <MasterTable<FloorData & Record<string, unknown>>
                            columns={floorDetailsColumns}
                            data={[props.floorData as FloorData & Record<string, unknown>]}
                            headerTitle={t('roomSubmission.table.selectedFloorDetails')}
                            paginationConfig={{ enabled: false }}
                            maxBodyHeightClassName="max-h-none"
                            containerClassName="mb-6 shadow-sm border-blue-100"
                            theadClassName="bg-blue-50/50 border-blue-100"
                            rowClassName={() => "border-blue-50 hover:bg-blue-50/30"}
                            tableClassName="text-sm"
                        />
                    )}
                    <RoomWiseSubmission
                        {...props}
                        displayMode="inline"
                        externalAreaUnit={areaUnit}
                        onExternalToggleUnit={handleToggleUnit}
                    />
                </div>
            </Drawer>
        </div>
    );
}
