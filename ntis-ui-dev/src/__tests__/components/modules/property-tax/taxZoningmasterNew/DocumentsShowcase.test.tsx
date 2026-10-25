import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DocumentsShowcase from '@/components/modules/property-tax/taxZoningmasterNew/DocumentsShowcase';
import {
  fetchUlbDocumentsAction,
  uploadUlbDocumentAction,
  deleteUlbDocumentAction,
} from '@/app/[locale]/property-tax/taxzoningmaster/actions';
import { toast } from 'sonner';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/app/[locale]/property-tax/taxzoningmaster/actions', () => ({
  fetchUlbDocumentsAction: vi.fn(),
  uploadUlbDocumentAction: vi.fn(),
  deleteUlbDocumentAction: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockConfirm = vi.fn();
vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({ confirm: mockConfirm }),
}));

vi.mock('@/components/common/Modal', () => ({
  Modal: ({ open, children, title }: { open: boolean; children: React.ReactNode; title?: React.ReactNode }) =>
    open ? (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        {children}
      </div>
    ) : null,
}));

vi.mock('@/components/common/ActionButtons', () => ({
  UploadButton: ({ onClick }: { onClick: () => void }) => (
    <button data-testid="upload-button" onClick={onClick}>
      Upload
    </button>
  ),
  ViewButton: ({ title, onClick }: { title?: string; onClick: () => void }) => (
    <button title={title} onClick={onClick}>View</button>
  ),
  DownloadIconButton: ({ title, onClick }: { title?: string; onClick: () => void }) => (
    <button title={title} onClick={onClick}>Download</button>
  ),
  DeleteButton: ({ title, onClick }: { title?: string; onClick: () => void }) => (
    <button title={title} onClick={onClick}>Delete</button>
  ),
  CancelButton: ({ label, onClick }: { label?: string; onClick: () => void }) => (
    <button type="button" onClick={onClick}>{label}</button>
  ),
  SaveButton: ({ label, disabled, type }: { label?: string; disabled?: boolean; type?: "button" | "submit" | "reset" }) => (
    <button type={type ?? "button"} disabled={disabled}>{label}</button>
  ),
}));

const listDoc = {
  id: 1,
  documentTypeCode: 'TAX_ZONING_DOCUMENT_LIST',
  documentTypeName: 'List',
  documentBindingId: null,
  originalFileName: 'list.pdf',
  mimeType: 'application/pdf',
  fileSizeBytes: 100,
  documentGuid: 'guid-list-1',
};

const mapDoc = {
  id: 2,
  documentTypeCode: 'TAX_ZONING_DOCUMENT_MAP',
  documentTypeName: 'Map',
  documentBindingId: null,
  originalFileName: 'map.png',
  mimeType: 'image/png',
  fileSizeBytes: 200,
  documentGuid: 'guid-map-1',
};

