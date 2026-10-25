'use client';

import { useState } from 'react';
import {
  UserCheck,
  ArrowLeft,
  X,
  Share2,
  CheckCircle2,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button, Badge, ConfirmDialog, type BadgeVariant } from '@/components/common';
import type { TrackingTicket } from '@/types/grievance';
import { deleteGrievanceApplicationAction } from '@/lib/actions/grievance/citizen/track-grievance.actions';
import { removeTrackingTicket } from '@/lib/services/grievance/tracking-storage.service';
import { evictTicketDetailCache } from '@/hooks/grievance/citizen/useTrackerTickets';

interface TimelineStepperHeaderProps {
  ticket: TrackingTicket;
  subjectText: string;
  deptText: string;
  wardText?: string;
  badgeVariant: BadgeVariant;
  badgeLabel: string;
  activeSubTab: 'timeline' | 'officers';
  onSubTabChange: (tab: 'timeline' | 'officers') => void;
  onOpenEditModal: () => void;
  onOpenPreviewModal: () => void;
  onTicketDeleted?: (ticketIdOrToken: string) => void;
  onBack?: () => void;
  onClose?: () => void;
}

export function TimelineStepperHeader({
  ticket,
  subjectText,
  deptText,
  wardText,
  badgeVariant,
  badgeLabel,
  activeSubTab,
  onSubTabChange,
  onOpenEditModal,
  onOpenPreviewModal,
  onTicketDeleted,
  onBack,
  onClose,
}: TimelineStepperHeaderProps) {
  const t = useTranslations('grievance');
  const [isCopied, setIsCopied] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isPending =
    ticket?.status === 'SUBMITTED' ||
    ticket?.status === 'PENDING' ||
    ticket?.currentStateId === 1;

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareTitle = `${ticket.subject} - #${ticket.token}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: t('trackShareText', { token: ticket.token, subject: ticket.subject }),
          url: shareUrl,
        });
        return;
      } catch {}
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      const targetId = ticket.id || ticket.token;
      const res = await deleteGrievanceApplicationAction(targetId);
      if (res.success) {
        removeTrackingTicket(ticket.token);
        evictTicketDetailCache(ticket.token);
        if (ticket.id) {
          removeTrackingTicket(ticket.id);
          evictTicketDetailCache(ticket.id);
        }
        toast.success(t('grievanceDeletedSuccess'));
        setIsDeleteDialogOpen(false);
        onTicketDeleted?.(ticket.token);
      } else {
        toast.error((res as { error?: string; message?: string }).error || res.message || t('failedToDeleteGrievance'));
      }
    } catch (err) {
      console.error('[TimelineStepperHeader] Failed to delete ticket:', err);
      toast.error(t('failedToDeleteGrievance'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* 0. TOP ACTION BAR: BACK & SHARE */}
      <div className="shrink-0 bg-white border-b border-slate-200/90 px-3 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between gap-2 shadow-2xs">
        {onBack ? (
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={onBack}
            className="font-bold text-xs h-8 px-2 sm:px-2.5 bg-white text-slate-800 border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer shrink-0"
            title={t('backToTickets')}
          >
            <span className="hidden sm:inline">{t('backToTickets')}</span>
            <span className="sm:hidden">{t('back')}</span>
          </Button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Dedicated View / Edit Complaint Modal Trigger */}
          <Button
            variant={isPending ? 'success' : 'secondary'}
            size="sm"
            icon={isPending ? Pencil : Eye}
            onClick={() => {
              if (isPending) {
                onOpenEditModal();
              } else {
                onOpenPreviewModal();
              }
            }}
            className={`font-bold text-xs h-8 px-2.5 sm:px-3 rounded-xl shadow-2xs transition-all cursor-pointer shrink-0 ${
              isPending
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isPending ? t('editGrievance') : t('viewDetails')}
          </Button>

          {/* Delete Grievance Button (Only when pending) */}
          {isPending && (
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setIsDeleteDialogOpen(true)}
              className="font-bold text-xs h-8 px-2 sm:px-2.5 rounded-xl shadow-2xs cursor-pointer shrink-0"
              title={t('deleteGrievance')}
            >
              <span className="hidden sm:inline">{t('deleteGrievance')}</span>
            </Button>
          )}

          {/* Share Button (Fully responsive, icon-only on mobile so it is never clipped) */}
          <Button
            variant="secondary"
            size="sm"
            icon={Share2}
            onClick={handleShare}
            className="font-bold text-xs h-8 px-2.5 sm:px-3 bg-white text-slate-700 border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer shrink-0"
            title={isCopied ? t('copied') : t('share')}
            aria-label={t('share')}
          >
            <span className="hidden sm:inline">{isCopied ? t('copied') : t('share')}</span>
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="xs"
              icon={X}
              onClick={onClose}
              aria-label={t('close')}
              className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
            />
          )}
        </div>
      </div>

      {/* 1. TICKET TITLE & COMPACT METADATA HERO */}
      <div className="shrink-0 bg-white border-b border-slate-100 px-3.5 py-2.5 sm:px-6 sm:py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <h3 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight leading-snug truncate">
              {subjectText}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium flex-wrap">
              <span className="font-mono font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                #{ticket.token}
              </span>
              <span>•</span>
              <span className="text-slate-700 font-semibold truncate max-w-[130px] sm:max-w-none">
                {deptText}
              </span>
              {wardText && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline text-slate-500 truncate max-w-[140px]">
                    {wardText}
                  </span>
                </>
              )}
              <span>•</span>
              <span className="text-[11px] text-slate-400">
                {ticket.reportedDate}
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-1">
            <Badge
              variant={badgeVariant}
              size="sm"
              dot
              className="font-black uppercase text-[10px] tracking-wider"
            >
              {badgeLabel}
            </Badge>
          </div>
        </div>
      </div>

      {/* 2. SUB-TABS NAVIGATION */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-3 py-1.5 sm:px-6 shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto custom-scrollbar">
          {[
            { id: 'timeline', label: t('liveTimeline'), icon: CheckCircle2 },
            { id: 'officers', label: t('officersAndSquad'), icon: UserCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSubTabChange(tab.id as 'timeline' | 'officers')}
                className={`flex items-center gap-1.5 pb-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'border-emerald-600 text-emerald-800 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => !isDeleting && setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        variant="delete"
        size="sm"
        title={t('deleteGrievanceTitle')}
        description={t('deleteGrievanceConfirm', { token: ticket.token })}
        confirmText={t('deleteGrievance')}
        cancelText={t('cancel')}
        isLoading={isDeleting}
      />
    </>
  );
}
