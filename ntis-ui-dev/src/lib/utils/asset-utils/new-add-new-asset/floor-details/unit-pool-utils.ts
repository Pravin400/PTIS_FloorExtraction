 
export { buildConfiguratorUnit } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/unit-pool-configurator-mapping.utils';
export { calculateArea } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-registration-area.utils';
export { parseOpenSpacesFromFloors, parseAmenitiesFromFloors } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/unit-pool-floor-space-parser.utils';

export const typeBadge: Record<string, string> = {
  Flat: 'bg-blue-100 text-blue-700',
  Shop: 'bg-amber-100 text-amber-700',
  Office: 'bg-indigo-100 text-indigo-700',
  Floor: 'bg-slate-100 text-slate-600',
  Construction: 'bg-slate-100 text-slate-600',
  Room: 'bg-violet-100 text-violet-700',
  Department: 'bg-teal-100 text-teal-700',
  'Open Space': 'bg-emerald-100 text-emerald-700',
  Amenity: 'bg-violet-100 text-violet-700',
};
