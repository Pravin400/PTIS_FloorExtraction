/**
 * Tests for PropertyStatsCards component
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PropertyStatsCards } from '@/components/modules/property-tax/waterconnection/PropertyStatsCards';

describe('PropertyStatsCards', () => {
  const defaultProps = {
    stats: {
      totalConnections: 5,
      activeConnections: 3,
      stoppedConnections: 2,
      yearlyRevenue: 15000,
    },
    labels: {
      totalConnections: 'Total Connections',
      activeConnections: 'Active Connections',
      stoppedConnections: 'Stopped Connections',
      yearlyRevenue: 'Yearly Revenue',
    },
  };

  describe('rendering', () => {
    it('should render all four stat cards', () => {
      render(<PropertyStatsCards {...defaultProps} />);

      expect(screen.getByText('Total Connections')).toBeInTheDocument();
      expect(screen.getByText('Active Connections')).toBeInTheDocument();
      expect(screen.getByText('Stopped Connections')).toBeInTheDocument();
      expect(screen.getByText('Yearly Revenue')).toBeInTheDocument();
    });

    it('should display total connections value', () => {
      render(<PropertyStatsCards {...defaultProps} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should display active connections value', () => {
      render(<PropertyStatsCards {...defaultProps} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display stopped connections value', () => {
      render(<PropertyStatsCards {...defaultProps} />);

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should display yearly revenue value', () => {
      render(<PropertyStatsCards {...defaultProps} />);

      // Revenue is formatted with ₹ and Indian locale
      expect(screen.getByText(/₹15,000/)).toBeInTheDocument();
    });
  });

  describe('zero values', () => {
    it('should display zero for all stats when no connections', () => {
      const props = {
        ...defaultProps,
        stats: {
          totalConnections: 0,
          activeConnections: 0,
          stoppedConnections: 0,
          yearlyRevenue: 0,
        },
      };

      render(<PropertyStatsCards {...props} />);

      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBe(3); // total, active, stopped
      expect(screen.getByText(/₹0/)).toBeInTheDocument();
    });
  });

  describe('large values', () => {
    it('should display large revenue values correctly', () => {
      const props = {
        ...defaultProps,
        stats: {
          ...defaultProps.stats,
          yearlyRevenue: 1500000,
        },
      };

      render(<PropertyStatsCards {...props} />);

      // Should format with Indian locale - 15,00,000
      expect(screen.getByText(/₹15,00,000/)).toBeInTheDocument();
    });

    it('should display large connection counts', () => {
      const props = {
        ...defaultProps,
        stats: {
          totalConnections: 100,
          activeConnections: 75,
          stoppedConnections: 25,
          yearlyRevenue: 50000,
        },
      };

      render(<PropertyStatsCards {...props} />);

      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });

  describe('custom labels', () => {
    it('should use provided custom labels', () => {
      const props = {
        ...defaultProps,
        labels: {
          totalConnections: 'कुल कनेक्शन',
          activeConnections: 'सक्रिय कनेक्शन',
          stoppedConnections: 'बंद कनेक्शन',
          yearlyRevenue: 'वार्षिक आय',
        },
      };

      render(<PropertyStatsCards {...props} />);

      expect(screen.getByText('कुल कनेक्शन')).toBeInTheDocument();
      expect(screen.getByText('सक्रिय कनेक्शन')).toBeInTheDocument();
      expect(screen.getByText('बंद कनेक्शन')).toBeInTheDocument();
      expect(screen.getByText('वार्षिक आय')).toBeInTheDocument();
    });
  });

  describe('grid layout', () => {
    it('should render stats in a grid', () => {
      const { container } = render(<PropertyStatsCards {...defaultProps} />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-4');
    });
  });
});
