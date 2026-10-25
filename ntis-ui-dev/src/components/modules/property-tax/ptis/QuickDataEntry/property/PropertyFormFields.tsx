import { PropertyBasicDetailsApiItem, TaxZoneItem } from '@/types/property-basic-details.types';
import { BasicPropertyFields } from './BasicPropertyFields';
import { AdditionalPropertyFields } from './AdditionalPropertyFields';
import { PlotDetailsFields } from './PlotDetailsFields';
import { AreaDetailsFields } from './AreaDetailsFields';
import { isPlotCategory as checkIsPlotCategory } from '@/lib/utils/ptis/category-helpers';

interface PropertyFormFieldsProps {
    t: (key: string) => string;
    propertyData: PropertyBasicDetailsApiItem | null;
    categoryOptions: { label: string; value: string }[];
    categoryId: number | null;
    handleCategoryChange: (name: string | undefined, value: string) => void;
    moujaOptions: { label: string; value: string }[];
    moujaId: number | null;
    handleMoujaChange: (name: string | undefined, value: string) => void;
    propertyDescriptionOptions: { label: string; value: string }[];
    propertyTypeId: number | null;
    handlePropertyDescriptionChange: (name: string | undefined, value: string) => void;
    taxZones: TaxZoneItem[];
    checkFormChanges: () => void;
}

export const PropertyFormFields = (props: PropertyFormFieldsProps) => {
    const {
        t,
        propertyData,
        categoryOptions,
        categoryId,
        handleCategoryChange,
        moujaOptions,
        moujaId,
        handleMoujaChange,
        propertyDescriptionOptions,
        propertyTypeId,
        handlePropertyDescriptionChange,
        taxZones,
        checkFormChanges
    } = props;

    const selectedCategoryObj = categoryOptions.find(opt => opt.value === categoryId?.toString());
    const categoryName = selectedCategoryObj?.label || propertyData?.categoryName || '';
    const isIndividual = categoryName.toLowerCase() === 'individual';
    const isPlotCategory = checkIsPlotCategory(categoryName);

    return (
        <div className="grid grid-cols-12 gap-x-4 gap-y-3">
            <BasicPropertyFields
                t={t}
                propertyData={propertyData}
                categoryOptions={categoryOptions}
                categoryId={categoryId}
                handleCategoryChange={handleCategoryChange}
            />
            <AdditionalPropertyFields
                t={t}
                propertyData={propertyData}
                taxZones={taxZones}
                checkFormChanges={checkFormChanges}
                isIndividual={isIndividual}
                propertyDescriptionOptions={propertyDescriptionOptions}
                propertyTypeId={propertyTypeId}
                handlePropertyDescriptionChange={handlePropertyDescriptionChange}
            />
            <PlotDetailsFields
                t={t}
                propertyData={propertyData}
                isIndividual={isIndividual}
                moujaOptions={moujaOptions}
                moujaId={moujaId}
                handleMoujaChange={handleMoujaChange}
            />
            <AreaDetailsFields
                t={t}
                propertyData={propertyData}
                isPlotCategory={isPlotCategory}
            />
        </div>
    );
};
