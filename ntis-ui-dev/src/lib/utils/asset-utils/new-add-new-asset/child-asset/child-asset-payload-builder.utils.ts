 
import 'server-only';
import { CreateChildAssetRequest } from '@/types/asset/floor-details.types';
import { appendFormDataRecursive } from './child-asset.utils';
import { buildChildAssetApiPayload } from './child-asset-payload-fields.utils';
import { stageChildAssetPhotos } from './child-asset-photo-staging.utils';

/**
 * Builds the multipart FormData payload sent to /ManageSubUnits/create for a detailed child
 * asset: normalizes the flat DTO fields + rent information + room details, then stages any
 * pending photo/plan files (matching basic info step's staging convention) as PhotoFiles with
 * a PhotoMetadataJson sidecar.
 */
export async function buildChildAssetPayload(
  data: CreateChildAssetRequest,
  userId: number | undefined
): Promise<FormData> {
  const apiPayload = buildChildAssetApiPayload(data, userId);

  const formDataPayload = new FormData();
  appendFormDataRecursive(formDataPayload, apiPayload);

  await stageChildAssetPhotos(formDataPayload, data);

  return formDataPayload;
}
