/**
 * Test utilities for Water Connection module
 * Provides reusable mock data and factory functions
 */

import { vi } from 'vitest';
import type {
  WaterConnection,
  WaterConnectionFormModel,
  WaterConnectionTypeLookup,
  WaterConnectionSizeLookup,
  WaterConnectionStatusLookup,
  WaterRateMasterLookup,
  PropertyInfo,
  WaterConnectionPageData,
} from '@/types/water-connection.types';

// ── Mock Lookup Data ─────────────────────────────────────────────────────────

export const mockTypeOptions: WaterConnectionTypeLookup[] = [
  { id: 1, connectionTypeCode: 'DOM', connectionTypeName: 'Domestic' },
  { id: 2, connectionTypeCode: 'COM', connectionTypeName: 'Commercial' },
  { id: 3, connectionTypeCode: 'IND', connectionTypeName: 'Industrial' },
];

export const mockSizeOptions: WaterConnectionSizeLookup[] = [
  { id: 1, connectionSize: 0.5, connectionSizeUnit: 'Inch', displayLabel: '0.5 Inch' },
  { id: 2, connectionSize: 0.75, connectionSizeUnit: 'Inch', displayLabel: '0.75 Inch' },
  { id: 3, connectionSize: 1, connectionSizeUnit: 'Inch', displayLabel: '1 Inch' },
];

export const mockStatusOptions: WaterConnectionStatusLookup[] = [
  { id: 1, statusName: 'Running' },
  { id: 2, statusName: 'Stopped' },
  { id: 3, statusName: 'Disconnected' },
];

export const mockRateMasters: WaterRateMasterLookup[] = [
  {
    id: 1,
    waterConnectionTypeId: 1,
    connectionTypeName: 'Domestic',
    waterConnectionSizeId: 1,
    connectionSizeDisplay: '0.5 Inch',
    financeYearId: 2024,
    yearCode: '2024-25',
    yearlyRate: 1200,
    isActive: true,
  },
  {
    id: 2,
    waterConnectionTypeId: 1,
    connectionTypeName: 'Domestic',
    waterConnectionSizeId: 2,
    connectionSizeDisplay: '0.75 Inch',
    financeYearId: 2024,
    yearCode: '2024-25',
    yearlyRate: 1800,
    isActive: true,
  },
  {
    id: 3,
    waterConnectionTypeId: 2,
    connectionTypeName: 'Commercial',
    waterConnectionSizeId: 1,
    connectionSizeDisplay: '0.5 Inch',
    financeYearId: 2024,
    yearCode: '2024-25',
    yearlyRate: 2400,
    isActive: true,
  },
  {
    id: 4,
    waterConnectionTypeId: 1,
    connectionTypeName: 'Domestic',
    waterConnectionSizeId: 1,
    connectionSizeDisplay: '0.5 Inch',
    financeYearId: 2023,
    yearCode: '2023-24',
    yearlyRate: 1000,
    isActive: true,
  },
];

// ── Mock Property Info ───────────────────────────────────────────────────────

export const mockPropertyInfo: PropertyInfo = {
  id: 123,
  propertyNo: 'FR09-2024-001',
  ownerName: 'Rajesh Kumar',
  customerId: 'CID-123',
  customerType: 'Individual',
  contact: '+91 90743 42210',
  email: 'rajesh.kumar@email.com',
  address: '123 MG Road, Koramangala, Bangalore - 560034',
  zone: 'Zone-3',
  ward: 'Ward-21',
  buildingType: 'Residential',
};

// ── Mock Water Connections ───────────────────────────────────────────────────

export const mockWaterConnections: WaterConnection[] = [
  {
    id: 1,
    propertyId: 123,
    connectionNo: 'WC-001',
    meterNo: 'MTR-001',
    waterConnectionTypeId: 1,
    type: 'Domestic',
    waterConnectionSizeId: 1,
    tapSize: '0.5 Inch',
    waterConnectionStatusId: 1,
    statusName: 'Running',
    connectionStartDate: '2024-01-15',
    connectionStopDate: null,
    installDate: '2024-01-15',
    activatedDate: '2024-01-16',
    stoppedDate: null,
    applicableRate: 1200,
    applicableCharges: 1200,
    category: 'Residential',
    isActive: true,
  },
  {
    id: 2,
    propertyId: 123,
    connectionNo: 'WC-002',
    meterNo: null,
    waterConnectionTypeId: 2,
    type: 'Commercial',
    waterConnectionSizeId: 2,
    tapSize: '0.75 Inch',
    waterConnectionStatusId: 2,
    statusName: 'Stopped',
    connectionStartDate: '2023-06-10',
    connectionStopDate: '2024-03-01',
    installDate: '2023-06-10',
    activatedDate: '2023-06-11',
    stoppedDate: '2024-03-01',
    applicableRate: 1800,
    applicableCharges: 0,
    category: 'Commercial',
    isActive: false,
  },
];

// ── Factory Functions ────────────────────────────────────────────────────────

/**
 * Creates a mock WaterConnection with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns Complete WaterConnection object
 */
export const createMockWaterConnection = (
  overrides?: Partial<WaterConnection>
): WaterConnection => ({
  id: 1,
  propertyId: 123,
  connectionNo: 'WC-TEST-001',
  meterNo: 'MTR-TEST-001',
  waterConnectionTypeId: 1,
  type: 'Domestic',
  waterConnectionSizeId: 1,
  tapSize: '0.5 Inch',
  waterConnectionStatusId: 1,
  statusName: 'Running',
  connectionStartDate: '2024-01-01',
  connectionStopDate: null,
  installDate: '2024-01-01',
  activatedDate: '2024-01-02',
  stoppedDate: null,
  applicableRate: 1200,
  applicableCharges: 1200,
  category: 'Residential',
  isActive: true,
  ...overrides,
});

