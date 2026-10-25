'use client';

import { useTransition, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Pencil, Menu } from 'lucide-react';
import { Button } from '@/components/common';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { useActivePagePermissions } from '@/hooks/useActivePagePermissions';

interface ConfigItemActionsProps {
  id: string;
  configKeyId: number;
  isEnabled: boolean;
}

export function ConfigItemActions({ id, configKeyId, isEnabled }: ConfigItemActionsProps) {
  const t = useTranslations('configMaster');
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<'edit' | 'delete' | 'config' | null>(null);
  
  const { canEdit, haveFullAccess } = useActivePagePermissions();
  const showEdit = canEdit || haveFullAccess;

  const handleEditKey = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveAction('edit');
    startTransition(async () => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('editKey', id);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      setActiveAction(null);
    });
  };


  const handleConfigClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEnabled) return;
    setActiveAction('config');
    startTransition(async () => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('configKeyId', configKeyId.toString());
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      setActiveAction(null);
    });
  };

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {showEdit && (
        <Button
          variant="ghost"
          size="xs"
          icon={isPending && activeAction === 'edit' ? undefined : Pencil}
          disabled={isPending}
          isLoading={isPending && activeAction === 'edit'}
          className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer rounded-lg shrink-0"
          onClick={handleEditKey}
          title="Edit Key"
        />
      )}

      <Button
        variant="secondary"
        size="sm"
        icon={isPending && activeAction === 'config' ? undefined : Menu}
        onClick={handleConfigClick}
        disabled={!haveFullAccess || !isEnabled || isPending}
        isLoading={isPending && activeAction === 'config'}
        className={cn(
          'h-8 text-xs font-semibold gap-1.5 px-2.5 sm:px-3 shadow-sm transition-all cursor-pointer rounded-lg shrink-0',
          haveFullAccess && isEnabled
            ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            : 'bg-slate-50 text-slate-400 border-slate-100'
        )}
      >
        <span>{t('list.config')}</span>
      </Button>
    </div>
  );
}
