'use client';
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common';

export function SubAssetBackButton(): React.ReactElement {
  const router = useRouter();

  return (
    <Button
      variant="secondary"
      onClick={() => router.back()}
      className="flex items-center justify-center p-2 bg-white border border-slate-200 rounded-md shadow-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
      title="Go Back"
    >
      <ArrowLeft className="w-5 h-5" />
    </Button>
  );
}
