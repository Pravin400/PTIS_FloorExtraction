import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { getColumns } from '@/components/modules/property-tax/taxZoningmasterNew/TaxZoningColumns';
import type { TaxZoningRange } from '@/types/taxZoningRange.types';

const t = (key: string) => key;

const baseRow: TaxZoningRange = {
  id: 1,
  wardId: 1,
  wardNo: 'W1',
  taxZoneId: 1,
  taxZoneNo: 'TZ1',
  fromPropertyNo: '10',
  toPropertyNo: '20',
  assignEntireWard: false,
  zoneDescription: 'Some description',
  isActive: true,
  createdDate: null,
  updatedDate: '2024-01-15T10:30:00Z',
  minPropertyNo: '1',
  maxPropertyNo: '999',
  totalProperties: 42,
};

describe('getColumns', () => {
  it('returns 8 columns with correct labels', () => {
    const onEdit = vi.fn();
    const columns = getColumns(onEdit, t, 'en-IN');
    expect(columns).toHaveLength(8);
    expect(columns.map((c) => c.label)).toEqual([
      'columns.srNo',
      'wardNo',
      'columns.propertyRange',
      'columns.totalProperties',
      'zoneDescription',
      'taxZone',
      'columns.lastUpdated',
      'columns.actions',
    ]);
  });

  it('totalProperties column renders the server-computed count', () => {
    const columns = getColumns(vi.fn(), t, 'en-IN');
    const totalPropertiesCol = columns.find((c) => c.key === 'totalProperties')!;
    const node = totalPropertiesCol.render!(42, baseRow as unknown as TaxZoningRange & Record<string, unknown>, 0);
    render(node as ReactElement);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('srNo column render returns idx + 1', () => {
    const columns = getColumns(vi.fn(), t, 'en-IN');
    const srNoCol = columns.find((c) => c.key === 'srNo')!;
    expect(srNoCol.render!(undefined, baseRow as unknown as TaxZoningRange & Record<string, unknown>, 0)).toBe(1);
    expect(srNoCol.render!(undefined, baseRow as unknown as TaxZoningRange & Record<string, unknown>, 4)).toBe(5);
  });

  it('propertyRange column uses from/to when not assignEntireWard', () => {
    const columns = getColumns(vi.fn(), t, 'en-IN');
    const rangeCol = columns.find((c) => c.key === 'fromPropertyNo')!;
    const node = rangeCol.render!(undefined, baseRow as unknown as TaxZoningRange & Record<string, unknown>, 0);
    render(node as ReactElement);
    expect(screen.getByText('10 – 20')).toBeInTheDocument();
  });

  it('propertyRange column uses min/max when assignEntireWard is true', () => {
    const columns = getColumns(vi.fn(), t, 'en-IN');
    const rangeCol = columns.find((c) => c.key === 'fromPropertyNo')!;
    const wholeWardRow = { ...baseRow, assignEntireWard: true };
    const node = rangeCol.render!(undefined, wholeWardRow as unknown as TaxZoningRange & Record<string, unknown>, 0);
    render(node as ReactElement);
    expect(screen.getByText('1 – 999')).toBeInTheDocument();
  });

  it('propertyRange column falls back to "-" for null values', () => {
    const columns = getColumns(vi.fn(), t, 'en-IN');
    const rangeCol = columns.find((c) => c.key === 'fromPropertyNo')!;
    const nullRow = { ...baseRow, fromPropertyNo: null, toPropertyNo: null };
    const node = rangeCol.render!(undefined, nullRow as unknown as TaxZoningRange & Record<string, unknown>, 0);
    render(node as ReactElement);
    expect(screen.getByText('- – -')).toBeInTheDocument();
  });

  it('propertyRange column falls back to "-" for null min/max when assignEntireWard', () => {
    const columns = getColumns(vi.fn(), t, 'en-IN');
    const rangeCol = columns.find((c) => c.key === 'fromPropertyNo')!;
    const nullRow = { ...baseRow, assignEntireWard: true, minPropertyNo: null, maxPropertyNo: null };
    const node = rangeCol.render!(undefined, nullRow as unknown as TaxZoningRange & Record<string, unknown>, 0);
    render(node as ReactElement);
    expect(screen.getByText('- – -')).toBeInTheDocument();
  });

  it('lastUpdated column formats a date string using dateLocale', () => {
    const columns = getColumns(vi.fn(), t, 'en-IN');
    const dateCol = columns.find((c) => c.key === 'updatedDate')!;
    const result = dateCol.render!('2024-01-15T10:30:00Z', baseRow as unknown as TaxZoningRange & Record<string, unknown>, 0);
    const expected = new Date('2024-01-15T10:30:00Z').toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    expect(result).toBe(expected);
  });

  it('lastUpdated column returns "-" for falsy value', () => {
    const columns = getColumns(vi.fn(), t, 'en-IN');
    const dateCol = columns.find((c) => c.key === 'updatedDate')!;
    expect(dateCol.render!(null, baseRow as unknown as TaxZoningRange & Record<string, unknown>, 0)).toBe('-');
  });

  it('actions column render calls onEdit with row.id when clicked', () => {
    const onEdit = vi.fn();
    const columns = getColumns(onEdit, t, 'en-IN');
    const actionsCol = columns.find((c) => c.key === 'actions')!;
    const node = actionsCol.render!(undefined, baseRow as unknown as TaxZoningRange & Record<string, unknown>, 0);
    render(node as ReactElement);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onEdit).toHaveBeenCalledWith(1);
  });
});
