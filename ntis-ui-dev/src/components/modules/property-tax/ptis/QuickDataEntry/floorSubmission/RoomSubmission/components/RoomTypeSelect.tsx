"use client";

import React from "react";
import { SearchSelect } from "@/components/common";
import { useTranslations } from "next-intl";
import { RoomTypeResponse } from "@/types/room-details.types";

interface RoomTypeSelectProps {
    value: string | undefined;
    onChange: (value: string, id?: number) => void;
    className?: string;
    disabled?: boolean;
    roomTypeData?: RoomTypeResponse[];
}

export const RoomTypeSelect: React.FC<RoomTypeSelectProps> = ({ value, onChange, className, disabled, roomTypeData }) => {
    const roomTypeDetails = React.useMemo(() => roomTypeData || [], [roomTypeData]);
    const isLoading = false;
    const t = useTranslations("quickDataEntry");

    const options = [
        { label: t("roomSubmission.input.roomTypes.select"), value: "-Select-" },
        ...(roomTypeDetails?.map((item) => {
            const name = item.roomTypeName || item.description || '';
            const itemId = item.roomTypeId || item.id || item.ID || '';
            const code = item.roomTypeCode || String(itemId);
            return {
                label: name || code,
                value: name || code || String(itemId)
            };
        }) || []),
    ];

    const resolvedValue = React.useMemo(() => {
        if (!value || value === "-Select-" || value === "Room") return "-Select-";

        const matched = roomTypeDetails.find(item => {
            const name = String(item.roomTypeName || '').trim().toLowerCase();
            const desc = String(item.description || '').trim().toLowerCase();
            const code = String(item.roomTypeCode || '').trim().toLowerCase();
            const itemId = item.roomTypeId || item.id || item.ID || '';
            const id = String(itemId).trim().toLowerCase();
            const val = String(value || '').trim().toLowerCase();

            return (
                (code && code === val) ||
                (id && id === val) ||
                (name && name === val) ||
                (desc && desc === val)
            );
        });

        if (matched) {
            return matched.roomTypeName || matched.description || matched.roomTypeCode || value;
        }

        return value;
    }, [value, roomTypeDetails]);

    return (
        <SearchSelect
            options={options}
            value={resolvedValue}
            onChange={(_, newVal) => {
                const matched = roomTypeDetails.find(item => {
                    const name = String(item.roomTypeName || '').trim();
                    const desc = String(item.description || '').trim();
                    const code = String(item.roomTypeCode || '').trim();
                    const itemId = item.roomTypeId || item.id || item.ID || '';
                    const id = String(itemId).trim();
                    const val = String(newVal || '').trim();

                    return (
                        (code && code === val) ||
                        (id && id === val) ||
                        (name && name === val) ||
                        (desc && desc === val)
                    );
                });
                const resolvedId = matched ? (matched.roomTypeId || matched.id || matched.ID || 0) : 0;
                const finalValue = matched ? (matched.roomTypeName || matched.description || matched.roomTypeCode || newVal) : newVal;
                onChange(finalValue, Number(resolvedId));
            }}
            disabled={disabled || isLoading}
            placeholder={isLoading ? t("floor.loading") : t("roomSubmission.input.roomTypes.select")}
            isLoading={isLoading}
            className={className}
        />
    );
};
