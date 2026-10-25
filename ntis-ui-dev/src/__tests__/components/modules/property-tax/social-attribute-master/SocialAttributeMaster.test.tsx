import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRouter } from 'next/navigation';
import { useConfirm } from '@/components/common/ConfirmProvider';
import type { SocialAttribute } from '@/types/social-attribute.types';
import { SocialAttributeMaster } from '@/components/modules/property-tax/social-attribute-master';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(() => ''),
  })),
  redirect: vi.fn(),
}));

vi.mock('next-intl', () => {
  return {
    useTranslations: vi.fn((ns?: string) => {
      const t = (key: string, values?: Record<string, string>) => {
        let result = ns ? `${ns}.${key}` : key;
        if (values) {
          Object.entries(values).forEach(([k, v]) => {
            result = result.replace(`{${k}}`, v);
          });
        }
        return result;
      };
      return t;
    }),
    useLocale: vi.fn(() => 'en'),
  };
});

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: vi.fn(() => ({ confirm: vi.fn() })),
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const mockRouterPush = vi.fn();
const mockRouterReplace = vi.fn();
const mockRouterRefresh = vi.fn();
vi.mocked(useRouter).mockImplementation(() => ({
  push: mockRouterPush,
  refresh: mockRouterRefresh,
  back: vi.fn(),
  forward: vi.fn(),
  replace: mockRouterReplace,
  prefetch: vi.fn(),
} as unknown as ReturnType<typeof useRouter>));

Object.defineProperty(window, 'location', {
  value: { ...window.location, assign: vi.fn(), replace: vi.fn() },
  writable: true,
});

const defaultProps = {
  data: [
    {
      id: 1,
      socialAttributeCode: 'ROAD_WIDTH',
      socialAttributeName: 'Road Width',
      dataType: 'DECIMAL',
      unit: 'Meter',
      displayOrder: 1,
      parentAttributeId: null,
      isRequiredWhenParentTrue: false,
      isDiscountApplicable: false,
      isActive: true,
      createdDate: '2026-05-19T16:37:31.653Z',
      updatedDate: null,
    },
    {
      id: 2,
      socialAttributeCode: 'WATER_CONN_STATUS',
      socialAttributeName: 'Water Connection Status',
      dataType: 'BIT',
      unit: null,
      displayOrder: 2,
      parentAttributeId: null,
      isRequiredWhenParentTrue: false,
      isDiscountApplicable: false,
      isActive: false,
      createdDate: '2026-05-19T16:37:31.653Z',
      updatedDate: null,
    },
  ] as SocialAttribute[],
  pageNumber: 1,
  pageSize: 500,
  totalCount: 2,
  totalPages: 1,
  sortBy: undefined,
  sortOrder: undefined,
};

describe('SocialAttributeMaster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('renders tree categories and attribute cards with data', () => {
    render(<SocialAttributeMaster {...defaultProps} />);
    expect(screen.getByText('socialAttribute.list.title')).toBeInTheDocument();

    // Attributes should render
    expect(screen.getByText('ROAD_WIDTH')).toBeInTheDocument();
    expect(screen.getByText('Road Width')).toBeInTheDocument();
    expect(screen.getByText('WATER_CONN_STATUS')).toBeInTheDocument();
    expect(screen.getByText('Water Connection Status')).toBeInTheDocument();
  });

  it('calls router.push on add button click', () => {
    render(<SocialAttributeMaster {...defaultProps} />);
    const addButton = screen.getByRole('button', { name: 'socialAttribute.list.buttons.add' });
    fireEvent.click(addButton);
    expect(mockRouterPush).toHaveBeenCalledWith('/en/property-tax/social-attribute-master/add');
  });

  it('updates URL on search input change', () => {
    render(<SocialAttributeMaster {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('socialAttribute.list.filters.search');
    fireEvent.change(searchInput, { target: { value: 'Water' } });

    vi.runAllTimers();

    expect(mockRouterReplace).toHaveBeenCalledWith(
      '/en/property-tax/social-attribute-master?q=Water'
    );
  });

  it('updates URL on dropdown filters change', () => {
    render(<SocialAttributeMaster {...defaultProps} />);

    const dataTypeSelect = screen.getByLabelText('socialAttribute.list.filters.dataType.ariaLabel');
    fireEvent.click(dataTypeSelect);
    const bitOption = screen.getByRole('option', { name: 'BIT' });
    fireEvent.click(bitOption);

    const attributeSelect = screen.getByLabelText(
      'socialAttribute.list.filters.attributeType.ariaLabel'
    );
    fireEvent.click(attributeSelect);
    const parentOnlyOption = screen.getByRole('option', {
      name: 'socialAttribute.list.filters.attributeType.parentOnly',
    });
    fireEvent.click(parentOnlyOption);

    expect(mockRouterReplace).toHaveBeenCalledWith(
      '/en/property-tax/social-attribute-master?dataType=BIT&attributeType=PARENT_ONLY'
    );
  });

  it('navigates to edit page on edit button click', () => {
    render(<SocialAttributeMaster {...defaultProps} />);
    const editButtons = screen.getAllByRole('button', {
      name: 'socialAttribute.list.buttons.edit',
    });
    fireEvent.click(editButtons[0]); // Click first button (ID 1, ROAD_WIDTH)
    expect(mockRouterPush).toHaveBeenCalledWith('/en/property-tax/social-attribute-master/edit/1');
  });

  it('calls confirm dialog on delete click', () => {
    const confirmMock = vi.fn();
    vi.mocked(useConfirm).mockImplementation(() => ({ confirm: confirmMock }));
    render(<SocialAttributeMaster {...defaultProps} />);
    const deleteButtons = screen.getAllByRole('button', {
      name: 'socialAttribute.list.buttons.delete',
    });
    fireEvent.click(deleteButtons[0]);
    expect(confirmMock).toHaveBeenCalled();
  });
});
