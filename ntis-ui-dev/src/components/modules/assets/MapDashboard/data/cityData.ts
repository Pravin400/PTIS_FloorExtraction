import type { CityData } from '@/types/assets/map-dashboard.types';
export type { CityData };

export const createCityData = (akolaData: {
  totalAssets: number;
  criticalAssets: number;
  pendingDocuments: number;
  assetValue: number;
}): CityData[] => [
  // ====================  ALL 29 MUNICIPAL CORPORATIONS OF MAHARASHTRA  ====================
  // isLive: true  → has real API data and can navigate to its own dashboard
  // isLive: false → placeholder (not yet onboarded), shows "Coming soon" toast

  // Konkan Division - Municipal Corporations
  { name: 'Mumbai',            lat: 19.0760, lng: 72.8777, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 15,  y: 60 },
  { name: 'Thane',             lat: 19.2183, lng: 72.9781, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 20,  y: 55 },
  { name: 'Navi Mumbai',       lat: 19.0330, lng: 73.0297, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 25,  y: 65 },
  { name: 'Kalyan–Dombivli',   lat: 19.2403, lng: 73.1305, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 28,  y: 58 },
  { name: 'Vasai–Virar',       lat: 19.4612, lng: 72.7985, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 18,  y: 50 },
  { name: 'Mira–Bhayandar',    lat: 19.2952, lng: 72.8544, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 17,  y: 57 },
  { name: 'Bhiwandi–Nizampur', lat: 19.2969, lng: 73.0640, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 22,  y: 52 },
  { name: 'Ulhasnagar',        lat: 19.2183, lng: 73.1382, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 26,  y: 60 },
  { name: 'Panvel',            lat: 18.9894, lng: 73.1107, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 24,  y: 68 },

  // Nashik Division - Municipal Corporations
  { name: 'Nashik',            lat: 19.9975, lng: 73.7898, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 35,  y: 45 },
  { name: 'Ahmednagar',        lat: 19.0948, lng: 74.7480, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 47,  y: 55 },
  { name: 'Dhule',             lat: 20.9042, lng: 74.7749, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 44,  y: 28 },
  { name: 'Jalgaon',           lat: 21.0077, lng: 75.5626, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 62,  y: 28 },
  { name: 'Malegaon',          lat: 20.5579, lng: 74.5287, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 41,  y: 35 },

  // Pune Division - Municipal Corporations
  { name: 'Pune',              lat: 18.5204, lng: 73.8567, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 35,  y: 75 },
  { name: 'Pimpri–Chinchwad',  lat: 18.6298, lng: 73.7997, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 33,  y: 72 },
  { name: 'Sangli–Miraj–Kupwad', lat: 16.8524, lng: 74.5815, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 45, y: 92 },
  { name: 'Kolhapur',          lat: 16.7050, lng: 74.2433, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 40,  y: 95 },
  { name: 'Solapur',           lat: 17.6599, lng: 75.9064, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 55,  y: 85 },
  { name: 'Ichalkaranji',      lat: 16.6910, lng: 74.4607, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 42,  y: 93 },

  // Aurangabad Division - Municipal Corporations
  { name: 'Aurangabad',        lat: 19.8762, lng: 75.3433, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 50,  y: 50 },
  { name: 'Jalna',             lat: 19.8347, lng: 75.8800, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 72,  y: 50 },
  { name: 'Parbhani',          lat: 19.2608, lng: 76.7611, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 85,  y: 55 },
  { name: 'Nanded–Waghala',    lat: 19.1383, lng: 77.3210, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 102, y: 60 },
  { name: 'Latur',             lat: 18.3984, lng: 76.5604, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 88,  y: 72 },

  // Amravati Division - Municipal Corporations
  // Akola: isLive: true — the only city currently onboarded with real API data
  { name: 'Akola',             lat: 20.7002, lng: 77.0082, isLive: true,  totalAssets: akolaData.totalAssets, criticalAssets: akolaData.criticalAssets, pendingDocuments: akolaData.pendingDocuments, assetValue: akolaData.assetValue, x: 93,  y: 35 },
  { name: 'Amravati',          lat: 20.9374, lng: 77.7796, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 104, y: 27 },

  // Nagpur Division - Municipal Corporations
  { name: 'Nagpur',            lat: 21.1458, lng: 79.0882, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 133, y: 28 },
  { name: 'Chandrapur',        lat: 19.9615, lng: 79.2961, isLive: false, totalAssets: 0, criticalAssets: 0, pendingDocuments: 0, assetValue: 0, x: 140, y: 48 },
];
