import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import ServiceCards from '@/components/modules/home/ServiceCards';
import { Service } from '@/types/home/home.types';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'services.unableToLoad': 'Unable to load services',
      'services.tryAgain': 'Try Again',
      'services.noDepartmentsTitle': 'No departments assigned',
      'services.noDepartmentsMessage': "You don't have access to any departments yet. Please contact your administrator.",
    };
    return translations[key] || key;
  },
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockServices: Service[] = [
  {
    id: 1,
    link: '/property-tax',
    icon: 'Property Tax',
    title: 'Property Tax',
    subtext: 'Pay your property tax online',
    stats: [{ label: 'Due', value: '₹5000' }],
  },
  {
    id: 2,
    link: '/water-tax',
    icon: 'Water Tax',
    title: 'Water Tax',
    subtext: 'Pay your water tax online',
    stats: [{ label: 'Due', value: '₹1000' }],
  },
  {
    id: 3,
    link: '/garbage-collection',
    icon: 'Garbage Collection',
    title: 'Garbage Collection',
    subtext: 'Schedule garbage collection',
  },
];

describe('ServiceCards Component', () => {
  it('renders service cards for provided services', () => {
    render(<ServiceCards services={mockServices} />);
    expect(screen.getByText('Property Tax')).toBeInTheDocument();
    expect(screen.getByText('Water Tax')).toBeInTheDocument();
    expect(screen.getByText('Garbage Collection')).toBeInTheDocument();
  });

  it('renders empty state when services array is empty', () => {
    render(<ServiceCards services={[]} />);
    expect(screen.getByText('No departments assigned')).toBeInTheDocument();
  });

  it('renders empty state when services is undefined', () => {
    render(<ServiceCards />);
    expect(screen.getByText('No departments assigned')).toBeInTheDocument();
  });

  it('renders correct links for each service', () => {
    render(<ServiceCards services={mockServices} />);
    const propertyTaxLink = screen.getByText('Property Tax').closest('a');
    const waterTaxLink = screen.getByText('Water Tax').closest('a');
    expect(propertyTaxLink).toHaveAttribute('href', '/property-tax');
    expect(waterTaxLink).toHaveAttribute('href', '/water-tax');
  });

  it('renders subtext for each service', () => {
    render(<ServiceCards services={mockServices} />);
    expect(screen.getByText('Pay your property tax online')).toBeInTheDocument();
    expect(screen.getByText('Pay your water tax online')).toBeInTheDocument();
  });

  it('renders stats badges when provided', () => {
    render(<ServiceCards services={mockServices} />);
    expect(screen.getByText('Due: ₹5000')).toBeInTheDocument();
    expect(screen.getByText('Due: ₹1000')).toBeInTheDocument();
  });

  it('renders correct number of service cards', () => {
    render(<ServiceCards services={mockServices} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
  });

  it('applies responsive grid classes', () => {
    const { container } = render(<ServiceCards services={mockServices} />);
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass(
      'grid-cols-1',
      'sm:grid-cols-2',
      'md:grid-cols-2',
      'lg:grid-cols-3',
      'xl:grid-cols-3'
    );
  });

  it('renders section with correct styling', () => {
    const { container } = render(<ServiceCards services={mockServices} />);
    const section = container.querySelector('section');
    expect(section).toHaveClass('w-full', 'min-h-[300px]');
  });

  it('renders section with correct accessibility attributes', () => {
    const { container } = render(<ServiceCards services={mockServices} />);
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-label', 'Available Services');
  });

  it('renders cards with left border styling', () => {
    const { container } = render(<ServiceCards services={mockServices} />);
    const cards = container.querySelectorAll('.border-l-\\[6px\\]');
    expect(cards).toHaveLength(3);
  });
});

describe('ServiceCards Error Handling', () => {
  it('displays clean empty state when error prop is provided', () => {
    render(<ServiceCards error="Failed to load services" />);
    expect(screen.getByText('No departments assigned')).toBeInTheDocument();
  });

  it('renders section with correct accessibility label on error', () => {
    const { container } = render(<ServiceCards error="Error" />);
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-label', 'No Services');
  });

  it('shows empty state when error is passed even if services are provided', () => {
    render(<ServiceCards services={mockServices} error="API Error" />);
    expect(screen.getByText('No departments assigned')).toBeInTheDocument();
  });
});

describe('ServiceCards Icon Mapping', () => {
  const iconTestCases = [
    { icon: 'Property Tax', title: 'Property Tax' },
    { icon: 'Water Tax', title: 'Water Tax' },
    { icon: 'Trade License', title: 'Trade License' },
    { icon: 'Birth & Death', title: 'Birth & Death' },
    { icon: 'Garbage Collection', title: 'Garbage Collection' },
    { icon: 'Building Permission', title: 'Building Permission' },
    { icon: 'Grievance', title: 'Grievance' },
    { icon: 'RTS', title: 'RTS' },
    { icon: 'Asset Management', title: 'Asset Management' },
    { icon: 'Unknown Department', title: 'Unknown Department' },
  ];

  iconTestCases.forEach(({ icon, title }) => {
    it(`renders icon for ${icon}`, () => {
      const service: Service[] = [
        {
          id: 1,
          link: '/test',
          icon,
          title,
          subtext: 'Test subtext',
        },
      ];
      render(<ServiceCards services={service} />);
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });
});
