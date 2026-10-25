/** JSON emitted by the Windows Crystal Reports extractor, including extension fields. */
export interface NativeCrystalElement {
  id: string;
  sectionId: string;
  type: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  widthTwips: number;
  heightTwips: number;
  fieldName?: string;
  formulaName?: string;
  subreportName?: string;
  imageUrl?: string;
  visible?: boolean;
  styles?: Record<string, string>;
  properties?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface NativeCrystalSection {
  id: string;
  subreportName?: string;
  isSubreport?: boolean;
  [key: string]: unknown;
}

export interface NativeCrystalReport {
  reportId: string;
  orientation?: string;
  pageWidth: number;
  sections: NativeCrystalSection[];
  elements: NativeCrystalElement[];
  embeddedSubreports?: Array<{ name: string; sections: number; elements: number }>;
  [key: string]: unknown;
}
