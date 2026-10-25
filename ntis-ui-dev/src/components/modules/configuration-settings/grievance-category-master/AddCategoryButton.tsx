'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AddButton } from '@/components/common/ActionButtons';

interface AddCategoryButtonProps {
  addPath: string;
  label: string;
}

export function AddCategoryButton({ addPath, label }: AddCategoryButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    startTransition(() => {
      router.push(addPath);
    });
  };

  return (
    <AddButton
      onClick={handleClick}
      isLoading={isPending}
      label={label}
      className="cursor-pointer !bg-slate-900 !text-white !rounded-xl h-10 sm:h-10.5 md:h-11 px-4 sm:px-5 md:px-7 font-bold shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 shrink-0 border-none hover:!bg-slate-800"
    />
  );
}
