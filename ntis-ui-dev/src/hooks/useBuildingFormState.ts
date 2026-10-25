import { useState, useCallback, useMemo } from "react";
import { BuildingPermissionState, PropertyCertificateWithStatusDto, CertificateData } from "@/types/building-permission.types";
import { mapApiToBuildingState, hasChangesComparedToInitial } from "@/lib/utils/building-helpers";

export const useBuildingFormState = (
    initialData: PropertyCertificateWithStatusDto[] | null,
    initialFloorBuildingPermission?: PropertyCertificateWithStatusDto[] | null,
    initialActiveScope?: 'Property' | 'Floor',
    initialActiveFloorId?: number | null
) => {
    const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});
    const [fieldErrors, setFieldErrors] = useState<Record<number, { number?: string; date?: string; document?: string }>>({});
    const [incompleteCertificates, setIncompleteCertificates] = useState<{ id: number; name: string }[]>([]);

    // Scopes: 'Property' | 'Floor'
    const [activeScope, setActiveScope] = useState<'Property' | 'Floor'>(initialActiveScope || 'Property');
    const [activeFloorId, setActiveFloorId] = useState<number | null>(initialActiveFloorId ?? null);

    // Property-level state
    const [propertyCertificatesState, setPropertyCertificatesState] = useState<BuildingPermissionState>(() =>
        mapApiToBuildingState(initialData)
    );
    const [initialPropertyStateOverride, setInitialPropertyStateOverride] = useState<BuildingPermissionState | null>(null);

    const [prevInitialData, setPrevInitialData] = useState(initialData);
    if (initialData !== prevInitialData) {
        setPrevInitialData(initialData);
        setPropertyCertificatesState(mapApiToBuildingState(initialData));
        setInitialPropertyStateOverride(null);
    }

    // Floor-level states
    const [floorCertificatesCache, setFloorCertificatesCache] = useState<Record<number, BuildingPermissionState>>(() => {
        if (initialActiveFloorId && initialFloorBuildingPermission && initialFloorBuildingPermission.length > 0) {
            return {
                [initialActiveFloorId]: mapApiToBuildingState(initialFloorBuildingPermission)
            };
        }
        return {};
    });
    const [initialFloorStateCache, setInitialFloorStateCache] = useState<Record<number, BuildingPermissionState>>(() => {
        if (initialActiveFloorId && initialFloorBuildingPermission && initialFloorBuildingPermission.length > 0) {
            return {
                [initialActiveFloorId]: mapApiToBuildingState(initialFloorBuildingPermission)
            };
        }
        return {};
    });

    // Active state being edited / displayed in the UI
    const buildingPermission = useMemo<BuildingPermissionState>(() => {
        if (activeScope === 'Property') return propertyCertificatesState;
        if (activeFloorId == null) return {};
        return floorCertificatesCache[activeFloorId] || {};
    }, [activeScope, activeFloorId, propertyCertificatesState, floorCertificatesCache]);

    // Initial state of the active scope for change detection
    const initialMappedState = useMemo(() => {
        if (initialPropertyStateOverride !== null) {
            return initialPropertyStateOverride;
        }
        return mapApiToBuildingState(initialData);
    }, [initialData, initialPropertyStateOverride]);

    const activeInitialState = useMemo<BuildingPermissionState>(() => {
        if (activeScope === 'Property') return initialMappedState;
        if (activeFloorId == null) return {};
        return initialFloorStateCache[activeFloorId] || {};
    }, [activeScope, activeFloorId, initialMappedState, initialFloorStateCache]);

    const hasChanges = useMemo(() => 
        hasChangesComparedToInitial(buildingPermission, activeInitialState), 
        [buildingPermission, activeInitialState]
    );

    const markCurrentStateAsSaved = useCallback((newState?: BuildingPermissionState) => {
        if (activeScope === 'Property') {
            const targetState = newState || propertyCertificatesState;
            setInitialPropertyStateOverride({ ...targetState });
            setPropertyCertificatesState({ ...targetState });
        } else if (activeFloorId !== null) {
            const targetState = newState || floorCertificatesCache[activeFloorId] || {};
            setFloorCertificatesCache(prev => ({
                ...prev,
                [activeFloorId]: { ...targetState }
            }));
            setInitialFloorStateCache(prev => ({
                ...prev,
                [activeFloorId]: { ...targetState }
            }));
        }
    }, [activeScope, activeFloorId, propertyCertificatesState, floorCertificatesCache]);

    const hasAnyUnsavedBuildingChanges = useMemo(() => {
        if (hasChangesComparedToInitial(propertyCertificatesState, initialMappedState)) {
            return true;
        }
        const floorIds = Object.keys(floorCertificatesCache).map(Number);
        for (const floorId of floorIds) {
            const currentFloorState = floorCertificatesCache[floorId];
            const initialFloorState = initialFloorStateCache[floorId] || {};
            if (currentFloorState && hasChangesComparedToInitial(currentFloorState, initialFloorState)) {
                return true;
            }
        }
        return false;
    }, [propertyCertificatesState, initialMappedState, floorCertificatesCache, initialFloorStateCache]);

    const clearError = useCallback((id: number) => {
        setValidationErrors((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        setIncompleteCertificates((prev) => prev.filter((c) => c.id !== id));
    }, []);

    // Custom state setter that mimics React.Dispatch<React.SetStateAction<BuildingPermissionState>>
    const setBuildingPermission = useCallback((updateFn: React.SetStateAction<BuildingPermissionState>) => {
        if (activeScope === 'Property') {
            setPropertyCertificatesState(prev => {
                return typeof updateFn === 'function' ? updateFn(prev) : updateFn;
            });
        } else {
            setFloorCertificatesCache(prev => {
                const activeFloorData = prev[activeFloorId!] || {};
                const val = typeof updateFn === 'function' ? updateFn(activeFloorData) : updateFn;
                return {
                    ...prev,
                    [activeFloorId!]: val
                };
            });
        }
    }, [activeScope, activeFloorId]);

    const handleToggleEnabled = useCallback((certificateTypeId: number, checked: boolean) => {
        setBuildingPermission((prev) => {
            const currentItem = prev[certificateTypeId] || {};
            let prefillProps: Partial<CertificateData> = {};
            if (checked && activeScope === 'Floor' && !currentItem.number && !currentItem.date && !currentItem.documentGuid) {
                const propCert = propertyCertificatesState[certificateTypeId];
                if (propCert && (propCert.number || propCert.date || propCert.documentGuid)) {
                    prefillProps = {
                        number: propCert.number || '',
                        date: propCert.date || '',
                        documentGuid: propCert.documentGuid || undefined,
                        fileName: propCert.fileName || undefined,
                        pendingFile: propCert.pendingFile || undefined,
                    };
                }
            }
            return {
                ...prev,
                [certificateTypeId]: { ...currentItem, ...prefillProps, enabled: checked },
            };
        });
        clearError(certificateTypeId);
    }, [setBuildingPermission, clearError, activeScope, propertyCertificatesState]);

    const handleCopyFromPropertyCert = useCallback((certificateTypeId: number) => {
        const propCert = propertyCertificatesState[certificateTypeId];
        if (!propCert) return;
        setBuildingPermission((prev) => ({
            ...prev,
            [certificateTypeId]: {
                ...prev[certificateTypeId],
                enabled: true,
                number: propCert.number || '',
                date: propCert.date || '',
                documentGuid: propCert.documentGuid || undefined,
                fileName: propCert.fileName || undefined,
                pendingFile: propCert.pendingFile || undefined,
            },
        }));
        clearError(certificateTypeId);
    }, [propertyCertificatesState, setBuildingPermission, clearError]);

    const handleInputChange = useCallback((certificateTypeId: number, field: 'number' | 'date', value: string) => {
        setBuildingPermission((prev) => ({
            ...prev,
            [certificateTypeId]: { ...prev[certificateTypeId], [field]: value, enabled: true },
        }));
        clearError(certificateTypeId);
    }, [setBuildingPermission, clearError]);

    const revertFloorState = useCallback((floorId?: number | null) => {
        setFloorCertificatesCache((prev) => {
            const next = { ...prev };
            if (floorId !== undefined && floorId !== null) {
                if (initialFloorStateCache[floorId]) {
                    next[floorId] = { ...initialFloorStateCache[floorId] };
                } else {
                    delete next[floorId];
                }
            } else {
                // Revert all floors
                Object.keys(next).forEach((key) => {
                    const id = Number(key);
                    if (initialFloorStateCache[id]) {
                        next[id] = { ...initialFloorStateCache[id] };
                    } else {
                        delete next[id];
                    }
                });
            }
            return next;
        });
        setValidationErrors({});
        setFieldErrors({});
        setIncompleteCertificates([]);
    }, [initialFloorStateCache]);

    return {
        buildingPermission,
        setBuildingPermission,
        hasChanges,
        hasAnyUnsavedBuildingChanges,
        markCurrentStateAsSaved,
        revertFloorState,
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
        initialMappedState,
        propertyCertificatesState,
        // New exports for managing floor scopes
        activeScope,
        setActiveScope,
        activeFloorId,
        setActiveFloorId,
        floorCertificatesCache,
        setFloorCertificatesCache,
        initialFloorStateCache,
        setInitialFloorStateCache
    };
};
