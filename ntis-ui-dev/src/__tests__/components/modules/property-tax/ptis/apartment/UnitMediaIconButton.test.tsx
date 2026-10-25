import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnitMediaIconButton } from '@/components/modules/property-tax/ptis/apartment/tables/UnitMediaIconButton';

const { getDocumentBlobUrl, toastError, viewerProps } = vi.hoisted(() => ({
  getDocumentBlobUrl: vi.fn(),
  toastError: vi.fn(),
  viewerProps: { current: null as null | Record<string, unknown> },
}));

vi.mock('next-intl', () => ({ useLocale: () => 'en' }));
vi.mock('sonner', () => ({ toast: { error: toastError } }));
vi.mock('@/lib/utils/document-client-utils', () => ({ getDocumentBlobUrl }));
vi.mock('@/components/common', () => ({
  DocumentViewerModal: (props: Record<string, unknown>) => {
    viewerProps.current = props;
    return (
      <div role="dialog" aria-label="document viewer">
        <button type="button" onClick={props.onClose as () => void}>close viewer</button>
      </div>
    );
  },
}));

describe('UnitMediaIconButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    viewerProps.current = null;
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  });

  it('shows only a dash when the unit has no photo or plan', () => {
    render(<UnitMediaIconButton documentGuid={null} kind="photo" title="Unit 1 - Property Photo" tooltip="View photo" />);

    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows a small icon button and opens the document in the common document viewer', async () => {
    getDocumentBlobUrl.mockResolvedValue({ url: 'blob:plan', contentType: 'image/jpeg' });
    render(<UnitMediaIconButton documentGuid="guid-1" kind="plan" title="Unit 1 - Floor Plan" tooltip="View plan" />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'View plan' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(getDocumentBlobUrl).toHaveBeenCalledWith('guid-1', 'en');
    expect(viewerProps.current).toMatchObject({
      isOpen: true,
      fileUrl: 'blob:plan',
      fileName: 'Unit 1 - Floor Plan.jpg',
      label: 'Unit 1 - Floor Plan',
      contentType: 'image/jpeg',
    });
  });

  it('releases the blob url and closes the viewer', async () => {
    getDocumentBlobUrl.mockResolvedValue({ url: 'blob:photo', contentType: 'image/png' });
    render(<UnitMediaIconButton documentGuid="guid-2" kind="photo" title="Unit 2 - Property Photo" tooltip="View photo" />);

    fireEvent.click(screen.getByRole('button', { name: 'View photo' }));
    fireEvent.click(await screen.findByRole('button', { name: 'close viewer' }));

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:photo');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('tells the user when the document cannot be loaded', async () => {
    getDocumentBlobUrl.mockRejectedValue(new Error('Failed to view document'));
    render(<UnitMediaIconButton documentGuid="guid-3" kind="photo" title="t" tooltip="View photo" />);

    fireEvent.click(screen.getByRole('button', { name: 'View photo' }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Failed to view document'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not trigger the row click (stops propagation)', () => {
    getDocumentBlobUrl.mockResolvedValue({ url: 'blob:x', contentType: 'image/jpeg' });
    const onRowClick = vi.fn();
    render(
      <div onClick={onRowClick}>
        <UnitMediaIconButton documentGuid="guid-4" kind="photo" title="t" tooltip="View photo" />
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'View photo' }));

    expect(onRowClick).not.toHaveBeenCalled();
  });
});
