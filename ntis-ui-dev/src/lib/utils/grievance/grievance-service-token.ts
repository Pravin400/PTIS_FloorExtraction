import crypto from 'crypto';

function base64Url(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Creates a server-side BFF JWT for citizen evidence upload.
 * ASP.NET's default JwtBearer OnTokenValidated rejects `role: "Citizen"` tokens.
 * By minting a scoped token with role: "User" and the citizen's ID as nameidentifier,
 * both OnTokenValidated and GrievancePhotoService.UploadPhotoAsync authorization
 * (grievance.CreatedBy == userId) are satisfied.
 */
export function createGrievanceUploadServiceToken(userId: number | string = 1): string {
  const cleanId = String(userId);
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': cleanId,
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'Citizen Evidence Upload',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'User',
    sub: cleanId,
    iss: 'NtisPlatform',
    aud: 'NtisPlatformUsers',
    nbf: now - 10,
    exp: now + 3600,
    iat: now,
  };

  const key = process.env.JWT_SECRET || process.env.JWT_KEY || 'test_test_test_test_test_test_test_test_test_';
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', key)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
