import { render, screen } from '@testing-library/react';
import { DocumentsDrawer } from '@/components/modules/assets/municipal-Asset/asset-detail-view/DocumentsDrawer';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, args?: Record<string, string>) => args?.defaultValue || key,
}));

vi.mock('@/components/common/Drawer', () => ({
  Drawer: ({ children, open, title }: { children: React.ReactNode, open: boolean, title: string }) => (open ? <div data-testid="mock-drawer"><h1>{title}</h1>{children}</div> : null),
}));

describe('DocumentsDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockGroups = {
    DOCUMENTS: [
      {
        id: 'doc-1',
        name: 'My Custom Document',
        url: 'https://example.com/doc.pdf',
        type: 'PDF',
        isImage: false,
      },
    ],
  };

  it('renders correctly when open', () => {
    const setDrawerOpen = vi.fn();
    const setViewerState = vi.fn();

    render(
      <DocumentsDrawer
        drawerOpen={true}
        setDrawerOpen={setDrawerOpen}
        totalFiles={1}
        groups={mockGroups}
        setViewerState={setViewerState}
      />
    );
    
    expect(screen.getByTestId('mock-drawer')).toBeInTheDocument();
    expect(screen.getByText(/allDocuments/i)).toBeInTheDocument();
    expect(screen.getAllByText('My Custom Document')[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'VIEW' })).toBeInTheDocument();
  });

  it('calls setViewerState when VIEW button is clicked', async () => {
    const setDrawerOpen = vi.fn();
    const setViewerState = vi.fn();

    render(
      <DocumentsDrawer
        drawerOpen={true}
        setDrawerOpen={setDrawerOpen}
        totalFiles={1}
        groups={mockGroups}
        setViewerState={setViewerState}
      />
    );
    
    const viewButton = screen.getByRole('button', { name: 'VIEW' });
    await userEvent.click(viewButton);
    
    expect(setViewerState).toHaveBeenCalledWith({
      open: true,
      url: 'https://example.com/doc.pdf',
      name: 'My Custom Document',
    });
  });
});
