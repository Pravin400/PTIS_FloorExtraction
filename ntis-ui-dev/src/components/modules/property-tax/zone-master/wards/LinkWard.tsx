"use client";

import { useTranslations } from "next-intl";
import { Map as MapIcon } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import { ZoneItem } from "@/types/zoneMaster.types";
import { WardItem } from "@/types/wardMaster.types";
import { NextPageButton, SearchSelect, StatusBadge } from "@/components/common";
import { ViewWards } from "./ViewWards";
import { ZoneWards } from "./ZoneWards";
import { useLinkWard } from "@/hooks/zoneMaster/useLinkWard";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

const PAGE_SIZE_OPTIONS = [
	{ label: "10", value: "10" },
	{ label: "20", value: "20" },
	{ label: "50", value: "50" },
	{ label: "100", value: "100" }
];

interface Props {
	open: boolean;
	onClose: () => void;
	onSuccess?: () => void;
	onWardsChanged?: () => void;
	zones: ZoneItem[];
	selectedZoneId: number | null;
	ssrAllWards?: WardItem[];
	ssrAllZones?: ZoneItem[];
	ssrSelectedWards?: WardItem[];
	ssrViewAllWards?: WardItem[];
	ssrViewAllWardsTotalCount?: number;
	ssrViewAllWardsTotalPages?: number;
}

export default function LinkWard(props: Props) {
	const {
		open,
		onClose,
		onWardsChanged,
		zones,
		selectedZoneId,
		ssrAllZones = [],
		ssrSelectedWards = [],
		ssrViewAllWards = [],
		ssrViewAllWardsTotalCount = 0,
		ssrViewAllWardsTotalPages = 0,
	} = props;

	const t = useTranslations("zoneMaster");
	const zoneAlias = useAliasLabel("Zone", t("defaults.zone"));
	const wardAlias = useAliasLabel("Ward", t("defaults.ward"));
	const wardsAlias = useAliasLabel("Wards", t("defaults.wards"));

	const {
		checkedAvailable,
		loading,
		selectAllLoading,
		isSelectAllActive,
		zoneSearchTerm,
		viewAllSearchTerm,
		zonePage,
		zonePageSize,
		viewWardPage,
		viewWardPageSize,
		zoneOptions,
		getZoneDisplayLabel,
		isWardAssigned,
		paginatedZoneWards,
		handleZoneChange,
		toggleAvailableCheck,
		handleSelectAllViewWards,
		moveToSelected,
		handleClose,
		handleZoneSearch,
		handleZonePageChange,
		handleZonePageSizeChange,
		handleViewAllSearch,
		handleViewPageChange,
		handleViewPageSizeChange,
		totalZonePages,
		isPending,
	} = useLinkWard({
		open,
		selectedZoneId,
		ssrSelectedWards,
		zones,
		ssrAllZones,
		onWardsChanged,
		onClose,
		zoneAlias,
		wardAlias,
		wardsAlias,
		t: (key: string, values?: Record<string, unknown>) => t(key, values as never),
	});

	return (
		<Drawer
			open={open}
			width="lg"
			title={
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
						<MapIcon size={20} />
					</div>
					<div>
						<div className="text-lg font-bold text-blue-900">
							{t("wardList.linkTitle", { ward: wardAlias, zone: zoneAlias })}
						</div>
					</div>
				</div>
			}
			onClose={handleClose}
		>
			<div className="flex flex-col md:flex-row gap-3 h-[75vh] p-6">
				{/* View All Wards */}
				<div className="flex-1 flex flex-col rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-md border-2 border-blue-200/50 shadow-lg" data-testid="available-wards-list">
					<div className="bg-gradient-to-r from-[#1A86E8] via-[#1A86E8] to-[#1A86E8] px-4 py-3 font-semibold text-sm text-[#fff] shadow-md">
						<span className="flex items-center gap-2">
							{t("wardList.viewWards", { wards: wardsAlias })}
							<span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/30 border border-white/40">
								{ssrViewAllWardsTotalCount}
							</span>
						</span>
					</div>

					<ViewWards
						wards={ssrViewAllWards}
						checkedWards={checkedAvailable}
						onToggleWard={toggleAvailableCheck}
						searchTerm={viewAllSearchTerm}
						onSearchChange={handleViewAllSearch}
						page={viewWardPage}
						pageSize={viewWardPageSize}
						onPageChange={handleViewPageChange}
						onPageSizeChange={handleViewPageSizeChange}
						totalPages={ssrViewAllWardsTotalPages}
						pageSizeOptions={PAGE_SIZE_OPTIONS}
						getZoneLabel={getZoneDisplayLabel}
						isWardAssigned={isWardAssigned}
						onSelectAllChange={handleSelectAllViewWards}
						isSelectAllActive={isSelectAllActive}
						selectAllLoading={selectAllLoading}
						totalCount={ssrViewAllWardsTotalCount}
					/>
				</div>

				{/* Control Buttons */}
				<div className="flex flex-col justify-center gap-3">
					<NextPageButton
						size="sm"
						onClick={moveToSelected}
						disabled={(checkedAvailable.size === 0 && !isSelectAllActive) || loading}
						title={t("wardMessages.moveSelectedToRight")}
					/>
				</div>

				{/* Selected Wards */}
				<div className="flex-1 flex flex-col rounded-xl bg-gradient-to-br from-purple-50/80 to-indigo-50/80 backdrop-blur-md border-2 border-purple-200/50 shadow-lg" data-testid="selected-wards-list">
					<div className="bg-gradient-to-r from-[#1A86E8] via-[#1A86E8] to-[#1A86E8] px-4 py-3 font-semibold text-sm text-[#fff] shadow-md">
						<div className="flex items-center justify-between gap-3">
							<span className="flex items-center gap-2">
								{t("wardList.wardsInZone", { wards: wardsAlias, zone: zoneAlias })}
								<StatusBadge
									label={String(ssrSelectedWards.length)}
									variant="info"
								/>
							</span>
							<div className="flex-1 max-w-xs">
								<SearchSelect
									options={zoneOptions}
									value={String(selectedZoneId || '')}
									onChange={handleZoneChange}
									placeholder={t("wardList.selectZone", { zone: zoneAlias })}
									disabled={isPending}
									isLoading={isPending}
									disableSearch={false}
									className="text-sm"
								/>
							</div>
						</div>
					</div>
					<ZoneWards
						wards={paginatedZoneWards}
						searchTerm={zoneSearchTerm}
						onSearchChange={handleZoneSearch}
						page={zonePage}
						pageSize={zonePageSize}
						onPageChange={handleZonePageChange}
						onPageSizeChange={handleZonePageSizeChange}
						totalPages={totalZonePages}
						pageSizeOptions={PAGE_SIZE_OPTIONS}
						selectedWardCount={ssrSelectedWards.length}
					/>
				</div>
			</div>
		</Drawer>
	);
}