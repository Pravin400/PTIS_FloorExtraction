export function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
    const [x, y] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

export function isPointInGeometry(point: [number, number], geometry: GeoJSON.Geometry | null | undefined): boolean {
    if (!geometry) return false;
    if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates as number[][][];
        return isPointInPolygon(point, coords[0]);
    } else if (geometry.type === 'MultiPolygon') {
        const coords = geometry.coordinates as number[][][][];
        return coords.some((polygonCoords) => isPointInPolygon(point, polygonCoords[0]));
    }
    return false;
}
