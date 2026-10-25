import { cookies } from 'next/headers';
import { getUserIdFromCookies } from './cookie';

/**
 * Reusable helper to get user ID from cookie on the server side (Server Components / Actions).
 * Defaults to 0 if cookie is missing or invalid.
 */
export async function getLoggedInUserId(): Promise<number> {
  try {
    const cookieStore = await cookies();
    return getUserIdFromCookies(cookieStore) ?? 0;
  } catch {
    return 0;
  }
}
