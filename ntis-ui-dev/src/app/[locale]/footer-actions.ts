'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { footerService, FooterAction } from '@/lib/api/footer.service';
import { z } from 'zod';
import { getTranslations } from 'next-intl/server';
import { MAIN_TO_QDE_MAP } from '@/lib/utils/qde-tab-mapping';

export type ActionResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

export interface FooterActionPayload {
  propertyId?: string;
  locale?: string;
  wardNo?: string;
  wardId?: string;
  propertyNo?: string;
  partitionNo?: string;
  tab?: string;
  valuationTab?: string;
  appartmentTab?: string;
  subTab?: string;
  showDetails?: string;
  rateableExpand?: string | string[];
  capitalExpand?: string | string[];
  dualExpand?: string | string[];
  categoryId?: number;
  categoryName?: string;
  societyDetailId?: number;
  societyId?: string;
  wingDetailId?: string;
  wingId?: string;
  wingName?: string;
  isRedesign?: boolean;
  isApartment?: boolean;
  isIndividual?: boolean;
}

const ptisEditRedirectSchema = z.object({
  propertyId: z.coerce.number().positive(),
  locale: z.enum(['en', 'hi', 'mr']).default('en'),
  wardNo: z
    .string()
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  wardId: z.coerce.number().positive().optional(),
  propertyNo: z
    .string()
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  partitionNo: z
    .string()
    .regex(/^[a-zA-Z0-9_-]*$/)
    .optional(),
  tab: z.string().optional(),
  valuationTab: z.string().optional(),
  appartmentTab: z.string().optional(),
  subTab: z.string().optional(),
  showDetails: z.string().optional(),
  societyDetailId: z.coerce.number().optional(),
  societyId: z.string().optional(),
  wingDetailId: z.string().optional(),
  wingId: z.string().optional(),
  wingName: z.string().optional(),
  rateableExpand: z.union([z.string(), z.array(z.string())]).optional(),
  capitalExpand: z.union([z.string(), z.array(z.string())]).optional(),
  dualExpand: z.union([z.string(), z.array(z.string())]).optional(),
  categoryId: z.coerce.number().optional(),
  isApartment: z.boolean().optional(),
  isIndividual: z.boolean().optional(),
});

/**
 * Detects Next.js redirect errors to allow them to propagate.
 */
function isRedirectError(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'digest' in e &&
    typeof (e as { digest?: unknown }).digest === 'string' &&
    String((e as { digest: string }).digest).startsWith('NEXT_REDIRECT')
  );
}

/**
 * Server Action to fetch footer actions based on screen and role.
 */
