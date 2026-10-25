/* eslint-disable @typescript-eslint/no-explicit-any */
export const typeBadge: Record<string, string> = {
  Flat: 'bg-blue-100 text-blue-700',
  Shop: 'bg-amber-100 text-amber-700',
  Office: 'bg-indigo-100 text-indigo-700',
  Floor: 'bg-slate-100 text-slate-600',
  Construction: 'bg-slate-100 text-slate-600',
  Room: 'bg-violet-100 text-violet-700',
  Department: 'bg-teal-100 text-teal-700',
  'Open Space': 'bg-emerald-100 text-emerald-700',
  Amenity: 'bg-violet-100 text-violet-700',
};

export const resolveAmsTypeOfUseId = (typeOfUseId: any, useTypes: any[]) => {
  const idStr = String(typeOfUseId || '');
  if (!idStr) return null;

  const directMatch = (useTypes || []).find((o: any) => String(o.value) === idStr);
  if (directMatch) return Number(directMatch.value);

  if (idStr === '1') {
    const match = (useTypes || []).find(
      (o: any) => o.label.startsWith('C') || o.label.toUpperCase().includes('COMMERCIAL')
    );
    return match ? Number(match.value) : null;
  }
  if (idStr === '2') {
    const match = (useTypes || []).find(
      (o: any) =>
        o.label.startsWith('R') ||
        o.label.startsWith('N') ||
        o.label.toUpperCase().includes('RESIDENTIAL')
    );
    return match ? Number(match.value) : null;
  }

  return null;
};

// Resolves the real PTIS.FloorMaster row used to bucket "Open Space" submissions (FloorCode
// 'OP' / description "Open Plot") from the already-loaded Floor dropdown, instead of trusting a
// hardcoded id — FloorMaster.Id is assigned by IDENTITY at seed time and isn't stable across
// re-seeds, so a literal number here can silently point at the wrong floor (or a nonexistent one).
export const resolveOpenSpaceFloorId = (floorLevels: any[]): number | null => {
  const match = (floorLevels || []).find((f: any) => {
    const label = String(f.label || '').toUpperCase();
    return label.startsWith('OP -') || label.startsWith('OP-') || label.includes('OPEN PLOT');
  });
  return match ? Number(match.value) : null;
};

export const getTypeOfUseLabel = (typeOfUseId: any, useTypes: any[]) => {
  const idStr = String(typeOfUseId || '');
  if (!idStr) return '-';

  const directMatch = (useTypes || []).find((o: any) => String(o.value) === idStr);
  if (directMatch) return directMatch.label;

  if (idStr === '1') {
    const match = (useTypes || []).find(
      (o: any) => o.label.startsWith('C') || o.label.toUpperCase().includes('COMMERCIAL')
    );
    if (match) return match.label;
    return 'C - अनिवासी';
  }
  if (idStr === '2') {
    const match = (useTypes || []).find(
      (o: any) =>
        o.label.startsWith('R') ||
        o.label.startsWith('N') ||
        o.label.toUpperCase().includes('RESIDENTIAL')
    );
    if (match) return match.label;
    return 'N - निवासी';
  }

  return idStr;
};

export const getLocalizedFloorError = (err: string | undefined, t: any) => {
  if (!err) return '';
  if (err === 'A record with the same details already exists.') {
    try {
      return t('floorDetails.floorAlreadyExistsMsg') || 'Floor details already exist.';
    } catch (_e) {
      return 'Floor details already exist.';
    }
  }
  if (err === 'SubTypeOfUseId must be greater than 0') {
    try {
      return t('floorDetails.subTypeOfUseRequiredMsg') || 'Sub Type of Use must be selected';
    } catch (_e) {
      return 'Sub Type of Use must be selected';
    }
  }
  return err;
};
