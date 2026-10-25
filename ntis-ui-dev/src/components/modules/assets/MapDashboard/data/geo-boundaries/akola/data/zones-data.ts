// Akola Municipal Zones Data Structure

import type { AkolaZone } from '@/types/assets/map-dashboard.types';
export type { AkolaZone };

// Define colors for each zone (matching Pune map's aesthetic)
export const zoneColors = {
  zone1: { default: '#5cedce', hover: '#3bcbb5', selected: '#2ba691' }, // Central
  zone2: { default: '#ec4899', hover: '#db2777', selected: '#be185d' }, // North
  zone3: { default: '#1e88e5', hover: '#1976d2', selected: '#1565c0' }, // South
  zone4: { default: '#26a69a', hover: '#00897b', selected: '#00796b' }, // East
  zone5: { default: '#004a99', hover: '#003875', selected: '#002855' }, // West
  zone6: { default: '#fdba74', hover: '#fb923c', selected: '#f97316' },
  zone7: { default: '#fca5a5', hover: '#f87171', selected: '#ef4444' },
  zone8: { default: '#c4b5fd', hover: '#a78bfa', selected: '#8b5cf6' },
  // Add more zones as needed
};

// Zone details data
export const akolaZonesData: Record<string, AkolaZone> = {
  zone1: {
    id: 'zone1',
    name: 'Zone 1 - East',
    color: 'zone1',
    population: '50,000',
    area: '15 km²',
    wards: ['Ward 1', 'Ward 2', 'Ward 3'],
    description: 'Central business district of Akola',
    keyFacts: [
      'Main commercial area',
      'Historical monuments',
      'Well-connected transport'
    ]
  },
  zone2: {
    id: 'zone2',
    name: 'Zone 2 - North',
    color: 'zone2',
    population: '45,000',
    area: '12 km²',
    wards: ['Ward 4', 'Ward 5'],
    description: 'Northern residential zone',
    keyFacts: [
      'Residential area',
      'Schools and colleges',
      'Parks and gardens'
    ]
  },
  zone3: {
    id: 'zone3',
    name: 'Zone 3 - South',
    color: 'zone3',
    population: '40,000',
    area: '18 km²',
    wards: ['Ward 6', 'Ward 7', 'Ward 8'],
    description: 'Southern industrial zone',
    keyFacts: [
      'Industrial area',
      'Manufacturing units',
      'Developing infrastructure'
    ]
  },
  zone4: {
    id: 'zone4',
    name: 'Zone 4 - West',
    color: 'zone4',
    population: '38,000',
    area: '14 km²',
    wards: ['Ward 9', 'Ward 10'],
    description: 'Eastern residential zone',
    keyFacts: [
      'Residential neighborhoods',
      'Community centers',
      'Green spaces'
    ]
  },
  
};
