'use client';

import { useTransition, useState, useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { handleFooterAction } from '@/app/[locale]/footer-actions';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export function useFooterActionHandler(
  onAction?: (command: string) => void,
  categoryId?: number,
  societyDetailId?: number,
  categoryName?: string,
  wingDetailId?: number
) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const t = useTranslations('ptis');
  const [isPending, startTransition] = useTransition();
  const [clickedCommand, setClickedCommand] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending) {
      const timer = setTimeout(() => {
        setClickedCommand(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isPending]);

  const handleActionClick = async (command: string) => {
    if (isPending) {
      return;
    }
    if (onAction) {
      onAction(command);
      return;
    }
    const propertyId = searchParams.get('propertyId') || undefined;
    if (command === 'PTIS_COMBINE' && !propertyId) {
      const msg = t.has('error.propertyNotSearched')
        ? t('error.propertyNotSearched')
        : (t.has('errors.propertyNotSearched')
          ? t('errors.propertyNotSearched')
          : 'Please search for a property first before combining.');
      toast.error(msg);
      return;
    }
    if (command === 'PTIS_COMMON_UPDATE' && !propertyId) {
      const msg = t.has('error.propertyNotSearchedCommonUpdate')
        ? t('error.propertyNotSearchedCommonUpdate')
        : (t.has('errors.propertyNotSearchedCommonUpdate')
          ? t('errors.propertyNotSearchedCommonUpdate')
          : 'Please search for a property first before updating common details.');
      toast.error(msg);
      return;
    }
    setClickedCommand(command);
    startTransition(async () => {
      const propertyId = searchParams.get('propertyId') || undefined;
      const wardNo = searchParams.get('wardNo') || undefined;
      const wardId = searchParams.get('wardId') || undefined;
      const propertyNo = searchParams.get('propertyNo') || undefined;
      const partitionNo = searchParams.get('partitionNo') || undefined;
      const tab = searchParams.get('tab') || undefined;
      const valuationTab = searchParams.get('valuationTab') || undefined;
      const appartmentTab = searchParams.get('appartmentTab') || undefined;
      const subTab = searchParams.get('subTab') || undefined;
      const showDetails = searchParams.get('showDetails') || undefined;

      const pathnameSegments = pathname.split('/').filter(Boolean);
      const locale = pathnameSegments[0] || 'en';
      const isApartment = pathname.includes('/property-tax/ptis/apartment') || pathname.includes('/apartment');
      const isIndividual =
        pathname.includes('/property-tax/ptis/individual') ||
        pathname.includes('/individual') ||
        categoryId === 2 ||
        (categoryId !== undefined && categoryId !== 1);

      const societyIdParam = !isIndividual ? (searchParams.get('societyId') || undefined) : undefined;
      const wingIdParam = !isIndividual ? (searchParams.get('wingId') || undefined) : undefined;
      const wingDetailIdParam = !isIndividual ? (searchParams.get('wingDetailId') || searchParams.get('wingdetailid') || undefined) : undefined;
      const wingNameParam = !isIndividual ? (searchParams.get('wingName') || searchParams.get('wingname') || undefined) : undefined;
      const explicitSocDetailId = !isIndividual
        ? (searchParams.get('societyDetailId') || searchParams.get('societydetailid') || societyIdParam || (societyDetailId ? String(societyDetailId) : undefined))
        : undefined;
      const explicitWingDetailId = !isIndividual
        ? (wingDetailIdParam || (wingDetailId ? String(wingDetailId) : undefined))
        : undefined;

      const rateableExpand = searchParams.getAll('rateableExpand');
      const capitalExpand = searchParams.getAll('capitalExpand');
      const dualExpand = searchParams.getAll('dualExpand');

      const rateableExpandParam = rateableExpand.length > 0 ? rateableExpand : undefined;
      const capitalExpandParam = capitalExpand.length > 0 ? capitalExpand : undefined;
      const dualExpandParam = dualExpand.length > 0 ? dualExpand : undefined;

      const result = await handleFooterAction(command, {
        propertyId,
        locale,
        wardNo,
        wardId,
        propertyNo,
        partitionNo,
        tab,
        valuationTab,
        appartmentTab,
        subTab,
        showDetails,
        rateableExpand: rateableExpandParam,
        capitalExpand: capitalExpandParam,
        dualExpand: dualExpandParam,
        categoryId,
        categoryName,
        societyDetailId: explicitSocDetailId ? Number(explicitSocDetailId) : undefined,
        societyId: societyIdParam,
        wingDetailId: explicitWingDetailId,
        wingId: wingIdParam,
        wingName: wingNameParam,
        isApartment,
        isIndividual,
      });
      if (result.success) {
        toast.success(result.message || 'Action executed.');
        if (command === 'PTIS_REFRESH') {
          router.refresh();
        }
      } else if (result.error) {
        const errorMsg = t.has(result.error) ? t(result.error) : result.error;
        toast.error(errorMsg);
      }
    });
  };

  return { handleActionClick, isPending, clickedCommand };
}