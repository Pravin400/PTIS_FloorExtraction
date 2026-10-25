import { LoginForm } from '@/components/modules/login/LoginForm';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import type { LoginFormCopy, LoginPageProps } from '@/types/login.types';
import { fetchLoginBrandingAction } from '@/app/[locale]/login/actions';
import { resolveLoginPageErrorI18nSuffix } from '@/lib/utils/login-page-errors';
import { LanguageDropdown } from '@/components/common';

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations({ locale, namespace: 'login' });

  const usernameRaw = resolvedSearchParams?.username;
  const username =
    typeof usernameRaw === 'string'
      ? usernameRaw
      : Array.isArray(usernameRaw)
        ? usernameRaw[0] || ''
        : '';

  let errorMessage = '';
  const errParam = resolvedSearchParams?.error;
  const msgParam = resolvedSearchParams?.message;
  const reqVerParam = resolvedSearchParams?.requireVerification;
  const errStr =
    typeof errParam === 'string' ? errParam : Array.isArray(errParam) ? errParam[0] : undefined;
  const msgStr =
    typeof msgParam === 'string' ? msgParam : Array.isArray(msgParam) ? msgParam[0] : undefined;
  const reqVerStr =
    typeof reqVerParam === 'string'
      ? reqVerParam
      : Array.isArray(reqVerParam)
        ? reqVerParam[0]
        : undefined;

  const i18nSuffix = resolveLoginPageErrorI18nSuffix(errStr, msgStr, reqVerStr);
  if (i18nSuffix) {
    try {
      errorMessage = t(`errors.${i18nSuffix}`);
    } catch {
      errorMessage = '';
    }
  }

  const resentRaw = resolvedSearchParams?.resent;
  const showResent = resentRaw === '1' || (Array.isArray(resentRaw) && resentRaw[0] === '1');
  const infoMessage = showResent ? t('tokenResentFlash') : '';

  const { ulbData } = await fetchLoginBrandingAction();

  const backgroundSrc = ulbData?.ulbBackground || '';

  const copy: LoginFormCopy = {
    loginTitle: t('title'),
    username: t('username'),
    usernamePlaceholder: t('usernamePlaceholder'),
    password: t('password'),
    passwordPlaceholder: t('passwordPlaceholder'),
    signIn: t('signIn'),
    showPassword: t('showPassword'),
    hidePassword: t('hidePassword'),
    forgotPassword: t('forgotPassword'),
    capsLockOn: t('capsLockOn'),
  };

  const backgroundStyle = backgroundSrc
    ? { backgroundImage: `url(${backgroundSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-100 via-cyan-100 to-blue-100 transition-all duration-500"
      style={backgroundStyle}
    >
      <div className="absolute top-4 right-4 z-50">
        <LanguageDropdown />
      </div>
      <div className="flex min-h-full w-full flex-col items-center justify-center p-4 md:p-6">
        <LoginForm
          key={`${locale}-${username}`}
          username={username}
          locale={locale}
          errorMessage={errorMessage}
          infoMessage={infoMessage}
          ulbData={ulbData}
          copy={copy}
        />
      </div>
    </div>
  );
}
