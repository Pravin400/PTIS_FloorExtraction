import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock cookies
const mockCookieStore = {
    get: vi.fn(),
};
vi.mock('next/headers', () => ({
    cookies: () => Promise.resolve(mockCookieStore),
}));

// Mock userProfileService
const mockGetUserProfile = vi.fn();
vi.mock('@/lib/api/user-profile.service', () => ({
    userProfileService: {
        getUserProfile: (userId: number) => mockGetUserProfile(userId),
    },
}));

// Mock departmentActivationService
const mockGetDepartments = vi.fn();
vi.mock('@/lib/api/configuration-settings/department-activation/departmentActivation.service', () => ({
    departmentActivationService: {
        getDepartments: () => mockGetDepartments(),
    },
}));

// Import after mocks
import { listServices, ListServicesResponse } from '@/app/[locale]/home/action';

const mockUserProfile = {
    id: 2,
    userName: 'ADMIN',
    firstName: 'Test',
    lastName: 'User',
    departments: [
        {
            userId: 2,
            departmentId: 1,
            departmentName: 'Property Tax',
            departmentNameLocal: 'string',
            id: 7,
            isActive: true,
            createdDate: '2026-05-07T19:10:15.153',
            updatedDate: null,
        },
        {
            userId: 2,
            departmentId: 2,
            departmentName: 'Trade License',
            departmentNameLocal: 'string',
            id: 8,
            isActive: true,
            createdDate: '2026-05-07T19:13:33.58',
            updatedDate: null,
        },
        {
            userId: 2,
            departmentId: 3,
            departmentName: 'Asset Management',
            departmentNameLocal: 'string',
            id: 9,
            isActive: true,
            createdDate: '2026-05-07T19:13:33.58',
            updatedDate: null,
        },
    ],
    moduleAccess: [],
    roleAllocations: [],
};

describe('listServices Server Action', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCookieStore.get.mockImplementation((name: string) => {
            if (name === 'user_id') return { value: '2' };
            return undefined;
        });
        mockGetDepartments.mockResolvedValue({
            success: true,
            data: [
                { departmentId: 1, departmentCode: 'pt', departmentIcon: 'Home', isActive: true },
                { departmentId: 2, departmentCode: 'tl', departmentIcon: 'ShoppingCart', isActive: true },
                { departmentId: 3, departmentCode: 'am', departmentIcon: 'Landmark', isActive: true },
            ],
        });
    });

    describe('successful responses', () => {
        beforeEach(() => {
            mockGetUserProfile.mockResolvedValue({
                success: true,
                data: mockUserProfile,
            });
        });

        it('returns services for user departments', async () => {
            const result: ListServicesResponse = await listServices('en');

            expect(result.services.length).toBe(3);
            expect(result.error).toBeUndefined();
        });

        it('returns services with correct structure', async () => {
            const result = await listServices('en');

            result.services.forEach(service => {
                expect(service).toHaveProperty('id');
                expect(service).toHaveProperty('name');
                expect(service).toHaveProperty('title');
                expect(service).toHaveProperty('subtext');
                expect(service).toHaveProperty('icon');
                expect(service).toHaveProperty('link');
            });
        });

        it('returns correct routes for user departments', async () => {
            const result = await listServices('en');

            const ptService = result.services.find(s => s.name === 'Property Tax');
            expect(ptService?.link).toBe('/en/property-tax');

            const tlService = result.services.find(s => s.name === 'Trade License');
            expect(tlService?.link).toBe('/en/trade-license');

            const amService = result.services.find(s => s.name === 'Asset Management');
            expect(amService?.link).toBe('/en/assets/municipal-Asset');
        });

        it('returns localized routes based on locale parameter', async () => {
            const resultHi = await listServices('hi');
            const ptServiceHi = resultHi.services.find(s => s.name === 'Property Tax');
            expect(ptServiceHi?.link).toBe('/hi/property-tax');

            const resultMr = await listServices('mr');
            const ptServiceMr = resultMr.services.find(s => s.name === 'Property Tax');
            expect(ptServiceMr?.link).toBe('/mr/property-tax');
        });

        it('filters out inactive departments', async () => {
            mockGetUserProfile.mockResolvedValue({
                success: true,
                data: {
                    ...mockUserProfile,
                    departments: [
                        { ...mockUserProfile.departments[0], isActive: true },
                        { ...mockUserProfile.departments[1], isActive: false },
                    ],
                },
            });

            const result = await listServices('en');

            expect(result.services.length).toBe(1);
            expect(result.services[0].name).toBe('Property Tax');
        });
    });

    describe('error handling', () => {
        it('returns error when user not authenticated', async () => {
            mockCookieStore.get.mockReturnValue(undefined);

            const result = await listServices('en');

            expect(result.services).toHaveLength(0);
            expect(result.error).toBe('User not authenticated');
        });

        it('returns error when API fails', async () => {
            mockGetUserProfile.mockResolvedValue({
                success: false,
                error: 'API Error',
            });

            const result = await listServices('en');

            expect(result.services).toHaveLength(0);
            expect(result.error).toBe('API Error');
        });

        it('returns empty services when user has no departments', async () => {
            mockGetUserProfile.mockResolvedValue({
                success: true,
                data: { ...mockUserProfile, departments: [] },
            });

            const result = await listServices('en');

            expect(result.services).toHaveLength(0);
            expect(result.error).toBeUndefined();
        });
    });
});
