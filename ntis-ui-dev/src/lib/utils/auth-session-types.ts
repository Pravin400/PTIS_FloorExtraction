export type SessionValidity = 'active' | 'expired' | 'missing';

export type AuthSessionTokens = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
};
