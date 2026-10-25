import type { AssetTypeColorConfig } from '@/types/asset-gis.types';

export const MUNICIPAL_ASSET_TYPE_COLORS: Record<string, AssetTypeColorConfig> = {
    '59': { id: 59, mpmsCode: 'MPMS11', label: 'खुल्या जागा (Open Spaces)', color: '#3B82F6', border: '#FFFFFF' },
    '66': { id: 66, mpmsCode: 'MPMS9', label: 'सार्वजनिक शौचालये (Toilets)', color: '#8B5CF6', border: '#FFFFFF' },
    '2': { id: 2, mpmsCode: 'MPMS3', label: 'मनपा शाळा (Schools)', color: '#EAB308', border: '#FFFFFF' },
    '16': { id: 16, mpmsCode: 'MPMS10', label: 'कार्यालये व इमारती (Offices & Bldgs)', color: '#10B981', border: '#FFFFFF' },
    '11': { id: 11, mpmsCode: 'MPMS13', label: 'मंदिर व प्रार्थनास्थळ (Temples)', color: '#F97316', border: '#FFFFFF' },
    '65': { id: 65, mpmsCode: 'MPMS4', label: 'बगीचे/उद्यान (Gardens & Parks)', color: '#22C55E', border: '#FFFFFF' },
    '60': { id: 60, mpmsCode: 'MPMS12', label: 'पाण्याच्या टाकी (Water Tanks)', color: '#06B6D4', border: '#FFFFFF' },
    '4': { id: 4, mpmsCode: 'MPMS2', label: 'दवाखाने (Hospitals/Clinics)', color: '#EF4444', border: '#FFFFFF' },
    '61': { id: 61, mpmsCode: 'MPMS8', label: 'स्मशानभुमी (Crematoriums)', color: '#64748B', border: '#FFFFFF' },
    '64': { id: 64, mpmsCode: 'MPMS5', label: 'स्मारक (Memorials)', color: '#EC4899', border: '#FFFFFF' },
    '33': { id: 33, mpmsCode: 'MPMS15', label: 'कोंडवाडा (Animal Pounds)', color: '#D97706', border: '#FFFFFF' },
    '20': { id: 20, mpmsCode: 'MPMS14', label: 'इतर मालमत्ता (Other Assets)', color: '#A855F7', border: '#FFFFFF' },
    '36': { id: 36, mpmsCode: 'MPMS1', label: 'व्यापारी संकुल व दुकान गाळे (Shopping Complex)', color: '#F59E0B', border: '#FFFFFF' },
    '49': { id: 49, mpmsCode: 'MPMS6', label: 'नाट्यगृह (Theatre)', color: '#C084FC', border: '#FFFFFF' },
    '12': { id: 12, mpmsCode: 'MPMS7', label: 'अधिकारी/ कर्मचारी निवासस्थान (Residence)', color: '#0EA5E9', border: '#FFFFFF' },
};

export const getAssetCategoryColor = (featureProps: Record<string, unknown> | null | undefined): { label: string; color: string; border: string } => {
    if (!featureProps) return { label: 'इतर मालमत्ता', color: '#A855F7', border: '#FFFFFF' };

    // 1. Direct color passed from database/MVT
    const directColor = (featureProps.ColorCode || featureProps.colorCode || featureProps.color) as string | undefined;
    if (directColor) {
        return {
            label: String(featureProps.TypeName || featureProps.typeName || featureProps.label || 'Asset'),
            color: directColor,
            border: String(featureProps.BorderColor || featureProps.borderColor || '#FFFFFF'),
        };
    }

    const typeId = String(featureProps.AssetTypeId || featureProps.assetTypeId || featureProps.typeId || featureProps.TypeId || '');
    if (typeId && MUNICIPAL_ASSET_TYPE_COLORS[typeId]) {
        return MUNICIPAL_ASSET_TYPE_COLORS[typeId];
    }

    // 2. Identify by MPMS prefix (e.g. MPMS11-35 -> MPMS11 -> Open Space)
    const rawId = String(featureProps.MPMS_ID || featureProps.mpmsId || featureProps.assetNo || featureProps.AssetNo || featureProps.OwnerID || featureProps.ownerID || '').toUpperCase().trim();
    if (rawId) {
        for (const config of Object.values(MUNICIPAL_ASSET_TYPE_COLORS)) {
            if (config.mpmsCode && (rawId === config.mpmsCode || rawId.startsWith(config.mpmsCode + '-') || rawId.startsWith(config.mpmsCode + '_'))) {
                return config;
            }
        }
    }

    // 3. Identify by Marathi / English Name matching
    const str = String(
        featureProps.PropertyDe || featureProps.propertyde || featureProps.PropertyDescription ||
        featureProps.TypeName || featureProps.typeName || featureProps.TypeNameLocal || featureProps.typeNameLocal ||
        featureProps.MarathiOwn || featureProps.AssetName || featureProps.assetName || ''
    ).trim();

    if (str.includes('जागा') || str.includes('ओपन') || str.includes('Open Space') || str.includes('खुल्या')) return MUNICIPAL_ASSET_TYPE_COLORS['59'];
    if (str.includes('शौचालय') || str.includes('Toilet') || str.includes('सुलभ')) return MUNICIPAL_ASSET_TYPE_COLORS['66'];
    if (str.includes('शाळा') || str.includes('School')) return MUNICIPAL_ASSET_TYPE_COLORS['2'];
    if (str.includes('कार्यालय') || str.includes('इमारत') || str.includes('Office') || str.includes('Building')) return MUNICIPAL_ASSET_TYPE_COLORS['16'];
    if (str.includes('मंदिर') || str.includes('प्रार्थना') || str.includes('Temple') || str.includes('Prayer')) return MUNICIPAL_ASSET_TYPE_COLORS['11'];
    if (str.includes('बगीचे') || str.includes('उद्यान') || str.includes('गार्डन') || str.includes('Garden') || str.includes('Park')) return MUNICIPAL_ASSET_TYPE_COLORS['65'];
    if (str.includes('टाकी') || str.includes('Water Tank')) return MUNICIPAL_ASSET_TYPE_COLORS['60'];
    if (str.includes('दवाखाने') || str.includes('रुग्णालय') || str.includes('Dispensary') || str.includes('Hospital')) return MUNICIPAL_ASSET_TYPE_COLORS['4'];
    if (str.includes('स्मशान') || str.includes('Cremation') || str.includes('Crematorium')) return MUNICIPAL_ASSET_TYPE_COLORS['61'];
    if (str.includes('स्मारक') || str.includes('पुतळे') || str.includes('Monument') || str.includes('Statue')) return MUNICIPAL_ASSET_TYPE_COLORS['64'];
    if (str.includes('कोंडवाडे') || str.includes('कोंडवाडा') || str.includes('Cattle Pound')) return MUNICIPAL_ASSET_TYPE_COLORS['33'];
    if (str.includes('संकुल') || str.includes('गाळे') || str.includes('Shopping Complex')) return MUNICIPAL_ASSET_TYPE_COLORS['36'];
    if (str.includes('नाट्यगृह') || str.includes('Theatre')) return MUNICIPAL_ASSET_TYPE_COLORS['49'];
    if (str.includes('निवासस्थान') || str.includes('Residence')) return MUNICIPAL_ASSET_TYPE_COLORS['12'];

    return { label: 'इतर मालमत्ता', color: '#A855F7', border: '#FFFFFF' };
};
