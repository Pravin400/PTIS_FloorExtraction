import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import FloorSubmissionPage from '@/app/[locale]/property-tax/ptis/appartmentQC/appartmentQCDrawer/FloorSubmission/page';

const getFloorQCDetailsAction = vi.fn();
const fetchFloorsAction = vi.fn();
const fetchConstructionTypesAction = vi.fn();
const fetchUseTypesAction = vi.fn();
const fetchSubTypesAction = vi.fn();

vi.mock('@/app/[locale]/property-tax/ptis/appartmentQC/appartmentQCDrawer/FloorSubmission/action', () => ({
  getFloorQCDetailsAction: (...args: unknown[]) => getFloorQCDetailsAction(...args),
  fetchFloorsAction: (...args: unknown[]) => fetchFloorsAction(...args),
  fetchConstructionTypesAction: (...args: unknown[]) => fetchConstructionTypesAction(...args),
  fetchUseTypesAction: (...args: unknown[]) => fetchUseTypesAction(...args),
  fetchSubTypesAction: (...args: unknown[]) => fetchSubTypesAction(...args),
}));

vi.mock('@/components/modules/property-tax/ptis/appartmentQC/appartmentQCDrawer/FloorSubmissionDrawer/FloorSubmissionScreen', () => ({
  FloorSubmissionScreen: ({
    initialSubTab,
    initialFloorData,
    floorOptions,
    constructionTypeOptions,
    useOptions,
    subUseTypeOptions,
    propertyId,
  }: {
    initialSubTab: string;
    initialFloorData: unknown[];
    floorOptions: unknown[];
    constructionTypeOptions: unknown[];
    useOptions: unknown[];
    subUseTypeOptions: unknown[];
    propertyId: string;
  }) => (
    <div data-testid="floor-submission-screen">
      {JSON.stringify({
        initialSubTab,
        floorDataLen: initialFloorData.length,
        floorsLen: floorOptions.length,
        conTypesLen: constructionTypeOptions.length,
        useTypesLen: useOptions.length,
        subTypesLen: subUseTypeOptions.length,
        propertyId,
      })}
    </div>
  ),
}));

describe('FloorSubmissionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getFloorQCDetailsAction.mockResolvedValue({ success: true, data: [{ id: 1 }] });
    fetchFloorsAction.mockResolvedValue({ success: true, data: [{ id: 1 }] });
    fetchConstructionTypesAction.mockResolvedValue({ success: true, data: [{ id: 2 }] });
    fetchUseTypesAction.mockResolvedValue({ success: true, data: [{ id: 3 }] });
    fetchSubTypesAction.mockResolvedValue({ success: true, data: [{ id: 4 }] });
  });

  it('loads data based on query flags and forwards props to screen', async () => {
    const element = await FloorSubmissionPage({
      searchParams: Promise.resolve({
        subTab: 'dual-method',
        editPropertyId: '550299',
        loadFloor: 'true',
        loadConstruction: 'true',
        loadUsage: 'true',
        loadSubType: 'true',
        typeOfUseId: '12',
      }),
    });

    render(element as React.ReactElement);

    expect(getFloorQCDetailsAction).toHaveBeenCalledWith('550299', 'dual');
    expect(fetchFloorsAction).toHaveBeenCalledTimes(1);
    expect(fetchConstructionTypesAction).toHaveBeenCalledTimes(1);
    expect(fetchUseTypesAction).toHaveBeenCalledTimes(1);
    expect(fetchSubTypesAction).toHaveBeenCalledWith(12);

    const payload = JSON.parse(screen.getByTestId('floor-submission-screen').textContent || '{}');
    expect(payload).toMatchObject({
      initialSubTab: 'dual-method',
      floorDataLen: 1,
      floorsLen: 1,
      conTypesLen: 1,
      useTypesLen: 1,
      subTypesLen: 1,
      propertyId: '550299',
    });
  });
});
