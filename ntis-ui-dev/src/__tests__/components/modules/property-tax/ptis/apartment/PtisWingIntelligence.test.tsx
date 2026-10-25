import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PtisWingIntelligence } from '@/components/modules/property-tax/ptis/apartment/wing-intelligence/PtisWingIntelligence';

describe('PtisWingIntelligence', () => {
  it('should render wing intelligence title and grade legend', () => {
    render(<PtisWingIntelligence />);
    expect(screen.getByText('WING INTELLIGENCE')).toBeInTheDocument();
    expect(screen.getByText('(Click any wing to load comparison)')).toBeInTheDocument();
    expect(screen.getByText('A+ :')).toBeInTheDocument();
  });

  it('should render all wing cards and add wing button', () => {
    render(<PtisWingIntelligence />);
    expect(screen.getByText('A Wing')).toBeInTheDocument();
    expect(screen.getByText('B Wing')).toBeInTheDocument();
    expect(screen.getByText('C Wing')).toBeInTheDocument();
    expect(screen.getByText('D Wing')).toBeInTheDocument();
    expect(screen.getByText('ADD WING')).toBeInTheDocument();
  });

  it('should handle wing selection on click', () => {
    const handleSelectWing = vi.fn();
    render(<PtisWingIntelligence onSelectWing={handleSelectWing} />);

    const bWingCard = screen.getByText('B Wing');
    fireEvent.click(bWingCard);
    expect(handleSelectWing).toHaveBeenCalledWith('wing-b');
  });
});
