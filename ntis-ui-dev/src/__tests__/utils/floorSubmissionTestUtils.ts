/**
 * Test utilities for Floor Submission module
 * Provides reusable mock data and factory functions
 */

import { vi } from 'vitest';
import type { EditSidebarProps } from '@/types/floor-details.types';
import type { FloorData } from '@/types/room-details.types';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Creates mock EditSidebarProps with sensible defaults
 * @param overrides - Partial props to override defaults
 * @returns Complete EditSidebarProps object
 */
export const createMockEditSidebarProps = (
  overrides?: Partial<EditSidebarProps>
): EditSidebarProps => ({
  floorData: [
    { floorId: 1, floorCode: 'G', description: 'Ground Floor', sequenceNo: 0, maxFloorNo: 0, isActive: true, createdDate: '2024-01-01', updatedDate: null },
    { floorId: 2, floorCode: '1', description: 'First Floor', sequenceNo: 1, maxFloorNo: 1, isActive: true, createdDate: '2024-01-01', updatedDate: null },
  ],
  constructionTypeData: [
    { constructionTypeId: 1, constructionCode: 'RCC', description: 'RCC', searchKey: null, searchSequence: null, isActive: true, createdDate: '2024-01-01', updatedDate: null },
  ],
  useData: [
    { typeOfUseId: 1, typeOfUseCode: 'RES', description: 'Residential', type: 'R', typeOfUseGroupId: 1, searchKey: null, searchSequence: null, isActive: true, createdDate: '2024-01-01', updatedDate: null },
  ],
  subTypeData: [],
  subFloorData: [],
  floorOptions: [],
  constructionTypeOptions: [],
  useOptions: [],
  subTypeOptions: [],
  subFloorOptions: [],
  wardNo: '1',
  propertyNo: '123',
  partitionNo: '0',
  initialPropertyData: {
    plotAreaSqMeter: 1000,
    plotAreaSqFeet: 10764,
  },
  initialPlotArea: {
    length: 100,
    width: 10,
    totalPlotArea: 1000,
  },
  initialPropertyID: 123,
  initialFloors: [],
  initialFloorDetails: null,
  locale: 'en',
  apiErrors: [],
  ...overrides,
});

/**
 * Creates mock FloorData with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns Complete FloorData object
 */
export const createMockFloorData = (
  overrides?: Partial<FloorData>
): FloorData => ({
  id: 1,
  floor: '1',
  subFloor: 'None',
  conYr: '2020',
  asstYr: '2021',
  conTyp: 'RCC',
  use: 'Residential',
  subTyp: 'Apartment',
  rooms: '3',
  areaSqFt: '1000',
  areaSqM: '92.9',
  builtupAreaSqFt: '1200',
  builtupAreaSqM: '111.5',
  renter: 'No',
  isTaxable: 'Yes',
  roomData: [],
  ...overrides,
});

/**
 * Creates a mock Next.js router instance
 * @returns Mocked AppRouterInstance
 */
export const createMockRouter = (): AppRouterInstance => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
} as unknown as AppRouterInstance);

/**
 * Creates a mock translation function
 * @param returnValue - Optional custom return value function
 * @returns Mocked translation function
 */
export const createMockTranslation = (
  returnValue?: (key: string) => string
): ((key: string) => string) => {
  return returnValue || ((key: string) => key);
};

/**
 * Creates a mock confirm dialog function
 * @param autoConfirm - Whether to automatically execute onConfirm callback
 * @returns Mocked confirm function
 */
export const createMockConfirm = (autoConfirm = true) => {
  return vi.fn((options: { onConfirm?: () => void }) => {
    if (autoConfirm && options.onConfirm) {
      options.onConfirm();
    }
  });
};

/**
 * Default form error state
 */
export const EMPTY_FORM_ERRORS: Record<string, string> = {};

/**
 * Creates a complete set of default hook parameters for useFloorDataHandlers
 */
export const createDefaultFloorDataHandlersParams = () => {
  const mockRouter = createMockRouter();
  const mockConfirm = createMockConfirm();
  const mockT = createMockTranslation();
  
  const INITIAL_FORM_STATE: FloorData = {
    id: undefined,
    floor: '',
    subFloor: '',
    conYr: '',
    asstYr: '',
    conTyp: '',
    use: '',
    subTyp: '',
    rooms: '',
    areaSqFt: '',
    areaSqM: '',
    builtupAreaSqFt: '',
    builtupAreaSqM: '',
    renter: 'No',
    isTaxable: 'No',
    roomData: [],
  };

  return {
    props: createMockEditSidebarProps(),
    editingFloorForm: createMockFloorData(),
    selectedFloor: null,
    isAddingNewFloor: false,
    setIsAddingNewFloor: vi.fn(),
    setSelectedFloor: vi.fn(),
    setEditingFloorForm: vi.fn(),
    localFloors: [],
    setLocalFloors: vi.fn(),
    setFormErrors: vi.fn(),
    validateForm: vi.fn(() => true),
    startTransition: vi.fn((fn) => fn()),
    router: mockRouter,
    locale: 'en',
    propertyId: '123',
    confirm: mockConfirm,
    t: mockT,
    INITIAL_FORM_STATE,
  };
};
