import { useCallback, useState, useEffect, useMemo, useRef, startTransition } from 'react';
import { useParams, useSearchParams, usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { 
  saveBuildingPermissionsAction, 
  getBuildingPermissionsAction, 
  getFloorCertificatesAction,
  deletePropertyCertificateAction,
  saveCertificateAction,
  replaceCertificateDocumentAction
} from "@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Building/action";
import { 
  PropertyCertificateWithStatusDto, 
  FloorCertificatesResponseDto, 
  FloorCertificateDto,
  PropertyCertificateBulkSaveDto,
  BuildingPermissionState,
  CertificateScope
} from "@/types/building-permission.types";
import { mapApiToBuildingState, parseAndLocalizeBackendError, mapTypeNameToKey, hasChangesComparedToInitial } from "@/lib/utils/building-helpers";
import { useLoading } from "@/hooks/useLoading";
import { validateBuildingForm } from "@/lib/utils/validateBuildingForm";
import { useBuildingFormState } from "./useBuildingFormState";
import { useBuildingFileUpload } from "./useBuildingFileUpload";
import type { FloorData } from "@/types/room-details.types";

const getCleanGuid = (guid: string | null | undefined): string | null => {
    if (!guid) return null;
    const trimmed = guid.trim();
    if (trimmed === "" || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined" || trimmed === "pending") {
        return null;
    }
    return trimmed;
};

export const useBuildingForm = (
    initialData: PropertyCertificateWithStatusDto[] | null,
    initialFloorCertificates: FloorCertificatesResponseDto | null,
    propertyId: string,
    initialFloorsProp?: FloorData[],
    initialFloorBuildingPermission?: PropertyCertificateWithStatusDto[] | null,
    initialActiveScope?: 'Property' | 'Floor',
    initialActiveFloorId?: number | null,
    initialSelectedTypeId?: number | null
) => {
    const t = useTranslations("quickDataEntry");
    const params = useParams();
    const locale = params.locale as string;
    const router = useRouter();
    const { isLoading: isSaving, startLoading: baseStartLoading, stopLoading: baseStopLoading } = useLoading(false);

    const startLoading = useCallback(() => {
        baseStartLoading();
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('ntis:form-saving-state', { detail: { isSaving: true } }));
        }
    }, [baseStartLoading]);

    const stopLoading = useCallback(() => {
        baseStopLoading();
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('ntis:form-saving-state', { detail: { isSaving: false } }));
        }
    }, [baseStopLoading]);

    const {
        buildingPermission,
        setBuildingPermission,
        hasChanges,
        validationErrors,
        setValidationErrors,
        fieldErrors,
        setFieldErrors,
        incompleteCertificates,
        setIncompleteCertificates,
        clearError,
        handleToggleEnabled,
        handleCopyFromPropertyCert,
        handleInputChange,
        activeScope,
        setActiveScope,
        activeFloorId,
        setActiveFloorId,
        floorCertificatesCache,
        setFloorCertificatesCache,
        initialFloorStateCache,
        setInitialFloorStateCache,
        revertFloorState,
        initialMappedState,
        propertyCertificatesState,
        hasAnyUnsavedBuildingChanges,
        markCurrentStateAsSaved
    } = useBuildingFormState(
        initialData,
        initialFloorBuildingPermission,
        initialActiveScope,
        initialActiveFloorId
    );

    const getCombinedFloors = useCallback((certResponse: FloorCertificatesResponseDto | null | undefined, fallbackFloors?: FloorData[]): FloorCertificateDto[] => {
        const list: FloorCertificateDto[] = [];
        if (certResponse) {
            if (certResponse.selectedFloor) {
                list.push(certResponse.selectedFloor);
            }
            if (Array.isArray(certResponse.otherFloors)) {
                certResponse.otherFloors.forEach(f => {
                    if (!certResponse.selectedFloor || f.propertyDetailsId !== certResponse.selectedFloor.propertyDetailsId) {
                        list.push(f);
                    }
                });
            }
        }
        if (list.length === 0 && fallbackFloors && fallbackFloors.length > 0) {
            fallbackFloors.forEach(f => {
                const raw = f as unknown as Record<string, unknown>;
                const pdId = Number(f.id ?? raw.propertyDetailsId);
                if (pdId > 0) {
                    list.push({
                        propertyDetailsId: pdId,
                        propertyId: Number(f.propertyId || raw.ownerID || raw.ownerId || 0),
                        floorDescription: (f.floorDescription || f.floor || (typeof raw.floorName === 'string' ? raw.floorName : undefined)) || undefined,
                        subFloorDescription: (f.subFloorDescription || f.subFloor || (typeof raw.subFloorName === 'string' ? raw.subFloorName : undefined)) || undefined,
                        constructionTypeDescription: (f.constructionTypeDescription || f.conTyp || (typeof raw.constructionTypeName === 'string' ? raw.constructionTypeName : undefined)) || undefined,
                        typeOfUseDescription: (f.typeOfUseDescription || f.use || (typeof raw.useName === 'string' ? raw.useName : undefined)) || undefined,
                        subTypeOfUseDescription: (f.subTypeOfUseDescription || f.subTyp || (typeof raw.subUseName === 'string' ? raw.subUseName : undefined)) || undefined,
                        builtupAreaSqFeet: Number(raw.builtUpArea ?? f.builtupAreaSqFt ?? 0) || undefined,
                        carpetAreaSqFeet: Number(raw.carpetArea ?? f.areaSqFt ?? 0) || undefined,
                        constructionYear: f.conYr ? String(f.conYr) : (raw.constructionYear ? String(raw.constructionYear) : undefined),
                        isSelected: false,
                        certificateApplicable: true,
                    });
                }
            });
        }
        return list.filter(f => {
            const floorDesc = String(f.floorDescription ?? "").trim().toLowerCase();
            const conTyp = String(f.constructionTypeDescription ?? "").trim().toLowerCase();
            const useDesc = String(f.typeOfUseDescription ?? "").trim().toLowerCase();
            const isOpenPlot = floorDesc === "open plot" || floorDesc === "op" || floorDesc.includes("open plot") ||
                conTyp === "open plot" || conTyp === "op" || conTyp.includes("open plot") ||
                useDesc.includes("खुला भूखंड") || useDesc.includes("open plot");
            return !isOpenPlot;
        });
    }, []);

    const [isFloorLoading, setIsFloorLoading] = useState(false);
    const prevInitialFloorCertificatesRef = useRef<FloorCertificatesResponseDto | null>(initialFloorCertificates || null);
    const [floors, setFloors] = useState<FloorCertificateDto[]>(() => getCombinedFloors(initialFloorCertificates, initialFloorsProp));

    useEffect(() => {
        if (initialFloorCertificates && initialFloorCertificates !== prevInitialFloorCertificatesRef.current) {
            prevInitialFloorCertificatesRef.current = initialFloorCertificates;
            const updated = getCombinedFloors(initialFloorCertificates, initialFloorsProp);
            startTransition(() => {
                setFloors(updated);
            });
        }
    }, [initialFloorCertificates, initialFloorsProp, getCombinedFloors]);

    useEffect(() => {
        const win = typeof window !== 'undefined' ? (window as unknown as { __buildingFormHasChanges?: boolean; __buildingFormIsSaving?: boolean }) : null;
        if (win) {
            win.__buildingFormHasChanges = hasAnyUnsavedBuildingChanges;
            win.__buildingFormIsSaving = isSaving;
        }
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('ntis:form-saving-state', { detail: { isSaving } }));
        }
        return () => {
            if (win) {
                win.__buildingFormHasChanges = false;
                win.__buildingFormIsSaving = false;
            }
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('ntis:form-saving-state', { detail: { isSaving: false } }));
            }
        };
    }, [hasAnyUnsavedBuildingChanges, isSaving]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasAnyUnsavedBuildingChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasAnyUnsavedBuildingChanges]);

    const incompleteFloors = useMemo(() => {
        const incompleteList: Array<{ floorName: string; certificateNames: string[] }> = [];
        const floorIds = Object.keys(floorCertificatesCache).map(Number);
        
        for (const floorId of floorIds) {
            const currentFloorState = floorCertificatesCache[floorId];
            if (!currentFloorState) continue;

            const initialFloorState = initialFloorStateCache[floorId] || {};
            // Only inspect this floor if it actually has unsaved changes compared to baseline!
            if (!hasChangesComparedToInitial(currentFloorState, initialFloorState)) {
                continue;
            }

            const selectedFloorObj = floors.find(f => f.propertyDetailsId === floorId);
            const floorName = selectedFloorObj
                ? `${selectedFloorObj.floorDescription || ""}${selectedFloorObj.subFloorDescription ? ` - ${selectedFloorObj.subFloorDescription}` : ""}`
                : `Floor #${floorId}`;

            const incompleteCertNames: string[] = [];
            Object.values(currentFloorState).forEach(item => {
                if (item.enabled) {
                    const isNumEmpty = !item.number || item.number.trim() === "";
                    const isDateEmpty = !item.date || item.date.trim() === "";
                    const isDocEmpty = !item.documentGuid || item.documentGuid.trim() === "";
                    if (isNumEmpty || isDateEmpty || isDocEmpty) {
                        const key = mapTypeNameToKey(item.certificateTypeName || "");
                        const tKey = key ? `building.${key}` : "";
                        const displayName = key && t(tKey) && t(tKey) !== tKey
                            ? t(tKey)
                            : item.certificateTypeName || "";
                        incompleteCertNames.push(displayName);
                    }
                }
            });

            if (incompleteCertNames.length > 0) {
                incompleteList.push({
                    floorName,
                    certificateNames: incompleteCertNames
                });
            }
        }
        return incompleteList;
    }, [floorCertificatesCache, initialFloorStateCache, floors, t]);

    const incompleteFloorDetails = useMemo(() => {
        return incompleteFloors.map(inf => `${inf.floorName} (${inf.certificateNames.join(", ")})`);
    }, [incompleteFloors]);

    useEffect(() => {
        const win = typeof window !== 'undefined' ? (window as unknown as {
            __buildingFormHasChanges?: boolean;
            __discountFormHasChanges?: boolean;
            __socialFormHasChanges?: boolean;
            __buildingFormIncompleteDetails?: string[] | null;
            __showBuildingUnsavedChangesModal?: ((onDiscard: () => void) => void) | null;
        }) : null;
        if (win) {
            win.__buildingFormIncompleteDetails = (hasAnyUnsavedBuildingChanges && incompleteFloorDetails.length > 0)
                ? incompleteFloorDetails
                : null;
        }
        return () => {
            if (win) {
                win.__buildingFormIncompleteDetails = null;
            }
        };
    }, [hasAnyUnsavedBuildingChanges, incompleteFloorDetails]);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isInitialSyncDoneRef = useRef(false);

    const [selectedTypeId, setSelectedTypeId] = useState<number | null>(() => {
        if (initialSelectedTypeId && !isNaN(Number(initialSelectedTypeId))) return Number(initialSelectedTypeId);
        const urlCertId = searchParams?.get('certificateTypeId') || searchParams?.get('certTypeId');
        return urlCertId && !isNaN(Number(urlCertId)) ? Number(urlCertId) : null;
    });

    const firstCertTypeId = useMemo(() => {
        if (!buildingPermission || Object.keys(buildingPermission).length === 0) return null;
        const sorted = Object.values(buildingPermission).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        return sorted.length > 0 ? sorted[0].certificateTypeId : null;
    }, [buildingPermission]);

    const selectFloorOrPropertyScope = useCallback(async (scope: 'Property' | 'Floor', floorDetailsId: number | null) => {
        if (scope === 'Property') {
            revertFloorState();
        } else if (scope === 'Floor' && floorDetailsId !== null && activeFloorId !== null && activeFloorId !== floorDetailsId) {
            revertFloorState(activeFloorId);
        }

        setActiveScope(scope);
        setActiveFloorId(floorDetailsId);
        setValidationErrors({});
        setFieldErrors({});
        setIncompleteCertificates([]);
        
        // Cleanly synchronize browser URL search params
        if (typeof window !== 'undefined') {
            const currentParams = new URLSearchParams(searchParams ? searchParams.toString() : window.location.search);
            if (scope === 'Floor' && floorDetailsId) {
                currentParams.set('activeScope', 'Floor');
                currentParams.set('activeFloorId', String(floorDetailsId));
            } else {
                currentParams.delete('activeScope');
                currentParams.delete('activeFloorId');
                currentParams.delete('selectedPropertyDetailsId');
                currentParams.delete('floorId');
            }
            const queryStr = currentParams.toString();
            const newUrl = `${pathname}${queryStr ? `?${queryStr}` : ''}`;
            window.history.replaceState(null, '', newUrl);
        }

        if (scope === 'Floor' && floorDetailsId !== null) {
            if (!floorCertificatesCache[floorDetailsId]) {
                // Initialize the cache entry synchronously with empty/default state to prevent blank/flickering UI
                const initialFloorState = {} as BuildingPermissionState;
                Object.keys(initialMappedState).forEach(key => {
                    const certId = Number(key);
                    const propCert = initialMappedState[certId];
                    initialFloorState[certId] = {
                        certificateTypeId: certId,
                        certificateTypeName: propCert?.certificateTypeName || "",
                        enabled: false,
                        number: "",
                        date: "",
                        documentGuid: "",
                        displayOrder: propCert?.displayOrder || 0
                    };
                });
                setFloorCertificatesCache(prev => ({
                    ...prev,
                    [floorDetailsId]: initialFloorState
                }));
                setInitialFloorStateCache(prev => ({
                    ...prev,
                    [floorDetailsId]: prev[floorDetailsId] || initialFloorState
                }));

                setIsFloorLoading(true);
                try {
                    const result = await getBuildingPermissionsAction(propertyId, floorDetailsId);
                    if (result.success && result.data) {
                        const state = mapApiToBuildingState(result.data);
                        setFloorCertificatesCache(prev => ({
                            ...prev,
                            [floorDetailsId]: state
                        }));
                        setInitialFloorStateCache(prev => ({
                            ...prev,
                            [floorDetailsId]: state
                        }));
                    }
                } catch (_error) {
                    // Silently ignore floor certificate fetch failures since the floor may not have any certificates yet
                } finally {
                    setIsFloorLoading(false);
                }
            }
        }
    }, [revertFloorState, activeFloorId, floorCertificatesCache, initialMappedState, pathname, propertyId, searchParams, setActiveScope, setActiveFloorId, setFloorCertificatesCache, setInitialFloorStateCache, setValidationErrors, setFieldErrors, setIncompleteCertificates]);

    const urlScope = searchParams?.get('activeScope');
    const urlFloorId = searchParams?.get('selectedFloorId') || searchParams?.get('activeFloorId') || searchParams?.get('selectedPropertyDetailsId') || searchParams?.get('floorId');

    useEffect(() => {
        if (isInitialSyncDoneRef.current) return;

        if (urlFloorId) {
            const floorIdNum = Number(urlFloorId);
            if (!isNaN(floorIdNum) && floorIdNum > 0) {
                isInitialSyncDoneRef.current = true;
                queueMicrotask(() => {
                    selectFloorOrPropertyScope('Floor', floorIdNum);
                });
                return;
            }
        }
        if (initialFloorCertificates?.selectedFloor?.propertyDetailsId) {
            isInitialSyncDoneRef.current = true;
            const floorId = initialFloorCertificates.selectedFloor.propertyDetailsId;
            queueMicrotask(() => {
                selectFloorOrPropertyScope('Floor', floorId);
            });
        } else if (initialFloorCertificates?.selectedPropertyDetailsId) {
            isInitialSyncDoneRef.current = true;
            const floorId = initialFloorCertificates.selectedPropertyDetailsId;
            queueMicrotask(() => {
                selectFloorOrPropertyScope('Floor', floorId);
            });
        }
    }, [urlScope, urlFloorId, initialFloorCertificates, selectFloorOrPropertyScope]);

    const handleSave = useCallback(async (opts?: {
        skipDocumentValidation?: boolean;
        skipNumberDateValidation?: boolean;
        skipRevalidate?: boolean;
        silent?: boolean;
        skipPropertyWideConfirmation?: boolean;
        applyToRemaining?: boolean;
        dryRun?: boolean;
        onlyCertificateTypeId?: number;
        selectedFloorIds?: number[];
        overrideData?: {
            date?: string;
            number?: string;
            pendingFile?: File;
            propertyDetailsId?: number | null;
            propertyDetailsIds?: number[];
            entityType?: string;
            societyDetailId?: number | null;
            wingDetailId?: number | null;
            documentGuid?: string | null;
            existingDocumentGuid?: string | null;
            propertyCertificateId?: number | null;
            isFileModified?: boolean;
        };
    }): Promise<{
        success: boolean;
        isValid: boolean;
        incompleteCertificates?: { id: number; name: string }[];
        updatedCertificates?: PropertyCertificateWithStatusDto[];
    }> => {
        if (isSaving) return { success: false, isValid: true };
        
        const targetTypeId = opts?.onlyCertificateTypeId ?? selectedTypeId ?? firstCertTypeId;
        if (targetTypeId === null) {
            toast.error(t("building.noCertificateSelected") || "No certificate selected to save.");
            return { success: false, isValid: true };
        }

        const baseCert = buildingPermission[targetTypeId];
        if (!baseCert) {
            toast.error(t("building.certificateNotFound") || "Selected certificate not found.");
            return { success: false, isValid: true };
        }

        const activeCert = opts?.overrideData
            ? {
                ...baseCert,
                enabled: true,
                date: opts.overrideData.date !== undefined && opts.overrideData.date !== "" 
                    ? opts.overrideData.date 
                    : baseCert.date,
                number: opts.overrideData.number !== undefined && opts.overrideData.number !== "" 
                    ? opts.overrideData.number 
                    : baseCert.number,
                pendingFile: opts.overrideData.pendingFile || baseCert.pendingFile,
                documentGuid: opts.overrideData.documentGuid !== undefined ? (opts.overrideData.documentGuid || undefined) : baseCert.documentGuid,
                propertyCertificateId: opts.overrideData.propertyCertificateId !== undefined ? opts.overrideData.propertyCertificateId : baseCert.propertyCertificateId,
            }
            : baseCert;

        // Validate the active certificate (only if enabled)
        if (activeCert.enabled) {
            const { isValid, errors, incompleteCertificates: invalidCerts, fieldErrors: fErrors } = validateBuildingForm(
                buildingPermission,
                (key, params) => {
                    if (key.startsWith("building.") || key.startsWith("common.")) {
                        return t(key, params);
                    }
                    return t(`common.${key}`, params);
                },
                {
                    skipDocumentValidation: opts?.skipDocumentValidation,
                    skipNumberDateValidation: opts?.skipNumberDateValidation,
                    onlyCertificateTypeId: opts?.onlyCertificateTypeId,
                    activeCertificateTypeId: targetTypeId,
                    floors,
                    activeScope,
                    activeFloorId
                }
            );

            if (!isValid) {
                setValidationErrors(errors);
                setFieldErrors(fErrors || {});
                setIncompleteCertificates(invalidCerts);
                return { success: false, isValid: false, incompleteCertificates: invalidCerts };
            }
        }

        if (opts?.dryRun) {
            setValidationErrors({});
            setFieldErrors({});
            setIncompleteCertificates([]);
            return { success: true, isValid: true };
        }

        setValidationErrors({});
        setFieldErrors({});
        setIncompleteCertificates([]);
        startLoading();

        try {
            if (activeCert.enabled) {
                let response;

                if (opts?.applyToRemaining && opts?.selectedFloorIds && opts.selectedFloorIds.length > 0) {
                    const certKey = mapTypeNameToKey(activeCert.certificateTypeName || "");
                    const remainingFloors = floors.filter(f => {
                        if (certKey === "commencementCertificate") return !f.ccDate && !f.ccCertificateNo;
                        if (certKey === "occupancyCertificate") return !f.ocDate && !f.ocCertificateNo;
                        if (certKey === "electricBill") return !f.electricBillDate && !f.electricBillNo;
                        return false;
                    });

                    const isAllSelected = opts.selectedFloorIds.length === remainingFloors.length;
                    let certificatesList = [];

                    if (isAllSelected) {
                        certificatesList = [{
                            certificateTypeId: targetTypeId,
                            isEnabled: true,
                            certificateNumber: activeCert.number || null,
                            certificateDate: activeCert.date ? `${activeCert.date}T00:00:00` : null,
                            propertyCertificateId: activeCert.propertyCertificateId || null,
                            propertyDetailsId: null,
                            existingDocumentGuid: getCleanGuid(activeCert.documentGuid),
                            hasNewDocument: !!activeCert.pendingFile,
                            markedForDeletion: false
                        }];
                    } else {
                        certificatesList = opts.selectedFloorIds.map(floorId => ({
                            certificateTypeId: targetTypeId,
                            isEnabled: true,
                            certificateNumber: activeCert.number || null,
                            certificateDate: activeCert.date ? `${activeCert.date}T00:00:00` : null,
                            propertyCertificateId: null,
                            propertyDetailsId: floorId,
                            existingDocumentGuid: null,
                            hasNewDocument: !!activeCert.pendingFile,
                            markedForDeletion: false
                        }));
                    }

                    const payload: PropertyCertificateBulkSaveDto = {
                        propertyId: parseInt(propertyId),
                        certificates: certificatesList
                    };

                    const formData = new FormData();
                    formData.append("certificates", JSON.stringify(payload));
                    
                    // Attach pending file if exists
                    if (activeCert.pendingFile) {
                        formData.append(`file_${targetTypeId}`, activeCert.pendingFile);
                    }

                    response = await saveBuildingPermissionsAction(locale, propertyId, formData);
                } else {
                    const targetPropertyDetailsId = opts?.overrideData?.propertyDetailsId !== undefined 
                        ? opts.overrideData.propertyDetailsId 
                        : (activeScope === "Floor" ? activeFloorId : null);
                    const targetEntityType = opts?.overrideData?.entityType ?? (activeScope === "Floor" ? "F" : "P");
                    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
                    const urlSocietyDetailId = searchParams?.get('societyDetailId') || searchParams?.get('societyId');
                    const urlWingDetailId = searchParams?.get('wingDetailId') || searchParams?.get('wingId');

                    const isSocietyMode = opts?.overrideData?.societyDetailId !== undefined
                        ? (opts.overrideData.societyDetailId !== null && Number(opts.overrideData.societyDetailId) > 0)
                        : Boolean(urlSocietyDetailId && Number(urlSocietyDetailId) > 0);

                    const targetSocietyDetailId = (opts?.overrideData?.societyDetailId !== undefined)
                        ? opts.overrideData.societyDetailId
                        : (urlSocietyDetailId ? Number(urlSocietyDetailId) : null);

                    const targetWingDetailId = isSocietyMode
                        ? ((opts?.overrideData?.wingDetailId !== undefined)
                            ? opts.overrideData.wingDetailId
                            : (urlWingDetailId ? Number(urlWingDetailId) : null))
                        : null;
                    const targetPropertyDetailsIds = opts?.overrideData?.propertyDetailsIds;

                    const resolvedDocGuid = getCleanGuid(activeCert.documentGuid) || getCleanGuid(opts?.overrideData?.documentGuid) || getCleanGuid(opts?.overrideData?.existingDocumentGuid) || null;
                    const saveReq = {
                        propertyId: parseInt(propertyId),
                        propertyDetailsId: targetPropertyDetailsId,
                        propertyDetailsIds: targetPropertyDetailsIds,
                        certificateScope: targetPropertyDetailsId ? CertificateScope.Floor : CertificateScope.Property,
                        certificateTypeId: targetTypeId,
                        certificateNo: activeCert.number || null,
                        certificateIssueDate: activeCert.date ? `${activeCert.date}T00:00:00` : null,
                        isPrimaryDocument: true,
                        entityType: targetEntityType,
                        societyDetailId: targetSocietyDetailId,
                        wingDetailId: targetWingDetailId,
                        documentGuid: resolvedDocGuid,
                        existingDocumentGuid: resolvedDocGuid,
                        propertyCertificateId: activeCert.propertyCertificateId || opts?.overrideData?.propertyCertificateId || null,
                        isFileModified: opts?.overrideData?.isFileModified ?? !!activeCert.pendingFile,
                        hasExistingDocument: Boolean(resolvedDocGuid),
                    };

                    const result = await saveCertificateAction(locale, propertyId, saveReq);
                    response = { success: result.success, error: result.error };

                    if (result.success && result.data) {
                        const propertyCertificateId = result.data.propertyCertificateId;
                        
                        if (activeCert.pendingFile) {
                            const uploadFormData = new FormData();
                            uploadFormData.append("File", activeCert.pendingFile);
                            uploadFormData.append("CertificateTypeId", String(targetTypeId));
                            uploadFormData.append("PropertyId", propertyId);

                            const uploadResult = await replaceCertificateDocumentAction(
                                propertyCertificateId,
                                uploadFormData,
                                locale,
                                propertyId
                            );
                            if (!uploadResult.success) {
                                response = { success: false, error: uploadResult.error };
                            }
                        }
                    }
                }

                if (response.success) {
                    if (!opts?.silent) {
                        toast.success(t("building.saveSuccess") || "Certificate saved successfully!");
                    }

                    // Reload certificate types to get updated state (propertyCertificateId, documentGuid)
                    const reloadScope = activeScope === "Floor" && activeFloorId !== null ? activeFloorId : undefined;
                    const reloadResponse = await getBuildingPermissionsAction(propertyId, reloadScope);
                    if (reloadResponse.success && reloadResponse.data) {
                        const updatedState = mapApiToBuildingState(reloadResponse.data);
                        markCurrentStateAsSaved(updatedState);
                    } else {
                        markCurrentStateAsSaved();
                    }

                    if (activeScope === "Property") {
                        revertFloorState();
                    }

                    // Reload the floors list to update the FloorTable
                    const floorRes = await getFloorCertificatesAction(propertyId);
                    if (floorRes.success && floorRes.data) {
                        setFloors(getCombinedFloors(floorRes.data));
                    }

                    router.refresh();
                    return { success: true, isValid: true };
                } else {
                    const errText = response.error || response.message;
                    const displayError = errText 
                        ? parseAndLocalizeBackendError(errText, buildingPermission, (key) => t(key))
                        : (t("building.saveError") || "Error saving building permissions!");
                    toast.error(displayError);
                    return { success: false, isValid: true };
                }
            } else {
                // If disabled, use bulk-save payload to mark for deletion / disable it
                const payload: PropertyCertificateBulkSaveDto = {
                    propertyId: parseInt(propertyId),
                    certificates: [{
                        certificateTypeId: targetTypeId,
                        isEnabled: false,
                        propertyCertificateId: activeCert.propertyCertificateId || null,
                        propertyDetailsId: activeScope === "Floor" ? activeFloorId : null,
                        existingDocumentGuid: getCleanGuid(activeCert.documentGuid),
                        hasNewDocument: false
                    }]
                };

                const formData = new FormData();
                formData.append("certificates", JSON.stringify(payload));
                
                const response = await saveBuildingPermissionsAction(locale, propertyId, formData);
                if (response.success) {
                    if (!opts?.silent) {
                        toast.success(t("building.saveSuccess") || "Certificate updated successfully!");
                    }

                    // Update baseline initial cache to clear unsaved changes flag
                    markCurrentStateAsSaved();

                    if (activeScope === "Property") {
                        revertFloorState();
                    }

                    // Reload the floors list to update the FloorTable
                    const floorRes = await getFloorCertificatesAction(propertyId);
                    if (floorRes.success && floorRes.data) {
                        setFloors(getCombinedFloors(floorRes.data));
                    }

                    router.refresh();
                    return { success: true, isValid: true };
                } else {
                    const displayError = response.error 
                        ? parseAndLocalizeBackendError(response.error, buildingPermission, (key) => t(key))
                        : (t("building.saveError") || "Error saving building permissions!");
                    toast.error(displayError);
                    return { success: false, isValid: true };
                }
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "";
            const displayError = msg 
                ? parseAndLocalizeBackendError(msg, buildingPermission, (key) => t(key))
                : (t("building.saveError") || "Error saving building permissions!");
            toast.error(displayError);
            return { success: false, isValid: true };
        } finally {
            stopLoading();
        }
    }, [buildingPermission, isSaving, locale, propertyId, startLoading, stopLoading, t, setFieldErrors, setIncompleteCertificates, setValidationErrors, selectedTypeId, firstCertTypeId, activeScope, activeFloorId, floors, getCombinedFloors, router, markCurrentStateAsSaved, revertFloorState]);

    const { handleFileUpload, handleFileDelete } = useBuildingFileUpload(
        buildingPermission,
        setBuildingPermission,
        clearError,
        t as unknown as (key: string, values?: Record<string, string | number>) => string
    );

    const handleDeleteCertificate = useCallback(async (certificateTypeId: number): Promise<{ success: boolean; message?: string }> => {
        const activeCert = buildingPermission[certificateTypeId];
        if (!activeCert) return { success: false, message: "Certificate not found" };

        const isSavedOnBackend = typeof activeCert.propertyCertificateId === "number" && activeCert.propertyCertificateId > 0;

        startLoading();
        try {
            if (isSavedOnBackend) {
                const propertyDetailsId = activeScope === "Floor" ? activeFloorId : null;
                const response = await deletePropertyCertificateAction(
                    parseInt(propertyId),
                    certificateTypeId,
                    propertyDetailsId,
                    locale,
                    propertyId
                );

                if (!response.success) {
                    const errorMsg = response.message || "Failed to delete certificate";
                    toast.error(errorMsg);
                    return { success: false, message: errorMsg };
                }
            }

            // Clear local state and disable toggle
            handleFileDelete(certificateTypeId, { silent: true });
            handleInputChange(certificateTypeId, 'number', '');
            handleInputChange(certificateTypeId, 'date', '');
            handleToggleEnabled(certificateTypeId, false);
            markCurrentStateAsSaved();

            toast.success(t("building.deleteSuccess") || "Certificate and data deleted successfully!");

            if (isSavedOnBackend) {
                // Reload certificates and floors to sync state in parallel
                const reloadScope = activeScope === "Floor" && activeFloorId !== null ? activeFloorId : undefined;
                
                const [reloadResponse, floorRes] = await Promise.all([
                    getBuildingPermissionsAction(propertyId, reloadScope),
                    getFloorCertificatesAction(propertyId)
                ]);

                if (reloadResponse.success && reloadResponse.data) {
                    const updatedState = mapApiToBuildingState(reloadResponse.data);
                    markCurrentStateAsSaved(updatedState);
                }

                if (floorRes.success && floorRes.data) {
                    setFloors(getCombinedFloors(floorRes.data));
                }
                
                router.refresh();
            }
            return { success: true };
        } catch (_error) {
            const errorMsg = "An error occurred while deleting the certificate";
            toast.error(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            stopLoading();
        }
    }, [buildingPermission, activeScope, activeFloorId, propertyId, locale, handleFileDelete, handleInputChange, handleToggleEnabled, startLoading, stopLoading, setFloors, t, getCombinedFloors, router, markCurrentStateAsSaved]);

    return {
        buildingPermission,
        hasChanges,
        isSaving,
        validationErrors,
        fieldErrors,
        incompleteCertificates,
        handleFileUpload,
        handleFileDelete,
        handleToggleEnabled,
        handleCopyFromPropertyCert,
        handleInputChange,
        handleDeleteCertificate,
        handleSave,
        t,
        // Floor scoped state and controls
        floors,
        selectedTypeId: selectedTypeId ?? firstCertTypeId,
        setSelectedTypeId,
        activeScope,
        activeFloorId,
        selectFloorOrPropertyScope,
        isFloorLoading,
        propertyCertificatesState,
        incompleteFloors
    };
};