describe('DocumentsShowcase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetchUlbDocumentsAction as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: [],
    });
  });

  it('fetches documents on mount with both type codes and buckets them by documentTypeCode', async () => {
    (fetchUlbDocumentsAction as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: [listDoc, mapDoc],
    });

    render(<DocumentsShowcase />);

    await waitFor(() => {
      expect(fetchUlbDocumentsAction).toHaveBeenCalledWith([
        'TAX_ZONING_DOCUMENT_LIST',
        'TAX_ZONING_DOCUMENT_MAP',
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText('list.pdf')).toBeInTheDocument();
      expect(screen.getByText('map.png')).toBeInTheDocument();
    });
  });

  it('renders View/Download/Delete buttons when a document has a documentGuid', async () => {
    (fetchUlbDocumentsAction as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: [listDoc],
    });

    render(<DocumentsShowcase />);

    await waitFor(() => expect(screen.getByText('list.pdf')).toBeInTheDocument());

    expect(screen.getByTitle('View')).toBeInTheDocument();
    expect(screen.getByTitle('Download')).toBeInTheDocument();
    expect(screen.getByTitle('Delete')).toBeInTheDocument();
    expect(screen.queryAllByTestId('upload-button')).toHaveLength(1); // only MAP slot has upload button
  });

  it('renders notUploaded text and UploadButton when a document is missing', async () => {
    render(<DocumentsShowcase />);

    await waitFor(() => {
      expect(screen.getAllByText('notUploaded').length).toBe(2);
    });
    expect(screen.getAllByTestId('upload-button')).toHaveLength(2);
  });

  it('uploads a file for the correct slot and shows success toast then re-fetches', async () => {
    (uploadUlbDocumentAction as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: 1,
      message: 'Uploaded successfully',
    });

    render(<DocumentsShowcase />);

    await waitFor(() => expect(fetchUlbDocumentsAction).toHaveBeenCalledTimes(1));

    // Two upload buttons: LIST then MAP
    const uploadButtons = screen.getAllByTestId('upload-button');
    fireEvent.click(uploadButtons[1]); // MAP slot

    const modal = await screen.findByTestId('modal');
    const fileInput = modal.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy'], 'zoning-map.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const form = modal.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => expect(uploadUlbDocumentAction).toHaveBeenCalledTimes(1));

    const formDataArg = (uploadUlbDocumentAction as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as FormData;
    expect(formDataArg.get('file')).toBe(file);
    expect(formDataArg.get('documentTypeCode')).toBe('TAX_ZONING_DOCUMENT_MAP');

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Uploaded successfully'));
    await waitFor(() => expect(fetchUlbDocumentsAction).toHaveBeenCalledTimes(2));
  });

  it('shows error toast and blocks upload when file extension is invalid', async () => {
    render(<DocumentsShowcase />);
    await waitFor(() => expect(fetchUlbDocumentsAction).toHaveBeenCalledTimes(1));

    const uploadButtons = screen.getAllByTestId('upload-button');
    fireEvent.click(uploadButtons[0]); // LIST slot (accepts only PDF)

    const modal = await screen.findByTestId('modal');
    const fileInput = modal.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(['dummy'], 'invalid-file.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(toast.error).toHaveBeenCalledWith('messages.invalidDocumentType');
    expect(uploadUlbDocumentAction).not.toHaveBeenCalled();
  });

  it('shows error toast and blocks upload when file size exceeds 10MB', async () => {
    render(<DocumentsShowcase />);
    await waitFor(() => expect(fetchUlbDocumentsAction).toHaveBeenCalledTimes(1));

    const uploadButtons = screen.getAllByTestId('upload-button');
    fireEvent.click(uploadButtons[1]); // MAP slot

    const modal = await screen.findByTestId('modal');
    const fileInput = modal.querySelector('input[type="file"]') as HTMLInputElement;

    // Create a mock large file exceeding 10MB
    const largeFile = new File(['dummy'], 'large-map.pdf', { type: 'application/pdf' });
    Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(toast.error).toHaveBeenCalledWith('messages.maxFileSizeExceeded');
    expect(uploadUlbDocumentAction).not.toHaveBeenCalled();
  });

  it('calls deleteUlbDocumentAction via confirm and shows success toast on success', async () => {
    (fetchUlbDocumentsAction as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: [listDoc],
    });
    (deleteUlbDocumentAction as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: null,
      message: 'Deleted successfully',
    });

    render(<DocumentsShowcase />);
    await waitFor(() => expect(screen.getByText('list.pdf')).toBeInTheDocument());

    fireEvent.click(screen.getByTitle('Delete'));

    expect(mockConfirm).toHaveBeenCalledTimes(1);
    const confirmArgs = mockConfirm.mock.calls[0][0];
    expect(confirmArgs.variant).toBe('delete');

    await confirmArgs.onConfirm();

    expect(deleteUlbDocumentAction).toHaveBeenCalledWith(1);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Deleted successfully'));
  });

  it('shows an error toast when delete fails', async () => {
    (fetchUlbDocumentsAction as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: [listDoc],
    });
    (deleteUlbDocumentAction as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: 'Delete failed',
    });

    render(<DocumentsShowcase />);
    await waitFor(() => expect(screen.getByText('list.pdf')).toBeInTheDocument());

    fireEvent.click(screen.getByTitle('Delete'));
    const confirmArgs = mockConfirm.mock.calls[0][0];
    await confirmArgs.onConfirm();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Delete failed'));
  });
});
