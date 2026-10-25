'use client';

import React from 'react';

interface PropertyCategoryDisplayProps {
  t: (key: string) => string;
  categoryName?: string;
  categoryId?: number;
}

/**
 * PropertyCategoryDisplay - Shows the property category selected in the Property Information tab
 * This allows category-based floor functionality and provides visual context
 */
export const PropertyCategoryDisplay: React.FC<PropertyCategoryDisplayProps> = ({
  t,
  categoryName,
  categoryId,
}) => {
  // Don't render if no category is set
  if (!categoryName && !categoryId) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-blue-100 p-3 mb-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {t('floor.propertyCategory')}:
        </span>
        <span className="text-sm font-bold text-blue-900">
          {categoryName || `Category ID: ${categoryId}`}
        </span>
      </div>
    </div>
  );
};

export default PropertyCategoryDisplay;
