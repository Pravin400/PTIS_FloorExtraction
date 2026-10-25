'use client';

import { useState, useCallback } from 'react';
import { AssessmentUnit, PtisTaxMode } from '@/types/property-tax/apartment';
import { resolveDocumentUrl } from '@/components/modules/property-tax/ptis/media/ImageWithFallback';
import { fetchPropertyRuleLogsAction } from '@/app/[locale]/property-tax/ptis/apartment/action';
import type { PropertyRuleLogItem } from '@/types/rule-engine';
import { ROUTES } from '@/lib/constants/routes';
import { defaultLocale } from '@/i18n/config';
import { ImageViewerImage } from '@/components/common/ImageViewer';
import { useRouter, useParams } from 'next/navigation';

export interface UseContainerActionsProps {
  propertyId: number | null;
  locale?: string;
  societyDetailId?: number | null;
  societyId?: number | null;
  wingDetailId?: number | null;
  wingId?: number | null;
}

export function useContainerActions({
  propertyId,
  locale,
  societyDetailId,
  societyId,
  wingDetailId,
  wingId,
}: UseContainerActionsProps) {
  const router = useRouter();
  const params = useParams();
  const _locale = locale || (params?.locale as string) || defaultLocale;

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<ImageViewerImage[]>([]);
  const [selectedRuleUnit, setSelectedRuleUnit] = useState<AssessmentUnit | null>(null);
  const [isAppliedRulesDrawerOpen, setIsAppliedRulesDrawerOpen] = useState(false);
  const [appliedRulesForUnit, setAppliedRulesForUnit] = useState<PropertyRuleLogItem[]>([]);
  const [taxMode, setTaxMode] = useState<PtisTaxMode>('rateable');
  const [expandedPanel, setExpandedPanel] = useState<'survey' | 'difference' | 'existing' | null>(null);

  const handleActionQuickDataEntry = useCallback((unit: AssessmentUnit) => {
    const raw = unit.rawSurvey;
    const propId = raw?.id || raw?.pdnId || unit.propertyId || unit.id || propertyId;
    if (!propId) return;

    const queryParams = new URLSearchParams();
    if (propertyId) queryParams.set('parentPropertyId', String(propertyId));
    if (raw?.propertyFloorId) queryParams.set('floorId', String(raw.propertyFloorId));
    if (raw?.wardNo) queryParams.set('wardNo', String(raw.wardNo));
    if (raw?.wardId) queryParams.set('wardId', String(raw.wardId));
    if (raw?.propertyNo || unit.propertyNo) queryParams.set('propertyNo', String(raw?.propertyNo || unit.propertyNo));
    if (raw?.partitionNo || unit.partitionNo) queryParams.set('partitionNo', String(raw?.partitionNo || unit.partitionNo));
    const activeSocId = societyDetailId || societyId;
    if (activeSocId) {
      queryParams.set('societyDetailId', String(activeSocId));
      queryParams.set('societydetailid', String(activeSocId));
      queryParams.set('societyId', String(activeSocId));
    }
    if (wingDetailId) {
      queryParams.set('wingDetailId', String(wingDetailId));
      queryParams.set('wingdetailid', String(wingDetailId));
    }
    if (wingId) queryParams.set('wingId', String(wingId));
    queryParams.set('returnTab', 'apartment');
    queryParams.set('from', 'apartment');
    queryParams.set('hideWing', 'true');
    queryParams.set('hideSociety', 'true');
    queryParams.set('fromFooterEdit', 'true');

    router.push(`/${_locale}${ROUTES.PROPERTY_TAX.PTIS}/QuickDataEntry/${propId}/Property?${queryParams.toString()}`);
  }, [_locale, propertyId, societyDetailId, societyId, wingDetailId, wingId, router]);

  const handleViewDocument = useCallback(async (guid: string, title = 'Document Preview') => {
    if (!guid) return;
    try {
      const url = await resolveDocumentUrl('', guid);
      if (url) {
        setImageViewerImages([{ src: url, title, alt: title }]);
        setIsImageViewerOpen(true);
      }
    } catch (err) {
      console.error('Failed to resolve document preview url', err);
    }
  }, []);

  const handleViewRules = useCallback(async (unit: AssessmentUnit) => {
    setSelectedRuleUnit(unit);
    setIsAppliedRulesDrawerOpen(true);
    setAppliedRulesForUnit([]);
    const propId = Number(unit.rawSurvey?.id || unit.rawSurvey?.pdnId || propertyId || 0);
    if (propId > 0) {
      try {
        const res = await fetchPropertyRuleLogsAction(propId, unit.rawSurvey?.id);
        if (res.success && res.data) {
          const items = Array.isArray(res.data) ? res.data : (res.data as unknown as Record<string, unknown>).items as PropertyRuleLogItem[] || [];
          setAppliedRulesForUnit(items);
        }
      } catch (err) {
        console.error('Failed to fetch applied rules for unit', err);
      }
    }
  }, [propertyId]);

  const closeRulesModal = useCallback(() => {
    setIsAppliedRulesDrawerOpen(false);
    setSelectedRuleUnit(null);
  }, []);

  const closeImageViewer = useCallback(() => {
    setIsImageViewerOpen(false);
    setImageViewerImages([]);
  }, []);

  const toggleExpandPanel = useCallback((panel: 'survey' | 'difference' | 'existing') => {
    setExpandedPanel((prev) => (prev === panel ? null : panel));
  }, []);

  return {
    isImageViewerOpen,
    imageViewerImages,
    selectedRuleUnit,
    isAppliedRulesDrawerOpen,
    appliedRulesForUnit,
    taxMode,
    setTaxMode,
    expandedPanel,
    handleActionQuickDataEntry,
    handleViewDocument,
    handleViewRules,
    closeRulesModal,
    closeImageViewer,
    toggleExpandPanel,
  };
}
