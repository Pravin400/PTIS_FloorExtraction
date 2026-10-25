import { BadgeVariant } from "@/components/common";
import { Image, Ruler, FileText } from 'lucide-react';
import { GapSummaryCardConfig } from '@/types/PropertyMedia/PropertyMedia.types';

export enum PropertyMediaCategoryEnum {
    PHOTO = 1,
    PLAN = 2,
    DOCUMENT = 3,
}

export enum PropertyMediaCategoryKey {
    BUILDING_PHOTO = "Building Photo",
    BUILDING_PLAN = "Building Plan",
    SURVEY_FORM = "Survey Form",
}

export const categoryIcons = {
    [PropertyMediaCategoryEnum.PHOTO]: Image,
    [PropertyMediaCategoryEnum.PLAN]: Ruler,
    [PropertyMediaCategoryEnum.DOCUMENT]: FileText,
} as const;

export const MAX_LOCAL_DEVICE_UPLOAD_FILES = 10;
export const MAX_LOCAL_DEVICE_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export const GAP_ANALYSIS_SUMMARY_CARD_CONFIGS: GapSummaryCardConfig[] = [
    {
        id: PropertyMediaCategoryEnum.PHOTO,
        key: PropertyMediaCategoryKey.BUILDING_PHOTO,
        titleKey: 'gapAnalysis.summaryCards.buildingPhotoMissing',
        icon: Image,
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-500',
        getStats: (stats) => stats?.buildingPhotoMissing,
    },
    {
        id: PropertyMediaCategoryEnum.PLAN,
        key: PropertyMediaCategoryKey.BUILDING_PLAN,
        titleKey: 'gapAnalysis.summaryCards.buildingPlanMissing',
        icon: Ruler,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-500',
        getStats: (stats) => stats?.buildingPlanMissing,
    },
    {
        id: PropertyMediaCategoryEnum.DOCUMENT,
        key: PropertyMediaCategoryKey.SURVEY_FORM,
        titleKey: 'gapAnalysis.summaryCards.surveyFormMissing',
        icon: FileText,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-500',
        getStats: (stats) => stats?.surveyFormMissing,
    },
];

export const requirementVariants: Record<string, BadgeVariant> = {
  "Mandatory": "destructive",
  "Additional": "success",
  "Conditional": "warning"
};

export const workflowStatusVariants: Record<string, BadgeVariant> = {
    "Geo-Sequencing": "default",
    "Survey": "success",
    "Data Entry": "info",
    "Assessment": "warning",
    "Approved by ULB": "secondary",
    "Notice Distribution": "outline",
    "Hearing And Appeal": "default",
    "Bill Recovery": "secondary",
    "Bill Generation": "success",
};