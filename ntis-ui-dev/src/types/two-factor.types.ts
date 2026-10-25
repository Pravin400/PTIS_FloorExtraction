/**
 * Authenticator-app (TOTP) two-factor authentication — self-service security settings.
 * Mirrors the backend's `api/security/two-factor/*` DTOs.
 */

/** GET `/security/two-factor/status` — never includes the authenticator secret. */
export interface TwoFactorStatusResponse {
  isEnabled: boolean;
  recoveryCodesRemaining: number;
  hasAuthenticatorKey: boolean;
}

/** POST `/security/two-factor/setup` and `/security/two-factor/reset` — response shape. */
export interface TwoFactorSetupResponse {
  sharedKey: string;
  authenticatorUri: string;
  issuer: string;
  accountName: string;
}

/** POST `/security/two-factor/enable` — request body. */
export interface EnableTwoFactorRequest {
  code: string;
}

/** POST `/security/two-factor/enable` — response shape. Recovery codes are shown exactly once. */
export interface EnableTwoFactorResponse {
  isEnabled: boolean;
  recoveryCodes: string[];
}

/**
 * POST `/security/two-factor/disable`, `/security/two-factor/reset`, and
 * `/security/two-factor/recovery-codes/regenerate` — shared request body. Disable/reset accept
 * either a TOTP code or a recovery code; regenerate accepts a TOTP code only.
 */
export interface TwoFactorCodeRequest {
  code: string;
}

/** POST `/security/two-factor/recovery-codes/regenerate` — response shape. */
export interface RecoveryCodesResponse {
  recoveryCodes: string[];
}

/**
 * POST `/users/{id}/2fa/enable` (admin-assisted enrollment only) — response shape once the TOTP
 * code is confirmed. 2FA is NOT enabled yet at this point: a one-time code has been emailed to
 * the target's registered address, and enabling only completes once that's confirmed via
 * POST `/users/{id}/2fa/confirm-email` (which reuses {@link EnableTwoFactorResponse} on success).
 */
export interface TwoFactorEmailVerificationPendingResponse {
  maskedEmail: string;
}
