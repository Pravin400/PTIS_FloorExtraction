/** 
 * Form model for creating and editing payment modes
 */
export interface PaymentModeFormModel {
    id?: number;
    code: string;
    paymentModeName: string;
    type: string;
    category: string;
    description: string;
    chargeType: string;
    transactionCharge: number | "";
    isActive: boolean;
}

/**
 * Payment Mode Entity from API
 */
export interface PaymentMode {
    id: number;
    code: string;
    paymentModeName: string;
    type: string;
    category: string;
    description: string;
    chargeType: string;
    transactionCharge: number;
    isActive: boolean;
    createdDate: string;
    updatedDate: string;
    createdBy: number;
    updatedBy: number;
}

export interface PaymentModeFormData {
    code: string;
    paymentModeName: string;
    type: string;
    category: string;
    description: string;
    chargeType: string;
    transactionCharge: number | "";
    isActive: boolean;
}

export interface DashboardCardProps {
    label: string;
    value: string;
    iconBg: string;
    valueColor: string;
    icon: React.ElementType;
}


export interface PaymentModeFormProps {
    open: boolean;
    onClose: () => void;
    editingMode: PaymentMode | null;
    onSuccess: () => void;
}

/**
 * Props for Payment Mode page component with initial server-side data
 */
export interface PaymentModePageProps {
    initialData: PaymentMode[];
    allData?: PaymentMode[];
    initialPageNumber: number;
    initialPageSize: number;
    initialTotalCount: number;
    initialTotalPages: number;
    initialSearchTerm?: string;
}


export interface PagedResponse<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}
