import { useMemo } from 'react';
import { PropertyFormViewProps } from '@/types/property-basic-details.types';

export const usePropertyOptions = (props: PropertyFormViewProps) => {
    const {
        MoujaMaster: moujaList,
        propertyCategories: propertyCategoryList,
        propertyDescriptions: propertyDescriptionList,
    } = props;

    const categoryOptions = useMemo(() => 
        propertyCategoryList
            .filter((item) => item.isActive)
            .map((item) => ({ label: item.propertyCategoryName, value: String(item.id) })),
    [propertyCategoryList]);

    const propertyDescriptionOptions = useMemo(() => 
        propertyDescriptionList.map((item) => ({ label: item.type ? `${item.type} - ${item.propertyDescription}` : item.propertyDescription, value: String(item.id) })),
    [propertyDescriptionList]);

    const moujaOptions = useMemo(() => 
        moujaList.map((item) => ({ label: item.moujaName, value: String(item.id) })),
    [moujaList]);

    return {
        categoryOptions,
        moujaOptions,
        propertyDescriptionOptions,
    };
};