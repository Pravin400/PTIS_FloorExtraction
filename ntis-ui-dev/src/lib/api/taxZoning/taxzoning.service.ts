// Query operations (fetch/read)
export {
  getTaxZonePagedServer,
  getWardPagedServer,
  getTaxZoningPagedServer,
  getTaxZoningByWardServer,
  getAllTaxZoningServer,
  getTaxZoningPropertyNoServer,
} from './taxzoning-queries.service';

// Mutation operations (create/update)
export {
  createTaxZoning,
  updateTaxZoning,
} from './taxzoning-mutations.service';
