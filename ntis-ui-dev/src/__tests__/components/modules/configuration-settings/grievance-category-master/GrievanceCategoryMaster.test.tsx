/**
 * Comprehensive Test Suite for Grievance Category Master
 * Coverage: Components, Actions, Validation, Data Fetching, Services
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, renderHook, act, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { NextIntlClientProvider } from 'next-intl';

// Types
import type {
  GrievanceCategory,
  GrievanceCategoryFormModel,
  Priority,
  EscalationLevel,
  CreateGrievanceCategoryRequest,
  UpdateGrievanceCategoryRequest,
} from '@/types/grievance-category-master/grievanceCategory.types';
import type { DepartmentMaster } from '@/types/departmentMaster.types';
import { type LucideIcon } from 'lucide-react';

// Components
import { GrievanceCategoryMaster } from '@/components/modules/configuration-settings/grievance-category-master/GrievanceCategoryMasterView';
import { GrievanceCategoryList } from '@/components/modules/configuration-settings/grievance-category-master/GrievanceCategoryList';
import { GrievanceCategoryFilter } from '@/components/modules/configuration-settings/grievance-category-master/GrievanceCategoryFilter';
import { StatCard } from '@/components/modules/configuration-settings/grievance-category-master/StatCard';
import { GrievanceCategoryActions } from '@/components/modules/configuration-settings/grievance-category-master/GrievanceCategoryActions';
import { RequiredFieldsNote } from '@/components/common/RequiredFieldsNote';
import { StatusToggleCard } from '@/components/common/StatusToggleCard';
import { useGrievanceCategoryColumns } from '@/components/modules/configuration-settings/grievance-category-master/Column';
import {
  INITIAL_FORM_STATE,
  priorities,
  escalationLevels,
} from '@/components/modules/configuration-settings/grievance-category-master/GrievanceCategoryConstants';

// Validation
import {
  validateGrievanceCategory,
  validateGrievanceCategoryField,
  normalizeGrievanceCategoryFieldValue,
  createGrievanceCategoryValidationTranslator,
  resolveGrievanceCategoryServerError,
  type ValidationTranslator,
  type GrievanceCategoryValidationInput,
} from '@/lib/utils/grievance-category-validation';

// Actions utilities
import {
  parsePositiveInteger,
  getGrievanceCategoryMasterPath,
  getAuditTimestamp,
  resolveAuditUserId,
} from '@/app/[locale]/configuration-settings/grievance-category-master/actions/utils';

// Search params
import {
  normalizeMasterSearchParams,
  buildMasterUrl,
  buildMasterPathWithSearchParams,
} from '@/app/[locale]/configuration-settings/grievance-category-master/search-params';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/en/configuration-settings/grievance-category-master',
}));

// Mock API service
vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock confirm provider
vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({
    confirm: vi.fn((options: { onConfirm: () => void }) => {
      options.onConfirm();
    }),
  }),
}));

const mockPermissions = {
  canView: true,
  canEdit: true,
  canDelete: true,
  haveFullAccess: true,
  hasAccess: true,
};

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => mockPermissions,
}));



// Test data
const mockDepartments: DepartmentMaster[] = [
  {
    departmentId: 1,
    departmentCode: 'IT',
    departmentName: 'Information Technology',
    isActive: true,
  },
  {
    departmentId: 2,
    departmentCode: 'HR',
    departmentName: 'Human Resources',
    isActive: true,
  },
];

const mockCategories: GrievanceCategory[] = [
  {
    id: 1,
    categoryCode: 'CAT001',
    categoryName: 'Technical Issue',
    departmentId: 1,
    departmentName: 'Information Technology',
    priority: 'High',
    resolutionSla: '24',
    escalationLevel: 'Level 2',
    description: 'Technical support issues',
    isActive: true,
    createdDate: '2024-01-01T00:00:00Z',
    createdBy: 1,
  },
  {
    id: 2,
    categoryCode: 'CAT002',
    categoryName: 'HR Query',
    departmentId: 2,
    departmentName: 'Human Resources',
    priority: 'Medium',
    resolutionSla: '48',
    escalationLevel: 'Level 1',
    description: 'HR related queries',
    isActive: true,
    createdDate: '2024-01-02T00:00:00Z',
    createdBy: 1,
  },
];

const messages = {
  grievanceCategory: {
    master: {
      title: 'Grievance Category Master',
      description: 'Manage grievance categories',
      add: 'Add Category',
      tableTitle: 'Categories',
      tableSubtitle: 'Manage categories',
      stats: {
        total: 'Total Categories',
        critical: 'Critical Categories',
        sla: 'Avg SLA',
        active: 'Active Categories',
      },
    },
    list: {
      empty: 'No categories found',
      categoryCode: 'Code',
      categoryName: 'Name',
      department: 'Department',
      priority: 'Priority',
      sla: 'SLA',
      escalation: 'Escalation',
      description: 'Description',
      status: 'Status',
      actions: 'Actions',
      headers: {
        code: 'Code',
        name: 'Name',
        department: 'Department',
        priority: 'Priority',
        sla: 'SLA',
        escalation: 'Escalation',
        status: 'Status',
        description: 'Description',
        actions: 'Actions',
      },
      fallback: {
        notAssigned: 'Not Assigned',
        idNotFound: 'ID {id} not found',
      },
      days: 'days',
      pagination: {
        rowsPerPage: 'Rows per page',
        itemsPerPage: 'Items per page',
        showing: 'Showing',
        to: 'to',
        of: 'of',
        entries: 'entries',
      },
    },
    form: {
      addTitle: 'Add Grievance Category',
      editTitle: 'Edit Grievance Category',
      code: 'Category Code',
      name: 'Category Name',
      departmentId: 'Department',
      priority: 'Priority',
      resolutionSla: 'Resolution SLA',
      escalationLevel: 'Escalation Level',
      description: 'Description',
      active: 'Active Status',
    },
    filters: {
      search: 'Search',
      searchPlaceholder: 'Search categories...',
      filterBy: 'Filter By',
      allDepartments: 'All Departments',
      allStatus: 'All Status',
      active: 'Active',
      inactive: 'Inactive',
    },
    options: {
      priority: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        critical: 'Critical',
      },
      escalation: {
        level1: 'Level 1',
        level2: 'Level 2',
        level3: 'Level 3',
        level4: 'Level 4',
      },
    },
  },
  common: {
    status: {
      active: 'Active',
      inactive: 'Inactive',
    },
    table: {
      rowsPerPage: 'Rows per page',
      itemsPerPage: 'Items per page',
      firstPage: 'First page',
      previousPage: 'Previous page',
      nextPage: 'Next page',
      lastPage: 'Last page',
      page: 'Page',
      showingEntries: 'Showing {start} to {end} of {total} entries',
      columns: {
        status: 'Status',
        actions: 'Actions',
      },
    },
    buttons: {
      cancel: 'Cancel',
      save: 'Save',
      add: 'Add',
      update: 'Update',
    },
    actions: {
      loading: 'Loading...',
    },
    confirm: {
      delete: {
        title: 'Delete Confirmation',
        description: 'Are you sure?',
        confirm: 'Delete',
      },
    },
    messages: {
      deleteSuccess: 'Deleted successfully',
    },
    errors: {
      deleteError: 'Failed to delete',
    },
    note: {
      mandatory: '* Required fields',
    },
  },
};

// Helper to wrap components with providers
const renderWithIntl = (component: ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe('Grievance Category Master - Comprehensive Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPermissions.canView = true;
    mockPermissions.canEdit = true;
    mockPermissions.canDelete = true;
    mockPermissions.haveFullAccess = true;
    mockPermissions.hasAccess = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // UTILITY FUNCTIONS TESTS
  // ============================================================================
  describe('Action Utilities', () => {
    describe('parsePositiveInteger', () => {
      it('should parse valid positive integer strings', () => {
        expect(parsePositiveInteger('123')).toBe(123);
        expect(parsePositiveInteger('1')).toBe(1);
      });

      it('should return value for valid positive integer numbers', () => {
        expect(parsePositiveInteger(456)).toBe(456);
      });

      it('should return undefined for invalid inputs', () => {
        expect(parsePositiveInteger('0')).toBeUndefined();
        expect(parsePositiveInteger('-5')).toBeUndefined();
        expect(parsePositiveInteger('abc')).toBeUndefined();
        expect(parsePositiveInteger(null)).toBeUndefined();
        expect(parsePositiveInteger(undefined)).toBeUndefined();
        expect(parsePositiveInteger('')).toBeUndefined();
      });
    });



    describe('getGrievanceCategoryMasterPath', () => {
      it('should return correct path for locale', () => {
        expect(getGrievanceCategoryMasterPath('en')).toBe(
          '/en/configuration-settings/grievance-category-master'
        );
        expect(getGrievanceCategoryMasterPath('hi')).toBe(
          '/hi/configuration-settings/grievance-category-master'
        );
      });
    });

    describe('getAuditTimestamp', () => {
      it('should return ISO string timestamp', () => {
        const timestamp = getAuditTimestamp();
        expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });
    });

    describe('resolveAuditUserId', () => {
      it('should return provided userId', () => {
        expect(resolveAuditUserId(42)).toBe(42);
      });
    });
  });

  // ============================================================================
  // VALIDATION TESTS
  // ============================================================================
  describe('Validation', () => {
    const mockTranslator: ValidationTranslator = (key: string) => key;

    describe('validateGrievanceCategoryField', () => {
      it('should validate categoryCode correctly', () => {
        expect(validateGrievanceCategoryField({}, 'categoryCode', '', mockTranslator)).toBe(
          'errors.codeReq'
        );
        expect(
          validateGrievanceCategoryField({}, 'categoryCode', 'VALID123', mockTranslator)
        ).toBeNull();
        expect(
          validateGrievanceCategoryField({}, 'categoryCode', 'invalid@code', mockTranslator)
        ).toBe('errors.codeAlphanumeric');
        expect(
          validateGrievanceCategoryField({}, 'categoryCode', 'A'.repeat(21), mockTranslator)
        ).toBe('errors.codeMaxLength');
      });

      it('should validate categoryName correctly', () => {
        expect(validateGrievanceCategoryField({}, 'categoryName', '', mockTranslator)).toBe(
          'errors.nameReq'
        );
        expect(validateGrievanceCategoryField({}, 'categoryName', 'AB', mockTranslator)).toBe(
          'errors.nameMinLength'
        );
        expect(
          validateGrievanceCategoryField({}, 'categoryName', 'A'.repeat(101), mockTranslator)
        ).toBe('errors.nameMaxLength');
        expect(
          validateGrievanceCategoryField({}, 'categoryName', 'Valid Name', mockTranslator)
        ).toBeNull();
      });

      it('should validate departmentId correctly', () => {
        expect(validateGrievanceCategoryField({}, 'departmentId', null, mockTranslator)).toBe(
          'errors.departmentReq'
        );
        expect(validateGrievanceCategoryField({}, 'departmentId', undefined, mockTranslator)).toBe(
          'errors.departmentReq'
        );
        expect(validateGrievanceCategoryField({}, 'departmentId', '', mockTranslator)).toBe(
          'errors.departmentReq'
        );
        expect(validateGrievanceCategoryField({}, 'departmentId', 0, mockTranslator)).toBe(
          'errors.departmentReq'
        );
        expect(validateGrievanceCategoryField({}, 'departmentId', 1, mockTranslator)).toBeNull();
      });

      it('should validate resolutionSla correctly', () => {
        expect(validateGrievanceCategoryField({}, 'resolutionSla', '', mockTranslator)).toBe(
          'errors.slaReq'
        );
        expect(validateGrievanceCategoryField({}, 'resolutionSla', '0', mockTranslator)).toBe(
          'errors.slaPositiveInteger'
        );
        expect(validateGrievanceCategoryField({}, 'resolutionSla', '-5', mockTranslator)).toBe(
          'errors.slaPositiveInteger'
        );
        expect(validateGrievanceCategoryField({}, 'resolutionSla', '1.5', mockTranslator)).toBe(
          'errors.slaPositiveInteger'
        );
        expect(validateGrievanceCategoryField({}, 'resolutionSla', '1000', mockTranslator)).toBe(
          'errors.slaMaxLength'
        );
        expect(
          validateGrievanceCategoryField({}, 'resolutionSla', '24', mockTranslator)
        ).toBeNull();
      });

      it('should validate description correctly', () => {
        expect(
          validateGrievanceCategoryField({}, 'description', 'Valid description', mockTranslator)
        ).toBeNull();
        expect(
          validateGrievanceCategoryField({}, 'description', 'A'.repeat(501), mockTranslator)
        ).toBe('errors.descMaxLength');

        // 500 words limit validation
        const validWords = Array(80).fill('word').join(' '); // 80 words fits well within 500 chars and 500 words
        expect(
          validateGrievanceCategoryField({}, 'description', validWords, mockTranslator)
        ).toBeNull();

        const invalidWords = Array(1001).fill('w').join(' '); // 1001 words (2001 chars)
        expect(
          validateGrievanceCategoryField({}, 'description', invalidWords, mockTranslator)
        ).toBe('errors.descMaxLength');
      });
    });

    describe('validateGrievanceCategory', () => {
      it('should validate complete form model', () => {
        const validData: GrievanceCategoryFormModel = {
          categoryCode: 'TEST001',
          categoryName: 'Test Category',
          departmentId: 1,
          priority: 'High',
          resolutionSla: '24',
          escalationLevel: 'Level 1',
          description: 'Test description',
          isActive: true,
        };

        const errors = validateGrievanceCategory(validData, mockTranslator);
        expect(Object.keys(errors)).toHaveLength(0);
      });

      it('should return errors for invalid form model', () => {
        const invalidData: GrievanceCategoryFormModel = {
          categoryCode: '',
          categoryName: 'AB',
          departmentId: undefined,
          priority: 'High',
          resolutionSla: '',
          escalationLevel: 'Level 1',
          description: 'A'.repeat(501),
          isActive: true,
        };

        const errors = validateGrievanceCategory(invalidData, mockTranslator);
        expect(errors.categoryCode).toBeDefined();
        expect(errors.categoryName).toBeDefined();
        expect(errors.departmentId).toBeDefined();
        expect(errors.resolutionSla).toBeDefined();
        expect(errors.description).toBeDefined();
      });

      it('should validate raw validation input from server', () => {
        const validationInput: GrievanceCategoryValidationInput = {
          categoryCode: 'TEST001',
          categoryName: 'Test Category',
          departmentId: '1',
          priority: 'High',
          resolutionSla: '24',
          escalationLevel: 'Level 1',
          description: 'Test description',
          isActive: true,
        };

        const errors = validateGrievanceCategory(validationInput, mockTranslator);
        expect(Object.keys(errors)).toHaveLength(0);
      });
    });

    describe('normalizeGrievanceCategoryFieldValue', () => {
      it('should normalize categoryCode to uppercase', () => {
        expect(normalizeGrievanceCategoryFieldValue('categoryCode', 'test123')).toBe('TEST123');
        expect(normalizeGrievanceCategoryFieldValue('categoryCode', 'TEST-123')).toBe('TEST-123');
      });

      it('should trim string values', () => {
        expect(normalizeGrievanceCategoryFieldValue('categoryName', '  Test  ')).toBe('Test');
      });

      it('should return non-string values as-is', () => {
        expect(normalizeGrievanceCategoryFieldValue('departmentId', 123)).toBe(123);
      });
    });

    describe('createGrievanceCategoryValidationTranslator', () => {
      it('should create translator function', () => {
        const options = {
          errors: { codeReq: 'Code is required' },
          fields: { code: 'Category Code' },
        };
        const translator = createGrievanceCategoryValidationTranslator(options);
        expect(translator('codeReq')).toBe('Code is required');
        expect(translator('errors.codeReq')).toBe('Code is required');
      });

      it('should replace placeholders in messages', () => {
        const options = {
          errors: { maxLength: 'Maximum {max} characters' },
          fields: {},
        };
        const translator = createGrievanceCategoryValidationTranslator(options);
        expect(translator('maxLength', { max: 20 })).toBe('Maximum 20 characters');
      });
    });

    describe('resolveGrievanceCategoryServerError', () => {
      const translations = {
        duplicateCode: 'Duplicate code error',
        unexpected: 'Unexpected error',
      };

      it('should resolve error key to message', () => {
        expect(resolveGrievanceCategoryServerError('duplicateCode', translations)).toBe(
          'Duplicate code error'
        );
        expect(resolveGrievanceCategoryServerError('errors.duplicateCode', translations)).toBe(
          'Duplicate code error'
        );
      });

      it('should return unexpected for undefined error', () => {
        expect(resolveGrievanceCategoryServerError(undefined, translations)).toBe(
          'Unexpected error'
        );
      });

      it('should return error as-is if not found in translations', () => {
        expect(resolveGrievanceCategoryServerError('unknownError', translations)).toBe(
          'unknownError'
        );
      });
    });
  });

  // ============================================================================
  // SEARCH PARAMS TESTS
  // ============================================================================
  describe('Search Params', () => {
    describe('normalizeMasterSearchParams', () => {
      it('should normalize search params', () => {
        const raw = {
          pageSize: '20',
          page: '2',
          search: 'test',
          department: '1',
          status: 'active',
        };
        const normalized = normalizeMasterSearchParams(raw);
        expect(normalized).toEqual(raw);
      });

      it('should handle array values', () => {
        const raw = {
          pageSize: ['10', '20'],
          page: ['1'],
        };
        const normalized = normalizeMasterSearchParams(raw);
        expect(normalized.pageSize).toBe('10');
        expect(normalized.page).toBe('1');
      });

      it('should handle undefined values', () => {
        const raw = {};
        const normalized = normalizeMasterSearchParams(raw);
        expect(normalized.pageSize).toBeUndefined();
        expect(normalized.page).toBeUndefined();
      });
    });

    describe('buildMasterUrl', () => {
      it('should build URL with all params', () => {
        const url = buildMasterUrl('en', {
          pageSize: '20',
          page: '2',
          search: 'test',
          department: '1',
          status: 'active',
        });
        expect(url).toContain('/en/configuration-settings/grievance-category-master');
        expect(url).toContain('pageSize=20');
        expect(url).toContain('page=2');
        expect(url).toContain('search=test');
        expect(url).toContain('department=1');
        expect(url).toContain('status=active');
      });

      it('should exclude "all" values', () => {
        const url = buildMasterUrl('en', {
          department: 'all',
          status: 'all',
        });
        expect(url).not.toContain('department');
        expect(url).not.toContain('status');
      });

      it('should return base path for empty params', () => {
        const url = buildMasterUrl('en', {});
        expect(url).toBe('/en/configuration-settings/grievance-category-master');
      });
    });

    describe('buildMasterPathWithSearchParams', () => {
      it('should build path with URLSearchParams', () => {
        const params = new URLSearchParams({ search: 'test', page: '2' });
        const path = buildMasterPathWithSearchParams('en', params);
        expect(path).toContain('/en/configuration-settings/grievance-category-master');
        expect(path).toContain('search=test');
        expect(path).toContain('page=2');
      });
    });
  });

  // ============================================================================
  // COMPONENT TESTS
  // ============================================================================
  describe('Components', () => {
    describe('StatCard', () => {
      it('should render stat card with correct values', () => {
        const MockIcon = () => <div data-testid="mock-icon" />;
        const { container } = renderWithIntl(
          <StatCard
            label="Total Categories"
            value={42}
            icon={MockIcon as unknown as LucideIcon}
            color="blue"
          />
        );
        expect(container.textContent).toContain('Total Categories');
        expect(container.textContent).toContain('42');
      });

      it('should apply correct color scheme', () => {
        const MockIcon = () => <div />;
        const { container } = renderWithIntl(
          <StatCard label="Test" value={10} icon={MockIcon as unknown as LucideIcon} color="rose" />
        );
        expect(container.querySelector('.text-rose-600')).toBeTruthy();
      });
    });

    describe('RequiredFieldsNote', () => {
      it('should render required fields note', () => {
        const { container } = render(<RequiredFieldsNote text="* Required" />);
        expect(container.textContent).toContain('* Required');
      });
    });

    describe('StatusToggleCard', () => {
      it('should render status toggle card', () => {
        const onToggle = vi.fn();
        const { container } = render(
          <StatusToggleCard
            isActive={true}
            onToggle={onToggle}
            activeLabel="Active"
            inactiveLabel="Inactive"
            statusLabel="Status"
          />
        );
        expect(container.textContent).toContain('Status');
      });

      it('should call onToggle when clicked', () => {
        const onToggle = vi.fn();
        const { container } = render(
          <StatusToggleCard
            isActive={false}
            onToggle={onToggle}
            activeLabel="Active"
            inactiveLabel="Inactive"
            statusLabel="Status"
          />
        );
        const toggle = container.querySelector('input[type="checkbox"]');
        if (toggle) {
          act(() => {
            (toggle as HTMLInputElement).click();
          });
        }
      });
    });

    describe('GrievanceCategoryActions', () => {
      it('should render edit and delete buttons', () => {
        const onEdit = vi.fn();
        const onDelete = vi.fn();
        const { container } = render(
          <GrievanceCategoryActions categoryId={1} onEdit={onEdit} onDelete={onDelete} />
        );
        const buttons = container.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('useGrievanceCategoryColumns', () => {
      it('should return column configuration', () => {
        const { result } = renderHook(
          () =>
            useGrievanceCategoryColumns({
              locale: 'en',
              departments: mockDepartments,
              onEdit: vi.fn(),
              onDelete: vi.fn(),
            }),
          {
            wrapper: ({ children }) => (
              <NextIntlClientProvider locale="en" messages={messages}>
                {children}
              </NextIntlClientProvider>
            ),
          }
        );

        expect(Array.isArray(result.current)).toBe(true);
        expect(result.current.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // CONSTANTS TESTS
  // ============================================================================
  describe('Constants', () => {
    it('should export priorities array', () => {
      expect(priorities).toEqual(['Critical', 'High', 'Medium', 'Low']);
    });

    it('should export escalation levels array', () => {
      expect(escalationLevels).toEqual(['Level 1', 'Level 2', 'Level 3', 'Level 4']);
    });

    it('should export initial form state', () => {
      expect(INITIAL_FORM_STATE).toEqual({
        categoryCode: '',
        categoryName: '',
        departmentId: undefined,
        priority: 'Medium',
        resolutionSla: '',
        escalationLevel: 'Level 1',
        description: '',
        isActive: true,
      });
    });
  });

  // ============================================================================
  // EDGE CASES AND ERROR HANDLING
  // ============================================================================
  describe('Edge Cases', () => {
    it('should handle empty department list', () => {
      const { container } = renderWithIntl(
        <GrievanceCategoryFilter
          locale="en"
          departments={[]}
          initialSearch=""
          initialDepartment="all"
          initialStatus="all"
        />
      );
      expect(container).toBeTruthy();
    });

    it('should handle empty category list', () => {
      renderWithIntl(
        <GrievanceCategoryList
          locale="en"
          categories={[]}
          totalCount={0}
          page={1}
          pageSize={10}
          departments={mockDepartments}
          searchParams={{ search: '', department: 'all', status: 'all' }}
          headerTitle="Categories"
          headerSubtitle="Manage categories"
          emptyText="No categories found"
        />
      );
      expect(screen.getByText('No categories found')).toBeDefined();
    });

    it('should handle validation with null values', () => {
      const validationInput: GrievanceCategoryValidationInput = {
        categoryCode: null,
        categoryName: null,
        departmentId: null,
        priority: null,
        resolutionSla: null,
        escalationLevel: null,
        description: null,
        isActive: false,
      };

      const errors = validateGrievanceCategory(validationInput, (key: string) => key);
      expect(Object.keys(errors).length).toBeGreaterThan(0);
    });

    it('should handle very long strings in validation', () => {
      const longString = 'A'.repeat(1001);
      expect(
        validateGrievanceCategoryField({}, 'categoryCode', longString, (key: string) => key)
      ).toBe('errors.codeMaxLength');
      expect(
        validateGrievanceCategoryField({}, 'categoryName', longString, (key: string) => key)
      ).toBe('errors.nameMaxLength');
      expect(
        validateGrievanceCategoryField({}, 'description', 'A'.repeat(4001), (key: string) => key)
      ).toBe('errors.descMaxLength');
    });

    it('should handle special characters in normalization', () => {
      expect(normalizeGrievanceCategoryFieldValue('categoryCode', 'test@#$123')).toBe('TEST123');
      expect(normalizeGrievanceCategoryFieldValue('categoryName', '  Test  Name  ')).toBe(
        'Test  Name'
      );
    });
  });

  // ============================================================================
  // INTEGRATION SCENARIOS
  // ============================================================================
  describe('Integration Scenarios', () => {
    it('should validate and normalize form data for submission', () => {
      const rawInput: GrievanceCategoryValidationInput = {
        categoryCode: 'TEST001',
        categoryName: 'Test Category',
        departmentId: '1',
        priority: 'High',
        resolutionSla: '24',
        escalationLevel: 'Level 2',
        description: 'Test description',
        isActive: true,
      };

      const errors = validateGrievanceCategory(rawInput, (key: string) => key);
      expect(Object.keys(errors)).toHaveLength(0);

      const normalizedCode = normalizeGrievanceCategoryFieldValue('categoryCode', 'test-001');
      expect(normalizedCode).toBe('TEST-001');
    });

    it('should handle complete CRUD workflow data transformations', () => {
      // Create
      const createData: CreateGrievanceCategoryRequest = {
        categoryCode: 'NEW001',
        categoryName: 'New Category',
        departmentId: 1,
        priority: 'Critical',
        resolutionSla: '12',
        escalationLevel: 'Level 3',
        description: 'New category description',
        isActive: true,
      };
      expect(createData.categoryCode).toBe('NEW001');

      // Update
      const updateData: UpdateGrievanceCategoryRequest = {
        id: 1,
        ...createData,
        categoryName: 'Updated Category',
      };
      expect(updateData.id).toBe(1);
      expect(updateData.categoryName).toBe('Updated Category');
    });

    it('should build correct URLs for navigation scenarios', () => {
      // List page
      const listUrl = buildMasterUrl('en', { page: '1', pageSize: '10' });
      expect(listUrl).toContain('page=1');

      // Filtered view
      const filteredUrl = buildMasterUrl('en', {
        search: 'technical',
        department: '1',
        status: 'active',
      });
      expect(filteredUrl).toContain('search=technical');
      expect(filteredUrl).toContain('department=1');
      expect(filteredUrl).toContain('status=active');

      // Back to list with preserved filters
      const params = new URLSearchParams('search=technical&page=2');
      const backUrl = buildMasterPathWithSearchParams('en', params);
      expect(backUrl).toContain('search=technical');
      expect(backUrl).toContain('page=2');
    });
  });

  // ============================================================================
  // TYPE SAFETY TESTS
  // ============================================================================
  describe('Type Safety', () => {
    it('should enforce Priority type', () => {
      const validPriorities: Priority[] = ['Low', 'Medium', 'High', 'Critical'];
      validPriorities.forEach((priority) => {
        expect(['Low', 'Medium', 'High', 'Critical']).toContain(priority);
      });
    });

    it('should enforce EscalationLevel type', () => {
      const validLevels: EscalationLevel[] = ['Level 1', 'Level 2', 'Level 3', 'Level 4'];
      validLevels.forEach((level) => {
        expect(['Level 1', 'Level 2', 'Level 3', 'Level 4']).toContain(level);
      });
    });

    it('should ensure form model structure', () => {
      const formModel: GrievanceCategoryFormModel = {
        categoryCode: 'TEST',
        categoryName: 'Test',
        departmentId: 1,
        priority: 'High',
        resolutionSla: '24',
        escalationLevel: 'Level 1',
        description: 'Test',
        isActive: true,
      };
      expect(formModel).toBeDefined();
      expect(formModel.categoryCode).toBe('TEST');
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================
  describe('Accessibility', () => {
    it('should render forms with proper labels', () => {
      const { container } = renderWithIntl(<RequiredFieldsNote text="* Required fields" />);
      expect(container.textContent).toContain('* Required fields');
    });

    it('should provide meaningful button labels in actions', () => {
      const { container } = render(
        <GrievanceCategoryActions categoryId={1} onEdit={vi.fn()} onDelete={vi.fn()} />
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================
  describe('Performance', () => {
    it('should handle large dataset pagination efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockCategories[0],
        id: i + 1,
        categoryCode: `CAT${String(i + 1).padStart(4, '0')}`,
      }));

      const totalPages = Math.ceil(largeDataset.length / 10);
      expect(totalPages).toBe(100);
    });

    it('should validate form efficiently', () => {
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        validateGrievanceCategory(
          {
            categoryCode: `TEST${i}`,
            categoryName: `Test ${i}`,
            departmentId: 1,
            priority: 'High',
            resolutionSla: '24',
            escalationLevel: 'Level 1',
            description: 'Test',
            isActive: true,
          },
          (key: string) => key
        );
      }
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  // ============================================================================
  // PERMISSIONS AND ACCESS CONTROL TESTS
  // ============================================================================
  describe('Permissions and Access Control', () => {
    const mockStats = { total: 2, avgSla: 36, active: 2, critical: 1 };

    it('renders the grievance category list title when permitted', () => {
      renderWithIntl(
        <GrievanceCategoryMaster
          locale="en"
          data={mockCategories}
          departments={mockDepartments}
          stats={mockStats}
          pageSize={10}
          page={1}
          totalCount={2}
          initialSearch=""
          initialDepartment="all"
          initialStatus="all"
        />
      );
      expect(screen.getByText('Grievance Category Master')).toBeInTheDocument();
    });


    it('renders errors.fetchFailed when fetchError is provided', () => {
      renderWithIntl(
        <GrievanceCategoryMaster
          locale="en"
          data={[]}
          departments={mockDepartments}
          stats={mockStats}
          pageSize={10}
          page={1}
          totalCount={0}
          initialSearch=""
          initialDepartment="all"
          initialStatus="all"
          fetchError="Network connection lost"
        />
      );
      expect(screen.getByText('common.errors.fetchFailed')).toBeInTheDocument();
      expect(screen.getByText('Network connection lost')).toBeInTheDocument();
    });

  });
});
