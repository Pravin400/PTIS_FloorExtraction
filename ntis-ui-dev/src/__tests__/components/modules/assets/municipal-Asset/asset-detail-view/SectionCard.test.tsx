
import { render, screen } from '@testing-library/react';
import { SectionCard } from '@/components/modules/assets/municipal-Asset/asset-detail-view/SectionCard';

describe('SectionCard', () => {
  it('renders title and children correctly', () => {
    render(
      <SectionCard title="Test Section">
        <div data-testid="child-content">Child Content</div>
      </SectionCard>
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders correctly', () => {
    render(
      <SectionCard title="Test Section">
        <div>Content</div>
      </SectionCard>
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
  });
});