/**
 * Creates a mock WaterConnectionFormModel with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns Complete WaterConnectionFormModel object
 */
export const createMockFormModel = (
  overrides?: Partial<WaterConnectionFormModel>
): WaterConnectionFormModel => ({
  propertyId: 123,
  connectionNo: '',
  meterNo: '',
  waterConnectionTypeId: '',
  waterConnectionSizeId: '',
  installDate: new Date().toISOString().slice(0, 10),
  isActive: true,
  applicableRate: null,
  ...overrides,
  // Ensure waterConnectionStatusId is never undefined
  waterConnectionStatusId:
    overrides && Object.prototype.hasOwnProperty.call(overrides, 'waterConnectionStatusId')
      ? overrides.waterConnectionStatusId ?? null
      : null,
} as WaterConnectionFormModel);

/**
 * Creates mock WaterConnectionPageData with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns Complete WaterConnectionPageData object
 */
export const createMockPageData = (
  overrides?: Partial<WaterConnectionPageData>
): WaterConnectionPageData => ({
  property: mockPropertyInfo,
  connections: mockWaterConnections,
  totalCount: mockWaterConnections.length,
  totalPages: 1,
  pageNumber: 1,
  pageSize: 10,
  typeOptions: mockTypeOptions,
  sizeOptions: mockSizeOptions,
  statusOptions: mockStatusOptions,
  rateMasters: mockRateMasters,
  ...overrides,
});

// ── Mock Functions ───────────────────────────────────────────────────────────

export const createMockHandlers = () => ({
  onChange: vi.fn(),
  onSelectChange: vi.fn(),
  onBlur: vi.fn(),
  onAdd: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onClose: vi.fn(),
  onSaved: vi.fn(),
});

export const createMockTranslation = () => (key: string) => key;

// ── i18n Messages for Tests ──────────────────────────────────────────────────

export const waterConnectionMessages = {
  waterConnection: {
    page: {
      title: 'Water Connections',
      subtitle: 'Manage water connections for property',
    },
    stats: {
      totalConnections: 'Total Connections',
      activeConnections: 'Active Connections',
      stoppedConnections: 'Stopped Connections',
      yearlyRevenue: 'Yearly Revenue',
    },
    property: {
      owner: 'Owner',
      contact: 'Contact',
      email: 'Email',
      address: 'Address',
      propertyNo: 'Property No',
      zone: 'Zone',
      ward: 'Ward',
      buildingType: 'Building Type',
    },
    list: {
      title: 'Connections',
      subtitle: 'Water connections for {propertyNo}',
      connections: '{count} connections',
      buttons: {
        add: 'Add Connection',
      },
      table: {
        actions: 'Actions',
        installedOn: 'Installed',
        connectionNo: 'Connection No',
        type: 'Type',
        tapSize: 'Tap Size',
        applicableRate: 'Rate',
        category: 'Category',
        applicableCharges: 'Charges',
        status: 'Status',
        perMonth: '/month',
        perQuarter: '/quarter',
        perYear: '/year',
      },
      status: {
        active: 'Active',
        inactive: 'Inactive',
        activated: 'Activated',
        stopped: 'Stopped',
        stoppedOn: 'Stopped on',
      },
    },
    form: {
      addTitle: 'Add Water Connection',
      editTitle: 'Edit Water Connection',
      subtitle: 'Create a new water connection',
      editSubtitle: 'Update water connection details',
      actions: {
        cancel: 'Cancel',
        add: 'Add',
        update: 'Update',
      },
      status: {
        label: 'Status',
        active: 'Active',
        inactive: 'Inactive',
      },
      fields: {
        connectionNo: {
          label: 'Connection No',
          placeholder: 'Enter connection number',
        },
        meterNo: {
          label: 'Meter No',
          placeholder: 'Enter meter number',
        },
        type: {
          label: 'Connection Type',
          placeholder: 'Select type',
        },
        tapSize: {
          label: 'Tap Size',
          placeholder: 'Select size',
        },
        status: {
          label: 'Status',
          placeholder: 'Select status',
        },
        installDate: {
          label: 'Install Date',
        },
        rateType: {
          label: 'Rate Frequency',
          placeholder: 'Select rate frequency',
          yearly: 'Yearly Rate',
          quarterly: 'Quarterly Rate',
          monthly: 'Monthly Rate',
        },
        applicableRate: {
          label: 'Applicable Rate',
          autoCalculated: 'Auto-calculated based on selected rate frequency',
        },
      },
      validation: {
        connectionNoRequired: 'Connection number is required',
        typeRequired: 'Connection type is required',
        tapSizeRequired: 'Tap size is required',
        installDateRequired: 'Install date is required',
        fixErrors: 'Please fix the errors',
        rateNotFound: 'No rate found for selected type and size',
      },
      messages: {
        createSuccess: 'Connection created successfully',
        updateSuccess: 'Connection updated successfully',
        error: 'An error occurred',
      },
    },
    delete: {
      success: 'Connection deleted successfully',
      error: 'Failed to delete connection',
    },
  },
  common: {
    buttons: { cancel: 'Cancel' },
    actions: { save: 'Save', update: 'Update', loading: 'Loading...' },
    messages: { noData: 'No Data' },
    note: { mandatory: 'Fields marked * are mandatory' },
    table: {
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
    },
  },
};

