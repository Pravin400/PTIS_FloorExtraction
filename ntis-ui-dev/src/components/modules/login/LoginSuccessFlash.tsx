'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

const LOGIN_SUCCESS_PARAM = 'loginSuccess';

/**
 * Shows a one-time toast after successful login (redirect from `completeLoginSession`).
 */
export function LoginSuccessFlash() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('login');
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    if (searchParams.get(LOGIN_SUCCESS_PARAM) !== '1') return;

    handledRef.current = true;
    toast.success(t('loginSuccess'));

    const params = new URLSearchParams(searchParams.toString());
    params.delete(LOGIN_SUCCESS_PARAM);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [searchParams, pathname, router, t]);

  return null;
}
