'use client';

import React from 'react';
import { OpenPlotCategoryItem } from '@/lib/utils/floorSubmission/openplot-category';
import { usePlotAreaCalculator } from '../../../../../../../hooks/ptis/floorSubmission/usePlotAreaCalculator';
import { PlotAreaSingleRowLayout } from './PlotAreaSingleRowLayout';
// import { PlotAreaDoubleRowLayout } from './PlotAreaDoubleRowLayout';

export interface PlotAreaCalculatorProps {
  t: (key: string) => string;
  onApply?: (sqFt: string, sqM: string, len?: string, wid?: string) => void;
  onLoad?: (sqFt: string, sqM: string, len?: string, wid?: string) => void;
  layout?: 'single-row' | 'double-row';
  propertyId?: string | number;
  initialPlotArea?: {
    length?: number | string | null;
    width?: number | string | null;
    totalPlotArea?: number | string | null;
  } | null;
  onChange?: (sqFt: string, sqM: string, len?: string, wid?: string) => void;
  isLoading?: boolean;
  buttonText?: string;
  selectedFloorType?: 'Construction' | 'OpenPlot';
  onChangeFloorType?: (type: 'Construction' | 'OpenPlot') => void;
  openPlotCategories?: OpenPlotCategoryItem[];
  selectedOpenPlotCategory?: OpenPlotCategoryItem | null;
  onChangeOpenPlotCategory?: (category: OpenPlotCategoryItem | null) => void;
  menuPlacement?: 'top' | 'bottom';
  handleOpenDropdown?: (key: 'loadFloor' | 'loadSubFloor' | 'loadConstruction' | 'loadUsage' | 'loadSubType' | 'loadOpenPlotCategory') => void;
  isPlotCategory?: boolean;
  propertyTypeId?: string | number;
}

export const PlotAreaCalculator: React.FC<PlotAreaCalculatorProps> = (props) => {
  const { layout = 'single-row' } = props;
  const calcState = usePlotAreaCalculator(props);

  if (layout === 'single-row') {
    return <PlotAreaSingleRowLayout {...props} {...calcState} />;
  }

  // return <PlotAreaDoubleRowLayout {...props} {...calcState} t={t} />;
};
