import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppConfig } from '@/config/app.config';
import { logger } from '@/lib/utils/logger';
import { getTranslations } from 'next-intl/server';

export async function POST(request: NextRequest) {
  let t;
  try {
    t = await getTranslations('commonDetailsUpdate');
  } catch (_err) {
    t = (key: string) => key;
  }

  try {
    const formData = await request.formData();
    const file = formData.get('File');
    const updateCode = formData.get('UpdateCode');

    if (!file || !updateCode) {
      return NextResponse.json(
        { error: t('messages.missingParameters') },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: t('messages.unauthorized') },
        { status: 401 }
      );
    }

    const config = getAppConfig();
    const backendUrl = `${config.api.baseUrl.replace(/\/$/, '')}/CommonDetails/import-excel`;

    logger.info('[Common Details Excel Import] Proxying upload request', { backendUrl, updateCode });

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });

    const responseText = await response.text();
    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    logger.error('[Common Details Excel Import] Unexpected error', { error: error as Error });
    return NextResponse.json(
      { error: t('messages.excelImportError') },
      { status: 500 }
    );
  }
}
