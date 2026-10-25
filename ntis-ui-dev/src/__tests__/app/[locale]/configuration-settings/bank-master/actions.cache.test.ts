import { describe, it, expect } from 'vitest';
import { buildBankMasterMetadata } from '@/app/[locale]/configuration-settings/bank-master/actions.cache';
import type { BankMasterData } from '@/types/bank-master.types';

describe('buildBankMasterMetadata', () => {
  it('should accurately count active banks and normalize & deduplicate unique states case-insensitively', () => {
    const summary: BankMasterData[] = [
      {
        id: '1',
        bankCode: 'SBI01',
        bankName: 'State Bank of India',
        branchName: 'Main',
        ifscCode: 'SBIN0000001',
        address: 'Amravati Road',
        city: 'Amravati',
        state: 'maharashtra',
        pincode: '444600',
        isActive: true,
      },
      {
        id: '2',
        bankCode: 'SBI02',
        bankName: 'State Bank of India',
        branchName: 'East',
        ifscCode: 'SBIN0000002',
        address: 'Pune Road',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        isActive: true,
      },
      {
        id: '3',
        bankCode: 'SBI03',
        bankName: 'State Bank of India',
        branchName: 'West',
        ifscCode: 'SBIN0000003',
        address: 'Panaji Road',
        city: 'Panaji',
        state: 'goa',
        pincode: '403001',
        isActive: false,
      },
      {
        id: '4',
        bankCode: 'SBI04',
        bankName: 'State Bank of India',
        branchName: 'North',
        ifscCode: 'SBIN0000004',
        address: 'Delhi Road',
        city: 'Delhi',
        state: null,
        pincode: '110001',
        isActive: true,
      },
      {
        id: '5',
        bankCode: 'SBI05',
        bankName: 'State Bank of India',
        branchName: 'South',
        ifscCode: 'SBIN0000005',
        address: 'Margao Road',
        city: 'Margao',
        state: '—',
        pincode: '403601',
        isActive: true,
      },
    ];

    const result = buildBankMasterMetadata(summary);

    // Active count: id 1 (true), id 2 (true), id 4 (true), id 5 (true). Total: 4.
    expect(result.activeCount).toBe(4);

    // Unique states should deduplicate 'maharashtra' and 'Maharashtra' to 'Maharashtra',
    // format 'goa' to 'Goa', filter out null and '—', and sort alphabetically.
    // Result should be: ['Goa', 'Maharashtra']
    expect(result.uniqueStates).toEqual(['Goa', 'Maharashtra']);
  });
});
