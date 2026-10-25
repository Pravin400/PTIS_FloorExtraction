import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import InternalSurveyPage from '@/components/modules/property-tax/automation-dashboard/InternalSurvey/InternalSurveyPage';
import type { InternalSurveyGridItems } from '@/types/automation-dashboard/internal-surveygrid/internal-surveygrid.type';

const pushMock = vi.fn();
let searchParamsState = new URLSearchParams('workflowStageId=9');

vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParamsState,
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/',
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/common/SearchInput', () => ({
  SearchInput: ({ placeholder }: { placeholder?: string }) => <input aria-label="search" placeholder={placeholder} readOnly />,
}));

vi.mock('@/components/common', () => ({
  SearchButton: ({ label }: { label: string }) => <button>{label}</button>,
  ExportButton: ({ label }: { label: string }) => <button>{label}</button>,
}));

describe('InternalSurveyPage', () => {
  const serverData: InternalSurveyGridItems = {
    divisionData: [
      {
        divisionId: 13,
        zoneNo: '13',
        divisionName: 'Central',
        geoSequencingProperties: { structure: 101, unit: 102 },
        surveyProperties: { structure: 103, unit: 104 },
        propertyType: {
          residential: 105,
          nonResidential: 106,
          mixed: 107,
          publicUtility: 108,
          underConstruction: 109,
        },
        assessedProperties: { statusId: 1, structure: 110, units: 111 },
        unassessedProperties: { statusId: 2, structure: 112, units: 113 },
        newlyAssessedFound: { structure: 114, unit: 115 },
        assessmentInprocess: { structure: 116, unit: 117 },
        photoCount: 118,
      },
    ],
    totalRow: {
      divisionId: null,
      zoneNo: 'Total',
      divisionName: 'Total',
      geoSequencingProperties: { structure: 201, unit: 202 },
      surveyProperties: { structure: 203, unit: 204 },
      propertyType: {
        residential: 205,
        nonResidential: 206,
        mixed: 207,
        publicUtility: 208,
        underConstruction: 209,
      },
      assessedProperties: { statusId: 1, structure: 210, units: 211 },
      unassessedProperties: { statusId: 2, structure: 212, units: 213 },
      newlyAssessedFound: { structure: 214, unit: 215 },
      assessmentInprocess: { structure: 216, unit: 217 },
      photoCount: 218,
    },
  };

  beforeEach(() => {
    pushMock.mockReset();
    searchParamsState = new URLSearchParams('workflowStageId=9');
  });

  it('renders correctly with division data and total row', () => {
    render(<InternalSurveyPage serverData={serverData} />);

    expect(screen.getByText('13 - Central')).toBeInTheDocument();
    expect(screen.getByText('internalSurvey.total')).toBeInTheDocument();
  });

  it('navigates to ward-wise summary when clicking a division cell', () => {
    render(<InternalSurveyPage serverData={serverData} />);

    const divisionCell = screen.getByText('13 - Central');
    fireEvent.click(divisionCell);

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith(
      '/en/property-tax/automation-dashboard/internal-survey/ward-wise-summary/13?returnUrl=%2Fen%2Fproperty-tax%2Fautomation-dashboard%2Finternal-survey%3FworkflowStageId%3D9&workflowStageId=9&zoneNo=13'
    );
  });

  it('navigates to property details when clicking a property cell', () => {
    render(<InternalSurveyPage serverData={serverData} />);

    // Click on the geoStruct cell value '101'
    const propCell = screen.getByText('101');
    fireEvent.click(propCell);

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith(
      '/en/property-tax/automation-dashboard/property-details-dashboard/13?stage=internalSurvey&source=division&column=geoStruct&returnUrl=%2Fen%2Fproperty-tax%2Fautomation-dashboard%2Finternal-survey%3FworkflowStageId%3D9&workflowStageId=1&zoneNo=13&Structure=true&Unit=false'
    );
  });

  it('does not navigate when clicking a cell in the total row', () => {
    render(<InternalSurveyPage serverData={serverData} />);

    // Total row's geoStruct has value '201'
    const totalPropCell = screen.getByText('201');
    fireEvent.click(totalPropCell);
    expect(pushMock).not.toHaveBeenCalled();
  });
});
