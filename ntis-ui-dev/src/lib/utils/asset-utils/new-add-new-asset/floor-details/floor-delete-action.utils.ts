/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from 'sonner';
import {
  deleteChildAssetAction,
  deleteFloorSubmissionAction,
} from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions';
import { getLocalizedFloorError } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-registration-utils';
import { recalculateFloorAfterDelete } from './floor-delete-reconcile.utils';

export async function executeFloorDelete(params: {
  id: number;
  savedFloors: any[];
  setSavedFloors: React.Dispatch<React.SetStateAction<any[]>>;
  formData: any;
  setDbFloors: React.Dispatch<React.SetStateAction<any[]>>;
  t: any;
  setIsLoading: (loading: boolean) => void;
}) {
  const { id, savedFloors, setSavedFloors, formData, setDbFloors, t, setIsLoading } = params;
  const assetToDelete = savedFloors.find((f: any) => f.id === id);
  if (!assetToDelete) return;

  const floorDetailsId = assetToDelete.floorDetailsId;
  setIsLoading(true);
  try {
    const isDirect =
      assetToDelete.isDirectFloorSubmission ||
      (!assetToDelete.assetNo && assetToDelete.subUnitsDetailsId);
    const targetId = assetToDelete.subUnitsDetailsId || id;
    const res = isDirect
      ? await deleteFloorSubmissionAction(targetId)
      : await deleteChildAssetAction(id);
    if (res.success) {
      const remainingFloors = savedFloors.filter((f: any) => f.id !== id);
      setSavedFloors(remainingFloors);

      if (floorDetailsId) {
        await recalculateFloorAfterDelete(
          floorDetailsId,
          assetToDelete.floorId,
          remainingFloors,
          formData,
          setDbFloors
        );
      }

      toast.success(
        t('floorDetails.deleteSuccessMsg') || 'Floor detail deleted successfully.'
      );
    } else {
      toast.error(
        getLocalizedFloorError(res.error, t) ||
        t('floorDetails.deleteFailedMsg') ||
        'Failed to delete.'
      );
    }
  } catch (e: any) {
    toast.error(
      t('floorDetails.genericErrorMsg', { message: e.message }) || 'Error: ' + e.message
    );
  } finally {
    setIsLoading(false);
  }
}
