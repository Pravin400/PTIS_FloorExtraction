import { Filter, Building2, Building, MapPin } from 'lucide-react';

type Translator = (key: string) => string;

export function getSearchFieldOptions(t: Translator) {
  return [
    {
      value: 'all',
      label: (
        <span className="flex items-center gap-1.5 font-medium">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>{t('AllFields')}</span>
        </span>
      ) as unknown as string,
    },
    {
      value: 'assetId',
      label: (
        <span className="flex items-center gap-1.5 font-medium">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <span>{t('AssetId')}</span>
        </span>
      ) as unknown as string,
    },
    {
      value: 'assetName',
      label: (
        <span className="flex items-center gap-1.5 font-medium">
          <Building className="w-3.5 h-3.5 text-slate-500" />
          <span>{t('AssetName')}</span>
        </span>
      ) as unknown as string,
    },
    {
      value: 'address',
      label: (
        <span className="flex items-center gap-1.5 font-medium">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span>{t('Address')}</span>
        </span>
      ) as unknown as string,
    },
  ];
}
