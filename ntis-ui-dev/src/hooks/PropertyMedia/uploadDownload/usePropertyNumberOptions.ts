"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchPropertyNumbersAction } from "@/app/[locale]/property-tax/property-media/action";

interface UsePropertyNumberOptionsProps {
  zone?: string;
  ward?: string[];
  propertyFrom?: string;
}

export function usePropertyNumberOptions({
  zone,
  ward,
  propertyFrom,
}: UsePropertyNumberOptionsProps) {
  const [propertyFromOptions, setPropertyFromOptions] = useState<string[]>([]);
  const [propertyToOptions, setPropertyToOptions] = useState<string[]>([]);
  const [isLoadingPropertyFrom, setIsLoadingPropertyFrom] = useState(false);
  const [isLoadingPropertyTo, setIsLoadingPropertyTo] = useState(false);

  // Fetch Property From options when Zone or Wards change
  useEffect(() => {
    let isMounted = true;
    const fetchFromNumbers = async () => {
      if (!zone) {
        setPropertyFromOptions([]);
        return;
      }

      setIsLoadingPropertyFrom(true);
      try {
        const numbers = await fetchPropertyNumbersAction({
          divisionId: zone,
          wardIds: ward && ward.length > 0 ? ward : undefined,
        });
        if (isMounted) {
          setPropertyFromOptions(numbers);
        }
      } catch (_err) {
        if (isMounted) {
          setPropertyFromOptions([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPropertyFrom(false);
        }
      }
    };

    fetchFromNumbers();

    return () => {
      isMounted = false;
    };
  }, [zone, ward]);

  // Fetch Property To options when Property From is selected
  useEffect(() => {
    let isMounted = true;
    const fetchToNumbers = async () => {
      if (!zone || !propertyFrom) {
        setPropertyToOptions([]);
        return;
      }

      setIsLoadingPropertyTo(true);
      try {
        const numbers = await fetchPropertyNumbersAction({
          divisionId: zone,
          wardIds: ward && ward.length > 0 ? ward : undefined,
          fromPropertyNo: propertyFrom,
        });
        if (isMounted) {
          setPropertyToOptions(numbers);
        }
      } catch (_err) {
        if (isMounted) {
          setPropertyToOptions([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPropertyTo(false);
        }
      }
    };

    fetchToNumbers();

    return () => {
      isMounted = false;
    };
  }, [zone, ward, propertyFrom]);

  const resetAllPropertyOptions = useCallback(() => {
    setPropertyFromOptions([]);
    setPropertyToOptions([]);
  }, []);

  const resetPropertyToOptions = useCallback(() => {
    setPropertyToOptions([]);
  }, []);

  return {
    propertyFromOptions,
    propertyToOptions,
    isLoadingPropertyFrom,
    isLoadingPropertyTo,
    setPropertyFromOptions,
    setPropertyToOptions,
    resetAllPropertyOptions,
    resetPropertyToOptions,
  };
}
