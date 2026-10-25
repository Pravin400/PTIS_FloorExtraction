'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  MapPin,
  Building2,
  Lock,
  Pencil,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common';
import type { TrackingTicket } from '@/types/grievance';
import type { GrievancePhotoItem } from '@/types/grievance/grievance-photo.types';
import { fetchGrievancePhotosAction } from '@/lib/actions/grievance/citizen/grievance-photo.actions';
import { trackGrievanceDetailsAction } from '@/lib/actions/grievance/citizen/track-grievance.actions';
import { TrackerPhotoGallery } from './TrackerPhotoGallery';

export interface GrievanceSummaryPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: TrackingTicket;
  onEditClick?: () => void;
  onTicketUpdated?: (updated: TrackingTicket) => void;
}

export function GrievanceSummaryPreviewModal({
  isOpen,
  onClose,
  ticket,
  onEditClick,
}: GrievanceSummaryPreviewModalProps) {
  const t = useTranslations('grievance');

  const [photos, setPhotos] = useState<GrievancePhotoItem[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);

  const isPending =
    ticket?.status === 'SUBMITTED' ||
    ticket?.status === 'PENDING' ||
    ticket?.currentStateId === 1;

  const previewKey = `${isOpen}-${ticket.id || ''}-${ticket.token || ''}`;
  const [prevPreviewKey, setPrevPreviewKey] = useState(previewKey);
  if (prevPreviewKey !== previewKey) {
    setPrevPreviewKey(previewKey);
    if (isOpen) {
      setIsLoadingPhotos(true);
      setPhotos([]);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const rawId = ticket.id;
    const parsedId = parseInt(String(rawId), 10);
    const isDirectInt = !isNaN(parsedId) && String(parsedId) === String(rawId).trim();

    if (isDirectInt && parsedId > 0) {
      fetchGrievancePhotosAction(parsedId)
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.data) {
            setPhotos(res.data);
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingPhotos(false);
        });
    } else if (ticket.token && ticket.token.startsWith('GRV-')) {
      trackGrievanceDetailsAction(ticket.token)
        .then((detailRes) => {
          if (detailRes.success && detailRes.data?.id) {
            return fetchGrievancePhotosAction(detailRes.data.id);
          }
          return null;
        })
        .then((photoRes) => {
          if (!isMounted) return;
          if (photoRes?.success && photoRes.data) {
            setPhotos(photoRes.data);
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingPhotos(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, ticket.id, ticket.token]);

  if (!isOpen) return null;

  const deptText = ticket.department;
  const subjectText = ticket.subject;

  const statusLabel =
    ticket.status === 'RESOLVED'
      ? t('statusResolved')
      : ticket.status === 'IN_PROGRESS'
      ? t('statusInProgress')
      : t('statusPendingReview');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="bg-slate-50/90 px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs">
                  #{ticket.token}
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    ticket.status === 'RESOLVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : ticket.status === 'IN_PROGRESS'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-900 border border-amber-200/60'
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                {t('officialSummaryTitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label={t('close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 text-xs">
          <div className="space-y-3.5">
            {/* Department & Landmark Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-200/70">
              <div className="flex items-start gap-2 min-w-0">
                <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                    {t('department')}
                  </span>
                  <p className="text-xs font-bold text-slate-900 truncate">{deptText}</p>
                  <p className="text-[10.5px] text-slate-500 truncate">{subjectText}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                    {t('locationLandmark')}
                  </span>
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {ticket.roadLandmark || 'Amravati City Area'}
                  </p>
                  <p className="text-[10.5px] text-slate-500 truncate">{ticket.ward || 'Municipal Ward'}</p>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                {t('citizenGrievanceDescription')}
              </span>
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-medium">
                {ticket.description || '—'}
              </div>
            </div>

            {/* Live Uploaded Evidence Photos Gallery */}
            <TrackerPhotoGallery
              photos={photos}
              isLoadingPhotos={isLoadingPhotos}
            />
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="!px-3 !py-1.5 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
          >
            {t('close')}
          </Button>

          {isPending ? (
            <Button
              type="button"
              variant="success"
              size="sm"
              onClick={() => {
                onClose();
                onEditClick?.();
              }}
              className="!px-4 !py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{t('editGrievance')}</span>
            </Button>
          ) : (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 border border-slate-200/80 text-[11px] font-semibold select-none cursor-default"
              title={t('lockedUnderProcessHint')}
            >
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('lockedUnderProcess')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { GrievanceSummaryPreviewModal as GrievanceSummaryPreview };
