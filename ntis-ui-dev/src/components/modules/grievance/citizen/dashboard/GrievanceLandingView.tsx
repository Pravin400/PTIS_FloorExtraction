'use client';

import { useState, useRef, useEffect, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import {
  CitizenRegisterGrievanceModal,
} from '../';
import { type CivicComparisonItem } from './GrievanceFeedCard';
import type { MapMarker, Grievance, MunicipalDepartment, GrievanceStatus } from '@/types/grievance';
import {
  fetchAllGrievanceApplicationsAction,
  fetchPublicGrievancesAction,
} from '@/lib/actions/grievance/citizen/track-grievance.actions';
import { resolveGrievancePhotoUrl } from '@/lib/utils/grievance/grievance-photo-url';
import { LandingMobileView } from './LandingMobileView';
import { LandingDesktopView } from './LandingDesktopView';
import type { AmravatiMapHandle } from '../../shared';
import type { MapLayerType } from '../../shared/AmravatiMap';

const subscribeMedia = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia('(max-width: 767px)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
};

const getMobileSnapshot = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 767px)').matches;
};

const getMobileServerSnapshot = () => false;

export interface GrievanceLandingViewProps {
  onReportIssueClick?: () => void;
  onTrackRequestClick?: () => void;
  className?: string;
}

