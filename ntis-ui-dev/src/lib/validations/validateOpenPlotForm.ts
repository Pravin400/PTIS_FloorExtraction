import { OpenPlotCategoryItem } from '@/lib/utils/floorSubmission/openplot-category';

export interface OpenPlotValidationResult {
  isValid: boolean;
  errorMessage?: string;
  errorKey?: string;
  plotLength: number;
  plotWidth: number;
  areaSqMeter: number;
}

/**
 * Centralized validation helper for Open Plot dimensions and category selection.
 */
export function validateOpenPlotForm(
  selectedCategory: OpenPlotCategoryItem | null | undefined,
  lenStr?: string,
  widStr?: string
): OpenPlotValidationResult {
  if (!selectedCategory?.id) {
    return {
      isValid: false,
      errorKey: 'floor.errors.selectOpenPlotCategory',
      errorMessage: 'Please select an Open Plot Category.',
      plotLength: 0,
      plotWidth: 0,
      areaSqMeter: 0,
    };
  }

  const plotLength = parseFloat(lenStr || '0');
  const plotWidth = parseFloat(widStr || '0');

  if (isNaN(plotLength) || plotLength <= 0 || isNaN(plotWidth) || plotWidth <= 0) {
    return {
      isValid: false,
      errorKey: 'floor.errors.invalidDimensions',
      errorMessage: 'Length and Width must be greater than 0.',
      plotLength: 0,
      plotWidth: 0,
      areaSqMeter: 0,
    };
  }

  const areaSqMeter = plotLength * plotWidth;

  return {
    isValid: true,
    plotLength,
    plotWidth,
    areaSqMeter,
  };
}
