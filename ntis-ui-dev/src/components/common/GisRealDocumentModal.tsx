'use client';

import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import {
  X, Download, ExternalLink, FileText,
  ShieldCheck, AlertTriangle, FileQuestion, Loader2, File, ChevronLeft, ChevronRight, Eye
} from 'lucide-react';
import { Button } from '@/components/common';
import type { AssetDocumentItem } from '@/types/asset-gis.types';

export interface GisRealDocumentModalProps {
  onClose: () => void;
  builId: string;
  documents: AssetDocumentItem[];
  isLoading: boolean;
  selectedId: string | number | null;
  onSelect: (id: string | number) => void;
}

const emptySubscribe = () => () => {};

export function GisRealDocumentModal({
  onClose,
  builId,
  documents,
  isLoading,
  selectedId,
  onSelect,
}: GisRealDocumentModalProps) {
  const t = useTranslations('assetGis');
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const groupedDocs = useMemo(() => {
    const list = documents as (AssetDocumentItem & { customUrl?: string })[];
    const map = new Map<string, { groupName: string; items: typeof list; seen: Set<string> }>();

    list.forEach((doc) => {
      const docRecord = doc as unknown as Record<string, unknown>;
      const groupTitle = String(docRecord.bindingPurpose || docRecord.documentDefinitionName || docRecord.category || 'Asset Documents').trim();
      const groupKey = groupTitle.toLowerCase();

      if (!map.has(groupKey)) {
        map.set(groupKey, { groupName: groupTitle, items: [], seen: new Set() });
      }

      const grp = map.get(groupKey)!;
      const key = `${doc.documentGuid || doc.id || doc.fileName || doc.name}`;
      if (!grp.seen.has(key)) {
        grp.seen.add(key);
        grp.items.push(doc);
      }
    });

    return Array.from(map.values()).map(g => ({ groupName: g.groupName, items: g.items }));
  }, [documents]);

  const [activeGroupIdx, setActiveGroupIdx] = useState(0);
  const [activeItemIdx, setActiveItemIdx] = useState(0);

  useEffect(() => {
    if (selectedId && groupedDocs.length > 0) {
      groupedDocs.forEach((group, gIdx) => {
        const itemIdx = group.items.findIndex((i) => i.id === selectedId);
        if (itemIdx >= 0) {
          setActiveGroupIdx(gIdx);
          setActiveItemIdx(itemIdx);
        }
      });
    }
  }, [selectedId, groupedDocs]);

  if (!mounted) return null;

  const currentGroup = groupedDocs[activeGroupIdx] || groupedDocs[0];
  const currentItem = currentGroup?.items[activeItemIdx] || currentGroup?.items[0];

  const docUrl = currentItem?.customUrl || (currentItem
    ? (currentItem.documentGuid ? `/api/documents/${encodeURIComponent(currentItem.documentGuid)}` : (currentItem.fileName ? `/api/documents/${encodeURIComponent(currentItem.fileName)}` : (currentItem.id ? `/api/documents/${encodeURIComponent(String(currentItem.id))}` : undefined)))
    : undefined);

  const isImage = Boolean(
    (currentItem?.fileName || '').toLowerCase().match(/\.(png|jpe?g|webp|gif|svg)$/i) ||
    (currentItem?.contentType || '').toLowerCase().includes('image') ||
    (currentItem?.customUrl || '').toLowerCase().match(/\.(png|jpe?g|webp|gif|svg)$/i)
  );
  const isPdf = !isImage;

  const handleDownload = () => {
    if (!docUrl || !currentItem) return;
    const a = document.createElement('a');
    a.href = docUrl;
    a.download = currentItem.fileName || currentItem.name;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrevItem = () => {
    if (!currentGroup) return;
    setActiveItemIdx((prev) => (prev > 0 ? prev - 1 : currentGroup.items.length - 1));
  };

  const handleNextItem = () => {
    if (!currentGroup) return;
    setActiveItemIdx((prev) => (prev < currentGroup.items.length - 1 ? prev + 1 : 0));
  };

  const totalFilesCount = (documents || []).length;

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-[1200px] h-[92vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-700/80">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-5 py-3 text-white flex items-center justify-between shadow-lg shrink-0">
          <div>
            <h2 className="text-base font-black tracking-wider uppercase leading-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-300 shrink-0" />
              {t('details.assetDocuments')}
            </h2>
            <p className="text-xs font-semibold text-blue-100 opacity-90 flex items-center gap-2">
              <span>{t('details.assetDetails')} - <span className="font-extrabold text-white">{builId}</span></span>
              <span className="text-blue-300">•</span>
              <span className="text-amber-200 font-bold">
                {isLoading ? t('actions.loading') : `Total Documents: ${totalFilesCount}`}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {docUrl && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={handleDownload}
                  icon={Download}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 active:scale-95 cursor-pointer h-auto"
                >
                  <span>{t('actions.download')}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => window.open(docUrl, '_blank')}
                  icon={ExternalLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 active:scale-95 cursor-pointer h-auto"
                >
                  <span>{t('details.openInNewTab')}</span>
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onClose}
              icon={X}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-red-600 text-white transition-colors cursor-pointer ml-1 h-auto border-0"
              title="Close Modal"
            />
          </div>
        </div>

        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Main Document Viewer Column */}
          <div className="flex-1 flex flex-col bg-[#525659] min-w-0">
            {currentGroup && currentGroup.items.length > 1 && (
              <div className="bg-slate-800/90 text-white px-4 py-2 border-b border-slate-700 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold text-slate-200 truncate">
                  {currentGroup.groupName} — {currentItem?.fileName || currentItem?.name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={handlePrevItem}
                    icon={ChevronLeft}
                    className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white cursor-pointer h-auto border-0"
                    title="Previous Photo"
                  />
                  <span className="text-xs font-extrabold text-blue-400">
                    {`${activeItemIdx + 1} of ${currentGroup.items.length}`}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={handleNextItem}
                    icon={ChevronRight}
                    className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white cursor-pointer h-auto border-0"
                    title="Next Photo"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-auto p-3 md:p-6 flex flex-col items-center justify-start custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[450px] w-full text-slate-300 gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
                  {/* eslint-disable-next-line i18next/no-literal-string */}
                  <p className="text-sm font-semibold">Loading documents...</p>
                </div>
              ) : !currentItem ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[450px] w-full max-w-md my-auto p-8 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xl text-center backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                  <div className="w-20 h-20 rounded-full bg-slate-500/10 border-2 border-slate-500/30 flex items-center justify-center mb-5 text-slate-400 shadow-inner">
                    <FileQuestion className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-black text-white tracking-wide mb-2">
                    {t('details.documentNotAvailable')}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-6 max-w-xs">
                    {`No documents have been uploaded for asset ${builId}.`}
                  </p>
                </div>
              ) : (
                <div
                  className={`bg-white shadow-2xl rounded-lg p-3 text-slate-900 border border-slate-300 relative transition-all duration-200 origin-top shrink-0 my-2 flex flex-col items-center justify-center overflow-hidden ${isPdf ? 'cursor-pointer' : ''}`}
                  style={{ width: '720px', minHeight: '850px' }}
                  onClick={() => {
                    if (isPdf && docUrl) {
                      window.open(docUrl, '_blank');
                    }
                  }}
                  title={isPdf ? 'Click to open document in new tab' : undefined}
                >
                  {isPdf ? (
                    <iframe
                      src={docUrl}
                      className="w-full h-full min-h-[850px] rounded border-0"
                      title={currentItem.name}
                    />
                  ) : (
                    <GisDocumentImage key={docUrl} url={docUrl!} name={currentItem.name} />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Document Selection Sidebar */}
          <div className="w-44 md:w-56 bg-white border-l border-slate-200 p-3 md:p-4 flex flex-col shrink-0 shadow-lg z-10 overflow-y-auto">
            <h3 className="text-xs font-black text-blue-600 tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-600" />
              {t('details.documentGroups')}
            </h3>

            {isLoading ? (
              <>
                {/* eslint-disable-next-line i18next/no-literal-string */}
                <div className="text-[11px] text-slate-400 font-semibold">Loading...</div>
              </>
            ) : (
              <div className="space-y-2">
                {groupedDocs.map((group, gIdx) => {
                  const isActive = activeGroupIdx === gIdx;
                  const firstDoc = group.items[0];
                  const isImg = Boolean(
                    (firstDoc?.fileName || firstDoc?.name || '').toLowerCase().match(/\.(png|jpe?g|webp|gif|svg)$/i) ||
                    (firstDoc?.contentType || '').toLowerCase().includes('image') ||
                    (firstDoc?.customUrl || '').toLowerCase().match(/\.(png|jpe?g|webp|gif|svg)$/i)
                  );
                  const isPdfDoc = !isImg;
                  return (
                    <Button
                      type="button"
                      variant="ghost"
                      key={`${group.groupName}-${gIdx}`}
                      onClick={() => {
                        setActiveGroupIdx(gIdx);
                        setActiveItemIdx(0);
                        if (firstDoc?.id) onSelect(firstDoc.id);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all text-left border cursor-pointer h-auto ${isActive
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/40 hover:bg-blue-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      title="Click to view document"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isPdfDoc ? (
                          <FileText className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-red-500'}`} />
                        ) : (
                          <File className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                        )}
                        <span className="truncate">{group.groupName}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {group.items.length > 1 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${isActive ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                            {group.items.length}
                          </span>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function GisDocumentImage({ url, name }: { url: string; name: string }) {
  const t = useTranslations('assetGis');
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-8 text-amber-600">
        <AlertTriangle className="w-10 h-10" />
        <span className="text-sm font-semibold">{t('errors.loadFailed')}</span>
      </div>
    );
  }
  return (
    <Image
      src={url}
      alt={name}
      width={1200}
      height={900}
      unoptimized
      className="max-w-full max-h-full object-contain rounded shadow-sm"
      onError={() => setFailed(true)}
    />
  );
}
