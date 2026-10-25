import { apiClient } from '@/services/api.service';
import type { ApiResponse } from '@/types/common.types';
import type {
  TwoFactorStatusResponse,
  TwoFactorSetupResponse,
  EnableTwoFactorRequest,
  EnableTwoFactorResponse,
  TwoFactorCodeRequest,
  RecoveryCodesResponse,
  TwoFactorEmailVerificationPendingResponse,
} from '@/types/two-factor.types';

/**
 * Authenticator-app 2FA management for the caller's own account. All calls require the
 * caller's `auth_token` cookie (attached automatically by `apiClient`) — there is no way to
 * target another user's 2FA state through this service.
 */
class TwoFactorService {
  async getStatus(): Promise<ApiResponse<TwoFactorStatusResponse>> {
    return apiClient.get<TwoFactorStatusResponse>('/security/two-factor/status');
  }

  /** Starts (or restarts, if 2FA is already enabled and `isReset` — see {@link reset}) setup. */
  async beginSetup(): Promise<ApiResponse<TwoFactorSetupResponse>> {
    return apiClient.post<TwoFactorSetupResponse>('/security/two-factor/setup');
  }

  /**
   * Confirms the first authenticator code. Proves the caller can operate an authenticator app,
   * but not that it's bound to this account, so this does NOT enable 2FA yet — it emails a
   * one-time code to the caller's registered address. Call {@link confirmEmail} with that code
   * to finish.
   */
  async enable(request: EnableTwoFactorRequest): Promise<ApiResponse<TwoFactorEmailVerificationPendingResponse>> {
    return apiClient.post<TwoFactorEmailVerificationPendingResponse>('/security/two-factor/enable', request);
  }

  /** Confirms the one-time code emailed by {@link enable}. Enables 2FA and returns recovery codes exactly once. */
  async confirmEmail(request: TwoFactorCodeRequest): Promise<ApiResponse<EnableTwoFactorResponse>> {
    return apiClient.post<EnableTwoFactorResponse>('/security/two-factor/confirm-email', request);
  }

  /** Re-verifies a TOTP code and issues a fresh batch of recovery codes. */
  async regenerateRecoveryCodes(
    request: TwoFactorCodeRequest
  ): Promise<ApiResponse<RecoveryCodesResponse>> {
    return apiClient.post<RecoveryCodesResponse>(
      '/security/two-factor/recovery-codes/regenerate',
      request
    );
  }

  /** Disables 2FA after re-verifying a TOTP or recovery code. 204 No Content on success. */
  async disable(request: TwoFactorCodeRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/security/two-factor/disable', request);
  }

  /** Resets the authenticator after re-verifying a TOTP or recovery code; returns new setup data. */
  async reset(request: TwoFactorCodeRequest): Promise<ApiResponse<TwoFactorSetupResponse>> {
    return apiClient.post<TwoFactorSetupResponse>('/security/two-factor/reset', request);
  }
}

export const twoFactorService = new TwoFactorService();
