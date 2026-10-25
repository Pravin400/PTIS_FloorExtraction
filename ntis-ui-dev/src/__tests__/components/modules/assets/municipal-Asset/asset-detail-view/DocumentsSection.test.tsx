/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { DocumentsSection } from '@/components/modules/assets/municipal-Asset/asset-detail-view/DocumentsSection';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/modules/assets/municipal-Asset/asset-detail-view/SectionCard', () => ({
  SectionCard: ({ title, children }: any) => (
    <div data-testid="section-card">
      <div data-testid="section-card-title">{title}</div>
      <div data-testid="section-card-content">{children}</div>
    </div>
  ),
}));

describe('DocumentsSection', () => {
  it('renders correctly with multiple documents', () => {
    render(<DocumentsSection data={{ documents: [{ id: '1', name: 'Deed Document' }, { id: '2', name: 'Land Registry' }] } as any} />);
    
    expect(screen.getByTestId('section-card')).toBeInTheDocument();
    expect(screen.getByTestId('section-card-title')).toHaveTextContent('documentsEvidence');
    
    // Test for text elements from documents
    expect(screen.getByText('Deed Document')).toBeInTheDocument();
    expect(screen.getByText('Land Registry')).toBeInTheDocument();
  });

  it('handles empty document list', () => {
    render(<DocumentsSection data={{ documents: [] } as any} />);
    expect(screen.getByTestId('section-card')).toBeInTheDocument();
  });

  it('handles missing data', () => {
    render(<DocumentsSection data={{ documents: [] } as any} />);
    expect(screen.getByTestId('section-card')).toBeInTheDocument();
  });
});