export async function getFooterActionsAction(
  userRoleId: number,
  targetRoute?: string
): Promise<ActionResult<FooterAction[]>> {
  try {
    const actions = await footerService.getAuthorizedActions({ userRoleId, targetRoute });
    return { success: true, data: actions };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}

/**
 * Generic handler for footer commands.
 * This can be expanded to route to different feature-specific actions.
 */
export async function handleFooterAction(
  command: string,
  _payload: unknown
): Promise<ActionResult<unknown>> {
  try {
    const payload = (_payload as FooterActionPayload) || {};

    switch (command) {
      case 'CALCULATE':
        return { success: true, data: null, message: 'Calculation triggered successfully.' };
      case 'SAVE_PTIS':
        return { success: true, data: null, message: 'Assessment saved successfully.' };
      case 'PTIS_EDIT_ENTRY': {
        const validationResult = ptisEditRedirectSchema.safeParse(payload);
        if (!validationResult.success) {
          const errors = validationResult.error.format();
          if (errors.propertyId) {
            return { success: false, error: 'error.propertyIdMissing' };
          }
          return { success: false, error: 'Invalid or insecure redirect payload.' };
        }

        const {
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
          societyDetailId,
          societyId,
          wingDetailId,
          wingId,
          wingName,
          rateableExpand,
          capitalExpand,
          dualExpand,
          categoryId,
          isApartment,
          isIndividual,
        } = validationResult.data;

        const params = new URLSearchParams();
        if (wardNo) params.set('wardNo', wardNo);
        if (wardId) params.set('wardId', String(wardId));
        if (propertyNo) params.set('propertyNo', propertyNo);
        if (partitionNo && partitionNo !== '0') params.set('partitionNo', partitionNo);
        if (valuationTab) params.set('valuationTab', valuationTab);
        if (appartmentTab) params.set('appartmentTab', appartmentTab);
        if (subTab) params.set('subTab', subTab);
        if (showDetails) params.set('showDetails', showDetails);

        const isIndividualProp = isIndividual || categoryId === 2 || (categoryId !== undefined && categoryId !== 1);
        const isApartmentProp = !isIndividualProp && (isApartment || categoryId === 1);

        if (isApartmentProp) {
          params.set('parentPropertyId', String(propertyId));
          const activeSocId = societyDetailId || societyId;
          if (activeSocId) {
            params.set('societyDetailId', String(activeSocId));
            params.set('societyId', String(activeSocId));
          }
          const activeWingId = wingDetailId || wingId;
          if (activeWingId) {
            params.set('wingDetailId', String(activeWingId));
            params.set('wingId', String(activeWingId));
          }
          if (wingName) params.set('wingName', String(wingName));
        }

        const handleExpand = (key: string, val: string | string[] | undefined) => {
          if (val) {
            if (Array.isArray(val)) {
              val.forEach((v) => params.append(key, v));
            } else {
              params.set(key, val);
            }
          }
        };
        handleExpand('rateableExpand', rateableExpand);
        handleExpand('capitalExpand', capitalExpand);
        handleExpand('dualExpand', dualExpand);

        const activeTabKey = tab || (isApartment ? 'buildingpermission' : 'propertydetails');
        let resolvedTabKey = (activeTabKey === 'societydetails' || activeTabKey === 'wingdetails')
          ? 'propertydetails'
          : activeTabKey;
        if (isApartment && (resolvedTabKey === 'propertydetails' || resolvedTabKey === 'wingintelligence')) {
          resolvedTabKey = 'buildingpermission';
        }
        const config = MAIN_TO_QDE_MAP[resolvedTabKey] || (isApartment ? MAIN_TO_QDE_MAP.buildingpermission : MAIN_TO_QDE_MAP.propertydetails);

        params.set('propertyId', String(propertyId));
        params.set('returnTab', isApartmentProp ? 'apartment' : isIndividualProp ? 'individual' : config.mainTabId);
        params.set('from', isApartmentProp ? 'apartment' : isIndividualProp ? 'individual' : 'ptis');
        if (categoryId !== undefined) {
          params.set('categoryId', String(categoryId));
        }
        params.set('hideWing', 'true');
        params.set('hideSociety', 'true');
        params.set('fromFooterEdit', 'true');

        const targetPath = `/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/${config.qdePath}`;
        const queryString = params.toString();
        const suffix = queryString ? `?${queryString}` : '';
        redirect(`${targetPath}${suffix}`);
      }
      case 'PTIS_COMBINE': {
        const payloadLocale = payload.locale || 'en';
        const params = new URLSearchParams();

        if (payload.propertyId) params.set('basePropertyId', payload.propertyId);
        if (payload.wardId) params.set('wardId', String(payload.wardId));
        if (payload.wardNo) params.set('wardNo', payload.wardNo);
        if (payload.propertyNo) params.set('propertyNo', payload.propertyNo);
        if (payload.partitionNo) params.set('partitionNo', payload.partitionNo);
        if (payload.categoryId) params.set('categoryId', String(payload.categoryId));
        if (payload.societyDetailId) params.set('societyDetailId', String(payload.societyDetailId));
        if (payload.wingDetailId) params.set('wingDetailId', String(payload.wingDetailId));

        const queryString = params.toString();
        const suffix = queryString ? `?${queryString}` : '';

        redirect(`/${payloadLocale}/property-tax/ptis/combineproperty${suffix}`);
      }
      case 'PTIS_COMMON_UPDATE': {
        const payloadLocale = payload.locale || 'en';
        const params = new URLSearchParams();

        if (payload.propertyId) params.set('propertyId', payload.propertyId);
        if (payload.wardId) params.set('wardId', String(payload.wardId));
        if (payload.wardNo) params.set('wardNo', payload.wardNo);
        if (payload.propertyNo) params.set('propertyNo', payload.propertyNo);
        if (payload.partitionNo) params.set('partitionNo', payload.partitionNo);
        if (payload.societyDetailId) params.set('societyDetailId', String(payload.societyDetailId));
        if (payload.wingDetailId) params.set('wingDetailId', String(payload.wingDetailId));
        params.set('from', 'ptis');

        const queryString = params.toString();
        const suffix = queryString ? `?${queryString}` : '';

        redirect(`/${payloadLocale}/property-tax/common-details-update${suffix}`);
      }
      case 'PTIS_TAP_WATER': {
        if (!payload.propertyId) {
          return { success: false, error: 'error.propertyIdMissing' };
        }
        const payloadLocale = payload.locale || 'en';
        const params = new URLSearchParams();
        params.set('propertyId', String(payload.propertyId));
        if (payload.wardId) params.set('wardId', String(payload.wardId));
        if (payload.wardNo) params.set('wardNo', payload.wardNo);
        if (payload.propertyNo) params.set('propertyNo', payload.propertyNo);
        if (payload.partitionNo) params.set('partitionNo', payload.partitionNo);
        if (payload.tab) params.set('returnTab', payload.tab);

        const queryString = params.toString();
        const suffix = queryString ? `?${queryString}` : '';
        redirect(`/${payloadLocale}/property-tax/waterconnection${suffix}`);
      }
      case 'PTIS_APPLY':
      case 'PTIS_APPLICABLE_TAXES_INFO': {
        if (!payload.propertyId) {
          return { success: false, error: 'error.propertyIdMissing' };
        }
        const isApartmentCategory =
          payload.categoryId === 1 ||
          payload.categoryId === 0 ||
          String(payload.categoryName || '').toLowerCase().includes('apartment');
        const hasPartitionNo = Boolean(
          payload.partitionNo &&
          payload.partitionNo !== '0' &&
          payload.partitionNo.trim() !== '' &&
          payload.partitionNo.trim() !== '-'
        );

        if (isApartmentCategory && !hasPartitionNo) {
          return { success: false, error: '' };
        }

        const payloadLocale = payload.locale || 'en';
        const params = new URLSearchParams();
        params.set('propertyId', payload.propertyId);
        if (payload.wardId) params.set('wardId', String(payload.wardId));
        if (payload.wardNo) params.set('wardNo', payload.wardNo);
        if (payload.propertyNo) params.set('propertyNo', payload.propertyNo);
        if (payload.partitionNo !== undefined) params.set('partitionNo', payload.partitionNo);
        if (payload.valuationTab) params.set('valuationTab', payload.valuationTab);
        redirect(
          `/${payloadLocale}/property-tax/ptis/applicable-taxes?${params.toString()}`
        );
      }
      case 'PTIS_REFRESH': {
        const payloadLocale = payload.locale || 'en';
        const propertyId = payload.propertyId;
        const wardNo = payload.wardNo;
        const propertyNo = payload.propertyNo;
        const isSelected =
          (propertyId && propertyId !== 'undefined' && propertyId !== 'null') ||
          (wardNo && wardNo !== 'undefined' && propertyNo && propertyNo !== 'undefined');

        if (!isSelected) {
          const t = await getTranslations({ locale: payloadLocale, namespace: 'ptis' });
          return { success: false, error: t('error.selectPropertyFirst') };
        }

        revalidatePath(`/${payloadLocale}/property-tax/ptis`, 'page');
        revalidatePath(`/${payloadLocale}/property-tax/ptis/individual`, 'page');
        revalidatePath(`/${payloadLocale}/property-tax/ptis/apartment`, 'page');
        return { success: true, data: null, message: 'Taxes refreshed successfully.' };
      }
      case 'PTIS_PROPERTY_REPORT': {
        const payloadLocale = payload.locale || 'en';
        const params = new URLSearchParams();
        if (payload.propertyId) params.set('propertyId', payload.propertyId);
        if (payload.wardId) params.set('wardId', payload.wardId);
        if (payload.wardNo) params.set('wardNo', payload.wardNo);
        if (payload.propertyNo) params.set('propertyNo', payload.propertyNo);
        const queryString = params.toString();
        const suffix = queryString ? `?${queryString}` : '';
        redirect(`/${payloadLocale}/property-tax/reports${suffix}`);
      }
      default:
        return { success: false, error: `Command ${command} is not yet implemented.` };
    }
  } catch (error: unknown) {
    if (isRedirectError(error)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Action execution failed';
    return { success: false, error: message };
  }
}
