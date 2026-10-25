/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';
import { departmentService } from '@/lib/api/asset/department.service';


import { floorLookupService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/floor-lookup.service';
import { logger } from '@/lib/utils/logger';
import { ActionResult } from '@/types/common.types';
import { isRedirectError } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/shared.utils';

export async function fetchSubUseTypesAction(typeOfUseId?: number): Promise<ActionResult<any[]>> {
  try {
    const items = await floorLookupService.getSubUseTypes(typeOfUseId);
    const mapped = items
      .filter(
        (s: any) =>
          s.isActive !== false &&
          s.isActive !== 0 &&
          s.IsActive !== false &&
          s.IsActive !== 0 &&
          s.status?.toLowerCase() !== 'inactive'
      )
      .map((s: any) => {
        const code = s.subTypeCode ?? s.code ?? '';
        const desc = s.description ?? s.subTypeName ?? '';
        return {
          label: code && desc ? `${code} - ${desc}` : desc || String(s.id),
          value: String(s.id),
          typeOfUseId: String(s.typeOfUseId || typeOfUseId),
        };
      });
    return { success: true, data: mapped };
  } catch (err: any) {
    logger.error('fetchSubUseTypesAction Error:', { error: err });
    return { success: false, error: 'Network error fetching sub-use types' };
  }
}

export async function fetchSubFloorAction(floorId?: number): Promise<ActionResult<any[]>> {
  try {
    const items = await floorLookupService.getSubFloors(floorId);
    const mapped = items.map((s: any) => {
      const desc = s.subFloorDescription ?? s.description ?? s.subFloorName ?? String(s.id);
      return {
        label: desc,
        value: String(s.id),
        floorId: String(s.floorId || floorId || ''),
      };
    });
    return { success: true, data: mapped };
  } catch (err: any) {
    logger.error('fetchSubFloorAction Error:', { error: err });
    return { success: false, error: 'Network error fetching sub floors' };
  }
}

/**
 * Server action to fetch all departments for dropdown assignment
 */
export async function fetchDepartmentsAction(): Promise<
  ActionResult<{ label: string; value: string }[]>
> {
  try {
    const res = await departmentService.getDepartments();
    if (res.success && res.data) {
      const items = Array.isArray(res.data) ? res.data : [];
      const options = items
        .filter(
          (d: any) =>
            d.isActive !== false &&
            d.isActive !== 0 &&
            d.IsActive !== false &&
            d.IsActive !== 0 &&
            d.status?.toLowerCase() !== 'inactive'
        )
        .map((d: any) => ({
          label: d.departmentName || d.owningDepartmentName || `Dept ${d.id}`,
          value: String(d.id),
        }));
      return { success: true, data: options };
    }
    return { success: false, error: 'Failed to fetch departments' };
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    logger.error('fetchDepartmentsAction Error:', { error: err });
    return { success: true, data: [] }; // graceful fallback
  }
}

export async function fetchRoomTypesAction(categoryId?: number, typeId?: number): Promise<ActionResult<{ label: string; value: string }[]>> {
  try {
    const items = await floorLookupService.getRoomTypes(categoryId, typeId);
    const mapped = (items || [])
      .filter(
        (s: any) =>
          s.isActive !== false &&
          s.isActive !== 0 &&
          s.IsActive !== false &&
          s.IsActive !== 0 &&
          s.status?.toLowerCase() !== 'inactive'
      )
      .map((s: any) => {
        const desc = s.roomTypeName ?? s.description ?? s.roomTypeDescription ?? String(s.id ?? '');
        return {
          label: desc,
          value: desc,
          id: String(s.id ?? s.roomTypeId ?? '')
        };
      });

    // Deduplicate by value to prevent React key errors
    const uniqueMapped = mapped.filter((item, index, self) =>
      index === self.findIndex((t) => t.value === item.value)
    );

    return { success: true, data: uniqueMapped };
  } catch (err: any) {
    logger.error('fetchRoomTypesAction Error:', { error: err });
    return { success: false, error: 'Network error fetching room types' };
  }
}
