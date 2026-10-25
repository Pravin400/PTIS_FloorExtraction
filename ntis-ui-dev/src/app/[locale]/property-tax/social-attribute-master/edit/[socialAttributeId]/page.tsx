import { default as SocialAttributeForm } from '@/components/modules/property-tax/social-attribute-master/SocialAttributeForm';
import {
  getSocialAttributeByIdAction,
  fetchAllActiveSocialAttributesAction,
  fetchAllSocialAttributesAction,
} from '../../action';
import { notFound } from 'next/navigation';
import React from 'react';
import type { SocialAttribute } from '@/types/social-attribute.types';
import { ApiError } from '@/lib/utils/api';
import { logger } from '@/lib/utils/logger';

interface PageProps {
  params: Promise<{
    socialAttributeId: string;
  }>;
}

export default async function EditPage({ params }: PageProps): Promise<React.ReactElement> {
  const { socialAttributeId: socialAttributeIdParam } = await params;

  const socialAttributeId = Number(socialAttributeIdParam);
  if (!Number.isFinite(socialAttributeId) || socialAttributeId <= 0) {
    notFound();
  }

  let socialAttributeData: SocialAttribute;
  let activeAttributes: SocialAttribute[] = [];
  let allAttributes: SocialAttribute[] = [];
  try {
    const [data, list, all] = await Promise.all([
      getSocialAttributeByIdAction(socialAttributeId),
      fetchAllActiveSocialAttributesAction(),
      fetchAllSocialAttributesAction(),
    ]);
    socialAttributeData = data;
    activeAttributes = list;
    allAttributes = all;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    logger.error('Failed to fetch social attribute', { error: error as Error });
    throw error;
  }

  return (
    <>
      <SocialAttributeForm
        id={socialAttributeId}
        initialData={socialAttributeData}
        parentAttributes={activeAttributes}
        existingAttributes={allAttributes}
      />
    </>
  );
}
