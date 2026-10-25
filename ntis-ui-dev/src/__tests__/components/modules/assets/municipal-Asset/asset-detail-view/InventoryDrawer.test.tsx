/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen } from '@testing-library/react';
import { InventoryDrawer } from '@/components/modules/assets/municipal-Asset/asset-detail-view/InventoryDrawer';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock the Drawer component which InventoryDrawer probably uses
vi.mock('@/components/common', () => ({
  Drawer: ({ children, open, title }: any) => open ? (
    <div data-testid="drawer">
      <div data-testid="drawer-title">{title}</div>
      <div data-testid="drawer-content">{children}</div>
    </div>
  ) : null,
  MasterTable: () => <div data-testid="master-table"></div>,
  Input: () => <input />,
  Select: () => <select />,
  Button: ({ children }: any) => <button>{children}</button>,
}));

// Also mock lucide-react if needed, or other imports

describe('InventoryDrawer', () => {
  const mockProps = {
    open: true,
    onClose: vi.fn(),
    items: [
      { id: 1, name: 'Item 1' },
    ],
  };

  it('renders correctly when open', () => {
    render(<InventoryDrawer {...mockProps as any} />);
    expect(screen.getByTestId('drawer')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<InventoryDrawer {...mockProps as any} open={false} />);
    expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
  });
});


