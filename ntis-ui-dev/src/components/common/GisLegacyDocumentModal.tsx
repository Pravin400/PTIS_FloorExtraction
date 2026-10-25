'use client';

import { useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import {
  X, Download, ExternalLink, FileText, ZoomIn, ZoomOut, RotateCw,
  Printer, Search, Settings, ShieldCheck, SlidersHorizontal,
  FileQuestion
} from 'lucide-react';
import { Button } from '@/components/common';
import type { AssetDocumentModalProps } from '@/types/asset-gis.types';

export type GisLegacyDocumentModalProps = AssetDocumentModalProps;

const emptySubscribe = () => () => {};

export function GisLegacyDocumentModal({
  isOpen,
  onClose,
  assetData,
}: GisLegacyDocumentModalProps) {
  const t = useTranslations('assetGis');
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [selectedDoc, setSelectedDoc] = useState<'survey_form' | 'other_docs'>('survey_form');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const currentPage = 1;
  const totalPages = 1;

  if (!isOpen || !mounted) return null;

  const builId = String(assetData?.Buil_ID || assetData?.buil_id || assetData?.MPMS_ID || assetData?.mpmsId || assetData?.PropertyNo || assetData?.propertyNo || 'MPMS');
  const rawDocsUrl = assetData?.DocsUrl || assetData?.docsUrl || assetData?.DOCS || assetData?.docs || '';
  const docsUrl = rawDocsUrl || '';

  const currentTabTitle = selectedDoc === 'survey_form' ? t('details.surveyForm') : t('details.otherDocuments');
  const hasSurveyForm = !!docsUrl && docsUrl.trim().length > 0;

  const handleDownload = () => {
    if (hasSurveyForm && docsUrl) {
      const a = document.createElement('a');
      a.href = docsUrl;
      a.download = `${builId}_SurveyForm`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.print();
    }
  };

  const handleNewTab = () => {
    if (hasSurveyForm && docsUrl) {
      window.open(docsUrl, '_blank');
    }
  };

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
              <span className="text-amber-200 font-bold">{currentTabTitle}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasSurveyForm && (
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
                  onClick={handleNewTab}
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

        {/* Modal Main Area: Toolbar + Document Preview + Document List Sidebar */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Main Document Viewer Column */}
          <div className="flex-1 flex flex-col bg-[#525659] min-w-0">
            {/* PDF / Document Viewer Control Bar */}
            <div className="bg-[#323639] border-b border-slate-700 px-4 py-2 flex items-center justify-between text-slate-300 text-xs shrink-0 select-none">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  icon={SlidersHorizontal}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 h-auto border-0"
                  title="Sidebar"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  icon={RotateCw}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 h-auto border-0"
                  title="Rotate"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setZoomLevel(prev => Math.max(50, prev - 15))}
                  icon={ZoomOut}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 cursor-pointer h-auto border-0"
                  title="Zoom Out"
                />
                <span className="font-mono text-xs w-12 text-center text-slate-300">{zoomLevel}%</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setZoomLevel(prev => Math.min(200, prev + 15))}
                  icon={ZoomIn}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 cursor-pointer h-auto border-0"
                  title="Zoom In"
                />
                <span className="text-xs text-slate-400 font-mono">
                  {`${currentPage} / ${totalPages}`}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => window.print()}
                  icon={Printer}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 h-auto border-0"
                  title="Print"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  icon={Search}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 h-auto border-0"
                  title="Search Document"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  icon={Settings}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 h-auto border-0"
                  title="Settings"
                />
              </div>
            </div>

            {/* Document Render Area */}
            <div className="flex-1 overflow-auto p-3 md:p-6 flex flex-col items-center justify-start custom-scrollbar">
              {selectedDoc === 'survey_form' ? (
                hasSurveyForm ? (
                  <div
                    className="bg-white shadow-2xl rounded-lg p-3 text-slate-900 border border-slate-300 relative transition-all duration-200 origin-top shrink-0 my-2"
                    style={{
                      width: `${zoomLevel * 7.5}px`,
                      minHeight: '850px',
                      transform: `rotate(${rotation}deg)`
                    }}
                  >
                    {docsUrl.toLowerCase().endsWith('.pdf') ? (
                      <iframe
                        src={docsUrl}
                        className="w-full h-full min-h-[850px] rounded border-0"
                        title="Survey Form PDF"
                      />
                    ) : (
                      <Image
                        src={docsUrl}
                        alt="Survey Form Document"
                        width={1200}
                        height={900}
                        unoptimized
                        className="max-w-full max-h-full object-contain rounded shadow-sm"
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[450px] w-full max-w-md my-auto p-8 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xl text-center backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="w-20 h-20 rounded-full bg-slate-500/10 border-2 border-slate-500/30 flex items-center justify-center mb-5 text-slate-400 shadow-inner">
                      <FileQuestion className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-black text-white tracking-wide mb-2">
                      {t('details.surveyFormNotAvailable')}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-6 max-w-xs">
                      {`No survey form has been uploaded for asset ${builId}.`}
                    </p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[450px] w-full max-w-md my-auto p-8 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xl text-center backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                  <div className="w-20 h-20 rounded-full bg-slate-500/10 border-2 border-slate-500/30 flex items-center justify-center mb-5 text-slate-400 shadow-inner">
                    <FileQuestion className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-black text-white tracking-wide mb-2">
                    {t('details.otherDocumentsNotAvailable')}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-6 max-w-xs">
                    {`No other documents have been uploaded for asset ${builId}.`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Document Selection Sidebar */}
          <div className="w-44 md:w-56 bg-white border-l border-slate-200 p-3 md:p-4 flex flex-col shrink-0 shadow-lg z-10 overflow-y-auto">
            <h3 className="text-xs font-black text-blue-600 tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              {t('details.documentTypes')}
            </h3>

            <div className="space-y-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSelectedDoc('survey_form')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all text-left border cursor-pointer h-auto ${selectedDoc === 'survey_form'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/40 hover:bg-blue-700'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className={`w-4 h-4 shrink-0 ${selectedDoc === 'survey_form' ? 'text-white' : 'text-blue-600'}`} />
                  <span className="truncate">{t('details.surveyForm')}</span>
                </div>
                {hasSurveyForm && (
                  <span className={`w-2 h-2 rounded-full shrink-0 ${selectedDoc === 'survey_form' ? 'bg-amber-300' : 'bg-emerald-500'}`} title="Document Available" />
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setSelectedDoc('other_docs')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all text-left border cursor-pointer h-auto ${selectedDoc === 'other_docs'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/40 hover:bg-blue-700'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className={`w-4 h-4 shrink-0 ${selectedDoc === 'other_docs' ? 'text-white' : 'text-blue-600'}`} />
                  <span className="truncate">{t('details.otherDocuments')}</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
