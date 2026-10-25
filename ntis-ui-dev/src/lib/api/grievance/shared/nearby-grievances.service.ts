export interface NearbyGrievance {
  id: string;
  trackingId: string;
  title: string;
  category: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
  status: string;
}

export class NearbyGrievancesService {
  async findNearby(_lat?: number, _lng?: number, _radiusMeters: number = 500): Promise<NearbyGrievance[]> {
    return [];
  }

  findNearbyGrievances(lat: number, lng: number, radiusMeters: number = 500): Promise<NearbyGrievance[]> {
    return this.findNearby(lat, lng, radiusMeters);
  }
}

export const nearbyGrievancesService = new NearbyGrievancesService();
