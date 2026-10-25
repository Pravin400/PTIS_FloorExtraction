/**
 * Represents an Urban Local Body (ULB) configuration.
 * A ULB is an administrative body for a specific urban area (e.g., Municipality, Corporation).
 */
export interface UlbMaster {
  /** Unique identifier for the ULB */
  id: number;
  /** Official code assigned to the ULB */
  ulbCode: string;
  /** Name of the ULB in English */
  ulbName: string;
  /** Localized name (e.g., Marathi/Hindi), optional */
  ulbNameLocal?: string;
  /**
   * Type identifier for the ULB category.
   * Common values: 1 = Municipal Corporation, 2 = Municipal Council, 3 = Nagar Panchayat
   * Note: Actual type definitions should be fetched from the backend or defined in a separate UlbType enum.
   */
  ulbTypeId: number;
  /** URL to the ULB's logo image. If not present, a default placeholder/text will be shown */
  ulbLogo?: string;
  /** URL to the ULB's background wallpaper image, optional */
  ulbBackground?: string;
  /** Official contact email, optional */
  email?: string;
  /** Contact phone number, optional */
  phoneNo?: string;
  /** Official website URL, optional */
  websiteUrl?: string;
  /** Physical address of the ULB headquarters, optional */
  ulbAddress?: string;
  /** Whether the ULB is currently active in the system */
  isActive: boolean;
}
