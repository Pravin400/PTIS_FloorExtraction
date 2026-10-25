'use server';

import { revalidatePath } from 'next/cache';
import { proceedClerkApplication, getClerkApplications } from '@/lib/api/fire-audit/staff/clerk.service';
import type { ClerkFilterParams, ClerkApplicationItem } from '@/types/fire-audit/clerk.types';

export interface ProceedClerkActionResult {
    success: boolean;
    error?: string;
    message?: string;
}

/**
 * Server Action to transition a Clerk application through the audit lifecycle.
 */
export async function proceedClerkApplicationAction(
    applicationId: string,
    action: string,
    remarks?: string
): Promise<ProceedClerkActionResult> {
    try {
        if (!applicationId) {
            return { success: false, error: "Application ID is required" };
        }

        const res = await proceedClerkApplication(applicationId, action, remarks);

        // Revalidate Next.js Server Component page cache
        revalidatePath('/[locale]/fire-audit/clerk', 'page');

        return { success: res.success, message: res.message };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to process application",
        };
    }
}

/**
 * Server Action to revalidate Clerk queue cache on demand.
 */
export async function revalidateClerkQueueAction(): Promise<void> {
    revalidatePath('/[locale]/fire-audit/clerk', 'page');
}

/**
 * Server Action to fetch Clerk applications on demand (e.g. for client-side pagination).
 */
export async function fetchClerkApplicationsAction(
    filters: ClerkFilterParams = {}
): Promise<{ items: ClerkApplicationItem[]; totalCount: number }> {
    return await getClerkApplications(filters);
}
