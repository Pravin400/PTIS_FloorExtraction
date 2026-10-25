import React from 'react';
import type { RetrospectiveRuleLibraryProps } from '@/types/retrospective-rule.types';
import { RetrospectiveRuleLibraryClient } from './RetrospectiveRuleLibraryClient';

export const RetrospectiveRuleLibrary: React.FC<RetrospectiveRuleLibraryProps> = (props) => {
  return <RetrospectiveRuleLibraryClient {...props} />;
};
