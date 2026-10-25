'use client';

import type { ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MessageSquare } from 'lucide-react';
import { Drawer } from '@/components/common';
import type { GrievanceCategoryDrawerClientProps } from '@/types/grievance-category-master/grievanceCategory.types';

export function GrievanceCategoryDrawerClient({
  children,
  isEdit = false,
  returnPath,
}: GrievanceCategoryDrawerClientProps): ReactElement {
  const router = useRouter();
  const t = useTranslations('grievanceCategory.form');

  const handleClose = (): void => {
    router.replace(returnPath ?? '/configuration-settings/grievance-category-master');
  };

  return (
    <div className="[&_[role='button']]:bg-black/[0.08]! [&_[role='button']]:backdrop-blur-[1px]! light">
      <Drawer
        open={true}
        onClose={handleClose}
        width="md"
        title={
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-linear-to-br from-[#4b70a6] to-[#3d5a8a] rounded-lg shadow-sm">
                <MessageSquare className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold text-[#1e3a8a] tracking-tight">
                {isEdit ? t('editTitle') : t('addTitle')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium pl-[56px] -mt-1">
              {isEdit ? t('editDesc') : t('addDesc')}
            </p>
          </div>
        }
      >
        <div className="light">
          {children}
          <style dangerouslySetInnerHTML={{ __html: LIGHT_MODE_OVERRIDES }} />
        </div>
      </Drawer>
    </div>
  );
}

const LIGHT_MODE_OVERRIDES = `
  .light .dark\\:text-slate-500 { color: #94a3b8 !important; }
  .light .dark\\:text-gray-200 { color: #374151 !important; }
  .light .dark\\:border-slate-700\\/30 { border-color: rgba(226, 232, 240, 0.6) !important; }
  .light .dark\\:bg-slate-800\\/20 { background-color: rgba(248, 250, 252, 0.5) !important; }
  .light .dark\\:bg-blue-900\\/10 { background-color: rgba(239, 246, 255, 0.3) !important; }
  .light .dark\\:bg-slate-800\\/50 { background-color: rgba(241, 245, 249, 0.5) !important; }
  .light .dark\\:border-slate-700 { border-color: rgb(226, 232, 240) !important; }
  .light .dark\\:bg-emerald-900\\/20 { background-color: rgb(240, 253, 244) !important; }
  .light .dark\\:text-emerald-400 { color: rgb(5, 150, 105) !important; }
  .light .dark\\:border-emerald-900\\/30 { border-color: rgb(220, 252, 231) !important; }
  .light .dark\\:bg-slate-700 { background-color: rgb(226, 232, 240) !important; }
  .light .dark\\:text-slate-400 { color: rgb(100, 116, 139) !important; }
  .light .dark\\:border-slate-600 { border-color: rgb(203, 213, 225) !important; }
  .light .dark\\:text-white { color: rgb(15, 23, 42) !important; }
  .light .dark\\:text-slate-300 { color: rgb(51, 65, 85) !important; }
  .light .dark\\:text-slate-400 { color: rgb(100, 116, 139) !important; }
  .light .dark\\:text-slate-500 { color: rgb(148, 163, 184) !important; }
`;
