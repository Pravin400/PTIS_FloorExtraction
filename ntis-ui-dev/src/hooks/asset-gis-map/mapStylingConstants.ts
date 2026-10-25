export function getHeatmapColor(
    heatMapType: string,
    demand: number,
    paid: number,
    propertyTypeGroup: string
): string {
    if (heatMapType === 'collection') {
        if (demand > 0) {
            const rate = (paid / demand) * 100;
            if (rate >= 90) return '#059669';
            if (rate >= 50) return '#FBBF24';
            if (rate > 0) return '#F97316';
            return '#EF4444';
        }
        return '#333336';
    }
    if (heatMapType === 'defaulters') {
        const balance = demand - paid;
        if (balance > 1000) return '#B91C1C';
        if (balance > 0) return '#EF4444';
        return '#059669';
    }
    if (heatMapType === 'density') {
        const type = String(propertyTypeGroup || '').toUpperCase();
        if (type === 'RESIDENTIAL' || type === 'R') return '#3B82F6';
        if (type === 'COMMERCIAL' || type === 'C') return '#8B5CF6';
        if (type === 'INDUSTRIAL' || type === 'I') return '#F59E0B';
        return '#333336';
    }
    return '#94A3B8';
}

export function getKpiFillColor(kpi: string): string {
    const k = kpi.toUpperCase();
    if (k === 'ASSESSED') return '#22C55E';
    if (k.includes('UNASSESSED')) return '#EF4444';
    if (k === 'SURVEY' || k === 'INTERNAL_SURVEY') return '#FFFF00';
    if (k === 'GEO_SEQUENCING') return '#F97316';
    if (k === 'UNDER_CONSTRUCTION') return '#0ea5e9';
    if (k === 'GOVERNMENT') return '#6366F1';
    if (k === 'IN_PROCESS') return '#1e170cff';
    return '#94A3B8';
}

export function getStatusFillColor(
    status: string,
    isConstruction: boolean,
    isGovernment: boolean,
    isAssessed: boolean,
    isSurvey: boolean,
    isNumbering: boolean,
    isInProcess: boolean,
    hasOldId: boolean
): string {
    if (isConstruction) return '#0ea5e9';
    if (isGovernment) return '#6366F1';
    if (isAssessed) return '#22C55E';
    if (isSurvey) return '#FFFF00';
    if (isNumbering) return '#F97316';
    if (isInProcess) return '#1e170cff';
    if (status === 'UNASSESSED' || (!hasOldId && status !== 'BACKGROUND')) return '#EF4444';
    return '#94A3B8';
}
