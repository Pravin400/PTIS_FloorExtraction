'use client';

/**
 * Complaint Evidence Comparison Modal
 * Path: src/components/modules/grievance/admin/complaints/ComplaintEvidenceModal.tsx
 *
 * Full-screen lightbox modal displaying the Before & After comparison slider
 * with ticket metadata, bilateral thumbnail ribbons, and photo ID tracking.
 * Line ceiling: <= 300 lines.
 */

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Building2, MapPin, User, SlidersHorizontal, LayoutGrid } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Modal, Button, BeforeAfterSlider } from '@/components/common';
import type { AdminGrievanceRecord } from '@/types/grievance/admin-complaints.types';
import type { TrackingTicket } from '@/types/grievance';
import type { GrievancePhotoItem } from '@/types/grievance/grievance-photo.types';
import { fetchGrievancePhotosAction } from '@/lib/actions/grievance/citizen/grievance-photo.actions';
import { extractGrievancePhotoUrl } from '@/lib/utils/grievance';
import { EvidenceRibbonSelector } from './EvidenceRibbonSelector';

interface ComplaintEvidenceModalProps {
  isOpen: boolean;
  complaint: AdminGrievanceRecord | TrackingTicket | null;
  initialPhotoId?: number;
  onClose: () => void;
}

export function ComplaintEvidenceModal({
  isOpen,
  complaint,
  initialPhotoId,
  onClose,
}: ComplaintEvidenceModalProps) {
  const t = useTranslations('grievance');
  const [fetchedPhotos, setFetchedPhotos] = useState<GrievancePhotoItem[]>([]);
  const [selectedBeforeIdx, setSelectedBeforeIdx] = useState(0);
  const [selectedAfterIdx, setSelectedAfterIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'slider' | 'gallery'>('slider');

  const complaintId = complaint && 'id' in complaint ? complaint.id : undefined;

  useEffect(() => {
    if (!isOpen || !complaintId) return;
    let numId = Number(complaintId);
    if (!numId || isNaN(numId)) {
      const token =
        complaint && ('token' in complaint ? complaint.token : ('trackingId' in complaint ? complaint.trackingId : undefined));
      const match = typeof token === 'string' ? token.match(/(\d+)$/) : null;
      if (match) numId = Number(match[1]);
    }
    if (!numId || isNaN(numId)) return;

    let isMounted = true;
    fetchGrievancePhotosAction(numId)
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setFetchedPhotos(res.data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOpen, complaintId, complaint]);

  const preloadedPhotos = (complaint && 'photos' in complaint && complaint.photos) ? complaint.photos : [];
  const photos = preloadedPhotos.length > 0 ? preloadedPhotos : fetchedPhotos;

  const beforePhotos = useMemo(
    () => photos.filter((p) => p.photoTypeId === 1 || p.photoTypeCode?.toLowerCase() === 'before'),
    [photos]
  );
  const afterPhotos = useMemo(
    () =>
      photos.filter(
        (p) =>
          p.photoTypeId === 2 ||
          p.photoTypeId === 3 ||
          p.photoTypeCode === 'RESOLUTION_PROOF' ||
          p.photoTypeCode?.toLowerCase() === 'after'
      ),
    [photos]
  );

  const [appliedKey, setAppliedKey] = useState<string>('');
  const currentKey = `${isOpen ? 'open' : 'closed'}_${initialPhotoId ?? ''}_${photos.length}`;
  if (isOpen && initialPhotoId && photos.length > 0 && appliedKey !== currentKey) {
    setAppliedKey(currentKey);
    const bIdx = beforePhotos.findIndex((p) => Number(p.id) === Number(initialPhotoId));
    if (bIdx >= 0) {
      setSelectedBeforeIdx(bIdx);
    } else {
      const aIdx = afterPhotos.findIndex((p) => Number(p.id) === Number(initialPhotoId));
      if (aIdx >= 0) {
        setSelectedAfterIdx(aIdx);
      }
    }
  }
  if (!isOpen && appliedKey !== '') {
    setAppliedKey('');
  }

  if (!complaint) return null;

  const grievanceNo = 'grievanceNo' in complaint ? complaint.grievanceNo : complaint.token;
  const deptName = 'departmentName' in complaint ? complaint.departmentName : complaint.department;
  const citName = 'citizenName' in complaint ? complaint.citizenName : '';
  const landmark = 'roadLandmark' in complaint ? complaint.roadLandmark : complaint.ward;
  const descText = 'description' in complaint ? complaint.description : complaint.subject;

  const activeBeforePhoto = beforePhotos[selectedBeforeIdx] ?? beforePhotos[0];
  const activeAfterPhoto = afterPhotos[selectedAfterIdx] ?? afterPhotos[0];

  const proofBefore = 'proof' in complaint ? complaint.proof?.beforeImageUrl : undefined;
  const proofAfter = 'proof' in complaint ? complaint.proof?.afterImageUrl : undefined;

  const fallbackImage =
    complaint && 'images' in complaint && Array.isArray((complaint as { images?: string[] }).images)
      ? (complaint as { images?: string[] }).images?.[0]
      : undefined;

  const beforeUrl =
    (activeBeforePhoto ? extractGrievancePhotoUrl(activeBeforePhoto) : '') ||
    proofBefore ||
    fallbackImage ||
    ('beforeImageUrl' in complaint ? complaint.beforeImageUrl : '') ||
    '';

  const hasAfter = afterPhotos.length > 0 || Boolean(
    proofAfter || ('afterImageUrl' in complaint && complaint.afterImageUrl)
  );

  const afterUrl =
    (activeAfterPhoto ? extractGrievancePhotoUrl(activeAfterPhoto) : undefined) ||
    proofAfter ||
    ('afterImageUrl' in complaint ? complaint.afterImageUrl : undefined) ||
    (beforeUrl ? 'placeholder:in-progress' : undefined);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
            {grievanceNo}
          </span>
          <span className="text-sm font-black text-slate-800">
            {t('evidenceModalTitle')}
          </span>
        </div>
      }
      maxWidth="2xl"
    >
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 font-bold text-slate-800 truncate">
              <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{deptName}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0 font-semibold text-slate-700 truncate">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{citName || t('defaultCitizen')}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0 text-slate-500 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{landmark || t('defaultAmravatiArea')}</span>
            </div>
          </div>

          <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('slider')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'slider' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>{t('comparisonView')}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('gallery')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'gallery' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>{t('allPhotosView', { count: photos.length || (hasAfter ? 2 : 1) })}</span>
            </button>
          </div>
        </div>

        {viewMode === 'slider' ? (
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-md">
              <BeforeAfterSlider
                beforeImage={beforeUrl}
                afterImage={afterUrl}
                beforeLabel={`${t('beforeLabel')} (${selectedBeforeIdx + 1}/${beforePhotos.length || 1})`}
                afterLabel={hasAfter ? `${t('afterLabel')} (${selectedAfterIdx + 1}/${afterPhotos.length || 1})` : t('pendingFix')}
                aspectRatioClassName="h-64 sm:h-96 w-full"
                alt={descText || grievanceNo}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <EvidenceRibbonSelector
                title={t('citizenPhotosCount', { count: beforePhotos.length || 1 })}
                indicatorColor="bg-rose-500"
                photos={beforePhotos}
                selectedIdx={selectedBeforeIdx}
                onSelect={setSelectedBeforeIdx}
                actionHint={t('clickToCompare')}
                tooltip={t('selectCitizenPhoto')}
                emptyNotice={beforeUrl ? t('singleCitizenPhotoAttached') : t('noPhotoAttached')}
              />
              <EvidenceRibbonSelector
                title={t('resolutionProofsCount', { count: afterPhotos.length })}
                indicatorColor="bg-emerald-500"
                photos={afterPhotos}
                selectedIdx={selectedAfterIdx}
                onSelect={setSelectedAfterIdx}
                actionHint={hasAfter ? t('clickToCompare') : undefined}
                tooltip={t('selectResolutionPhoto')}
                emptyNotice={t('pendingAfterNotice')}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[55vh] overflow-y-auto p-1">
            {photos.map((photo, i) => {
              const isAfter =
                photo.photoTypeId === 2 ||
                photo.photoTypeId === 3 ||
                photo.photoTypeCode?.toLowerCase() === 'after' ||
                photo.photoTypeCode === 'RESOLUTION_PROOF';
              return (
                <div
                  key={photo.id || i}
                  onClick={() => {
                    if (isAfter) {
                      const idx = afterPhotos.findIndex((p) => p.id === photo.id);
                      if (idx >= 0) setSelectedAfterIdx(idx);
                    } else {
                      const idx = beforePhotos.findIndex((p) => p.id === photo.id);
                      if (idx >= 0) setSelectedBeforeIdx(idx);
                    }
                    setViewMode('slider');
                  }}
                  className="group relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs cursor-pointer hover:shadow-md transition-all"
                  title={t('clickToViewInSlider')}
                >
                  <Image
                    src={extractGrievancePhotoUrl(photo)}
                    alt={photo.fileName || t('evidenceLabel')}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <span
                    className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-white shadow-xs ${
                      isAfter ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  >
                    {isAfter ? t('afterLabel') : t('beforeLabel')}
                  </span>
                  {photo.remarks && (
                    <div className="absolute inset-x-0 bottom-0 bg-black/75 backdrop-blur-xs text-[9px] text-white p-1.5 truncate">
                      {photo.remarks}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] font-medium text-slate-500">
            {hasAfter ? t('bothPhotosAvailableNotice') : t('pendingAfterNotice')}
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
