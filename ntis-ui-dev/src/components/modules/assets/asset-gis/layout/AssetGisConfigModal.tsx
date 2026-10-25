import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Upload, RefreshCw, FileText, CheckCircle2, AlertCircle, HardDrive, User, Calendar
} from 'lucide-react';
import { getGisUploadHistoryAction, uploadGeoJsonAction } from '@/app/[locale]/assets/gismapviewer/actions';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';
import { logger } from '@/lib/utils/logger';
import type { AssetGisConfigModalProps } from '@/types/asset-gis.types';
import type { TableColumn } from '@/types/common.types';
import { useTranslations } from 'next-intl';
import { Modal, Button, Input, Table } from '@/components/common';

export function AssetGisConfigModal({ isOpen, onClose }: AssetGisConfigModalProps) {
  const t = useTranslations('assetGis');
  const triggerMapRefresh = useCouncilBoundaryStore(s => s.triggerMapRefresh);
  
  const [history, setHistory] = useState<Array<{ uploadId?: string | number; fileName?: string; totalFeatures?: number; uploadedBy?: string; uploadedAt?: string }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (prevOpen !== isOpen) {
    setPrevOpen(isOpen);
    if (!isOpen) {
      setStatusMsg(null);
      setUploadProgress(0);
      setDragOver(false);
    }
  }

  // Fetch upload history log
  const fetchHistory = async () => {
    setStatusMsg(null);
    setUploadProgress(0);
    setLoadingHistory(true);
    try {
      const res = await getGisUploadHistoryAction();
      if (res && res.success && res.data) {
        setHistory(res.data as Array<{ uploadId?: string | number; fileName?: string; totalFeatures?: number; uploadedBy?: string; uploadedAt?: string; }>);
      } else if (res && !res.success) {
        logger.error('Failed to load history:', { message: res.error });
      }
    } catch (err) {
      logger.error('Error fetching history:', { error: err as Error });
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (isOpen) {
      const loadHistory = async () => {
        setLoadingHistory(true);
        try {
          const res = await getGisUploadHistoryAction();
          if (active && res && res.success && res.data) {
            setHistory(res.data as Array<{ uploadId?: string | number; fileName?: string; totalFeatures?: number; uploadedBy?: string; uploadedAt?: string; }>);
          } else if (res && !res.success) {
            logger.error('Failed to load history:', { message: res.error });
          }
        } catch (err) {
          logger.error('Error fetching history:', { error: err as Error });
        } finally {
          if (active) setLoadingHistory(false);
        }
      };
      void loadHistory();
    }
    return () => { active = false; };
  }, [isOpen]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.geojson' && ext !== '.json') {
      setStatusMsg({ type: 'error', text: 'Invalid file format. Please upload a valid .geojson or .json file.' });
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setStatusMsg({ type: 'info', text: `Ingesting ${file.name}... parsing features...` });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadedBy', 'Administrator');

      const interval = setInterval(() => {
        setUploadProgress(p => (p < 85 ? p + 8 : p));
      }, 350);

      const res = await uploadGeoJsonAction(formData);
      clearInterval(interval);

      if (res && res.success) {
        setUploadProgress(100);
        setStatusMsg({ 
          type: 'success', 
          text: `Success: ${String((res.data as Record<string, unknown> | undefined)?.message || 'GeoJSON uploaded and merged with tblGisPropertyGeometry successfully!')}` 
        });
        
        triggerMapRefresh();
        await fetchHistory();
      } else {
        setUploadProgress(0);
        setStatusMsg({ type: 'error', text: res?.error || 'Import failed. Check server logs.' });
      }
    } catch (err: unknown) {
      setUploadProgress(0);
      const errorObj = err as { message?: string };
      setStatusMsg({ type: 'error', text: errorObj?.message || 'Network error occurred during GeoJSON synchronization.' });
    } finally {
      setUploading(false);
    }
  };

  const historyColumns: TableColumn<typeof history[number]>[] = useMemo(() => [
    {
      key: 'fileName',
      label: t('config.fileName'),
      render: (_val, row) => (
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate max-w-[220px]">{row.fileName}</span>
        </div>
      ),
    },
    {
      key: 'totalFeatures',
      label: t('config.totalShapes'),
      render: (_val, row) => (
        <span className="font-semibold text-slate-700">
          {`${row.totalFeatures?.toLocaleString() ?? 0} ${t('config.features')}`}
        </span>
      ),
    },
    {
      key: 'uploadedBy',
      label: t('config.uploadedBy'),
      render: (_val, row) => (
        <span className="flex items-center gap-1">
          <User className="w-3 h-3 text-slate-400" />
          {row.uploadedBy || 'Admin'}
        </span>
      ),
    },
    {
      key: 'uploadedAt',
      label: t('config.dateTime'),
      render: (_val, row) => (
        <span className="flex items-center justify-end gap-1 font-mono text-slate-500">
          <Calendar className="w-3 h-3 text-slate-400" />
          {row.uploadedAt ? new Date(row.uploadedAt).toLocaleString() : '-'}
        </span>
      ),
    },
  ], [t]);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-blue-600" />
          <span>{t('config.title')}</span>
        </div>
      }
      subtitle={t('config.description')}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer ${
            dragOver 
              ? 'border-blue-500 bg-blue-50/50 scale-[0.99]' 
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <Input 
            naked
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".geojson,.json"
            className="hidden"
          />
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shadow-inner mb-4">
            <Upload className={`w-6 h-6 text-blue-600 ${uploading ? 'animate-bounce' : ''}`} />
          </div>
          <p className="text-sm font-bold text-slate-800 tracking-wide">
            {t('config.dragDrop')}
          </p>
          <p className="text-[11px] font-medium text-slate-500 mt-1">
            {t('config.browse')}
          </p>
        </div>

        {/* Progress & Message Alert */}
        {statusMsg && (
          <div className={`p-4 rounded-xl border flex gap-3 items-start ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : statusMsg.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            ) : statusMsg.type === 'error' ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            ) : (
              <RefreshCw className="w-5 h-5 flex-shrink-0 text-blue-600 animate-spin" />
            )}
            
            <div className="flex-1">
              <p className="text-xs font-bold leading-normal">{statusMsg.text}</p>
              
              {uploading && (
                <div className="mt-3">
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[9px] font-bold text-slate-500 uppercase">
                    <span>{t('config.uploading')}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Log History Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              {t('config.historyTitle')}
            </span>
          </div>
          
          <Button
            type="button"
            variant="secondary"
            size="xs"
            onClick={fetchHistory}
            disabled={loadingHistory}
            isLoading={loadingHistory}
            icon={RefreshCw}
            className="text-[10px] font-black uppercase tracking-wider"
          >
            {t('config.reloadLogs')}
          </Button>
        </div>

        {/* History Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <Table
            data={history as unknown as Array<Record<string, unknown>>}
            columns={historyColumns as unknown as Array<TableColumn<Record<string, unknown>>>}
            isLoading={loadingHistory && history.length === 0}
            emptyMessage={t('config.noHistory') || 'No import history found.'}
            className="w-full text-left"
          />
        </div>
      </div>
    </Modal>
  );
}
