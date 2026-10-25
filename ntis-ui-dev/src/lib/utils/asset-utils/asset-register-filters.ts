import { ASSET_MASTER_TEXT_SANITIZE } from '@/lib/utils/asset-validation-rules';

export type AssetRegisterSearchField = 'all' | 'assetId' | 'assetName' | 'address';

export function normalizeSearchField(value?: string | null): AssetRegisterSearchField {
  if (value === 'assetId' || value === 'assetName' || value === 'address') {
    return value;
  }
  return 'all';
}

export function sanitizeFilterInput(value: string): string {
  let sanitized = value.replace(/\s+-/g, '-');
  sanitized = sanitized.replace(/-\s+/g, '-');
  sanitized = sanitized.replace(/-+/g, '-');
  sanitized = sanitized.replace(/\s+/g, ' ');
  return sanitized.replace(ASSET_MASTER_TEXT_SANITIZE, '');
}

export function getMainSearchPlaceholder(
  searchField: AssetRegisterSearchField,
  allFieldsLabel: string,
  assetIdLabel: string = 'Search by Asset ID...',
  assetNameLabel: string = 'Search by Asset Name...',
  addressLabel: string = 'Search by Address...'
): string {
  if (searchField === 'all') return allFieldsLabel;
  if (searchField === 'assetId') return assetIdLabel;
  if (searchField === 'assetName') return assetNameLabel;
  return addressLabel;
}
