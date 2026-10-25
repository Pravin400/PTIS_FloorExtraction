import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import {
  getInternalSurveyColumns,
  getInternalSurveyHeaderRows,
  type InternalSurveyTableRow,
} from '@/components/modules/property-tax/automation-dashboard/InternalSurvey/InternalSurveyColumns';

const t = (key: string) => key;

describe('InternalSurveyColumns', () => {
  const baseRow: InternalSurveyTableRow = {
    sr: 1,
    division: '10 - Division A',
    geoStruct: 1250,
    geoUnit: 2250,
    surveyStruct: 1000,
    surveyUnit: 2000,
    propRes: 10,
    propNonRes: 20,
    propMixed: 30,
    propPublic: 40,
    propUnder: 50,
    assessStruct: 60,
    assessUnit: 70,
    unassessStruct: 80,
    unassessUnit: 90,
    newlyStruct: 100,
    newlyUnit: 110,
    inprocessStruct: 120,
    inprocessUnit: 130,
    photoCount: 140,
  };

  it('returns expected number of columns and key positions', () => {
    const columns = getInternalSurveyColumns(t);

    expect(columns).toHaveLength(20);
    expect(columns[0]?.key).toBe('sr');
    expect(columns[1]?.key).toBe('division');
    expect(columns[19]?.key).toBe('photoCount');
  });

  it('renders numeric values using en-IN locale formatting', () => {
    const columns = getInternalSurveyColumns(t);
    const geoStructColumn = columns.find((c) => c.key === 'geoStruct');

    const node = geoStructColumn?.render?.(1250, baseRow as InternalSurveyTableRow & Record<string, unknown>, 0);
    render(<>{node}</>);

    expect(screen.getByText('1,250')).toBeInTheDocument();
  });

  it('calls row click handler with division code on division cell click', () => {
    const onRowClick = vi.fn();
    const columns = getInternalSurveyColumns(t, onRowClick);
    const divisionColumn = columns.find((c) => c.key === 'division');

    const node = divisionColumn?.render?.(
      '10 - Division A',
      baseRow as InternalSurveyTableRow & Record<string, unknown>,
      0
    );
    render(<>{node}</>);

    fireEvent.click(screen.getByText('10 - Division A'));
    expect(onRowClick).toHaveBeenCalledWith('10', baseRow);
  });

  it('returns two header rows with expected grouped column counts', () => {
    const rows = getInternalSurveyHeaderRows(t);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveLength(10);
    expect(rows[1]).toHaveLength(17);
  });
});
