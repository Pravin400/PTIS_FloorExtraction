'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getDepartmentContextFromCookieStore, getUserIdFromCookies } from '@/lib/utils/cookie';
import { propertyWorkflowStageService } from '@/lib/api/ptis/propertyWorkflowStage/propertyWorkflowStage.service';
import type { PropertyWorkflowStage, PropertyWorkflowDetail } from '@/types/propertyWorkflowStage.types';
import { workflowStageActionSchema } from '@/lib/validations/ptis.schema';

export async function getWorkflowStagesAction(): Promise<{
  success: boolean;
  data?: PropertyWorkflowStage[];
  error?: string;
}> {
  try {
    const result = await propertyWorkflowStageService.getWorkflowStages();
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error || 'Action failed' };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function savePropertyWorkflowStageAction(
  propertyId: number | string,
  workflowStageId: number,
  locale: string = 'en'
): Promise<{ success: boolean; data?: PropertyWorkflowDetail; error?: string }> {
  try {
    const validation = workflowStageActionSchema.safeParse({ propertyId, workflowStageId });
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((issue) => issue.message).join(', ');
      return { success: false, error: errorMsg };
    }

    const cookieStore = await cookies();
    const { moduleId } = getDepartmentContextFromCookieStore(cookieStore);
    const userId = getUserIdFromCookies(cookieStore);

    const result = await propertyWorkflowStageService.savePropertyWorkflowDetail(
      propertyId,
      workflowStageId,
      moduleId,
      userId
    );
    if (result.success) {
      revalidatePath(`/${locale}/property-tax/ptis`, 'page');
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error || 'Action failed' };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function getCurrentWorkflowDetailAction(
  propertyId: number | string
): Promise<{ success: boolean; data?: PropertyWorkflowDetail; error?: string }> {
  try {
    const result = await propertyWorkflowStageService.getCurrentWorkflowDetail(propertyId);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error || 'Action failed' };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function getPropertyWorkflowDetailsAction(
  propertyId: number | string
): Promise<{ success: boolean; data?: PropertyWorkflowDetail[]; error?: string }> {
  try {
    const result = await propertyWorkflowStageService.getPropertyWorkflowDetails(propertyId);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error || 'Action failed' };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

