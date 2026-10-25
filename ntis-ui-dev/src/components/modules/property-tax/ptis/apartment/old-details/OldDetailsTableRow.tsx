'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { MappedPropertySocietyWiseItem } from '@/types/property-mapping/property-mapping-society-wise.types';
import { OLD_DETAILS_COLUMNS } from './oldDetailsColumns';
import { cn } from '@/lib/utils/cn';

interface OldDetailsTableRowProps {
  item: MappedPropertySocietyWiseItem;
  idx?: number;
}

export const OldDetailsTableRow: React.FC<OldDetailsTableRowProps> = ({ item, idx = 0 }) => {
  const locale = useLocale();
  const isMarathi = locale === 'mr';

  const getLocalized = (mrVal?: string | null, enVal?: string | null): string => {
    if (isMarathi) return mrVal || enVal || '—';
    return enVal || mrVal || '—';
  };

  const getPropFlat = (): string => {
    const propNo = item.propertyNo
      ? (item.partitionNo ? `${item.propertyNo}-${item.partitionNo}` : item.propertyNo)
      : '—';
    const flat = item.flatOrShopNo || item.flatOrShopName;
    return flat ? `${propNo} / ${flat}` : propNo;
  };

  const getOldPropFlat = (): string => {
    const oldProp = item.oldPropertyNo
      ? (item.oldPartitionNo ? `${item.oldPropertyNo}-${item.oldPartitionNo}` : item.oldPropertyNo)
      : '—';
    const oldFlat = item.oldFlatOrShopNumber;
    return oldFlat ? `${oldProp} / ${oldFlat}` : oldProp;
  };

  const getParking = (): string => {
    if (item.oldParkingAreaSqFt != null && item.oldParkingAreaSqMtr != null) {
      return `${item.oldParkingAreaSqFt} / ${item.oldParkingAreaSqMtr}`;
    }
    if (item.oldParkingAreaSqFt != null) return `${item.oldParkingAreaSqFt} sq.ft`;
    if (item.oldParkingAreaSqMtr != null) return `${item.oldParkingAreaSqMtr} m²`;
    return '—';
  };

  const getRoomsToilets = (): string => {
    const rooms = item.oldTotalRooms != null ? `${item.oldTotalRooms} R` : null;
    const toilets = item.noOfOldToilets != null ? `${item.noOfOldToilets} T` : null;
    if (rooms && toilets) return `${rooms} / ${toilets}`;
    return rooms || toilets || '—';
  };

  const getOldTax = (): string => {
    const gen = item.oldGeneralTax != null ? `₹${item.oldGeneralTax.toLocaleString()}` : null;
    const tot = item.oldTotalTax != null ? `₹${item.oldTotalTax.toLocaleString()}` : null;
    if (gen && tot) return `${gen} / ${tot}`;
    return gen || tot || '—';
  };

  const formatCellValue = (key: string): React.ReactNode => {
    switch (key) {
      case 'index':
        return idx + 1;
      case 'propFlat':
        return getPropFlat();
      case 'ownerName':
        return getLocalized(item.ownerName, item.ownerNameEnglish);
      case 'occupierName':
        return getLocalized(item.occupierName, item.occupierNameEnglish);
      case 'address':
        return getLocalized(item.address, item.addressEnglish);
      case 'csnPlot':
        return item.csn && item.plotNo ? `${item.csn} / ${item.plotNo}` : (item.csn || item.plotNo || '—');
      case 'contact':
        return item.mobileNo || item.emailId || '—';
      case 'mappingCategory':
        return item.mappingCategory || '—';
      case 'oldPropFlat':
        return getOldPropFlat();
      case 'oldWardZone':
        return item.oldWardNo && item.oldZoneNo ? `${item.oldWardNo} / ${item.oldZoneNo}` : (item.oldWardNo || item.oldZoneNo || '—');
      case 'oldWingFloor':
        return item.oldFloor || '—';
      case 'oldEgovNo':
        return item.oldEgovNo || '—';
      case 'oldCsnPlot':
        return item.oldCSN && item.oldPlotNo ? `${item.oldCSN} / ${item.oldPlotNo}` : (item.oldCSN || item.oldPlotNo || '—');
      case 'oldUseType':
        return item.oldUseType || '—';
      case 'oldConstructionYear':
        return item.oldConstructionYear || '—';
      case 'oldAssessmentYear':
        return item.oldAssessmentYear || '—';
      case 'oldConstructionArea':
        return item.oldConstructionArea != null ? `${item.oldConstructionArea.toLocaleString()} sq.ft` : '—';
      case 'oldPlotArea':
        return item.oldPlotArea != null ? `${item.oldPlotArea.toLocaleString()} sq.ft` : '—';
      case 'oldParking':
        return getParking();
      case 'oldRoomsToilets':
        return getRoomsToilets();
      case 'oldOwnerName':
        return getLocalized(item.oldOwnerName, item.oldOwnerNameEnglish);
      case 'oldOccupierName':
        return getLocalized(item.oldOccupierName, item.oldOccupierNameEnglish);
      case 'oldAddress':
        return getLocalized(item.oldAddress, item.oldAddressEnglish);
      case 'oldSocietyName':
        return item.oldSocietyName || '—';
      case 'oldALV':
        return item.oldALV != null ? `₹${item.oldALV.toLocaleString()}` : '—';
      case 'oldRV':
        return item.oldRV != null ? `₹${item.oldRV.toLocaleString()}` : '—';
      case 'oldTax':
        return getOldTax();
      case 'oldAssessmentDate':
        return item.oldAssessmentDate || '—';
      case 'oldContact':
        return item.oldMobileNo || item.oldEmailId || '—';
      default:
        return '—';
    }
  };

  return (
    <tr className="h-10 transition-colors hover:bg-blue-50/50 border-b border-zinc-100 text-[11px]">
      {OLD_DETAILS_COLUMNS.map((col) => {
        const isIndex = col.key === 'index';
        return (
          <td
            key={col.key}
            className={cn(
              'px-3 py-2 whitespace-nowrap font-medium text-zinc-800',
              isIndex && 'sticky left-0 bg-white group-hover:bg-blue-50/80 z-10 border-r border-zinc-200 text-zinc-500 font-bold',
              col.minWidth,
              col.align
            )}
          >
            {formatCellValue(col.key)}
          </td>
        );
      })}
    </tr>
  );
};
