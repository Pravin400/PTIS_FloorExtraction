/**
 * Citizen Authentication Session Service
 * Manages citizen session cookies and dispatches client-side auth state notifications.
 * Path: src/lib/services/grievance/citizen-auth-session.service.ts
 */

import type { VerifyOtpResponse } from '@/types/grievance/citizen-auth.types';
import { clearTrackingStorage } from './tracking-storage.service';

export interface CitizenSessionData {
  isLoggedIn: boolean;
  name: string | null;
  mobileNo: string | null;
  citizenId: number | null;
}

export interface UseCitizenAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (authData: VerifyOtpResponse) => void;
  initialMobileNo?: string;
  initialName?: string;
  purpose?: string;
  moduleCode?: string;
  referenceId?: string;
}

export const CitizenAuthSessionService = {
  /**
   * Save citizen authentication credentials to cookies and notify listeners.
   */
  saveSession(authData: VerifyOtpResponse): void {
    if (typeof document === 'undefined') return;

    const maxAge = 7 * 24 * 60 * 60; // 7 days
    document.cookie = `citizen_is_logged_in=true; path=/; max-age=${maxAge}; SameSite=Lax`;

    if (authData.token) {
      document.cookie = `citizen_token=${encodeURIComponent(authData.token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
    if (authData.name) {
      document.cookie = `citizen_name=${encodeURIComponent(authData.name)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
    if (authData.mobileNo) {
      document.cookie = `citizen_mobile=${encodeURIComponent(authData.mobileNo)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
    const resolvedCitizenId =
      authData.citizenId ?? authData.CitizenId ?? authData.id ?? authData.Id;
    if (resolvedCitizenId) {
      document.cookie = `citizen_id=${encodeURIComponent(String(resolvedCitizenId))}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
    if (authData.token) {
      try {
        const parts = authData.token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          if (payload?.exp) {
            document.cookie = `citizen_token_exp=${payload.exp}; path=/; max-age=${maxAge}; SameSite=Lax`;
          }
        }
      } catch {}
    }

    window.dispatchEvent(new CustomEvent('citizen-auth-change', { detail: authData }));
  },

  /**
   * Clear citizen authentication session cookies and notify listeners.
   */
  clearSession(): void {
    if (typeof document === 'undefined') return;

    clearTrackingStorage();

    const expireCookie = '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax';
    document.cookie = `citizen_is_logged_in${expireCookie}`;
    document.cookie = `citizen_token${expireCookie}`;
    document.cookie = `citizen_token_exp${expireCookie}`;
    document.cookie = `citizen_name${expireCookie}`;
    document.cookie = `citizen_mobile${expireCookie}`;
    document.cookie = `citizen_id${expireCookie}`;

    window.dispatchEvent(new CustomEvent('citizen-auth-change', { detail: { event: 'LOGOUT' } }));
  },

  /**
   * Persist in-flight OTP session to prevent accidental loss on modal dismissal
   */
  savePendingOtp(session: {
    mobileNo: string;
    maskedMobileNo: string;
    name?: string;
    purpose?: string;
    moduleCode?: string;
    referenceId?: string;
    sentAt: number;
  }): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem('pending_citizen_otp', JSON.stringify(session));
    } catch {}
  },

  getPendingOtp(): {
    mobileNo: string;
    maskedMobileNo: string;
    name?: string;
    purpose?: string;
    moduleCode?: string;
    referenceId?: string;
    sentAt: number;
  } | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = sessionStorage.getItem('pending_citizen_otp');
      if (!data) return null;
      const parsed = JSON.parse(data);
      if (Date.now() - parsed.sentAt < 15 * 60 * 1000) {
        return parsed;
      }
      sessionStorage.removeItem('pending_citizen_otp');
      return null;
    } catch {
      return null;
    }
  },

  clearPendingOtp(): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem('pending_citizen_otp');
    } catch {}
  },
};

export const saveCitizenAuthSession = CitizenAuthSessionService.saveSession;
export const clearCitizenAuthSession = CitizenAuthSessionService.clearSession;
export const savePendingCitizenOtp = CitizenAuthSessionService.savePendingOtp;
export const getPendingCitizenOtp = CitizenAuthSessionService.getPendingOtp;
export const clearPendingCitizenOtp = CitizenAuthSessionService.clearPendingOtp;
