/**
 * Amravati Municipal GIS Spatial Boundaries, Coordinates & Zone Master Data
 * Architectural Layer: src/lib/constants/grievance/
 */

import type { LandmarkCoordinates } from '@/types/grievance';

// Amravati Municipal Corporation Center Coordinates
export const AMRAVATI_CENTER: [number, number] = [20.9374, 77.7796];
export const AMRAVATI_DEFAULT_ZOOM = 13;

// Approximate AMC Boundary Polygon Coordinates (Lat, Lng)
export const AMRAVATI_BOUNDARY_COORDS: [number, number][] = [
  [20.9700, 77.7400],
  [20.9850, 77.7700],
  [20.9650, 77.8200],
  [20.9350, 77.8400],
  [20.9000, 77.8100],
  [20.8900, 77.7600],
  [20.9100, 77.7300],
  [20.9450, 77.7250],
  [20.9700, 77.7400],
];

// Major Landmarks across Amravati
export const AMRAVATI_LANDMARKS: (LandmarkCoordinates & { nameMr?: string; ward?: number })[] = [];

export interface ZoneConfigItem {
  id: number;
  name: string;
  nameMr: string;
  char: string;
  wardsCount: number;
  headOffice: string;
}

export const ZONE_CONFIG: Record<string, ZoneConfigItem> = {
  zoneA: {
    id: 1,
    name: 'Zone 1 - Central / Camp',
    nameMr: 'प्रभाग समिती १ - मध्य / कॅम्प',
    char: 'A',
    wardsCount: 18,
    headOffice: 'AMC Camp Main Office',
  },
  zoneB: {
    id: 2,
    name: 'Zone 2 - Gadge Nagar / North',
    nameMr: 'प्रभाग समिती २ - गाडगे नगर / उत्तर',
    char: 'B',
    wardsCount: 14,
    headOffice: 'Gadge Nagar Ward Office',
  },
  zoneC: {
    id: 3,
    name: 'Zone 3 - Wadali / East',
    nameMr: 'प्रभाग समिती ३ - वडाळी / पूर्व',
    char: 'C',
    wardsCount: 11,
    headOffice: 'Wadali Division Office',
  },
  zoneD: {
    id: 4,
    name: 'Zone 4 - Dastur Nagar / South',
    nameMr: 'प्रभाग समिती ४ - दस्तूर नगर / दक्षिण',
    char: 'D',
    wardsCount: 12,
    headOffice: 'Dastur Nagar Office',
  },
  zoneE: {
    id: 5,
    name: 'Zone 5 - Badnera',
    nameMr: 'प्रभाग समिती ५ - बडनेरा',
    char: 'E',
    wardsCount: 12,
    headOffice: 'Badnera Sub-Central Office',
  },
};

export interface CivicCityConfig {
  id: string;
  name: string;
  nameMr: string;
  center: [number, number];
  zoom: number;
}

export const CIVIC_CITY_CONFIG: CivicCityConfig = {
  id: 'amravati',
  name: 'Amravati, Maharashtra',
  nameMr: 'अमरावती, महाराष्ट्र',
  center: AMRAVATI_CENTER,
  zoom: AMRAVATI_DEFAULT_ZOOM,
};
