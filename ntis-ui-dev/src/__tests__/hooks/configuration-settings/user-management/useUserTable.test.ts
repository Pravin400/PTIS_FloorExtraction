import { renderHook, act } from '@testing-library/react';
import { useUserTable } from '@/hooks/configuration-settings/user-management/useUserTable';
import { User } from '@/types/user-management';
import { describe, it, expect } from 'vitest';

const mockUsers: User[] = [
  {
    id: '1',
    userId: 1,
    userName: 'johndoe',
    firstName: 'John',
    middleName: '',
    lastName: 'Doe',
    email: 'john@example.com',
    mobileNo: '1234567890',
    roles: ['Administrator'],
    userRoleIds: [1],
    isActive: true,
    twoFactorEnabled: false,
    twoFactorRequired: false,
    status: 'Active',
    departmentNames: ['Property Tax'],
    departmentIds: ['1'],
    moduleNames: ['Assessment'],
    moduleIds: ['101'],
    moduleAccess: { '1': ['101'] },
  },
  {
    id: '2',
    userId: 2,
    userName: 'janesmith',
    firstName: 'Jane',
    middleName: '',
    lastName: 'Smith',
    email: 'jane@example.com',
    mobileNo: '0987654321',
    roles: ['Staff'],
    userRoleIds: [2],
    isActive: false,
    twoFactorEnabled: false,
    twoFactorRequired: false,
    status: 'Inactive',
    departmentNames: [],
    departmentIds: [],
    moduleNames: [],
    moduleIds: [],
    moduleAccess: {},
  },
];

describe('useUserTable', () => {
  it('should initialize with provided users', () => {
    const { result } = renderHook(() => useUserTable(mockUsers));
    expect(result.current.users).toEqual(mockUsers);
    expect(result.current.filteredUsers).toEqual(mockUsers);
  });

  it('should filter users by search term', () => {
    const { result } = renderHook(() => useUserTable(mockUsers));

    act(() => {
      result.current.setSearchTerm('Jane');
    });

    expect(result.current.filteredUsers).toHaveLength(1);
    expect(result.current.filteredUsers[0].firstName).toBe('Jane');
  });

  it('should handle card filters correctly', () => {
    const { result } = renderHook(() => useUserTable(mockUsers));

    act(() => {
      result.current.handleCardClick('active');
    });

    expect(result.current.cardFilter).toBe('active');
    expect(result.current.filteredUsers).toHaveLength(1);
    expect(result.current.filteredUsers[0].status).toBe('Active');
  });

  it('should clear all filters when card filter is set to "all"', () => {
    const { result } = renderHook(() => useUserTable(mockUsers));

    act(() => {
      result.current.setSearchTerm('Jane');
      result.current.handleCardClick('all');
    });

    expect(result.current.searchTerm).toBe('');
    expect(result.current.cardFilter).toBe('all');
    expect(result.current.filteredUsers).toHaveLength(2);
  });

  it('should synchronize state with props when they change', () => {
    const { result, rerender } = renderHook(
      ({ users, page, search }) => useUserTable(users, 2, page, search),
      {
        initialProps: { users: mockUsers, page: 1, search: '' },
      }
    );

    expect(result.current.pageNumber).toBe(1);
    expect(result.current.searchTerm).toBe('');

    rerender({ users: [mockUsers[0]], page: 2, search: 'John' });

    expect(result.current.users).toHaveLength(1);
    expect(result.current.pageNumber).toBe(2);
    expect(result.current.searchTerm).toBe('John');
  });
});
