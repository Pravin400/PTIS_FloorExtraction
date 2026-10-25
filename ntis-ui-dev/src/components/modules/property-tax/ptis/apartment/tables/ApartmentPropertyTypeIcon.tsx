'use client';
import React from 'react';
import { Building2, Store, TreePine } from 'lucide-react';
import { PropertyTypeIconProps } from '@/types/property-tax/apartment';

export const ApartmentPropertyTypeIcon: React.FC<PropertyTypeIconProps> = ({ type, className = '' }) => {
  switch (type) {
    case 'Residential':
      return (
        <div className={`flex items-center justify-center w-6 h-6 rounded bg-blue-50 text-blue-500 ${className}`}>
          <Building2 size={14} />
        </div>
      );
    case 'Commercial':
      return (
        <div className={`flex items-center justify-center w-6 h-6 rounded bg-amber-50 text-amber-500 ${className}`}>
          <Store size={14} />
        </div>
      );
    case 'Amenity':
      return (
        <div className={`flex items-center justify-center w-6 h-6 rounded bg-purple-50 text-purple-500 ${className}`}>
          <TreePine size={14} />
        </div>
      );
    default:
      return null;
  }
};

export default ApartmentPropertyTypeIcon;
