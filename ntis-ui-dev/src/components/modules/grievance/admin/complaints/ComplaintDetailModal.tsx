'use client';

/**
 * Complaint Detail Modal Component
 * Path: src/components/modules/grievance/admin/complaints/ComplaintDetailModal.tsx
 *
 * Wraps @/components/common/Modal to display comprehensive dossier for a selected complaint.
 * Line ceiling: <= 300 lines.
 */

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Building2, User, Phone, MapPin, Calendar, FileText, Clock, CheckCircle2, AlertCircle, Tag, Camera, Maximize2,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Modal, Button, BeforeAfterSlider } from '@/components/common';
import type { AdminGrievanceRecord, DepartmentOption } from '@/types/grievance/admin-complaints.types';
import type { GrievancePhotoItem } from '@/types/grievance/grievance-photo.types';
import { fetchGrievancePhotosAction } from '@/lib/actions/grievance/citizen/grievance-photo.actions';
import { extractGrievancePhotoUrl } from '@/lib/utils/grievance';
import { ComplaintAssignCard } from './ComplaintAssignCard';
import { ComplaintEvidenceModal } from './ComplaintEvidenceModal';

interface ComplaintDetailModalProps {
  isOpen: boolean;
  complaint: AdminGrievanceRecord | null;
  departments?: DepartmentOption[];
  onClose: () => void;
  onSuccess?: () => void;
}

