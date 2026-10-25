import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChangeDetectionCompare } from '@/components/modules/property-tax/ptis/media/ChangeDetectionCompare';
import React from 'react';

// Mock next-intl to avoid translation errors during testing
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'media.backToGrid': 'Back to Grid',
      'media.play': 'Play',
      'media.pause': 'Pause',
      'media.speed': 'Speed:',
      'media.speedSlow': '0.5x (Slow)',
      'media.speedNormal': '1x (Normal)',
      'media.speedMedium': '1.5x (Medium)',
      'media.speedFast': '2x (Fast)',
      'media.googleMap': 'View on Google Map',
      'media.changeDetection': 'Change Detection',
    };
    return translations[key] || key;
  },
  useLocale: () => 'en',
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: React.ComponentProps<'img'> & { fill?: boolean }) => {
    const { fill: _f, ...rest } = props;
    const ImgTag = 'img';
    return <ImgTag {...rest} />;
  },
}));

// Mock next/dynamic
vi.mock('next/dynamic', () => ({
  default: () => {
    const DynamicComponent = () => <div data-testid="mock-dynamic-component" />;
    return DynamicComponent;
  },
}));

const mockActiveCategory = {
  photoTypeId: 9999,
  photoTypeCode: 'CHANGE_DETECTION',
  photoTypeName: 'Change Detection',
  images: [
    {
      src: '',
      fullSrc: '',
      alt: 'Before (Old)',
      title: 'Before (Old)',
      photoTypeId: 9999,
      photoTypeCode: 'CHANGE_DETECTION',
      propertyPhotoId: 9998,
      hasPhoto: false,
      displayOrder: 1,
    },
    {
      src: '',
      fullSrc: '',
      alt: 'After (New)',
      title: 'After (New)',
      photoTypeId: 9999,
      photoTypeCode: 'CHANGE_DETECTION',
      propertyPhotoId: 9999,
      hasPhoto: false,
      displayOrder: 2,
    }
  ],
};

describe('ChangeDetectionCompare', () => {
  it('renders correctly with default props', () => {
    const handleBackToGrid = vi.fn();
    const handleImagesChange = vi.fn();

    render(
      <ChangeDetectionCompare
        activeCategory={mockActiveCategory}
        onBackToGrid={handleBackToGrid}
        onImagesChange={handleImagesChange}
        initialLatitude={19.076}
        initialLongitude={72.877}
      />
    );

    // Check for playback controls
    expect(screen.getByText('Play')).toBeInTheDocument();
    expect(screen.getByText('Speed:')).toBeInTheDocument();
  });
});
