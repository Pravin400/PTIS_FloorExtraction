'use client';

import { useState, useCallback } from 'react';
import { getCookieValue } from '@/lib/utils/cookie';
import { sanitizeCitizenName } from '@/lib/utils/grievance/citizen-form-validation';

interface UseCitizenContactStateProps {
  user: { name?: string | null; phone?: string | null } | null;
  isEditMode: boolean;
}

export function useCitizenContactState({ user, isEditMode }: UseCitizenContactStateProps) {
  const [fullName, setFullNameState] = useState(() => {
    if (user?.name) return sanitizeCitizenName(user.name);
    const isLoggedIn = getCookieValue('citizen_is_logged_in') === 'true';
    if (!isLoggedIn) return '';
    const cookieName = getCookieValue('citizen_name');
    return cookieName ? sanitizeCitizenName(decodeURIComponent(cookieName)) : '';
  });

  const setFullName = useCallback((v: string) => {
    setFullNameState(sanitizeCitizenName(v));
  }, []);

  const [mobile, setMobileState] = useState(() => {
    if (user?.phone) return user.phone.replace(/\D/g, '').slice(-10);
    const isLoggedIn = getCookieValue('citizen_is_logged_in') === 'true';
    if (!isLoggedIn) return '';
    const cookieMobile = getCookieValue('citizen_mobile');
    return cookieMobile ? cookieMobile.replace(/\D/g, '').slice(-10) : '';
  });

  const setMobile = useCallback((v: string) => {
    setMobileState(v.replace(/\D/g, '').slice(0, 10));
  }, []);

  const userKey = `${user?.phone || ''}-${user?.name || ''}`;
  const [prevUserKey, setPrevUserKey] = useState(userKey);
  if (!isEditMode && prevUserKey !== userKey) {
    setPrevUserKey(userKey);
    const isLoggedIn = getCookieValue('citizen_is_logged_in') === 'true';
    if (user?.phone) {
      const clean = user.phone.replace(/\D/g, '').slice(-10);
      setMobileState(clean);
    } else if (isLoggedIn) {
      const cookieMobile = getCookieValue('citizen_mobile');
      if (cookieMobile) {
        const clean = cookieMobile.replace(/\D/g, '').slice(-10);
        setMobileState(clean);
      }
    } else {
      setMobileState('');
    }

    if (user?.name) {
      setFullName(user.name);
    } else if (isLoggedIn) {
      const cookieName = getCookieValue('citizen_name');
      if (cookieName) setFullName(decodeURIComponent(cookieName));
    } else {
      setFullName('');
    }
  }

  return {
    fullName,
    setFullName,
    mobile,
    setMobile,
    setMobileState
  };
}
