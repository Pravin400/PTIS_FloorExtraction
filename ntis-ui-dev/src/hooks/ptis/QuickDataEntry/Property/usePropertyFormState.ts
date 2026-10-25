import { useState } from 'react';
import { PropertyBasicDetailsApiItem } from '@/types/property-basic-details.types';

export const usePropertyFormState = (propertyData: PropertyBasicDetailsApiItem | null) => {
    const [propertyTypeId, setPropertyTypeId] = useState<number | null>(propertyData?.propertyTypeId ?? null);
    const [categoryId, setCategoryId] = useState<number | null>(propertyData?.categoryId ?? null);

    const initialWingId = (propertyData?.wingId && propertyData.wingId !== 0)
        ? propertyData.wingId
        : null;

    const initialWingName = (propertyData?.wingName && propertyData.wingName.trim() !== "")
        ? propertyData.wingName
        : '';

    const [wingId, setWingId] = useState<number | null>(initialWingId);
    const [wingName, setWingName] = useState(initialWingName);
    
    const [moujaId, setMoujaId] = useState<number | null>(propertyData?.moujaId ?? null);
    const [moujaName, setMoujaName] = useState<string>(propertyData?.moujaName ?? '');

    const [hasChanges, setHasChanges] = useState(false);

    return {
        propertyTypeId,
        setPropertyTypeId,
        categoryId,
        setCategoryId,
        wingId,
        setWingId,
        wingName,
        setWingName,
        moujaId,
        setMoujaId,
        moujaName,
        setMoujaName,
        hasChanges,
        setHasChanges,
        initialWingId,
    };
};