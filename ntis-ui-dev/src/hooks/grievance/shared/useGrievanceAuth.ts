'use client';

/**
 * Enterprise Native Cookie-Based Authentication Hook for Grievance Module
 *
 * Adheres strictly to NTIS-UI architecture:
 * Reads user identity and session directly from HTTP cookies via @/lib/utils/cookie.ts.
 * Does NOT require any wrapping React Context Provider.
 */

import { useState, useEffect, useCallback } from 'react';
import { getCookieValue, getUsernameFromCookie } from '@/lib/utils/cookie';
import { AUTH_COOKIES } from '@/components/modules/login/constants';
import { logoutAction } from '@/app/[locale]/login/actions';
import { logoutCitizenAction } from '@/lib/actions/grievance/citizen/citizen-auth.actions';
import { clearCitizenAuthSession } from '@/lib/services/grievance/citizen-auth-session.service';

export interface GrievanceAuthUser {
  id: string;
  name: string;
  username: string;
  role: 'CITIZEN' | 'ADMIN' | 'ENGINEER' | 'WARD_OFFICER' | string;
  phone?: string;
  mobile?: string;
  email?: string;
  address?: string;
}

export interface UseGrievanceAuthReturn {
  user: GrievanceAuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isVerified: boolean;
  logout: () => Promise<void>;
}

export function useAuth(): UseGrievanceAuthReturn {
  const [user, setUser] = useState<GrievanceAuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync state from NTIS-UI cookies on mount and storage events
  const syncFromCookies = useCallback(() => {
    // 1. Prioritize Citizen Session (Public citizen OTP login)
    const citizenLoggedIn = getCookieValue('citizen_is_logged_in') === 'true';
    const citizenMobile = getCookieValue('citizen_mobile');
    const citizenNameRaw = getCookieValue('citizen_name');
    const citizenName = citizenNameRaw ? decodeURIComponent(citizenNameRaw) : '';
    const citizenId = getCookieValue('citizen_id') || 'citizen_user';
    const citizenTokenExpRaw = getCookieValue('citizen_token_exp');
    const citizenTokenExp = citizenTokenExpRaw ? Number(citizenTokenExpRaw) : null;
    // Session is only expired if an active expiration timestamp is strictly in the past
    const isCitizenExpired = Boolean(citizenTokenExp && Math.floor(Date.now() / 1000) >= citizenTokenExp);

    if (citizenLoggedIn && citizenMobile && !isCitizenExpired) {
      setIsAuthenticated(true);
      setUser({
        id: citizenId,
        name: citizenName,
        username: citizenMobile,
        phone: citizenMobile,
        mobile: citizenMobile,
        role: 'CITIZEN',
      });
      setIsLoading(false);
      return;
    } else if (citizenLoggedIn && isCitizenExpired) {
      // Clear expired citizen login cookies
      try {
        document.cookie = 'citizen_is_logged_in=; path=/; max-age=0';
        document.cookie = 'citizen_token=; path=/; max-age=0';
        document.cookie = 'citizen_token_exp=; path=/; max-age=0';
      } catch {}
    }

    // 2. Municipal Officer / Admin Session (central NTIS portal login)
    const isStaffLoggedIn = getCookieValue(AUTH_COOKIES.IS_LOGGED_IN) === 'true';
    const userId = getCookieValue(AUTH_COOKIES.USER_ID);
    const userName = getUsernameFromCookie() || getCookieValue(AUTH_COOKIES.LOGIN_USERNAME);
    const loginUsername = getCookieValue(AUTH_COOKIES.LOGIN_USERNAME) || userName || 'officer';
    const rawRole = getCookieValue('user_role') || getCookieValue('role') || getCookieValue('userRole');
    const resolvedRole = rawRole ? rawRole.toUpperCase() : 'ADMIN';

    if (isStaffLoggedIn) {
      setIsAuthenticated(true);
      setUser({
        id: userId || 'ntis_user',
        name: userName || loginUsername || 'NTIS Officer',
        username: loginUsername,
        role: resolvedRole, // Preserves granular roles (STAFF, ENGINEER, ADMIN)
      });
      setIsLoading(false);
      return;
    }

    setIsAuthenticated(false);
    setUser(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => syncFromCookies(), 0);
    const handleAuthChange = () => syncFromCookies();
    window.addEventListener('citizen-auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('citizen-auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [syncFromCookies]);

  /**
   * Enterprise logout using NTIS server logout action
   */
  const logout = useCallback(async () => {
    const isCitizen = user?.role === 'CITIZEN' || getCookieValue('citizen_is_logged_in') === 'true';

    clearCitizenAuthSession();

    if (isCitizen) {
      try {
        await logoutCitizenAction();
      } catch {
        // Best-effort client fallback
      }
    } else {
      try {
        await logoutAction();
      } catch {
        // Best-effort client fallback
      }
    }

    setIsAuthenticated(false);
    setUser(null);
  }, [user?.role]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isVerified: isAuthenticated,
    logout,
  };
}

export default useAuth;