export function GrievanceLandingView({
  onReportIssueClick,
  onTrackRequestClick: _onTrackRequestClick,
  className = '',
}: GrievanceLandingViewProps) {
  const t = useTranslations('grievance');
  const mapRef = useRef<AmravatiMapHandle>(null);

  const isMobile = useSyncExternalStore(subscribeMedia, getMobileSnapshot, getMobileServerSnapshot);

  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [civicFeed, setCivicFeed] = useState<CivicComparisonItem[]>([]);

  useEffect(() => {
    // 1. Primary: load real public grievances with photos and timeline from GET /api/GrievanceApplication/public
    fetchPublicGrievancesAction().then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const publicApps = res.data;

        const loadedGrievances: Grievance[] = publicApps.map((app) => {
          const hasLat = app.latitude !== null && app.latitude !== undefined && !isNaN(Number(app.latitude));
          const hasLng = app.longitude !== null && app.longitude !== undefined && !isNaN(Number(app.longitude));

          return {
            id: app.grievanceNo || String(app.id),
            trackingId: app.grievanceNo || String(app.id),
            title: app.grievanceType || app.description || 'Grievance',
            titleMr: app.departmentNameLocal || '',
            description: app.description || '',
            descriptionMr: '',
            category: 'other' as const,
            status: app.isResolved || app.currentStateId === 3 ? 'RESOLVED' : 'IN_PROGRESS',
            priority: 'MEDIUM' as const,
            ward: app.wardName || (app.wardNo ? `Ward ${app.wardNo}` : app.roadLandmark || ''),
            wardNumber: app.wardId || (app.wardNo ? parseInt(app.wardNo.replace(/\D/g, '') || '0', 10) : 0),
            zone: app.zoneName || app.zoneNo || '',
            address: app.roadLandmark || '',
            landmark: app.roadLandmark || '',
            lat: hasLat ? Number(app.latitude) : 0,
            lng: hasLng ? Number(app.longitude) : 0,
            reportedAt: app.submittedDate || new Date().toISOString(),
            updatedAt: app.resolvedDate || app.submittedDate || new Date().toISOString(),
            slaHours: 48,
            slaDeadline: '',
            slaStatus: 'ON_TRACK',
            reporter: {
              name: app.citizenName || 'Citizen',
              phoneMasked: app.maskedMobileNo || '',
            },
            timeline: (app.timeline || []).map((step) => ({
              status: (step.toState === 'Pending' ? 'SUBMITTED' : step.toState === 'Resolved' ? 'RESOLVED' : 'IN_PROGRESS') as GrievanceStatus,
              timestamp: step.actionAt,
              title: step.toState || 'Step',
              titleMr: '',
              note: step.remark || '',
              noteMr: '',
              performedBy: step.actionBy || 'System',
            })),
            images: (app.photos || []).map((p) => ({
              id: String(p.id),
              url: resolveGrievancePhotoUrl(p.viewPhotoUrl),
              caption: p.remarks || p.photoTypeName || 'Photo',
              type: p.photoTypeId === 2 || p.photoTypeId === 3 ? 'AFTER' : 'BEFORE',
            })),
            upvotesCount: 0,
          };
        });

        const loadedFeed: CivicComparisonItem[] = publicApps.map((app) => {
          const hasLat = app.latitude !== null && app.latitude !== undefined && !isNaN(Number(app.latitude));
          const hasLng = app.longitude !== null && app.longitude !== undefined && !isNaN(Number(app.longitude));

          const beforePhotos = (app.photos || []).filter(
            (p) => p.photoTypeId === 1 || p.photoTypeCode?.toLowerCase() === 'before'
          );
          const afterPhotos = (app.photos || []).filter(
            (p) =>
              p.photoTypeId === 2 ||
              p.photoTypeId === 3 ||
              p.photoTypeCode === 'RESOLUTION_PROOF' ||
              p.photoTypeCode?.toLowerCase() === 'after'
          );

          // Smart mix of Option 2 & Option 3:
          let beforeImage = '';
          let afterImage: string | undefined = undefined;
          let beforeLabel = t('beforeLabel');
          let afterLabel = t('afterLabel');
          let photoBadge: string | undefined = undefined;

          if (app.photos && app.photos.length > 1) {
            photoBadge = t('photosCountBadge', { count: app.photos.length });
          }

          if (afterPhotos.length > 0) {
            // Case 1: Post-resolution proof exists (full Before/After comparison)
            beforeImage = resolveGrievancePhotoUrl(beforePhotos[0]?.viewPhotoUrl);
            afterImage = resolveGrievancePhotoUrl(afterPhotos[0]?.viewPhotoUrl);
            beforeLabel = t('beforeLabel');
            afterLabel = t('afterLabel');
          } else if (beforePhotos.length > 0) {
            // Case 2: Citizen evidence photos attached, awaiting municipal resolution
            beforeImage = resolveGrievancePhotoUrl(beforePhotos[0]?.viewPhotoUrl);
            afterImage = 'placeholder:in-progress';
            beforeLabel = t('beforeLabel');
            afterLabel = t('pendingFix');
          } else {
            beforeImage = '';
            afterImage = undefined;
          }

          const isClean = app.isResolved || app.currentStateId === 3 || app.currentStateName === 'Resolved';
          const isPending = app.currentStateName === 'Pending' || app.currentStateId === 1;

          return {
            id: app.grievanceNo || String(app.id),
            grievanceNo: app.grievanceNo,
            wardNumber: app.wardId || (app.wardNo ? parseInt(app.wardNo.replace(/\D/g, '') || '1', 10) : 1),
            wardName: app.wardName || (app.wardNo ? `${t('wardPrefix')} ${app.wardNo}` : `${t('wardPrefix')} 1`),
            title: app.grievanceType || app.description || t('defaultGrievanceTitle'),
            departmentName: app.departmentName,
            departmentNameLocal: app.departmentNameLocal,
            roadLandmark: app.roadLandmark || '',
            status: isClean ? 'Cleaned' : isPending ? 'Pending' : 'In Progress',
            beforeImage,
            afterImage,
            beforeLabel,
            afterLabel,
            photoBadge,
            photos: app.photos || [],
            upvotes: 0,
            lat: hasLat ? Number(app.latitude) : 20.932,
            lng: hasLng ? Number(app.longitude) : 77.7523,
            daysOpen: app.daysOpen || 0,
            isResolved: app.isResolved,
          };
        });

        setGrievances(loadedGrievances);
        setCivicFeed(loadedFeed);
        return;
      }

      // 2. Fallback: load applications via general citizen API if public endpoint returns no items
      fetchAllGrievanceApplicationsAction(50).then((fallbackRes) => {
        if (fallbackRes.success && Array.isArray(fallbackRes.data) && fallbackRes.data.length > 0) {
          const loadedFeed: CivicComparisonItem[] = fallbackRes.data.map((ticket) => ({
            id: ticket.token || ticket.id,
            grievanceNo: ticket.token || ticket.id,
            wardNumber: parseInt(ticket.ward?.replace(/\D/g, '') || '1', 10) || 1,
            wardName: ticket.ward || `${t('wardPrefix')} 1`,
            title: ticket.subject || ticket.description || t('defaultGrievanceTitle'),
            status: ticket.status === 'RESOLVED' ? 'Cleaned' : 'In Progress',
            beforeImage: ticket.proof?.beforeImageUrl || '',
            afterImage: ticket.proof?.afterImageUrl,
            upvotes: 0,
            lat: ticket.latitude ? parseFloat(ticket.latitude) : 20.932,
            lng: ticket.longitude ? parseFloat(ticket.longitude) : 77.7523,
          }));
          setCivicFeed(loadedFeed);
        }
      });
    });
  }, [t]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'dirty' | 'clean'>('all');
  const [selectedWard, setSelectedWard] = useState<string>('All Wards');
  const [selectedComplaint, setSelectedComplaint] = useState<Grievance | null>(null);
  const [inspectedItem, setInspectedItem] = useState<CivicComparisonItem | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'report' | 'track'>('report');
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('default');
  const [showBoundary, setShowBoundary] = useState(true);

  const [selectedDeptForReport, setSelectedDeptForReport] = useState<MunicipalDepartment | null>(null);

  const panToItem = (item?: CivicComparisonItem | null) => {
    if (
      item &&
      typeof item.lat === 'number' &&
      typeof item.lng === 'number' &&
      item.lat !== 0 &&
      item.lng !== 0 &&
      !isNaN(item.lat) &&
      !isNaN(item.lng) &&
      isFinite(item.lat) &&
      isFinite(item.lng)
    ) {
      mapRef.current?.panTo(item.lat, item.lng);
    }
  };

  const handleMarkerClick = (marker: MapMarker) => {
    const match = grievances.find((g) => g.id === marker.id);
    if (match) setSelectedComplaint(match);
  };

  const handleReport = () => {
    if (onReportIssueClick) return onReportIssueClick();
    setSelectedDeptForReport(null);
    setModalType('report');
    setIsActionModalOpen(true);
  };

  const handleReportForDept = (dept: MunicipalDepartment) => {
    setSelectedDeptForReport(dept);
    setModalType('report');
    setIsActionModalOpen(true);
  };

  const handleNextComplaint = () => {
    if (!inspectedItem || civicFeed.length === 0) return;
    const idx = (civicFeed.findIndex((c) => c.id === inspectedItem.id) + 1) % civicFeed.length;
    setInspectedItem(civicFeed[idx]);
    panToItem(civicFeed[idx]);
  };

  const handlePrevComplaint = () => {
    if (!inspectedItem || civicFeed.length === 0) return;
    const idx = (civicFeed.findIndex((c) => c.id === inspectedItem.id) - 1 + civicFeed.length) % civicFeed.length;
    setInspectedItem(civicFeed[idx]);
    panToItem(civicFeed[idx]);
  };

  const handleSelectFeedCard = (item: CivicComparisonItem) => {
    panToItem(item);
    const match = grievances.find((g) => g.id === item.id);
    if (match) setSelectedComplaint(match);
  };

  const handleDetailsFeedClick = (item: CivicComparisonItem) => {
    panToItem(item);
    setInspectedItem(item);
  };

  return (
    <div className={`w-full h-full relative overflow-hidden ${className}`}>
      {isMobile ? (
        <LandingMobileView
          mapRef={mapRef}
          activeLayer={activeLayer}
          showBoundary={showBoundary}
          onLayerChange={setActiveLayer}
          onToggleBoundary={() => setShowBoundary((v) => !v)}
          onMarkerClick={handleMarkerClick}
          onSnapClick={handleReport}
          onFileGrievanceForDept={handleReportForDept}
          onSelectComplaint={handleSelectFeedCard}
          onDetailsClick={handleDetailsFeedClick}
          civicFeed={civicFeed}
          inspectedItem={inspectedItem}
          onCloseInspector={() => setInspectedItem(null)}
          onPrevComplaint={handlePrevComplaint}
          onNextComplaint={handleNextComplaint}
          onReportSimilar={() => {
            setInspectedItem(null);
            handleReport();
          }}
        />
      ) : (
        <LandingDesktopView
          mapRef={mapRef}
          activeLayer={activeLayer}
          showBoundary={showBoundary}
          onLayerChange={setActiveLayer}
          onToggleBoundary={() => setShowBoundary((v) => !v)}
          onMarkerClick={handleMarkerClick}
          selectedWard={selectedWard}
          onToggleWard={() => setSelectedWard(selectedWard === 'All Wards' ? 'Ward 1' : 'All Wards')}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onReport={handleReport}
          selectedComplaint={selectedComplaint}
          onCloseComplaint={() => setSelectedComplaint(null)}
          civicFeed={civicFeed}
          inspectedItem={inspectedItem}
          onSelectFeedCard={handleSelectFeedCard}
          onDetailsFeedClick={handleDetailsFeedClick}
          onCloseInspector={() => setInspectedItem(null)}
          onPrevComplaint={handlePrevComplaint}
          onNextComplaint={handleNextComplaint}
          onReportSimilar={() => {
            setInspectedItem(null);
            handleReport();
          }}
        />
      )}


      <CitizenRegisterGrievanceModal
        isOpen={isActionModalOpen && modalType === 'report'}
        onClose={() => {
          setIsActionModalOpen(false);
          setSelectedDeptForReport(null);
        }}
        showOfficerContact={true}
        defaultDepartmentId={selectedDeptForReport?.id}
        defaultCategory={selectedDeptForReport?.category}
      />
    </div>
  );
}
