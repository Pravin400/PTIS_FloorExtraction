import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { SectionBandView } from '@/components/modules/property-tax/report-designer/canvas/SectionBandView';

describe('SectionBandView Component', () => {
  const sampleSection = {
    id: 'sec_details',
    name: 'Details (तपशील)',
    height: 350,
  };

  const sampleElements = [
    {
      id: 'el_inside',
      type: 'text',
      sectionId: 'sec_details',
      x: 30,
      y: 40,
      width: 120,
      height: 25,
      text: 'Property ID: 1001',
    },
    {
      id: 'el_outside',
      type: 'text',
      sectionId: 'sec_header',
      x: 10,
      y: 10,
      width: 80,
      height: 20,
      text: 'Header',
    },
  ];

  it('renders section name and filters child elements by sectionId', () => {
    const { getByText, queryByText } = render(
      <SectionBandView
        section={sampleSection}
        elements={sampleElements}
        selectedElementIds={[]}
        isActive={false}
        onSelectSection={vi.fn()}
        onElementPointerDown={vi.fn()}
      />
    );

    expect(getByText('Details (तपशील)')).toBeTruthy();
    expect(getByText('Property ID: 1001')).toBeTruthy();
    expect(queryByText('Header')).toBeNull();
  });

  it('handles section click and activates section', () => {
    const onSelectSection = vi.fn();
    const { getByText } = render(
      <SectionBandView
        section={sampleSection}
        elements={sampleElements}
        selectedElementIds={[]}
        isActive={true}
        onSelectSection={onSelectSection}
        onElementPointerDown={vi.fn()}
      />
    );

    fireEvent.click(getByText('Details (तपशील)'));
    expect(onSelectSection).toHaveBeenCalledWith('sec_details');
  });
});
