'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Download,
  ExternalLink,
  FileText,
  ShieldCheck,
  File,
  Eye,
} from 'lucide-react';
import { Button, Modal } from '@/components/common';

export interface AssetDocumentModalItem {
  id: string | number;
  name: string;
  groupName: string;
  fileName?: string;
  contentType?: string;
  isPdf?: boolean;
  isImage?: boolean;
  url?: string;
}

export interface AssetDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetTitle?: string;
  documents?: AssetDocumentModalItem[];
  isLoading?: boolean;
  initialMediaType?: 'photo' | 'document';
}

interface ActiveItemSelection {
  documents: AssetDocumentModalItem[];
  initialMediaType: 'photo' | 'document';
  index: number;
}

export function AssetDocumentsModal({
  isOpen,
  onClose,
  assetTitle = '',
  documents = [],
  isLoading = false,
  initialMediaType = 'photo',
}: AssetDocumentsModalProps) {
  const t = useTranslations('assetRegister');
  const [selection, setSelection] = useState<ActiveItemSelection | null>(null);

  const preferredItemIndex = initialMediaType === 'document'
    ? documents.findIndex((document) =>
        document.isPdf || !document.groupName?.toLowerCase().includes('photo')
      )
    : documents.findIndex((document) =>
        document.groupName?.toLowerCase().includes('photo')
      );
  const selectedItemIndex = selection?.documents === documents &&
    selection.initialMediaType === initialMediaType
    ? selection.index
    : -1;
  const activeItemIndex = selectedItemIndex >= 0 && selectedItemIndex < documents.length
    ? selectedItemIndex
    : Math.max(preferredItemIndex, 0);

  if (!isOpen) return null;

  const activeItem = documents[activeItemIndex] || documents[0];

  const handleDownload = () => {
    if (!activeItem?.url) return;
    const a = document.createElement('a');
    a.href = activeItem.url;
    a.download = activeItem.fileName || activeItem.name || 'document';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenNewTab = () => {
    if (!activeItem?.url) return;
    window.open(activeItem.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <span>{t('Modal_Asset_Documents')}</span>
        </div>
      }
      subtitle={
        <div className="flex items-center gap-2 text-xs">
          <span>
            {t('Modal_Asset_Details')} - <span className="font-bold text-slate-800">{assetTitle || 'Asset'}</span>
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-blue-600 font-semibold">
            {t('Modal_Total_Documents', { count: documents.length })}
          </span>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 font-medium truncate max-w-md">
            {activeItem?.name ? `${activeItem.groupName || 'Document'}: ${activeItem.name}` : ''}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleDownload}
              disabled={!activeItem?.url}
            >
              <span>{t('Modal_Download')}</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={ExternalLink}
              onClick={handleOpenNewTab}
              disabled={!activeItem?.url}
            >
              <span>{t('Modal_New_Tab')}</span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col md:flex-row h-[65vh] min-h-[420px] max-h-[750px] -m-6 overflow-hidden">
        {/* Main Document Viewer Column */}
        <div className="flex-1 flex flex-col bg-[#525659] min-w-0">
          <div className="flex-1 overflow-auto p-3 md:p-6 flex flex-col items-center justify-center custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] w-full max-w-md p-8 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xl text-center backdrop-blur-sm">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-400 border-t-transparent mb-4" />
                <p className="text-sm font-bold text-white">{t('Loading') || 'Loading documents...'}</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] w-full max-w-md p-8 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xl text-center backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                <div className="w-20 h-20 rounded-full bg-slate-500/10 border-2 border-slate-500/30 flex items-center justify-center mb-5 text-slate-400 shadow-inner">
                  <FileText className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-black text-white tracking-wide mb-2">
                  {t('Modal_Document_Not_Available')}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-2 max-w-xs">
                  {t('Modal_No_Documents_Uploaded', { name: assetTitle || '' })}
                </p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-white shadow-2xl rounded-lg p-2 overflow-hidden">
                {activeItem?.isPdf ? (
                  <iframe
                    src={`${activeItem.url}#toolbar=0`}
                    className="w-full h-full min-h-[400px] border-0 rounded"
                    title={activeItem.name}
                  />
                ) : activeItem?.url && activeItem.isImage ? (
                  <div className="relative w-full h-full min-h-[350px] flex items-center justify-center bg-slate-950/5 rounded overflow-auto p-2">
                    {/* Asset media URLs may be dynamic API/blob sources; keep native sizing and loading behavior. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeItem.url}
                      alt={activeItem.name}
                      className="max-h-[58vh] max-w-full object-contain rounded shadow"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-center">
                    <File className="w-16 h-16 mb-3" />
                    <p className="text-sm font-semibold text-slate-600">{activeItem?.name}</p>
                    <p className="text-xs mt-1">{t('Modal_Download')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Document Groups Sidebar */}
        <div className="w-full md:w-64 bg-white border-t md:border-t-0 md:border-l border-slate-200 p-3 md:p-4 flex flex-col shrink-0 shadow-lg z-10 overflow-y-auto">
          <h3 className="text-xs font-black text-blue-600 tracking-wider uppercase mb-3 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-blue-600" />
            {t('Modal_Document_Groups')}
          </h3>

          <div className="space-y-2">
            {documents.length === 0 ? (
              <div className="text-xs text-slate-400 p-2 text-center">
                {t('Modal_No_Documents')}
              </div>
            ) : (
              documents.map((doc, idx) => {
                const isActive = activeItemIndex === idx;
                return (
                  <Button
                    type="button"
                    variant="ghost"
                    key={`${doc.id}-${idx}`}
                    onClick={() => setSelection({ documents, initialMediaType, index: idx })}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all text-left border cursor-pointer h-auto ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/40 hover:bg-blue-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                    title={doc.name}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {doc.isPdf ? (
                        <FileText
                          className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-red-500'}`}
                        />
                      ) : (
                        <File
                          className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-blue-600'}`}
                        />
                      )}
                      <span className="truncate">{doc.groupName || doc.name}</span>
                    </div>
                  </Button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
