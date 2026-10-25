import { describe, it, expect } from 'vitest';
import { resolveAgreementBaseMonthlyRent } from '@/lib/utils/renter/renterUtils';

describe('resolveAgreementBaseMonthlyRent', () => {
    it('prefers nonCalculateRentMonthly over calculated mast/detail rents', () => {
        const resolved = resolveAgreementBaseMonthlyRent({
            nonCalculateRentMonthly: 10000,
            rentMonthly: 13125,
            renterMast: [{ rentMonthly: 13125, nonCalculateRentMonthly: 10000 }],
            renterDetails: [{ rentAmount: 10000, rentMonthly: 13125 }],
        });

        expect(resolved).toBe(10000);
    });

    it('uses renterDetail rentAmount when nonCalculateRentMonthly is missing', () => {
        const resolved = resolveAgreementBaseMonthlyRent({
            rentMonthly: 13125,
            renterDetails: [{ rentAmount: 10000, rentMonthly: 13125 }],
            renterMast: [{ rentMonthly: 13125 }],
        });

        expect(resolved).toBe(10000);
    });

    it('does not fall back to calculated renterMast rentMonthly', () => {
        const resolved = resolveAgreementBaseMonthlyRent({
            rentMonthly: 0,
            renterMast: [{ rentMonthly: 13125 }],
            renterDetails: [],
        });

        expect(resolved).toBe('');
    });
});
