/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  createFloorSubmissionAction,
  updateFloorSubmissionAction,
  deleteFloorSubmissionAction,
  getFloorSubmissionByIdAction,
  getFloorSubmissionsByParentAction,
  syncUnitFloorAction,
} from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions';
import { mapUnitRoomsToDrawerRooms } from '@/lib/utils/asset-utils/new-add-new-asset/room-wise-submission-mapping.utils';

export interface DuplicateEntry {
  /** sequential or db-backed id for list key */
  entryId: string;
  subUnitsDetailsId?: number;
  floorLabel: string;
  floorId?: number | string;
  subFloorName: string;
  subFloorId: string | number;
  conYear: string | number;
  asstYear?: string | number;
  conType: string;
  useType?: string;
  subUseType?: string;
  subTypeOfUseName?: string;
  ccDate?: string;
  ocDate?: string;
  isTaxable?: boolean;
  isRenter?: boolean;
  carpetAreaSqFeet: number;
  carpetAreaSqMeter?: number;
  builtupAreaSqFeet?: number;
  builtupAreaSqMeter?: number;
  noOfRooms?: number;
  rooms: any[];
  openSpacesList: any[];
  /** full formData snapshot for edit reload */
  formDataSnapshot: any;
}

interface UseSubUnitDuplicateModeParams {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  roomsList: any[];
  setRoomsList: React.Dispatch<React.SetStateAction<any[]>>;
  openSpacesList: any[];
  setOpenSpacesList: React.Dispatch<React.SetStateAction<any[]>>;
  confirm?: (args: any) => void;
  onSave?: (updatedUnit: any, options?: { isDuplicateMode?: boolean }) => void;
  targetAssetId?: number;
  dropdownOptions?: any;
  subFloorOptions?: any[];
  dynamicSubUseTypes?: any[];
  area?: number;
  setSubmissionType?: (type: 'Construction' | 'Open Space') => void;
}

