export interface TargetFloor {
    propertyDetailsId: number;
    floorDescription?: string | null;
    subFloorDescription?: string | null;
    constructionTypeDescription?: string | null;
    typeOfUseDescription?: string | null;
}

export interface IncompleteFloor {
    floorName: string;
    certificateNames: string[];
}

export interface SaveDetailsConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedFloorIds?: number[]) => void;
    certificateName?: string;
    certificateNumber?: string;
    certificateDate?: string;
    targetFloors?: TargetFloor[];
    isPropertyWideGlobal?: boolean;
    t: (key: string) => string;
    isUnsavedWarning?: boolean;
    incompleteFloors?: IncompleteFloor[];
}
