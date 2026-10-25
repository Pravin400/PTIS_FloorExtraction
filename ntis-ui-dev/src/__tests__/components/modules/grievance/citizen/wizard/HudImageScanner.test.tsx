import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HudImageScanner } from '@/components/modules/grievance/citizen/wizard/HudImageScanner';

describe('HudImageScanner Component', () => {
  it('renders scanner assembly with accessible role and label when isScanning is true', () => {
    render(<HudImageScanner label="AI Scanning Evidence" isScanning={true} />);
    const scanner = screen.getByRole('status');
    expect(scanner).toBeInTheDocument();
    expect(scanner).toHaveAttribute('aria-label', 'AI Scanning Evidence');
    expect(screen.getByText('AI Scanning Evidence')).toBeInTheDocument();
  });

  it('does not render when isScanning is false', () => {
    const { container } = render(<HudImageScanner label="AI Scanning Evidence" isScanning={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly without label text and maintains accessible live region', () => {
    render(<HudImageScanner isScanning={true} />);
    const scanner = screen.getByRole('status');
    expect(scanner).toBeInTheDocument();
    expect(scanner).toHaveAttribute('aria-live', 'polite');
  });
});
