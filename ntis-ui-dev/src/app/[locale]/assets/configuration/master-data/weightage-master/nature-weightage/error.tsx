'use client';

import { useEffect } from 'react';
import { ErrorPage } from '@/components/common';
import { useWeightageMasterError } from '@/components/modules/assets/configuration/master-data/weightage-mastercv/WeightageMasterErrorContext';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function NatureWeightageError({ error, reset }: ErrorProps) {
  const { setHasError } = useWeightageMasterError();

  useEffect(() => {
    setHasError(true);
    return () => setHasError(false);
  }, [setHasError]);

  return (
    <ErrorPage
      error={error}
      reset={reset}
      translationNamespace="assetWeightageMaster.nature.error"
    />
  );
}