export function ComplaintDetailModal({
  isOpen,
  complaint,
  departments = [],
  onClose,
  onSuccess,
}: ComplaintDetailModalProps) {
  const t = useTranslations('grievance');
  const locale = useLocale();
  const [fetchedPhotos, setFetchedPhotos] = useState<Record<number, GrievancePhotoItem[]>>({});
  const [selectedBeforeIdx, setSelectedBeforeIdx] = useState(0);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);

  const [prevComplaintId, setPrevComplaintId] = useState(complaint?.id);
  if (prevComplaintId !== complaint?.id) {
    setPrevComplaintId(complaint?.id);
    setSelectedBeforeIdx(0);
  }

  useEffect(() => {
    if (!isOpen || !complaint?.id) return;
    if (complaint.photos && complaint.photos.length > 0) return;
    const cid = complaint.id;
    if (fetchedPhotos[cid]) return;

    let isMounted = true;
    fetchGrievancePhotosAction(cid)
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setFetchedPhotos((prev) => ({ ...prev, [cid]: res.data! }));
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, [isOpen, complaint?.id, complaint?.photos, fetchedPhotos]);

  const extraPhotos = (complaint?.id ? fetchedPhotos[complaint.id] : undefined) ?? [];
  const allPhotos = complaint?.photos && complaint.photos.length > 0 ? complaint.photos : extraPhotos;

  const beforePhotos = useMemo(
    () => allPhotos.filter((p) => p.photoTypeId === 1 || p.photoTypeCode?.toLowerCase() === 'before'),
    [allPhotos]
  );
  const afterPhotos = useMemo(
    () => allPhotos.filter((p) => [2, 3].includes(p.photoTypeId) || p.photoTypeCode === 'RESOLUTION_PROOF' || p.photoTypeCode?.toLowerCase() === 'after'),
    [allPhotos]
  );

  if (!complaint) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getStateStatus = (stateId: number) => {
    if (stateId === 1) return { label: t('statusPending'), color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
    if (stateId === 2) return { label: t('statusInProgress'), color: 'bg-sky-50 text-sky-700 border-sky-200', icon: AlertCircle };
    if (stateId === 3) return { label: t('statusResolved'), color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
    return { label: t('statusClosed'), color: 'bg-slate-100 text-slate-700 border-slate-200', icon: CheckCircle2 };
  };

  const activeBeforePhoto = beforePhotos[selectedBeforeIdx] ?? beforePhotos[0];
  const activeAfterPhoto = afterPhotos[0];

  const beforeUrl = (activeBeforePhoto ? extractGrievancePhotoUrl(activeBeforePhoto) : '') || complaint.beforeImageUrl || '';
  const hasAfter = afterPhotos.length > 0 || Boolean(complaint.afterImageUrl);
  const afterUrl = (activeAfterPhoto ? extractGrievancePhotoUrl(activeAfterPhoto) : undefined) || complaint.afterImageUrl || (beforeUrl ? 'placeholder:in-progress' : undefined);

  const status = getStateStatus(complaint.currentStateId);
  const StatusIcon = status.icon;

  return (
    <>
      <Modal
        open={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2.5">
            <span className="font-mono font-black text-slate-900 text-base sm:text-lg">
              {complaint.grievanceNo}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${status.color}`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
          </div>
        }
        subtitle={t('complaintDetailsSubtitle')}
        maxWidth="lg"
        footer={
          <Button variant="secondary" size="sm" onClick={onClose} className="h-8 px-4 rounded-xl border-slate-200 text-slate-700 font-semibold text-xs">
            {t('close')}
          </Button>
        }
      >
        <div className="space-y-4">
          {/* Section 1: Department & Category */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('thDepartment')}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">{t('department')}</div>
                  <div className="text-sm font-bold text-slate-900">{complaint.departmentName}</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">{t('defectType')}</div>
                  <div className="text-sm font-bold text-slate-900">{complaint.grievanceType}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Citizen Details & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('citizenContact')}</div>
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-800">{complaint.citizenName || t('defaultCitizen')}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-mono font-medium text-slate-600">
                  {complaint.citizenMobileNo ? complaint.citizenMobileNo.replace(/(\d{2})\d{4}(\d{4})/, '$1****$2') : '—'}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {t('thLocation')}
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-800">
                  {complaint.roadLandmark || t('defaultAmravatiArea')}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-500 font-medium">{formatDate(complaint.submittedDate)}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Grievance Description */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('issueDescription')}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-slate-50/70 p-3 rounded-lg border border-slate-200/60 whitespace-pre-wrap">
              {complaint.description || t('noDescriptionProvided')}
            </p>
          </div>

          {/* Section 4: Evidence & Resolution Proof (Before & After) */}
          {(beforeUrl || hasAfter) && (
            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('thBeforeAfter')}</span>
                  {beforePhotos.length > 1 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                      {beforePhotos.length} {t('beforeLabel')}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsEvidenceModalOpen(true)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>{t('inspectEvidence')}</span>
                </button>
              </div>

              <div
                className="rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:border-emerald-400 transition-all shadow-xs group relative"
                onClick={() => setIsEvidenceModalOpen(true)}
                title={t('inspectEvidence')}
              >
                <BeforeAfterSlider
                  beforeImage={beforeUrl}
                  afterImage={afterUrl}
                  beforeLabel={`${t('beforeLabel')} (${selectedBeforeIdx + 1}/${beforePhotos.length || 1})`}
                  afterLabel={hasAfter ? t('afterLabel') : t('pendingFix')}
                  aspectRatioClassName="h-44 sm:h-52 w-full"
                  alt={complaint.description || complaint.grievanceNo}
                />
                <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/85 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm pointer-events-none">
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
              </div>

              {beforePhotos.length > 1 && (
                <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                    {t('beforeLabel')}:
                  </span>
                  {beforePhotos.map((photo, idx) => (
                    <button
                      key={photo.id || idx}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedBeforeIdx(idx); }}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                        selectedBeforeIdx === idx ? 'border-rose-500 ring-2 ring-rose-200 scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                      title={t('clickToCompare')}
                    >
                      <Image src={extractGrievancePhotoUrl(photo)} alt={t('evidenceLabel')} fill unoptimized className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 5: Assign / Forward to Department */}
          {departments && departments.length > 0 && (
            <ComplaintAssignCard
              complaint={complaint}
              departments={departments}
              onSuccess={onSuccess}
            />
          )}
        </div>
      </Modal>

      <ComplaintEvidenceModal
        isOpen={isEvidenceModalOpen}
        complaint={{ ...complaint, photos: allPhotos }}
        initialPhotoId={beforePhotos[selectedBeforeIdx]?.id}
        onClose={() => setIsEvidenceModalOpen(false)}
      />
    </>
  );
}
