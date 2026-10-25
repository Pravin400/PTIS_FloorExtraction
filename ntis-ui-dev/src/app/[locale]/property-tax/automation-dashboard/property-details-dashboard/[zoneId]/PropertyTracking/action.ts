'use server';

import { getTranslations } from 'next-intl/server';
import { ApiError } from '@/lib/utils/api';
import { createLogger } from '@/lib/utils/server-logger';
import { getPropertyTrackingStageStatus } from '@/lib/api/automation-dashboard/property-dashboard/property-subgrid-details.service';
import { PropertyTrackingStageStatusItem } from '@/types/automation-dashboard/property-dashboard/property-subgrid-details.type';

const logger = createLogger('PropertyTrackingActions');

type ActionResult<T> = {
	success: boolean;
	data?: T | null;
	error?: string;
	statusCode?: number;
};

export async function getPropertyTrackingStageStatusAction(
	propertyId: string | number
): Promise<ActionResult<PropertyTrackingStageStatusItem[]>> {
	try {
		logger.info('getPropertyTrackingStageStatusAction: Fetching tracking status', { propertyId });
		const data = await getPropertyTrackingStageStatus(propertyId);
		return { success: true, data };
	} catch (error) {
		logger.error('Failed to fetch property tracking stage status', { propertyId }, error);
		if (error instanceof ApiError) {
			return { success: false, error: error.message, statusCode: error.statusCode };
		}
		const t = await getTranslations('automationDashboard');
		return { success: false, error: t('errors.fetchPropertyTrackingStatus') || 'Failed to fetch property tracking stage status', statusCode: 500 };
	}
}
