import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { appConfig } from '@/config/app.config';
import { locales } from '@/i18n/config';
import { getUserIdFromCookies } from '@/lib/utils/cookie';

export type ActionResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  validationErrors?: Record<string, string>;
  statusCode?: number;
};

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const token = cookieStore.get(appConfig.auth.tokenKey)?.value?.trim();
  return token ? token : undefined;
}

export async function getUserId(): Promise<number | undefined> {
  const cookieStore = await cookies();
  return getUserIdFromCookies(cookieStore) ?? undefined;
}

export async function performAction<T>(
  action: () => Promise<T>,
  shouldRevalidate = false
): Promise<ActionResponse<T>> {
  try {
    const data = await action();
    if (shouldRevalidate) {
      for (const locale of locales) {
        revalidatePath(`/${locale}/configuration-settings/screenAccess`, 'page');
      }
    }
    return { success: true, data };
  } catch (error: unknown) {
    let message = 'messages.errorOccurred';
    let statusCode: number | undefined;

    // Attempt to extract translation key from ApiError
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ApiError') {
      const apiError = error as { responseText?: string; message?: string; statusCode?: number };
      statusCode = apiError.statusCode;
      if (
        apiError.responseText &&
        (apiError.responseText.startsWith('errors.') ||
          apiError.responseText.startsWith('messages.'))
      ) {
        message = apiError.responseText;
      } else {
        message = apiError.responseText || apiError.message || message;
      }
    } else if (error instanceof Error) {
      message = error.message;
    }

    return { success: false, message, statusCode };
  }
}
