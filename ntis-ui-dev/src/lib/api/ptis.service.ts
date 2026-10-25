import { getOldDetails, getOldFloorDetails, getPropertyBasicDetails } from './ptis-details.service';
import { getWardByNo, searchProperties } from './ptis-search.service';

export const ptisService = {
  searchProperties,
  getWardByNo,
  getOldDetails,
  getOldFloorDetails,
  getPropertyBasicDetails,
};
