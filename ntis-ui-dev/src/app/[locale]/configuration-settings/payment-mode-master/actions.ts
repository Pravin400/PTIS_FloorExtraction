'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getUserIdFromCookies } from '@/lib/utils/cookie';
import {
    createPaymentModeMaster,
    deletePaymentModeMaster,
    getPaymentModeMastersPagedServer,
    updatePaymentModeMaster,
} from '@/lib/api/configuration-settings/payment-mode/paymentMode.services';
import { PaymentModeFormModel } from '@/types/paymentMode.types';


export async function getPaymentModeMastersAction(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = '') {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (userId == null) {
        return {
            success: false,
            error: 'Unauthorized',
        };
    }

    const result = await getPaymentModeMastersPagedServer(pageNumber, pageSize, searchTerm);
    if (result.success) {
        return {
            success: true,
            data: result.data,
        };
    }
    return {
        success: false,
        error: result.error || 'Failed to fetch payment modes',
    };
}

export async function getAllPaymentModeMastersAction() {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (userId == null) {
        return {
            success: false,
            error: 'Unauthorized',
            data: [],
        };
    }

    const result = await getPaymentModeMastersPagedServer(1, 1000);
    // TODO: Replace this with a summary/metadata endpoint for stats (see bank-master/actions.cache.ts)
    // Avoid fetching all records for stats; this is a temporary workaround.
    if (result.success && result.data && Array.isArray(result.data.items)) {
        return {
            success: true,
            data: result.data.items,
        };
    }
    return {
        success: false,
        error: result.error || 'Failed to fetch payment modes',
        data: [],
    };
}

export async function savePaymentModeMasterAction(formData: FormData) {
    try {
        const cookieStore = await cookies();
        const userId = getUserIdFromCookies(cookieStore);
        if (userId == null) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }
        const id = formData.get('id');
        const data: PaymentModeFormModel = {
            id: id ? Number(id) : undefined,
            code: formData.get('code') as string,
            paymentModeName: formData.get('paymentModeName') as string,
            type: formData.get('type') as string,
            category: formData.get('category') as string,
            description: formData.get('description') as string,
            chargeType: formData.get('chargeType') as string,
            transactionCharge: Number(formData.get('transactionCharge')),
            isActive: formData.get('isActive') === 'true',
        };

        if (data.id) {
            await updatePaymentModeMaster(data, userId);
        } else {
            await createPaymentModeMaster(data, userId);
        }

        revalidatePath('/[locale]/configuration-settings/payment-mode-master', 'page');
        return {
            success: true,
            messageKey: data.id ? 'toast.updateSuccess' : 'toast.createSuccess',
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to save payment mode',
        };
    }
}

export async function deletePaymentModeMasterAction(formData: FormData) {
    try {
        const cookieStore = await cookies();
        const userId = getUserIdFromCookies(cookieStore);
        if (userId == null) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        const id = Number(formData.get('id'));
        if (isNaN(id)) throw new Error("Invalid payment mode ID");

        await deletePaymentModeMaster(id);
        revalidatePath('/[locale]/configuration-settings/payment-mode-master', 'page');
        return {
            success: true,
            messageKey: 'toast.deleteSuccess',
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete payment mode',
        };
    }
}
