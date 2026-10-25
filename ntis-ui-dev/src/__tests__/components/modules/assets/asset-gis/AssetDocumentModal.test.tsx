import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AssetDocumentModal } from '@/components/modules/assets/asset-gis/AssetDocumentModal';
import type { AssetDocumentItem } from '@/types/asset-gis.types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (values && values.count !== undefined) {
      return `Total Documents: ${values.count}`;
    }
    if (key === 'details.documentGroups') {
      return 'DOCUMENT GROUPS';
    }
    return key;
  },
}));

describe('AssetDocumentModal Component', () => {
  it('renders modal with asset metadata and document list when open', () => {
    const handleClose = vi.fn();
    const assetData = {
      Buil_ID: 'BLD-999',
      PropertyNo: 'PROP-12345',
      OwnerName: 'Jane Doe',
      Ward_No: '04',
      Zone_No: '01',
    };
    const docs: AssetDocumentItem[] = [
      { id: 'doc-1', fileName: 'survey.pdf', name: 'Survey Report', contentType: 'application/pdf' },
      { id: 'doc-2', fileName: 'tax.pdf', name: 'Property Tax', contentType: 'application/pdf' }
    ];

    render(
      <AssetDocumentModal
        isOpen={true}
        onClose={handleClose}
        assetData={assetData}
        documents={docs}
      />
    );

    expect(screen.getByText('BLD-999')).toBeInTheDocument();
    expect(screen.getByText(/Total Documents: 2/i)).toBeInTheDocument();
    expect(screen.getByText(/DOCUMENT GROUPS/i)).toBeInTheDocument();

    const closeBtn = screen.getByTitle('Close Modal');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders null when isOpen is false', () => {
    const { container } = render(
      <AssetDocumentModal
        isOpen={false}
        onClose={vi.fn()}
        assetData={{}}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
