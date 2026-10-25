'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Image as ImageIcon, Download, Eye, Folder } from 'lucide-react';
import { getDownloadDocumentUrl } from '@/lib/utils/document-utils';
import { Button } from '@/components/common';
import { Drawer } from '@/components/common';

export type DrawerItem = { id: string; name: string; url: string; type: string; isImage: boolean };

export interface DocumentsDrawerProps {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  totalFiles: number;
  groups: Record<string, DrawerItem[]>;
  setViewerState: (state: { open: boolean; url: string; name: string }) => void;
}

export function DocumentsDrawer({
  drawerOpen,
  setDrawerOpen,
  totalFiles,
  groups,
  setViewerState,
}: DocumentsDrawerProps): React.ReactElement {
  const t = useTranslations('asset-detail');

  return (
    <Drawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      width="md"
      title={
        <div className="flex items-center gap-2 text-[#0f3482]">
          <Folder className="w-5 h-5 font-black" />
          <span className="text-[14px] font-black tracking-wide uppercase">{t('allDocuments')} ({totalFiles})</span>
        </div>
      }
    >
      <div className="space-y-5 p-5">
        <div className="space-y-3 pb-8">
          {Object.entries(groups).map(([groupName, files]) => (
            <React.Fragment key={groupName}>
              {files.map((file) => (
                <div key={file.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-row flex-wrap items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                    <div className="w-12 h-12 rounded border border-slate-200 bg-slate-50 flex flex-col items-center justify-center shrink-0 shadow-sm">
                      {file.isImage ? <ImageIcon className="w-5 h-5 mb-0.5 text-blue-500" /> : <FileText className="w-5 h-5 mb-0.5 text-red-500" />}
                      <span className="text-[9px] font-black text-slate-500 uppercase">{file.type}</span>
                    </div>
                    <div className="flex flex-col justify-center flex-1 min-w-0">
                      <span className="text-[13px] font-bold text-[#0f3482] break-words line-clamp-2" title={file.name}>{file.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    <Button
                      variant="primary"
                      icon={Eye}
                      iconPosition="left"
                      onClick={() => setViewerState({ open: true, url: file.url, name: file.name })}
                      disabled={!file.url}
                      className="px-4 py-1.5 rounded-md shadow-sm !h-auto text-[10px] font-bold tracking-wide"
                    >
                      VIEW
                    </Button>
                    <Button
                      variant="outline"
                      icon={Download}
                      iconPosition="left"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = getDownloadDocumentUrl(file.id);
                        a.download = file.name;
                        a.target = '_blank';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                      disabled={!file.id}
                      className="px-4 py-1.5 rounded-md shadow-sm !h-auto text-[10px] font-bold tracking-wide"
                    >
                      DOWNLOAD
                    </Button>
                  </div>
                </div>
              ))}
            </React.Fragment>
          ))}
          {totalFiles === 0 && (
            <div className="text-center text-slate-500 text-sm font-medium py-4">
              {t('noDocumentsAvailable', { defaultValue: 'No files available' })}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
