import { useState, useEffect, useCallback } from "react";
import { SocietyWingDetailItem } from "@/types/zone-master/properties/society-wing-details.types";
import { getSocietyWingDetailsAction } from "@/app/[locale]/property-tax/zone-master/actions";

interface UseSocietyWingDetailsProps {
  propertyId: number | null | undefined;
}

interface UseSocietyWingDetailsReturn {
  wingDetails: SocietyWingDetailItem[];
  loadingWingDetails: boolean;
  wingDetailsError: string | null;
  refetchWingDetails: () => Promise<void>;
}

/**
 * Hook to fetch society wing details for a property.
 * Returns wing information including property counts and amenity counts.
 */
export function useSocietyWingDetails({ propertyId }: UseSocietyWingDetailsProps): UseSocietyWingDetailsReturn {
  const [wingDetails, setWingDetails] = useState<SocietyWingDetailItem[]>([]);
  const [loadingWingDetails, setLoadingWingDetails] = useState(false);
  const [wingDetailsError, setWingDetailsError] = useState<string | null>(null);

  const fetchWingDetails = useCallback(async () => {
    if (!propertyId || propertyId <= 0) {
      setWingDetails([]);
      setWingDetailsError(null);
      return;
    }

    setLoadingWingDetails(true);
    setWingDetailsError(null);

    try {
      const result = await getSocietyWingDetailsAction(propertyId);
      
      if (result.success && result.data) {
        setWingDetails(result.data);
      } else {
        setWingDetailsError(result.error || "Failed to fetch wing details");
        setWingDetails([]);
      }
    } catch (error) {
      setWingDetailsError(error instanceof Error ? error.message : "Failed to fetch wing details");
      setWingDetails([]);
    } finally {
      setLoadingWingDetails(false);
    }
  }, [propertyId]);

  // Fetch wing details when propertyId changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWingDetails();
  }, [fetchWingDetails]);

  return {
    wingDetails,
    loadingWingDetails,
    wingDetailsError,
    refetchWingDetails: fetchWingDetails,
  };
}
