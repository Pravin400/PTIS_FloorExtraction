export interface Amenity {
  id: string | number;
  amenityType: string;
  count: number;
  lengthMtr?: string | number;
  widthMtr?: string | number;
  heightMtr?: string | number;
  areaSqMtr?: number;
  totalAreaSqMtr?: number;
  outerYesNo?: string;
  minusYesNo?: string;
  photoUrl?: string;
  photoTitle?: string;
  description?: string;
  notes?: string;
  offsets?: Array<{
    id?: string | number;
    description: string;
    lengthMtr: number;
    widthMtr: number;
    areaSqMtr: number;
    outerYesNo: string;
    isMinus: boolean;
  }>;
}
