import { QuickDataEntryClientWrapper } from "@/components/modules/property-tax/ptis/QuickDataEntry/QuickDataEntryClientWrapper";
import { getPropertyBasicDetailsAction, validateFloorCompatibilityAction } from "./Property/action";
import { getPropertySocietyDetailsAction } from "./Society/action";
import { getWingWiseDetailsAction } from "@/app/[locale]/property-tax/ptis/apartment/action";
import { getPhotoSlotsAction, getPropertyPhotosAction } from "@/app/[locale]/property-tax/ptis/media-fetch.action";
import { getPropertyPhotoTypesByScopeAction } from "@/app/[locale]/property-tax/ptis/PhotoPlanType.action";
import type { WingWiseWingDetails } from "@/types/property-tax/apartment/wing-intelligence.types";
import type { PropertyPhotoTypeWithStatusDto } from "@/types/photoplan.types";

interface Props {
    children: React.ReactNode;
    params: Promise<{ locale: string; propertyId: string }>;
}

export default async function Layout({ children, params }: Props) {
    const { propertyId } = await params;
    const numericPropertyId = Number(propertyId);
    const isValidPropId = Boolean(numericPropertyId && !isNaN(numericPropertyId));

    const [basicDetailsRes, compatibilityRes, societyDetailsRes, photoSlotsRes, photosRes, propScopeTypesRes] = await Promise.all([
        propertyId ? getPropertyBasicDetailsAction(numericPropertyId) : Promise.resolve(null),
        isValidPropId ? validateFloorCompatibilityAction(numericPropertyId) : Promise.resolve(null),
        isValidPropId ? getPropertySocietyDetailsAction(numericPropertyId) : Promise.resolve(null),
        isValidPropId ? getPhotoSlotsAction(numericPropertyId) : Promise.resolve(null),
        isValidPropId ? getPropertyPhotosAction(numericPropertyId) : Promise.resolve(null),
        getPropertyPhotoTypesByScopeAction('PROPERTY').catch(() => null),
    ]);

    const basicDetails = basicDetailsRes?.success ? basicDetailsRes.data : null;
    const categoryId = basicDetails?.categoryId ?? null;
    const propertyTypeId = basicDetails?.propertyTypeId ?? null;
    const categoryName = basicDetails?.categoryName || "";
    const propertyDescription = basicDetails?.propertyDescription || "";
    const initialHasIncompatibleFloor = compatibilityRes?.success ? !compatibilityRes.data?.isCompatible : false;

    const initialPhotoSlots: PropertyPhotoTypeWithStatusDto[] = [
        ...(photoSlotsRes?.success && Array.isArray(photoSlotsRes.data) ? photoSlotsRes.data : []),
    ];

    if (propScopeTypesRes?.success && Array.isArray(propScopeTypesRes.data)) {
        propScopeTypesRes.data.forEach((pt) => {
            if (pt.isActive === false) return;
            const code = (pt.photoTypeCode || '').toUpperCase();
            const existingIdx = initialPhotoSlots.findIndex(
                (s) => (s.photoTypeCode && s.photoTypeCode.toUpperCase() === code) || s.photoTypeId === pt.id
            );
            if (existingIdx === -1) {
                initialPhotoSlots.push({
                    photoTypeId: pt.id,
                    photoTypeCode: pt.photoTypeCode,
                    photoTypeName: pt.photoTypeName,
                    photoScope: pt.photoScope || 'PROPERTY',
                    displayOrder: pt.displayOrder || 1,
                    hasPhoto: false,
                    photoCount: 0,
                });
            } else {
                if (!initialPhotoSlots[existingIdx].photoScope) {
                    initialPhotoSlots[existingIdx].photoScope = pt.photoScope || 'PROPERTY';
                }
            }
        });
    }

    const initialPhotos = photosRes?.success && Array.isArray(photosRes.data) ? photosRes.data : [];

    // Fetch wing-wise details if wardId and propertyNo exist
    let wings: WingWiseWingDetails[] = [];
    let wingsSocietyId: number | null = null;
    if (basicDetails?.wardId && basicDetails?.propertyNo) {
        try {
            const wingsRes = await getWingWiseDetailsAction(basicDetails.wardId, basicDetails.propertyNo);
            if (wingsRes?.success && wingsRes.data) {
                wings = Array.isArray(wingsRes.data.wings) ? wingsRes.data.wings : [];
                wingsSocietyId = wingsRes.data.societyId ? Number(wingsRes.data.societyId) : null;
            }
        } catch {
            // Non-blocking fallback
        }
    }

    const resolvedSocietyDetailId =
        (societyDetailsRes?.success && societyDetailsRes.data?.societyDetailId
            ? Number(societyDetailsRes.data.societyDetailId)
            : null) ||
        wingsSocietyId ||
        (wings[0]?.societyId ? Number(wings[0].societyId) : null) ||
        (wings[0]?.societyDetailId ? Number(wings[0].societyDetailId) : null) ||
        null;

    const matchedWing = wings.find(
        (w) =>
            (basicDetails?.wingId && (Number(w.wingDetailId) === Number(basicDetails.wingId) || Number(w.wingMasterId) === Number(basicDetails.wingId) || Number(w.wingId) === Number(basicDetails.wingId))) ||
            (basicDetails?.wingName && w.wingName && w.wingName.trim().toLowerCase() === basicDetails.wingName.trim().toLowerCase()) ||
            (basicDetails?.wingNo && w.wingNo && w.wingNo.trim().toLowerCase() === basicDetails.wingNo.trim().toLowerCase())
    ) || (wings.length > 0 ? wings[0] : null);

    const resolvedWingDetailId = matchedWing?.wingDetailId ?? (basicDetails?.wingId ? Number(basicDetails.wingId) : null);
    const resolvedWingName =
        (matchedWing?.wingName && matchedWing.wingName.trim()) ||
        (matchedWing?.wingNo ? `${matchedWing.wingNo} Wing` : '') ||
        (basicDetails?.wingName && basicDetails.wingName.trim()) ||
        (basicDetails?.wingNo ? `${basicDetails.wingNo} Wing` : '') ||
        '';

    return (
        <QuickDataEntryClientWrapper
            categoryId={categoryId}
            propertyTypeId={propertyTypeId}
            categoryName={categoryName}
            propertyDescription={propertyDescription}
            initialHasIncompatibleFloor={initialHasIncompatibleFloor}
            initialPhotoSlots={initialPhotoSlots}
            initialPhotos={initialPhotos}
            societyDetailId={resolvedSocietyDetailId}
            wings={wings}
            wingName={resolvedWingName}
            wingDetailId={resolvedWingDetailId}
        >
            {children}
        </QuickDataEntryClientWrapper>
    );
}