import { default as SocialAttributeForm } from '@/components/modules/property-tax/social-attribute-master/SocialAttributeForm';
import { fetchAllActiveSocialAttributesAction, fetchAllSocialAttributesAction } from '../action';
import React from 'react';

export default async function AddPage(): Promise<React.ReactElement> {
  const [activeAttributes, allAttributes] = await Promise.all([
    fetchAllActiveSocialAttributesAction(),
    fetchAllSocialAttributesAction(),
  ]);
  return (
    <SocialAttributeForm
      id={null}
      initialData={undefined}
      parentAttributes={activeAttributes}
      existingAttributes={allAttributes}
    />
  );
}
