import { cookies } from 'next/headers';

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const headers: Record<string, string> = {
    'Accept': 'application/json, text/plain, */*',
  };
  const token = cookieStore.get('auth_token')?.value;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const csrf = cookieStore.get('csrf_token')?.value;
  if (csrf) headers['X-CSRF-Token'] = csrf;
  
  const cookieStr = cookieStore.getAll()
    .filter(c => /auth_token|refresh_token|session_id|csrf_token|\.AspNetCore\.Antiforgery/.test(c.name))
    .map(c => `${c.name.replace(/[^\x00-\x7F]/g, '')}=${c.value.replace(/[^\x00-\x7F]/g, '')}`)
    .join('; ');
  if (cookieStr) headers['Cookie'] = cookieStr;
  
  return headers;
}
