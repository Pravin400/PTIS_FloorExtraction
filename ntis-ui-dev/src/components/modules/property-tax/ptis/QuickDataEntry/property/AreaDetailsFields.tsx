import { Input } from '@/components/common';
import { Tooltip } from '@/components/common/Tooltip';
import { Label } from '@/components/common/label';
import { PropertyBasicDetailsApiItem } from '@/types/property-basic-details.types';

interface AreaDetailsFieldsProps {
    t: (key: string) => string;
    propertyData: PropertyBasicDetailsApiItem | null;
    isPlotCategory?: boolean;
}

export const AreaDetailsFields = ({
    t,
    propertyData,
    isPlotCategory = false,
}: AreaDetailsFieldsProps) => {
    const formatAreaValue = (sqFeet: number | string | null | undefined, sqMeter: number | string | null | undefined) => {
        if (sqFeet == null && sqMeter == null) return '';
        const feetNum = Number(sqFeet);
        const meterNum = Number(sqMeter);
        const feetStr = sqFeet != null && !isNaN(feetNum) ? feetNum.toFixed(2) : '0.00';
        const meterStr = sqMeter != null && !isNaN(meterNum) ? meterNum.toFixed(2) : '0.00';
        return `${feetStr} / ${meterStr}`;
    };

    const plotAreaVal = formatAreaValue(propertyData?.plotAreaSqFeet, propertyData?.plotAreaSqMeter);
    const carpetAreaVal = formatAreaValue(propertyData?.totalCarpetAreaSqFeet, propertyData?.totalCarpetAreaSqMeter);
    const buildupAreaVal = formatAreaValue(propertyData?.totalBuiltupAreaSqFeet, propertyData?.totalBuiltupAreaSqMeter);
    const oldCarpetAreaVal = formatAreaValue(propertyData?.oldCarpetAreaSqFeet, propertyData?.oldCarpetAreaSqMeter);
    const oldBuildupAreaVal = formatAreaValue(propertyData?.oldBuiltupAreaSqFeet, propertyData?.oldBuiltupAreaSqMeter);

    const preventEnterSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    };

    return (
        <>
            {/* Plot Area */}
            <div className="space-y-1.5 col-span-12 sm:col-span-6 md:col-span-4 min-w-0">
                <Label htmlFor="pd-plotarea" className="text-xs font-semibold text-gray-700">
                    {t('property.plotAreaWithUnit')}
                </Label>
                <Tooltip content={plotAreaVal} placement="top">
                    <Input
                        readOnly
                        id="pd-plotarea"
                        type="text"
                        placeholder="0.00 / 0.00"
                        defaultValue={plotAreaVal}
                        onKeyDown={preventEnterSubmit}
                        className="h-9 text-sm bg-gray-50 text-gray-600 cursor-not-allowed border-gray-300"
                    />
                </Tooltip>
            </div>

            {/* Total Carpet Area & Buildup Area - Hidden for Plot Category */}
            {!isPlotCategory && (
                <>
                    {/* Total Carpet Area */}
                    <div className="space-y-1.5 col-span-12 sm:col-span-6 md:col-span-4 min-w-0">
                        <Label htmlFor="pd-carpetarea" className="text-xs font-semibold text-gray-700">
                            {t('property.totalCarpetAreaWithUnit')}
                        </Label>
                        <Tooltip content={carpetAreaVal} placement="top">
                            <Input
                                readOnly
                                id="pd-carpetarea"
                                type="text"
                                placeholder="0.00 / 0.00"
                                defaultValue={carpetAreaVal}
                                onKeyDown={preventEnterSubmit}
                                className="h-9 text-sm bg-gray-50 text-gray-600 cursor-not-allowed border-gray-300"
                            />
                        </Tooltip>
                    </div>

                    {/* Buildup Area */}
                    <div className="space-y-1.5 col-span-12 sm:col-span-6 md:col-span-4 min-w-0">
                        <Label htmlFor="pd-builduparea" className="text-xs font-semibold text-gray-700">
                            {t('property.buildupAreaWithUnit')}
                        </Label>
                        <Tooltip content={buildupAreaVal} placement="top">
                            <Input
                                readOnly
                                id="pd-builduparea"
                                type="text"
                                placeholder="0.00 / 0.00"
                                defaultValue={buildupAreaVal}
                                onKeyDown={preventEnterSubmit}
                                className="h-9 text-sm bg-gray-50 text-gray-600 cursor-not-allowed border-gray-300"
                            />
                        </Tooltip>
                    </div>

                    {/* Old Carpet Area */}
                    <div className="space-y-1.5 col-span-12 sm:col-span-6 md:col-span-4 min-w-0">
                        <Label htmlFor="pd-oldcarpetarea" className="text-xs font-semibold text-gray-700">
                            {t('property.oldCarpetAreaWithUnit') || 'Old Carpet Area (sq.ft / sq.m)'}
                        </Label>
                        <Tooltip content={oldCarpetAreaVal} placement="top">
                            <Input
                                readOnly
                                id="pd-oldcarpetarea"
                                type="text"
                                placeholder="0.00 / 0.00"
                                defaultValue={oldCarpetAreaVal}
                                onKeyDown={preventEnterSubmit}
                                className="h-9 text-sm bg-gray-50 text-gray-600 cursor-not-allowed border-gray-300"
                            />
                        </Tooltip>
                    </div>

                    {/* Old Buildup Area */}
                    <div className="space-y-1.5 col-span-12 sm:col-span-6 md:col-span-4 min-w-0">
                        <Label htmlFor="pd-oldbuilduparea" className="text-xs font-semibold text-gray-700">
                            {t('property.oldBuildupAreaWithUnit') || 'Old Buildup Area (sq.ft / sq.m)'}
                        </Label>
                        <Tooltip content={oldBuildupAreaVal} placement="top">
                            <Input
                                readOnly
                                id="pd-oldbuilduparea"
                                type="text"
                                placeholder="0.00 / 0.00"
                                defaultValue={oldBuildupAreaVal}
                                onKeyDown={preventEnterSubmit}
                                className="h-9 text-sm bg-gray-50 text-gray-600 cursor-not-allowed border-gray-300"
                            />
                        </Tooltip>
                    </div>
                </>
            )}

            {/* Hidden Form Inputs for Server Submission */}
            <input type="hidden" name="totalCarpetAreaSqFeet" value={propertyData?.totalCarpetAreaSqFeet != null ? Number(propertyData.totalCarpetAreaSqFeet).toFixed(2) : ''} />
            <input type="hidden" name="totalCarpetAreaSqMeter" value={propertyData?.totalCarpetAreaSqMeter != null ? Number(propertyData.totalCarpetAreaSqMeter).toFixed(2) : ''} />
            <input type="hidden" name="totalBuiltupAreaSqFeet" value={propertyData?.totalBuiltupAreaSqFeet != null ? Number(propertyData.totalBuiltupAreaSqFeet).toFixed(2) : ''} />
            <input type="hidden" name="totalBuiltupAreaSqMeter" value={propertyData?.totalBuiltupAreaSqMeter != null ? Number(propertyData.totalBuiltupAreaSqMeter).toFixed(2) : ''} />
        </>
    );
};
