'use client';
import type { DocumentsSectionProps } from '@/types/asset/municipal-Asset/asset-detail.types';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { SectionCard } from './SectionCard';
import { FolderOpen, Folder } from 'lucide-react';
import { Button } from '@/components/common';
import { DocumentViewerModal } from '@/components/common';
import { DocumentThumb } from './DocumentThumb';
import { DocumentsDrawer, type DrawerItem } from './DocumentsDrawer';

export function DocumentsSection({ data }: DocumentsSectionProps): React.ReactElement {
  const t = useTranslations('asset-detail');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewerState, setViewerState] = useState<{ open: boolean; url: string; name: string }>({ open: false, url: '', name: '' });

  const groups = React.useMemo(() => {
    const map: Record<string, DrawerItem[]> = { 'DOCUMENTS': [] };

    if (data.documents) {
      data.documents.forEach((doc, idx) => {
        let docType = (doc.type || 'DOC').toUpperCase();
        if (docType.includes('PDF')) docType = 'PDF';
        else if (docType.includes('IMAGE') || docType.includes('JPEG') || docType.includes('JPG') || docType.includes('PNG')) docType = 'JPG';

        map['DOCUMENTS'].push({
          id: doc.id || `doc-${idx}`,
          name: doc.name || t('document'),
          url: doc.url || '',
          type: docType,
          isImage: doc.icon === 'image',
        });
      });
    }
    
    if (map['DOCUMENTS'].length === 0) {
      delete map['DOCUMENTS'];
    }

    return map;
  }, [data, t]);

  const totalFiles = Object.values(groups).reduce((acc, curr) => acc + curr.length, 0);

  /** Show first 7 documents as thumbnails */
  const previewDocs = data.documents.slice(0, 7);

  return (
    <>
      <SectionCard
        title={t('documentsEvidence')}
        titleIcon={<Folder className="w-3.5 h-3.5 text-white" />} iconBgClass="bg-fuchsia-500"
        headerRight={
          previewDocs.length > 0 ? (
            <Button
              variant="secondary"
              className="!text-[9px] !font-bold !text-blue-600 !border-blue-200 !bg-white !rounded-full !px-2 !h-4 flex items-center hover:!bg-blue-50 transition-colors"
              onClick={() => setDrawerOpen(true)}
              aria-label={t('viewAll')}
            >
              {t('viewAll')}
            </Button>
          ) : undefined
        }
      >
        <div className="flex gap-3 flex-wrap">
          {previewDocs.length > 0 ? (
            previewDocs.map((doc, i) => (
              <DocumentThumb
                key={doc.id}
                doc={doc}
                index={i}
                onClick={() => {
                  if (doc.url) {
                    setViewerState({ open: true, url: doc.url, name: doc.name });
                  }
                }}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full min-h-[80px] text-slate-400">
              <FolderOpen className="w-8 h-8 mb-2 opacity-20" />
              <span className="text-[10px] font-medium">{t('noDocumentsAvailable')}</span>
            </div>
          )}
        </div>
      </SectionCard>

      <DocumentsDrawer
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        totalFiles={totalFiles}
        groups={groups}
        setViewerState={setViewerState}
      />

      <DocumentViewerModal
        isOpen={viewerState.open}
        onClose={() => setViewerState(prev => ({ ...prev, open: false }))}
        fileUrl={viewerState.url}
        fileName={viewerState.name}
      />
    </>
  );
}
