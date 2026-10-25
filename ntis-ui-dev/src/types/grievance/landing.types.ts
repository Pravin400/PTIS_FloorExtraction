/**
 * Grievance Landing and GIS Map Domain Types
 */

import type { IssueCategory } from './grievance.types';

export type { IssueCategory };

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  category: string;
  title: string;
  titleMr?: string;
  description?: string;
  status: string;
  ward?: string;
  address?: string;
  reportedAt?: string;
}

export interface LandmarkCoordinates {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zone?: string;
}
