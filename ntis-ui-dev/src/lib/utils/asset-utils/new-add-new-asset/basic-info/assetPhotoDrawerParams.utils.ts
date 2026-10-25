export const DRAWER_PARAM_KEYS = [
  'drawer',
  'photoCategoryIndex',
  'selectedImageIndex',
  'viewMode',
  'action',
] as const;

export function stripDrawerParams(params: URLSearchParams) {
  DRAWER_PARAM_KEYS.forEach((key) => params.delete(key));
}
