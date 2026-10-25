'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { defaultLocale } from '@/i18n/config';
import { isConfigured, getItemLevel } from '@/lib/utils/ptis/social-details';
import { getDocumentBlobUrl } from '@/lib/utils/document-client-utils';
import type { PropertySocialDetailItem } from '@/types/ptis.types';
import { buildDiscountEditUrl } from './discount-tab-helpers';
import type { DiscountDataTabProps, DiscountSubTab, LevelCounts } from './types';

export function useDiscountDataTab(props: DiscountDataTabProps) {
  const {
    propertyId, initialData, initialSocialData, wardId, wardNo, propertyNo,
    societyDetailId, wingDetailsId, wingName, isApartmentScreen: propIsApartmentScreen,
  } = props;

  const locale = useLocale() || defaultLocale;
  const router = useRouter();

  const isApartmentScreen =
    propIsApartmentScreen !== undefined ? propIsApartmentScreen : Boolean(societyDetailId && Number(societyDetailId) > 0);

  const [activeSubTab, setActiveSubTab] = useState<DiscountSubTab>('discount');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [activeViewingKey, setActiveViewingKey] = useState<string | null>(null);
  const [activeEditingKey, setActiveEditingKey] = useState<string | null>(null);
  const [viewerData, setViewerData] = useState<{
    isOpen: boolean; url: string; name: string; label?: string; contentType?: string;
  } | null>(null);

  // Pure SSR data projection: derive items directly from server-rendered initial props
  const discountConfiguredItems = useMemo(
    () => (initialData?.items || []).filter(isConfigured),
    [initialData?.items]
  );
  const socialConfiguredItems = useMemo(
    () => (initialSocialData?.items || []).filter(isConfigured),
    [initialSocialData?.items]
  );
  const currentRawItems = useMemo(
    () => (activeSubTab === 'social' ? initialSocialData?.items || [] : initialData?.items || []),
    [activeSubTab, initialData?.items, initialSocialData?.items]
  );
  const configuredItems = useMemo(
    () => currentRawItems.filter(isConfigured),
    [currentRawItems]
  );

  const levelCounts: LevelCounts = useMemo(() => {
    let apartment = 0;
    let wing = 0;
    let unit = 0;
    for (const item of configuredItems) {
      const lvl = getItemLevel(item);
      if (lvl === 'Apartment') apartment++;
      else if (lvl === 'Wing') wing++;
      else if (lvl === 'Unit') unit++;
    }
    return { all: configuredItems.length, apartment, wing, unit };
  }, [configuredItems]);

  const displayedItems = useMemo(() => {
    return configuredItems.filter((item) => {
      if (isApartmentScreen && selectedLevel && selectedLevel.toLowerCase() !== 'all') {
        const itemLvl = getItemLevel(item);
        if (itemLvl.toLowerCase() !== selectedLevel.toLowerCase()) return false;
      }
      return true;
    });
  }, [configuredItems, isApartmentScreen, selectedLevel]);

  const closeViewer = useCallback(() => {
    if (viewerData?.url) URL.revokeObjectURL(viewerData.url);
    setViewerData(null);
  }, [viewerData]);

  useEffect(() => {
    return () => { if (viewerData?.url) URL.revokeObjectURL(viewerData.url); };
  }, [viewerData]);

  const handleViewDocument = useCallback(async (item: PropertySocialDetailItem, rowKey: string) => {
    if (!item.documentGuid) return;
    setActiveViewingKey(rowKey);
    try {
      const res = await getDocumentBlobUrl(item.documentGuid, locale);
      setViewerData({
        isOpen: true,
        url: res.url,
        name: item.socialAttributeName || 'Document',
        label: item.socialAttributeName,
        contentType: res.contentType,
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to view document');
    } finally {
      setActiveViewingKey(null);
    }
  }, [locale]);

  const handleEditInQDE = useCallback((item?: PropertySocialDetailItem, rowKey?: string) => {
    const targetPropId =
      (propertyId && Number(propertyId) > 0 ? propertyId : undefined) ||
      (item?.propertyId && Number(item.propertyId) > 0 ? item.propertyId : undefined) ||
      initialData?.items?.find((i) => i.propertyId && Number(i.propertyId) > 0)?.propertyId ||
      initialSocialData?.items?.find((i) => i.propertyId && Number(i.propertyId) > 0)?.propertyId ||
      '0';

    setActiveEditingKey(rowKey || (item?.id ? String(item.id) : 'edit-all'));
    router.push(buildDiscountEditUrl({
      targetPropId, wardNo, wardId, propertyNo, societyDetailId, wingDetailsId, wingName,
      selectedLevel, item, activeSubTab, locale,
    }));
  }, [propertyId, initialData?.items, initialSocialData?.items, wardNo, wardId, propertyNo, societyDetailId, wingDetailsId, wingName, selectedLevel, activeSubTab, locale, router]);

  return {
    isApartmentScreen, activeSubTab, setActiveSubTab, selectedLevel, setSelectedLevel,
    activeViewingKey, activeEditingKey, viewerData, closeViewer,
    discountCount: discountConfiguredItems.length,
    socialCount: socialConfiguredItems.length,
    levelCounts, displayedItems, handleViewDocument, handleEditInQDE,
  };
}
