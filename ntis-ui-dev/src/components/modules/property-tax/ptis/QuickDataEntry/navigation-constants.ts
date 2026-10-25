import { Home, UserCheck, Building2, Percent } from 'lucide-react';
import { Tab } from '@/types/property-basic-details.types';

export const TABS: Tab[] = [
  { label: 'Property', href: 'Property', icon: Home },
  { label: 'Kyc', href: 'Kyc', icon: UserCheck },
  { label: 'Society', href: 'Society', icon: Building2 },
  { label: 'Wing', href: 'Wing', icon: Building2 },
  { label: 'BuildingPermission', href: 'Building', icon: Building2 },
  { label: 'Discount', href: 'Discount', icon: Percent },
  { label: 'FloorSubmission', href: 'FloorSubmission', icon: Building2 },
  { label: 'OldDetails', href: 'OldDetails/old-taxation', icon: Building2 },
];

import { RETURN_TAB_BY_QDE_HREF } from '@/lib/utils/qde-tab-mapping';
export { RETURN_TAB_BY_QDE_HREF };

export const TAB_GRADIENT_CLASSES = {
  activeClass: 'from-blue-500 to-blue-600 border-blue-700',
};
