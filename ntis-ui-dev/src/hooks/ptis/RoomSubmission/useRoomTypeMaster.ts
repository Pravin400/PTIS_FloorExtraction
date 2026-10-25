"use client";

import { useState, useEffect } from "react";
import { getRoomTypesAction } from "@/lib/api/ptis/floorSubmission/room-master.action";
import { RoomTypeResponse } from "@/types/room-details.types";

/**
 * Custom hook to fetch and manage room type master data
 * @returns {Object} { roomTypes, roomTypeDetails, isLoading, error }
 */
export const useRoomTypeMaster = () => {
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [roomTypeDetails, setRoomTypeDetails] = useState<RoomTypeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRoomTypes = async () => {
      try {
        setIsLoading(true);
        const result = await getRoomTypesAction();
        
        if (isMounted) {
          if (result.success && result.data) {
            setRoomTypeDetails(result.data);
            const options = result.data.map(item => {
              const name = item.roomTypeName || item.description || item.roomTypeDescription || '';
              const code = item.roomTypeCode || String(item.roomTypeId || '');
              return name || code;
            });
            setRoomTypes(options);
          } else {
            setError(result.error || "Failed to load room types");
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "An unexpected error occurred");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchRoomTypes();

    return () => {
      isMounted = false;
    };
  }, []);

  return { roomTypes, roomTypeDetails, isLoading, error };
};