export function useSubUnitDuplicateMode({
  formData,
  setFormData,
  roomsList,
  setRoomsList,
  openSpacesList,
  setOpenSpacesList,
  targetAssetId,
  dropdownOptions,
  subFloorOptions,
  dynamicSubUseTypes,
  area,
  setSubmissionType,
}: UseSubUnitDuplicateModeParams) {
  const [duplicateEntries, setDuplicateEntries] = useState<DuplicateEntry[]>([]);
  const [editingDuplicateId, setEditingDuplicateId] = useState<string | null>(null);
  const [initialSubUnitsDetailsId, setInitialSubUnitsDetailsId] = useState<number | null>(null);

  const formDataRef = useRef(formData);
  const dynamicSubUseTypesRef = useRef(dynamicSubUseTypes);

  useEffect(() => {
    formDataRef.current = formData;
    dynamicSubUseTypesRef.current = dynamicSubUseTypes;
  });

  const effectiveAssetId = Number(
    targetAssetId ||
    formData?.assetId ||
    formData?.AssetId ||
    formData?.dbId ||
    formData?.id ||
    0
  );

  /**
   * Resets the Floor & Construction Details form fields so the user has a completely
   * fresh start to add a new floor, while preserving unit-level Assign To Floor and identity.
   */
  const resetFloorFormForFreshEntry = useCallback(
    (currentFloorId?: number | string, currentFloorLabel?: string) => {
      setFormData((prev: any) => ({
        ...prev,
        floorId: currentFloorId ?? prev.floorId,
        floorLabel: currentFloorLabel ?? prev.floorLabel,
        subFloorId: '',
        subFloorName: '',
        conYear: '',
        asstYear: '',
        conType: '',
        useType: '',
        subUseType: '',
        carpetAreaSqFeet: '',
        carpetAreaSqMeter: '',
        builtupAreaSqFeet: '',
        builtupAreaSqMeter: '',
      }));
      setRoomsList([]);
      setOpenSpacesList([]);
      setEditingDuplicateId(null);
      setSubmissionType?.('Construction');
    },
    [setFormData, setRoomsList, setOpenSpacesList, setSubmissionType]
  );

  // Load existing floor submissions for the current Unit AssetId on mount or when unit changes
  useEffect(() => {
    let isCancelled = false;
    setTimeout(() => {
      setInitialSubUnitsDetailsId(null);
      setDuplicateEntries([]);
    }, 0);

    if (effectiveAssetId > 0) {
      (async () => {
        try {
          const res = await getFloorSubmissionsByParentAction(effectiveAssetId);
          if (isCancelled) return;

          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            // Helper to check if a DB row is an actual user-configured entry vs unconfigured unit-generation baseline
            const isConfiguredEntry = (item: any) => {
              const carpet = Number(
                item.carpetAreaSqFeet ??
                item.CarpetAreaSqFeet ??
                item.carpetAreaSqMeter ??
                item.CarpetAreaSqMeter ??
                0
              );
              const roomsCount = Number(item.noOfRooms ?? item.NoOfRooms ?? 0);
              const rawRooms = item.roomWiseDetails || item.RoomWiseDetails || item.rooms || [];
              const hasRooms = Array.isArray(rawRooms) && rawRooms.length > 0;
              const hasSubFloor = Boolean(
                (item.subFloorId && String(item.subFloorId) !== '0' && String(item.subFloorId) !== '') ||
                (item.SubFloorId && String(item.SubFloorId) !== '0' && String(item.SubFloorId) !== '')
              );

              return carpet > 0 || roomsCount > 0 || hasRooms || hasSubFloor;
            };

            // If there's an unconfigured baseline row created during unit generation, capture its ID
            const unconfiguredRow = res.data.find((item: any) => !isConfiguredEntry(item));
            if (unconfiguredRow) {
              const unconfiguredId = Number(
                unconfiguredRow.subUnitsDetailsId ??
                unconfiguredRow.SubUnitsDetailsId ??
                unconfiguredRow.id ??
                unconfiguredRow.Id ??
                0
              );
              if (unconfiguredId > 0) {
                setInitialSubUnitsDetailsId(unconfiguredId);
              }
            }

            // Only rows with actual user-configured details are treated as "Added Entries"
            const configuredRows = res.data.filter(isConfiguredEntry);

            if (configuredRows.length > 0) {
              const currentFormData = formDataRef.current;
              const anyConfiguredRented =
                Boolean(currentFormData?.isRenter || currentFormData?.isRented) ||
                configuredRows.some((item: any) =>
                  Boolean(item.isRenter ?? item.IsRenter ?? item.isRented ?? item.IsRented ?? false)
                );

              const loaded: DuplicateEntry[] = configuredRows.map((item: any, idx: number) => {
                const fId = Number(item.floorId ?? item.FloorId ?? 0);
                const floorOpt = (dropdownOptions?.floorLevels || []).find(
                  (l: any) => String(l.value) === String(fId)
                );
                const fLabel = floorOpt?.label || item.floorName || item.FloorName || String(fId);

                const sfId = item.subFloorId ?? item.SubFloorId;
                const sfOpt = (subFloorOptions || []).find(
                  (sf: any) => String(sf.value) === String(sfId)
                );
                const sfLabel =
                  item.subFloorName ||
                  item.SubFloorName ||
                  sfOpt?.label ||
                  (sfId && sfId !== 0 ? String(sfId) : '—');

                const mappedRooms = Array.isArray(item.roomWiseDetails || item.RoomWiseDetails)
                  ? mapUnitRoomsToDrawerRooms({ rooms: item.roomWiseDetails || item.RoomWiseDetails })
                  : [];

                const rawSubUnitsDetailsId = Number(
                  item.subUnitsDetailsId ?? item.SubUnitsDetailsId ?? item.id ?? item.Id ?? 0
                );

                const carpetSqFeet = Number(item.carpetAreaSqFeet || item.CarpetAreaSqFeet || 0);
                const carpetSqM = Number(item.carpetAreaSqMeter || item.CarpetAreaSqMeter || (carpetSqFeet ? carpetSqFeet / 10.7639 : 0));
                const builtupSqFt = Number(item.builtupAreaSqFeet || item.BuiltupAreaSqFeet || (carpetSqFeet ? carpetSqFeet * 1.2 : 0));
                const builtupSqM = Number(item.builtupAreaSqMeter || item.BuiltupAreaSqMeter || (builtupSqFt ? builtupSqFt / 10.7639 : 0));

                const itemSubUseId = item.subTypeOfUseId ?? item.SubTypeOfUseId ?? '';
                const subUseOpt =
                  (dropdownOptions?.subUseTypes || []).find((o: any) => String(o.value) === String(itemSubUseId)) ||
                  (dynamicSubUseTypesRef.current || []).find((o: any) => String(o.value) === String(itemSubUseId));
                const itemSubUseName =
                  item.subTypeOfUseName ||
                  item.SubTypeOfUseName ||
                  item.subUseTypeName ||
                  item.SubUseTypeName ||
                  subUseOpt?.label ||
                  '';

                const itemRenter =
                  anyConfiguredRented ||
                  Boolean(item.isRenter ?? item.IsRenter ?? item.isRented ?? item.IsRented ?? false);

                return {
                  entryId: `db-${rawSubUnitsDetailsId || idx}`,
                  subUnitsDetailsId: rawSubUnitsDetailsId > 0 ? rawSubUnitsDetailsId : undefined,
                  floorLabel: fLabel,
                  floorId: fId,
                  subFloorName: sfLabel,
                  subFloorId: sfId ? String(sfId) : '',
                  conYear: item.constructionYear || item.ConstructionYear || '',
                  asstYear: item.assessmentYear || item.AssessmentYear || '',
                  conType: item.constructionTypeId
                    ? String(item.constructionTypeId)
                    : item.ConstructionTypeId
                    ? String(item.ConstructionTypeId)
                    : '',
                  useType: item.typeOfUseId
                    ? String(item.typeOfUseId)
                    : item.TypeOfUseId
                    ? String(item.TypeOfUseId)
                    : '',
                  subUseType: itemSubUseId ? String(itemSubUseId) : '',
                  subTypeOfUseName: itemSubUseName,
                  ccDate: item.ccDate || item.CcDate || item.cCDate || '',
                  ocDate: item.ocDate || item.OcDate || item.oCDate || '',
                  isTaxable: item.isTaxable ?? item.IsTaxable ?? item.taxable ?? true,
                  isRenter: itemRenter,
                  carpetAreaSqFeet: carpetSqFeet,
                  carpetAreaSqMeter: carpetSqM,
                  builtupAreaSqFeet: builtupSqFt,
                  builtupAreaSqMeter: builtupSqM,
                  noOfRooms: Number(item.noOfRooms || item.NoOfRooms || mappedRooms.length || 0),
                  rooms: mappedRooms.filter(
                    (r: any) => r.submissionType !== 'Open Space' && r.roomType !== 'Open Space'
                  ),
                  openSpacesList: mappedRooms.filter(
                    (r: any) => r.submissionType === 'Open Space' || r.roomType === 'Open Space'
                  ),
                  formDataSnapshot: {
                    ...(currentFormData || {}),
                    floorId: fId,
                    floorLabel: fLabel,
                    subFloorId: sfId ? String(sfId) : '',
                    subFloorName: sfLabel,
                    conYear: item.constructionYear || item.ConstructionYear || '',
                    asstYear: item.assessmentYear || item.AssessmentYear || '',
                    conType: item.constructionTypeId
                      ? String(item.constructionTypeId)
                      : item.ConstructionTypeId
                      ? String(item.ConstructionTypeId)
                      : '',
                    useType: item.typeOfUseId
                      ? String(item.typeOfUseId)
                      : item.TypeOfUseId
                      ? String(item.TypeOfUseId)
                      : '',
                    subUseType: itemSubUseId ? String(itemSubUseId) : '',
                    subTypeOfUseName: itemSubUseName,
                    ccDate: item.ccDate || item.CcDate || '',
                    ocDate: item.ocDate || item.OcDate || '',
                    isTaxable: item.isTaxable ?? item.IsTaxable ?? true,
                    isRenter: itemRenter,
                    isRented: itemRenter,
                    carpetAreaSqFeet: carpetSqFeet,
                  },
                };
              });

              if (anyConfiguredRented) {
                setFormData((prev: any) => ({ ...prev, isRenter: true, isRented: true }));
              }
              setDuplicateEntries(loaded);
              // When configured entries exist from previous saves, ensure form starts in fresh add mode
              const primaryFloorId = Number(configuredRows[0].floorId ?? configuredRows[0].FloorId ?? 0);
              const floorOpt = (dropdownOptions?.floorLevels || []).find(
                (l: any) => String(l.value) === String(primaryFloorId)
              );
              const primaryFloorLabel =
                floorOpt?.label ||
                configuredRows[0].floorName ||
                configuredRows[0].FloorName ||
                String(primaryFloorId);
              resetFloorFormForFreshEntry(
                primaryFloorId > 0 ? primaryFloorId : undefined,
                primaryFloorLabel
              );
            } else {
              setDuplicateEntries([]);
            }
          } else {
            setDuplicateEntries([]);
          }
        } catch (err) {
          console.warn('Failed to load existing unit floor submissions', err);
          setDuplicateEntries([]);
        }
      })();
    }
    return () => {
      isCancelled = true;
    };
  }, [effectiveAssetId, dropdownOptions, subFloorOptions, resetFloorFormForFreshEntry, setFormData]);

  /**
   * Add or update a floor entry directly from the Floor & Construction Details card.
   * Saves to AMS.SubUnitsDetails and AMS.RoomWiseSubmissionDetails.
   */
  const handleAddFloor = async () => {
    const floorId = Number(formData.floorId ?? formData.floor ?? 0);
    if (!floorId || floorId <= 0) {
      toast.error('Please select a floor');
      return;
    }

    if (effectiveAssetId <= 0) {
      toast.error('Asset ID is required to add a floor');
      return;
    }

    // Resolve human-readable floor label matching floorId
    const floorOption = (dropdownOptions?.floorLevels || []).find(
      (l: any) => String(l.value) === String(floorId)
    );
    const resolvedFloorLabel =
      floorOption?.label ||
      formData.floorLabel ||
      formData.floorName ||
      String(floorId);

    const hasSubFloor = Boolean(
      formData.subFloorId &&
      String(formData.subFloorId) !== '0' &&
      String(formData.subFloorId) !== ''
    );
    const resolvedSubFloorId = hasSubFloor ? Number(formData.subFloorId) : null;
    const subFloorOption = hasSubFloor
      ? (subFloorOptions || []).find((sf: any) => String(sf.value) === String(formData.subFloorId))
      : null;
    const resolvedSubFloorName = hasSubFloor
      ? (subFloorOption?.label || formData.subFloorName || String(formData.subFloorId))
      : '—';

    // Map room details with offset deduplication for AMS.RoomDetails
    const resolvedRoomDetails = Array.isArray(roomsList)
      ? roomsList.map((r: any) => ({
          roomNo: r.roomNo,
          roomType: r.roomType,
          shape: r.shape || 'Rectangle',
          lengthMtr: r.length ? Number(r.length) : null,
          widthMtr: r.width ? Number(r.width) : null,
          heightMtr: r.height ? Number(r.height) : null,
          base1Mtr: r.base1 ? Number(r.base1) : null,
          base2Mtr: r.base2 ? Number(r.base2) : null,
          areaSqMtr: r.areaSqM != null ? Number(r.areaSqM) : (r.area ? Number(r.area) * 0.092903 : null),
          noOfRooms: Number(r.count || 1),
          totalAreaSqMtr:
            (r.roomType === 'Open Space' ? Number(r.netAreaSqM || 0) : (r.areaSqM != null ? Number(r.areaSqM) : Number(r.area || 0) * 0.092903)) *
            Number(r.count || 1),
          outerYesNo: r.outer === 'Yes' || !!r.outerYesNo,
          minusYesNo: r.minus === 'Yes' || r.hasOffset === 'Yes' || !!r.minusYesNo,
          submissionType: r.submissionType || 'Room',
          offsets: Array.isArray(r.offsets)
            ? r.offsets.map((off: any) => ({
                shape: off.shape || 'Rectangle',
                length: Number(off.length ?? off.radius ?? 0),
                width: Number(off.width ?? 0),
                height: Number(off.height ?? 0),
                base1: Number(off.base1 ?? 0),
                base2: Number(off.base2 ?? 0),
                radius: Number(off.radius ?? off.length ?? 0),
                areaSqM: Number(off.areaSqM ?? 0),
                op: off.op || 'Subtract',
              }))
            : [],
        }))
      : [];

    const carpetArea = Number(formData.carpetAreaSqFeet || 0) || Number(area || 0);

    const subOption =
      (dynamicSubUseTypes || []).find((s: any) => String(s.value) === String(formData.subUseType)) ||
      (dropdownOptions?.subUseTypes || []).find((s: any) => String(s.value) === String(formData.subUseType));
    const resolvedSubUseName =
      subOption?.label ||
      (formData.subTypeOfUseName && isNaN(Number(formData.subTypeOfUseName))
        ? formData.subTypeOfUseName
        : '') ||
      '';

    const isRenterEffective = Boolean(
      formData.isRenter ||
      formData.isRented ||
      duplicateEntries.some((e) => Boolean(e.isRenter ?? e.formDataSnapshot?.isRenter))
    );

    const resolvedShopNo =
      formData.unitNo ||
      formData.unitNumber ||
      formData.shopNo ||
      null;
    const resolvedShopName =
      formData.shopUnitName ||
      formData.unitName ||
      formData.shopName ||
      formData.complexName ||
      null;
    const resolvedShopRegionalName =
      formData.shopUnitNameLocal ||
      formData.unitNameLocal ||
      formData.shopRegionalName ||
      null;

    const submissionPayload: any = {
      parentAssetId: effectiveAssetId,
      shopNo: resolvedShopNo,
      shopName: resolvedShopName,
      shopRegionalName: resolvedShopRegionalName,
      floorId,
      subFloorId: resolvedSubFloorId,
      constructionTypeId: formData.conType ? Number(formData.conType) : null,
      typeOfUseId: formData.useType ? Number(formData.useType) : null,
      subTypeOfUseId:
        formData.subUseType && Number(formData.subUseType) > 0
          ? Number(formData.subUseType)
          : null,
      constructionYear: formData.conYear ? String(formData.conYear) : null,
      assessmentYear: formData.asstYear ? String(formData.asstYear) : null,
      carpetAreaSqFeet: carpetArea,
      carpetAreaSqMeter: Number((carpetArea / 10.7639).toFixed(4)),
      builtupAreaSqFeet: Number((carpetArea * 1.2).toFixed(4)),
      builtupAreaSqMeter: Number(((carpetArea * 1.2) / 10.7639).toFixed(4)),
      totalAreaSqFt: carpetArea,
      noOfRooms: resolvedRoomDetails.length,
      roomDetails: resolvedRoomDetails,
      isRenter: isRenterEffective,
      isRented: isRenterEffective,
      renterName: formData.renterName || formData.renterNameEnglish || null,
      renterNameLocal: formData.renterNameLocal || null,
      tenantRegionalName: formData.tenantRegionalName || formData.renterNameLocal || null,
      tenantAddress: formData.tenantAddress || null,
      mobileNo: formData.mobileNo || null,
      emailId: formData.emailId || null,
      gstNo: formData.gstNo || null,
      aadhaarCardNo: formData.aadhaar || null,
      panCardNo: formData.pan || null,
      propertyDescription: formData.propertyDescription || null,
      agreementId: formData.agreementId || formData.agreementNo || null,
      leaseType: formData.leaseType || formData.rentType || null,
      leaseRentType: formData.leaseRentType || formData.rentType || null,
      leaseStartDate: formData.leaseStartDate || formData.agreementFromDate || null,
      leaseEndDate: formData.leaseEndDate || formData.agreementToDate || null,
      duration: formData.duration ? Number(formData.duration) : null,
      rentAmount: formData.rentAmount ? Number(formData.rentAmount) : (formData.rentMonthly ? Number(formData.rentMonthly) : null),
      monthlyRent: formData.monthlyRent ? Number(formData.monthlyRent) : (formData.rentMonthly ? Number(formData.rentMonthly) : null),
      securityDeposit: formData.securityDeposit ? Number(formData.securityDeposit) : null,
      depositType: formData.depositType || null,
      paymentFrequency: formData.paymentFrequency || formData.rentFreq || null,
      rentFrequency: formData.rentFrequency || formData.rentFreq || null,
      rentInformation: isRenterEffective
        ? {
            shopNo: resolvedShopNo,
            shopName: resolvedShopName,
            shopRegionalName: resolvedShopRegionalName,
            agreementId: formData.agreementId || formData.agreementNo || null,
            leaseRentType: formData.rentType || formData.leaseType || 'Leased',
            leaseStart: formData.agreementFromDate || formData.leaseStartDate || null,
            leaseEnd: formData.agreementToDate || formData.leaseEndDate || null,
            rentFrequency: formData.rentFreq || formData.paymentFrequency || 'Monthly',
            rentAmount: Number(formData.rentMonthly || formData.rentAmount || 0),
            securityDeposit: Number(formData.securityDeposit || 0),
            depositType: formData.depositType || 'Refundable',
            tenantName: formData.renterName || formData.renterNameEnglish || null,
            renterNameLocal: formData.renterNameLocal || null,
            tenantRegionalName: formData.tenantRegionalName || formData.renterNameLocal || null,
            tenantAddress: formData.tenantAddress || null,
          }
        : null,
    };

    if (editingDuplicateId) {
      const existingEntry = duplicateEntries.find((e) => e.entryId === editingDuplicateId);
      const subUnitsDetailsId = existingEntry?.subUnitsDetailsId;

      const loadingToast = toast.loading('Updating floor entry in database...');
      if (subUnitsDetailsId && subUnitsDetailsId > 0) {
        const res = await updateFloorSubmissionAction(subUnitsDetailsId, submissionPayload);
        if (!res.success) {
          toast.error(res.error || 'Failed to update floor entry in database', { id: loadingToast });
          return;
        }
      }
      setDuplicateEntries((prev) =>
        prev.map((entry) => {
          if (entry.entryId === editingDuplicateId) {
            return {
              ...entry,
              floorLabel: resolvedFloorLabel,
              floorId,
              subFloorName: resolvedSubFloorName,
              subFloorId: resolvedSubFloorId ? String(resolvedSubFloorId) : '',
              conYear: formData.conYear || '',
              asstYear: formData.asstYear || '',
              conType: formData.conType || '',
              useType: formData.useType || '',
              subUseType: formData.subUseType || '',
              subTypeOfUseName: resolvedSubUseName || entry.subTypeOfUseName || '',
              ccDate: formData.ccDate || '',
              ocDate: formData.ocDate || '',
              isTaxable: formData.isTaxable ?? true,
              isRenter: isRenterEffective,
              carpetAreaSqFeet: carpetArea,
              carpetAreaSqMeter: Number((carpetArea / 10.7639).toFixed(2)),
              builtupAreaSqFeet: Number((carpetArea * 1.2).toFixed(2)),
              builtupAreaSqMeter: Number(((carpetArea * 1.2) / 10.7639).toFixed(2)),
              noOfRooms: resolvedRoomDetails.length,
              rooms: [...roomsList],
              openSpacesList: [...openSpacesList],
              formDataSnapshot: {
                ...formData,
                floorId,
                floorLabel: resolvedFloorLabel,
                subFloorId: resolvedSubFloorId ? String(resolvedSubFloorId) : '',
                subFloorName: resolvedSubFloorName,
                subTypeOfUseName: resolvedSubUseName || entry.subTypeOfUseName || '',
                isRenter: isRenterEffective,
                isRented: isRenterEffective,
              },
            };
          }
          // Unit-wide rule: Synchronize FloorId, floorLabel, and renter status across other entries,
          // but keep their SubFloor and all other fields completely separate and intact!
          return {
            ...entry,
            floorLabel: resolvedFloorLabel,
            isRenter: isRenterEffective ? true : entry.isRenter,
            formDataSnapshot: {
              ...entry.formDataSnapshot,
              floorId,
              floorLabel: resolvedFloorLabel,
              ...(isRenterEffective ? { isRenter: true, isRented: true } : {}),
            },
          };
        })
      );

      // Persist floor synchronization across all rows of this unit in DB
      if (effectiveAssetId > 0 && duplicateEntries.length > 1) {
        syncUnitFloorAction(effectiveAssetId, floorId, duplicateEntries).catch((err) => {
          console.error('Failed to sync unit floor to other entries', err);
        });
      }

      toast.success('Floor entry updated in database', { id: loadingToast });
      resetFloorFormForFreshEntry(floorId, resolvedFloorLabel);
    } else if (duplicateEntries.length === 0 && initialSubUnitsDetailsId && initialSubUnitsDetailsId > 0) {
      // First time configuring the floor for this generated unit!
      // Update the existing baseline SubUnitsDetails row via PUT instead of inserting a duplicate!
      const loadingToast = toast.loading('Saving floor entry to database...');
      const res = await updateFloorSubmissionAction(initialSubUnitsDetailsId, submissionPayload);
      if (!res.success) {
        toast.error(res.error || 'Failed to save floor entry to database', { id: loadingToast });
        return;
      }

      const entry: DuplicateEntry = {
        entryId: `db-${initialSubUnitsDetailsId}`,
        subUnitsDetailsId: initialSubUnitsDetailsId,
        floorLabel: resolvedFloorLabel,
        floorId,
        subFloorName: resolvedSubFloorName,
        subFloorId: resolvedSubFloorId ? String(resolvedSubFloorId) : '',
        conYear: formData.conYear || '',
        asstYear: formData.asstYear || '',
        conType: formData.conType || '',
        useType: formData.useType || '',
        subUseType: formData.subUseType || '',
        subTypeOfUseName: resolvedSubUseName,
        ccDate: formData.ccDate || '',
        ocDate: formData.ocDate || '',
        isTaxable: formData.isTaxable ?? true,
        isRenter: isRenterEffective,
        carpetAreaSqFeet: carpetArea,
        carpetAreaSqMeter: Number((carpetArea / 10.7639).toFixed(2)),
        builtupAreaSqFeet: Number((carpetArea * 1.2).toFixed(2)),
        builtupAreaSqMeter: Number(((carpetArea * 1.2) / 10.7639).toFixed(2)),
        noOfRooms: resolvedRoomDetails.length,
        rooms: [...roomsList],
        openSpacesList: [...openSpacesList],
        formDataSnapshot: {
          ...formData,
          floorId,
          floorLabel: resolvedFloorLabel,
          subFloorId: resolvedSubFloorId ? String(resolvedSubFloorId) : '',
          subFloorName: resolvedSubFloorName,
          subTypeOfUseName: resolvedSubUseName,
          isRenter: isRenterEffective,
          isRented: isRenterEffective,
        },
      };

      setDuplicateEntries([entry]);
      setInitialSubUnitsDetailsId(null);
      toast.success('Floor entry added successfully!', { id: loadingToast });
      // Reset form so the added entry is not kept in the form and user gets a clean start to add a new floor
      resetFloorFormForFreshEntry(floorId, resolvedFloorLabel);
    } else {
      // Direct new entry - ALWAYS POST
      const loadingToast = toast.loading('Saving new floor entry to database...');
      const res = await createFloorSubmissionAction(submissionPayload);
      if (!res.success || !res.data) {
        toast.error(res.error || 'Failed to save floor entry to database', { id: loadingToast });
        return;
      }

      const newSubUnitsDetailsId = Number(
        res.data?.subUnitsDetailsId ??
        res.data?.SubUnitsDetailsId ??
        res.data?.items?.subUnitsDetailsId ??
        res.data?.id ??
        res.data?.Id ??
        0
      );

      const entry: DuplicateEntry = {
        entryId: `db-${newSubUnitsDetailsId || Date.now()}`,
        subUnitsDetailsId: newSubUnitsDetailsId > 0 ? newSubUnitsDetailsId : undefined,
        floorLabel: resolvedFloorLabel,
        floorId,
        subFloorName: resolvedSubFloorName,
        subFloorId: resolvedSubFloorId ? String(resolvedSubFloorId) : '',
        conYear: formData.conYear || '',
        asstYear: formData.asstYear || '',
        conType: formData.conType || '',
        useType: formData.useType || '',
        subUseType: formData.subUseType || '',
        subTypeOfUseName: resolvedSubUseName,
        ccDate: formData.ccDate || '',
        ocDate: formData.ocDate || '',
        isTaxable: formData.isTaxable ?? true,
        isRenter: isRenterEffective,
        carpetAreaSqFeet: carpetArea,
        carpetAreaSqMeter: Number((carpetArea / 10.7639).toFixed(2)),
        builtupAreaSqFeet: Number((carpetArea * 1.2).toFixed(2)),
        builtupAreaSqMeter: Number(((carpetArea * 1.2) / 10.7639).toFixed(2)),
        noOfRooms: resolvedRoomDetails.length,
        rooms: [...roomsList],
        openSpacesList: [...openSpacesList],
        formDataSnapshot: {
          ...formData,
          floorId,
          floorLabel: resolvedFloorLabel,
          subFloorId: resolvedSubFloorId ? String(resolvedSubFloorId) : '',
          subFloorName: resolvedSubFloorName,
          subTypeOfUseName: resolvedSubUseName,
          isRenter: isRenterEffective,
          isRented: isRenterEffective,
        },
      };

      setDuplicateEntries((prev) => [
        ...prev.map((e) =>
          isRenterEffective
            ? {
                ...e,
                isRenter: true,
                formDataSnapshot: {
                  ...e.formDataSnapshot,
                  isRenter: true,
                  isRented: true,
                },
              }
            : e
        ),
        entry,
      ]);
      toast.success('Floor entry saved to database as a new entry!', { id: loadingToast });
      // Reset form for fresh start
      resetFloorFormForFreshEntry(floorId, resolvedFloorLabel);
    }
  };

  /** Remove an entry from the list and delete from DB if persisted */
  const removeDuplicateEntry = async (entryId: string) => {
    const entry = duplicateEntries.find((e) => e.entryId === entryId);

    // Optimistically update collection immediately
    setDuplicateEntries((prev) => prev.filter((e) => e.entryId !== entryId));

    if (entry?.subUnitsDetailsId && entry.subUnitsDetailsId > 0) {
      const loadingToast = toast.loading('Deleting floor entry from database...');
      const res = await deleteFloorSubmissionAction(entry.subUnitsDetailsId);
      if (!res.success) {
        toast.error(res.error || 'Failed to delete floor entry from database', { id: loadingToast });
        return;
      }
      toast.success('Floor entry deleted from database', { id: loadingToast });
    } else {
      toast.info('Floor entry removed');
    }
    if (editingDuplicateId === entryId) {
      resetFloorFormForFreshEntry(formData.floorId, formData.floorLabel);
    }
  };

  /** Load a saved floor entry back into the form for editing */
  const loadEntryForEdit = async (entry: DuplicateEntry) => {
    setEditingDuplicateId(entry.entryId);
    const isEntryRenter = Boolean(
      formData.isRenter ||
      formData.isRented ||
      entry.isRenter ||
      entry.formDataSnapshot?.isRenter
    );

    setFormData((prev: any) => ({
      ...prev,
      ...entry.formDataSnapshot,
      floorId: entry.formDataSnapshot?.floorId || entry.formDataSnapshot?.floor || prev.floorId,
      floorLabel: entry.floorLabel,
      subFloorId: entry.subFloorId,
      subFloorName: entry.subFloorName,
      conYear: entry.conYear,
      conType: entry.conType,
      carpetAreaSqFeet: entry.carpetAreaSqFeet,
      isRenter: isEntryRenter,
      isRented: isEntryRenter,
    }));

    if (entry.openSpacesList && entry.openSpacesList.length > 0 && (!entry.rooms || entry.rooms.length === 0)) {
      setSubmissionType?.('Open Space');
    } else {
      setSubmissionType?.('Construction');
    }

    let activeRooms = Array.isArray(entry.rooms) ? [...entry.rooms] : [];

    // If entry.rooms is empty but has subUnitsDetailsId, fetch details from DB
    if (activeRooms.length === 0 && entry.subUnitsDetailsId && entry.subUnitsDetailsId > 0) {
      try {
        const res = await getFloorSubmissionByIdAction(entry.subUnitsDetailsId);
        if (res.success && res.data) {
          const rawRooms =
            res.data.roomWiseDetails ||
            res.data.RoomWiseDetails ||
            res.data.roomDetails ||
            res.data.RoomDetails ||
            res.data.roomWiseSubmissionDetails ||
            res.data.RoomWiseSubmissionDetails ||
            res.data.rooms ||
            [];
          if (Array.isArray(rawRooms) && rawRooms.length > 0) {
            activeRooms = mapUnitRoomsToDrawerRooms({ rooms: rawRooms });
            setDuplicateEntries((prev) =>
              prev.map((e) =>
                e.entryId === entry.entryId
                  ? { ...e, rooms: activeRooms, noOfRooms: activeRooms.length }
                  : e
              )
            );
          }
        }
      } catch (err) {
        console.warn('Failed to fetch rooms for floor entry', err);
      }
    }

    setRoomsList(activeRooms.filter((r: any) => r.submissionType !== 'Open Space' && r.roomType !== 'Open Space'));
    setOpenSpacesList(entry.openSpacesList || activeRooms.filter((r: any) => r.submissionType === 'Open Space' || r.roomType === 'Open Space'));
    toast.info(`Loaded floor details (${entry.floorLabel || 'Floor'})`);
  };

  const cancelEditDuplicate = () => {
    resetFloorFormForFreshEntry(formData.floorId, formData.floorLabel);
  };

  /**
   * Synchronizes FloorId across ALL ams.SubUnitsDetails entries belonging to this Unit AssetId.
   * Updates state immediately (real-time UI update in Added Entries table)
   * and persists transactionally to the database. Does NOT create extra DB rows.
   */
  const handleSyncUnitFloor = async (newFloorId: number, newFloorLabel: string) => {
    if (!newFloorId || newFloorId <= 0) return;

    // 1. Immediately update duplicateEntries in local state so Added Entries table reflects the new floor
    setDuplicateEntries((prev) =>
      prev.map((entry) => ({
        ...entry,
        floorLabel: newFloorLabel,
        formDataSnapshot: {
          ...entry.formDataSnapshot,
          floorId: newFloorId,
          floorLabel: newFloorLabel,
        },
      }))
    );

    // 2. Persist to DB transactionally for current Unit AssetId only
    if (effectiveAssetId > 0) {
      try {
        if (duplicateEntries.length > 0) {
          await syncUnitFloorAction(effectiveAssetId, newFloorId, duplicateEntries);
        } else if (initialSubUnitsDetailsId && initialSubUnitsDetailsId > 0) {
          await syncUnitFloorAction(effectiveAssetId, newFloorId);
        }
      } catch (err) {
        console.error('Failed to sync unit floor across entries in database', err);
      }
    }
  };

  /**
   * Synchronizes Renter status across all added floor entries.
   * If Renter is YES, then YES applies for all floors added for this unit.
   */
  const syncRenterToAllEntries = useCallback((isRenterVal: boolean) => {
    setDuplicateEntries((prev) =>
      prev.map((e) => ({
        ...e,
        isRenter: isRenterVal,
        formDataSnapshot: {
          ...e.formDataSnapshot,
          isRenter: isRenterVal,
          isRented: isRenterVal,
        },
      }))
    );
  }, []);

  return {
    isDuplicateFloorMode: false,
    handleToggleDuplicateMode: () => {},
    duplicateEntries,
    removeDuplicateEntry,
    loadEntryForEdit,
    editingDuplicateId,
    selectedEntryId: editingDuplicateId,
    cancelEditDuplicate,
    handleAddFloor,
    handleSyncUnitFloor,
    syncRenterToAllEntries,
    handleDuplicateFloor: undefined,
  };
}
