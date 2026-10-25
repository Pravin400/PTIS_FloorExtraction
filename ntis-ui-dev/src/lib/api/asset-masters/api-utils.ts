import { ApiError } from "@/lib/utils/api";

export async function handleMasterDataApiRequest<T>(
  requestFn: () => Promise<{ success: boolean; data?: T; statusCode?: number; error?: string }>,
  defaultErrorMessage = 'Operation failed'
): Promise<T> {
  try {
    const res = await requestFn();
    if (!res.success) {
      const msg = res.error ?? '';
      const isDuplicate =
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('duplicate');
      throw new ApiError(
        res.statusCode ?? (isDuplicate ? 409 : 500),
        msg || defaultErrorMessage,
        defaultErrorMessage
      );
    }
    return res.data as T;
  } catch (error) {
    throw error;
  }
}
