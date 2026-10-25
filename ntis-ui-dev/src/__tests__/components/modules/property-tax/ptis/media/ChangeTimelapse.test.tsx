import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ChangeTimelapse } from '@/components/modules/property-tax/ptis/media/ChangeTimelapse';

// Mock next-intl translations
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'media.historicalSatellite': 'Historical Satellite',
      'media.pause': 'Pause',
      'media.play': 'Play',
      'media.speed': 'Speed:',
      'media.speedSlow': '0.5x (Slow)',
      'media.speedNormal': '1x (Normal)',
      'media.speedMedium': '1.5x (Medium)',
      'media.speedFast': '2x (Fast)',
      'media.labels': 'Labels',
      'media.googleMap': 'View on Google Map',
      'media.fetchingCatalog': 'Fetching satellite history catalog...',
      'media.interactionGuide': 'Drag to pan · Scroll to zoom · Click a year to jump',
      'media.attribution': '© Esri, Wayback, Maxar',
    };
    return translations[key] || key;
  },
}));

let shouldFail2014 = false;

// Mock next/dynamic to return our mock map component synchronously
vi.mock('next/dynamic', () => ({
  default: () => {
    interface MockMapProps {
      activeRelease?: { year: number; releaseId: number };
      onReleaseError: (releaseId: number) => void;
    }

    return function MockTimelapseMap({ activeRelease, onReleaseError }: MockMapProps) {
      // Simulate calling onReleaseError if release is 2014 and shouldFail2014 is true
      React.useEffect(() => {
        if (shouldFail2014 && activeRelease?.year === 2014) {
          onReleaseError(activeRelease.releaseId);
        }
      }, [activeRelease, onReleaseError]);

      return (
        <div data-testid="mock-timelapse-map">
          Mock Map Year: {activeRelease?.year || 'none'}
        </div>
      );
    };
  },
}));

const mockReleases = [
  { releaseId: 101, year: 2014, date: '2014-06-30' },
  { releaseId: 102, year: 2015, date: '2015-06-30' },
  { releaseId: 103, year: 2016, date: '2016-06-30' },
  { releaseId: 104, year: 2018, date: '2018-06-30' },
];

describe('ChangeTimelapse', () => {
  beforeEach(() => {
    shouldFail2014 = false;
  });

  it('renders controls, timeline track, and mock map correctly', () => {
    render(
      <ChangeTimelapse
        initialLat={19.076}
        initialLng={72.877}
        initialWaybackReleases={mockReleases}
      />
    );

    // Verify controls render
    expect(screen.getByText('Play')).toBeInTheDocument();
    expect(screen.getByText('Speed:')).toBeInTheDocument();
    expect(screen.getByText('View on Google Map')).toBeInTheDocument();

    // Verify timeline track renders years
    expect(screen.getByText('2014')).toBeInTheDocument();
    expect(screen.getByText('2015')).toBeInTheDocument();
    expect(screen.getByText('2016')).toBeInTheDocument();
    expect(screen.getByText('2018')).toBeInTheDocument();

    // Verify map container renders with 2014 release since 2014 is index 0
    expect(screen.getByTestId('mock-timelapse-map')).toHaveTextContent('Mock Map Year: 2014');
  });

  it('toggles playback states when play/pause buttons are clicked', () => {
    render(
      <ChangeTimelapse
        initialLat={19.076}
        initialLng={72.877}
        initialWaybackReleases={mockReleases}
      />
    );

    const playBtn = screen.getByText('Play');
    fireEvent.click(playBtn);

    // Button should toggle to Pause
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  it('navigates through releases using Prev and Next buttons', () => {
    render(
      <ChangeTimelapse
        initialLat={19.076}
        initialLng={72.877}
        initialWaybackReleases={mockReleases}
      />
    );

    // Initial is 2014 (index 0). Click Next to go to 2015
    const nextBtn = screen.getByLabelText('Next satellite release');
    fireEvent.click(nextBtn);

    expect(screen.getByTestId('mock-timelapse-map')).toHaveTextContent('Mock Map Year: 2015');

    // Click Prev to go back to 2014
    const prevBtn = screen.getByLabelText('Previous satellite release');
    fireEvent.click(prevBtn);

    expect(screen.getByTestId('mock-timelapse-map')).toHaveTextContent('Mock Map Year: 2014');
  });
});
