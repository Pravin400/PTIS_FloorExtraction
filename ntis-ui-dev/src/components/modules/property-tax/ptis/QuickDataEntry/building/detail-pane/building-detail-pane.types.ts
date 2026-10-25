import { CertificateData, FloorCertificateDto } from "@/types/building-permission.types";
import type {
    FloorResponse,
    ConstructionTypeResponse,
    TypeOfUseApiItem,
    SubFloorResponse,
    SubTypeOfUseResponse,
} from "@/types/floor-details.types";
import type { FloorData } from "@/types/room-details.types";

export interface BuildingDetailPaneProps {
    data: CertificateData | null | undefined;
    propertyWideCert?: CertificateData | null;
    onInputChange: (field: "number" | "date", value: string) => void;
    onFileUpload: (file: File) => void;
    onFileDelete?: (certificateTypeId: number) => void;
    onToggleEnabled?: (checked: boolean) => void;
    onCopyFromProperty?: () => void;
    validationError?: string;
    fieldErrors?: { number?: string; date?: string; document?: string };
    t: (key: string, values?: Record<string, string | number | Date>) => string;
    floorData?: FloorResponse[];
    constructionTypeData?: ConstructionTypeResponse[];
    useData?: TypeOfUseApiItem[];
    subFloorData?: SubFloorResponse[];
    subTypeData?: SubTypeOfUseResponse[];
    initialFloors?: FloorData[];
    activeScope?: string;
    activeFloorId?: string | number | null;
    onScopeChange?: (scope: "Property" | "Floor", floorDetailsId: number | null) => void | Promise<void>;
    floors?: FloorCertificateDto[];
    isFloorLoading?: boolean;
    cameFromFloor?: boolean;
    onDeleteCertificate?: () => void | Promise<unknown>;
    isSaving?: boolean;
    isDeletingCertificate?: boolean;
    hasChanges?: boolean;
    saveError?: string;
    deleteError?: string;
    onSave?: () => void | Promise<unknown>;
}
