export interface RawAliasMaster {
  id?: number;
  aliasKey?: string | null;
  keyName?: string;
  labelName?: string;
  englishName?: string | null;
  regionalName?: string | null;
  hindiName?: string | null;
  isActive?: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface AliasMaster {
  [key: string]: unknown;
  id: number;
  aliasKey: string | null;
  keyName: string;
  labelName: string;
  englishName: string | null;
  regionalName: string | null;
  hindiName: string | null;
  isActive: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface AliasMasterCounts {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
}

export interface AliasMasterProps {
  data: AliasMaster[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  counts: AliasMasterCounts;
  sortBy?: string;
  sortOrder?: string;
  searchTerm?: string;
}

export interface AliasMasterFormModel {
  id?: number | null;
  keyName: string;
  labelName: string;
  englishName: string;
  regionalName: string;
  hindiName: string;
  isActive: boolean;
}

/** Envelope shape returned by the Alias Master create/update endpoints. */
export interface AliasMasterApiEnvelope {
  success: boolean;
  message?: string;
  items?: RawAliasMaster;
  errors?: unknown;
  correlationId?: string | null;
}

/** Lightweight shape returned per row by GET /alias-master/active (active rows only). */
export interface RawAliasLabel {
  keyName: string;
  englishName?: string | null;
  regionalName?: string | null;
  hindiName?: string | null;
}

/** keyName -> per-language names, built from the /alias-master/active response. */
export type AliasLabelMap = Record<string, {
  englishName: string | null;
  regionalName: string | null;
  hindiName: string | null;
}>;
