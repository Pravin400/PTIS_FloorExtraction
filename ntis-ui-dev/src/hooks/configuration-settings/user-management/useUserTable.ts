import { useEffect, useMemo, useRef, useState } from 'react';
import { User } from '@/types/user-management';

type CardFilter = 'all' | 'active' | 'inactive' | 'highest' | 'lowest';

function normalizeUsers(users: User[] | undefined | null): User[] {
  return Array.isArray(users) ? users : [];
}

function getProductivityScore(user: User): number {
  const deptCount = user?.departmentNames?.length ?? 0;
  const moduleCount = user?.moduleNames?.length ?? 0;

  return deptCount * 10 + moduleCount;
}

export function useUserTable(
  initialUsers: User[],
  initialTotalCount: number = 0,
  initialPageNumber: number = 1,
  initialSearchTerm: string = '',
  initialCardFilter: CardFilter = 'all',
  initialPageSize: number = 10
) {
  const safeInitialUsers = normalizeUsers(initialUsers);

  const [users, setUsers] = useState<User[]>(safeInitialUsers);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [pageNumber, setPageNumber] = useState(initialPageNumber);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [cardFilter, setCardFilter] = useState<CardFilter>(initialCardFilter);
  const [pageSize, setPageSize] = useState(initialPageSize);

  /**
   * Keep previous incoming props in refs.
   *
   * This avoids expensive deep comparison / JSON.stringify on the users array.
   * Server-driven updates usually provide a new array reference when the data changes,
   * so reference comparison is enough and runs in O(1).
   */
  const prevInitialUsersRef = useRef<User[]>(safeInitialUsers);
  const prevTotalCountRef = useRef(initialTotalCount);
  const prevPageNumberRef = useRef(initialPageNumber);
  const prevSearchTermRef = useRef(initialSearchTerm);
  const prevCardFilterRef = useRef<CardFilter>(initialCardFilter);
  const prevPageSizeRef = useRef(initialPageSize);

  useEffect(() => {
    const incomingUsers = normalizeUsers(initialUsers);

    const dataChanged =
      incomingUsers !== prevInitialUsersRef.current ||
      initialTotalCount !== prevTotalCountRef.current;

    const pageChanged = initialPageNumber !== prevPageNumberRef.current;
    const searchChanged = initialSearchTerm !== prevSearchTermRef.current;
    const filterChanged = initialCardFilter !== prevCardFilterRef.current;
    const sizeChanged = initialPageSize !== prevPageSizeRef.current;

    if (dataChanged || pageChanged || searchChanged || filterChanged || sizeChanged) {
      if (dataChanged) {
        setUsers(incomingUsers);
        setTotalCount(initialTotalCount);
      }

      if (pageChanged) {
        setPageNumber(initialPageNumber);
      }

      if (searchChanged) {
        setSearchTerm(initialSearchTerm);
      }

      if (filterChanged) {
        setCardFilter(initialCardFilter);
      }

      if (sizeChanged) {
        setPageSize(initialPageSize);
      }

      prevInitialUsersRef.current = incomingUsers;
      prevTotalCountRef.current = initialTotalCount;
      prevPageNumberRef.current = initialPageNumber;
      prevSearchTermRef.current = initialSearchTerm;
      prevCardFilterRef.current = initialCardFilter;
      prevPageSizeRef.current = initialPageSize;
    }
  }, [
    initialUsers,
    initialTotalCount,
    initialPageNumber,
    initialSearchTerm,
    initialCardFilter,
    initialPageSize,
  ]);

  const { highestUser, lowestUser } = useMemo(() => {
    const validUsers = users.filter(Boolean);

    if (validUsers.length === 0) {
      return {
        highestUser: null as User | null,
        lowestUser: null as User | null,
      };
    }

    let highest = validUsers[0];
    let lowest = validUsers[0];

    for (const user of validUsers) {
      const score = getProductivityScore(user);

      if (score > getProductivityScore(highest)) {
        highest = user;
      }

      if (score < getProductivityScore(lowest)) {
        lowest = user;
      }
    }

    return {
      highestUser: highest,
      lowestUser: lowest?.id === highest?.id ? null : lowest,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();

    return users.filter((user) => {
      if (!user) return false;

      const matchesSearch =
        !normalizedSearch ||
        (user.userName || '').toLowerCase().includes(normalizedSearch) ||
        (user.firstName || '').toLowerCase().includes(normalizedSearch) ||
        (user.lastName || '').toLowerCase().includes(normalizedSearch) ||
        (user.email || '').toLowerCase().includes(normalizedSearch) ||
        (user.roles || []).some((role) => role.toLowerCase().includes(normalizedSearch));

      let matchesCardFilter = true;

      switch (cardFilter) {
        case 'active':
          matchesCardFilter = (user.status || '').toLowerCase() === 'active';
          break;

        case 'inactive':
          matchesCardFilter = (user.status || '').toLowerCase() === 'inactive';
          break;

        case 'highest':
          matchesCardFilter = user.id === highestUser?.id;
          break;

        case 'lowest':
          matchesCardFilter = user.id === lowestUser?.id;
          break;

        case 'all':
        default:
          matchesCardFilter = true;
          break;
      }

      return matchesSearch && matchesCardFilter;
    });
  }, [users, searchTerm, cardFilter, highestUser, lowestUser]);

  const handleCardClick = (filter: CardFilter) => {
    setCardFilter(filter);
    setPageNumber(1);
    setSearchTerm('');
  };

  return {
    users,
    setUsers,

    totalCount,
    setTotalCount,

    searchTerm,
    setSearchTerm,

    cardFilter,
    setCardFilter,

    pageNumber,
    setPageNumber,

    pageSize,

    filteredUsers,
    handleCardClick,
  };
}
