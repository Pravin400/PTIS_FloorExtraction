"use client";

import React from "react";
import { Select } from "@/components/common";
import { useRoomTypeMaster } from "@/hooks/ptis/RoomSubmission/useRoomTypeMaster";
import { useTranslations } from "next-intl";

interface RoomTypeSelectProps {
    value: string | undefined;
    onChange: (value: string, roomTypeId?: number) => void;
    className?: string;
    disabled?: boolean;
    autoFocus?: boolean;
}

export const RoomTypeSelect: React.FC<RoomTypeSelectProps> = ({ value, onChange, className, disabled, autoFocus }) => {
    const { roomTypes, roomTypeDetails, isLoading } = useRoomTypeMaster();
    const t = useTranslations("quickDataEntry");

    const options = [
        { label: t("roomSubmission.input.roomTypes.select"), value: "-Select-" },
        ...(roomTypes?.map((type) => ({ label: type, value: type })) || []),
    ];

    const handleChange = (_: React.ChangeEvent<HTMLSelectElement> | null, newVal: string) => {
        // Find the roomTypeId from roomTypeDetails based on the selected name
        // Check all possible name fields with case-insensitive matching
        const normalizedVal = newVal?.trim().toLowerCase();
        const selectedDetail = roomTypeDetails?.find((detail) => {
            // Check all possible name fields from the API response
            // roomTypeDescription is typed in RoomTypeResponse interface
            const possibleNames = [
                detail.roomTypeName,
                detail.description,
                detail.roomTypeDescription,
                detail.roomTypeCode,
            ].filter(Boolean);
            
            return possibleNames.some(name => 
                String(name).trim().toLowerCase() === normalizedVal
            );
        });
        
        // Get roomTypeId - use typed field, with safe fallback for legacy 'id' field
        let roomTypeId: number | undefined = selectedDetail?.roomTypeId;
        if (roomTypeId === undefined && selectedDetail) {
            // Safely parse legacy 'id' field if roomTypeId is not available
            const legacyId = selectedDetail['id'];
            if (typeof legacyId === 'number' && !Number.isNaN(legacyId)) {
                roomTypeId = legacyId;
            } else if (typeof legacyId === 'string') {
                const parsed = Number(legacyId);
                if (!Number.isNaN(parsed)) {
                    roomTypeId = parsed;
                }
            }
        }
        
        onChange(newVal, roomTypeId);
    };

    const wrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (autoFocus && !isLoading && !disabled && wrapperRef.current) {
            // Wait slightly for DOM updates before focusing
            const timer = setTimeout(() => {
                const btn = wrapperRef.current?.querySelector('button');
                if (btn) btn.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [autoFocus, isLoading, disabled]);

    return (
        <div ref={wrapperRef} className="w-full h-full">
            <Select
                options={options}
                value={value || "-Select-"}
                onChange={handleChange}
                disabled={disabled || isLoading}
                placeholder={isLoading ? t("floor.loading") : t("roomSubmission.input.roomTypes.select")}
                selectSize="md"
                className={className}
            />
        </div>
    );
};
