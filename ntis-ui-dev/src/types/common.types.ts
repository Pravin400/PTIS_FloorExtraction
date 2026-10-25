export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  warning?: string;
  /** The HTTP status code from the server response; absent for network/timeout errors */
  statusCode?: number;
}
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  warning?: string;
  statusCode?: number;
  validationErrors?: Record<string, string | string[]>;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
}

export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'save' | 'cancel' | 'add' | 'upload' | 'import' | 'export';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}


export interface CheckboxProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'role' | 'onChange' | 'value'
> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  value?: string;
  label?: string;
  indeterminate?: boolean;
}

export interface RadioGroupProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
}

export interface RadioGroupItemProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'role' | 'onChange' | 'value' | 'name'
> {
  value: string;
}

/**
 * Standard paginated response shape for API endpoints.
 * This is the primary type used for all paginated lists in the application.
 */
export interface PagedResponse<T> {
  /** Array of items for the current page */
  items: T[];
  /** Total number of items across all pages */
  totalCount: number;
  /** The current page number (1-indexed) */
  pageNumber: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages available */
  totalPages: number;
  /** Whether there is a previous page available */
  hasPrevious: boolean;
  /** Whether there is a next page available */
  hasNext: boolean;
  /** Duplicate row count */
  duplicateCount?: number;
  /** @deprecated Use duplicateCount instead */
  dublicateCount?: number;
}

export interface PhotoUploadSuccessModalProps {
  open: boolean;
  onClose: () => void;
  photoName?: string;
  categoryName?: string;
  imgSrc?: string;
  isReplacement?: boolean;
}
