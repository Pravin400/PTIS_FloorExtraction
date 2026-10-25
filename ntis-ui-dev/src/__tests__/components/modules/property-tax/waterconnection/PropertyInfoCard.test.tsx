/**
 * Tests for PropertyInfoCard component
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PropertyInfoCard } from '@/components/modules/property-tax/waterconnection/PropertyInfoCard';
import { mockPropertyInfo } from '@/__tests__/utils/waterConnectionTestUtils';

describe('PropertyInfoCard', () => {
  const defaultProps = {
    property: mockPropertyInfo,
    labels: {
      owner: 'Owner',
      contact: 'Contact',
      email: 'Email',
      address: 'Address',
      propertyNo: 'Property No',
      zone: 'Zone',
      ward: 'Ward',
      buildingType: 'Building Type',
    },
  };

  describe('rendering', () => {
    it('should render property info card', () => {
      render(<PropertyInfoCard {...defaultProps} />);

      expect(screen.getByText('Owner')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
    });

    it('should display owner name', () => {
      render(<PropertyInfoCard {...defaultProps} />);

      expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
    });

    it('should display customer ID', () => {
      render(<PropertyInfoCard {...defaultProps} />);

      expect(screen.getByText('CID-123')).toBeInTheDocument();
    });

    it('should display customer type badge', () => {
      render(<PropertyInfoCard {...defaultProps} />);

      expect(screen.getByText('Individual')).toBeInTheDocument();
    });

    it('should display contact number', () => {
      render(<PropertyInfoCard {...defaultProps} />);

      expect(screen.getByText('+91 90743 42210')).toBeInTheDocument();
    });

    it('should display email address', () => {
      render(<PropertyInfoCard {...defaultProps} />);

      expect(screen.getByText('rajesh.kumar@email.com')).toBeInTheDocument();
    });

    it('should display full address', () => {
      render(<PropertyInfoCard {...defaultProps} />);

      expect(screen.getByText('123 MG Road, Koramangala, Bangalore - 560034')).toBeInTheDocument();
    });

    it('should display property number', () => {
      render(<PropertyInfoCard {...defaultProps} />);

      expect(screen.getByText('FR09-2024-001')).toBeInTheDocument();
    });

    it('should display zone', () => {
      render(<PropertyInfoCard {...defaultProps} />);

      expect(screen.getByText('Zone-3')).toBeInTheDocument();
    });

    it('should display ward', () => {
      render(<PropertyInfoCard {...defaultProps} />);

      expect(screen.getByText('Ward-21')).toBeInTheDocument();
    });

    it('should display building type', () => {
      render(<PropertyInfoCard {...defaultProps} />);

      expect(screen.getByText('Residential')).toBeInTheDocument();
    });
  });

  describe('organization customer type', () => {
    it('should display Organization badge for organization customers', () => {
      const props = {
        ...defaultProps,
        property: {
          ...mockPropertyInfo,
          customerType: 'Organization' as const,
          ownerName: 'ABC Corporation',
        },
      };

      render(<PropertyInfoCard {...props} />);

      expect(screen.getByText('ABC Corporation')).toBeInTheDocument();
      expect(screen.getByText('Organization')).toBeInTheDocument();
    });
  });

  describe('custom labels', () => {
    it('should use provided custom labels', () => {
      const props = {
        ...defaultProps,
        labels: {
          owner: 'मालिक',
          contact: 'संपर्क',
          email: 'ईमेल',
          address: 'पता',
          propertyNo: 'संपत्ति नंबर',
          zone: 'क्षेत्र',
          ward: 'वार्ड',
          buildingType: 'भवन प्रकार',
        },
      };

      render(<PropertyInfoCard {...props} />);

      expect(screen.getByText('मालिक')).toBeInTheDocument();
      expect(screen.getByText('संपर्क')).toBeInTheDocument();
      expect(screen.getByText('ईमेल')).toBeInTheDocument();
      expect(screen.getByText('पता')).toBeInTheDocument();
      expect(screen.getByText('संपत्ति नंबर')).toBeInTheDocument();
      expect(screen.getByText('क्षेत्र')).toBeInTheDocument();
      expect(screen.getByText('वार्ड')).toBeInTheDocument();
      expect(screen.getByText('भवन प्रकार')).toBeInTheDocument();
    });
  });

  describe('different property data', () => {
    it('should display different property information', () => {
      const props = {
        ...defaultProps,
        property: {
          id: 456,
          propertyNo: 'PT-2024-999',
          ownerName: 'Suresh Sharma',
          customerId: 'CID-456',
          customerType: 'Individual' as const,
          contact: '+91 98765 43210',
          email: 'suresh.sharma@test.com',
          address: '456 Park Street, Jayanagar',
          zone: 'Zone-5',
          ward: 'Ward-15',
          buildingType: 'Commercial',
        },
      };

      render(<PropertyInfoCard {...props} />);

      expect(screen.getByText('PT-2024-999')).toBeInTheDocument();
      expect(screen.getByText('Suresh Sharma')).toBeInTheDocument();
      expect(screen.getByText('CID-456')).toBeInTheDocument();
      expect(screen.getByText('+91 98765 43210')).toBeInTheDocument();
      expect(screen.getByText('suresh.sharma@test.com')).toBeInTheDocument();
      expect(screen.getByText('456 Park Street, Jayanagar')).toBeInTheDocument();
      expect(screen.getByText('Zone-5')).toBeInTheDocument();
      expect(screen.getByText('Ward-15')).toBeInTheDocument();
      expect(screen.getByText('Commercial')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have card container with proper styling', () => {
      const { container } = render(<PropertyInfoCard {...defaultProps} />);

      const card = container.firstElementChild;
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-xl');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('shadow-sm');
    });

    it('should have grid layout for info fields', () => {
      const { container } = render(<PropertyInfoCard {...defaultProps} />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('icons', () => {
    it('should render icons for each info section', () => {
      const { container } = render(<PropertyInfoCard {...defaultProps} />);

      // Check that SVG icons are rendered
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });
});
