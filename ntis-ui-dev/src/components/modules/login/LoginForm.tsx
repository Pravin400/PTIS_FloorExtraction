import { Card, CardContent, CardHeader } from '@/components/common';

import type { LoginFormProps } from '@/types/login.types';

import { UlbBrandingHeader } from './UlbBrandingHeader';
import { LoginFormClient } from './LoginFormClient';

/**
 * Server Component shell: branding and copy are rendered on the server.
 * Interactive login (form, action state, motion) lives in `LoginFormClient`.
 */
export function LoginForm({ copy, ulbData, ...clientProps }: LoginFormProps) {
  return (
    <div className="w-full max-w-md">
      <Card className="overflow-hidden rounded-2xl border border-white/40 bg-white/80 shadow-2xl backdrop-blur-md transition-all duration-500 ease-in-out">
        <CardHeader className="flex flex-col items-center space-y-1 pb-2 pt-6 sm:pt-8 text-center">
          <UlbBrandingHeader ulbData={ulbData} />

          <div className="pt-1 text-sm font-bold uppercase tracking-[0.2em] text-cyan-600">
            {copy.loginTitle}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 px-6 sm:px-8 pb-8 sm:pb-10 pt-4">
          <LoginFormClient copy={copy} {...clientProps} />
        </CardContent>
      </Card>
    </div>
  );
}
