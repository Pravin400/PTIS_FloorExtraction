import { ListTree } from 'lucide-react';
import type { TranslatorFunction } from '@/types/typeOfUse.types';
import { Tooltip } from '@/components/common/Tooltip';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

const TRUNCATION_LIMIT = 50;
const TRUNCATED_LENGTH = TRUNCATION_LIMIT - 4;

interface SubTypeFormHeaderProps {
  isEdit: boolean;
  typeLabel: string;
  t: TranslatorFunction;
}

export function SubTypeFormHeader({ isEdit, typeLabel, t }: SubTypeFormHeaderProps) {
  const subTypeOfUseLabel = useAliasLabel("Sub_Type_Of_Use", t("aliasFallback.subTypeOfUse"));

  const name = typeLabel ? typeLabel.trim() : "";
  const isTruncated = name.length > TRUNCATION_LIMIT;
  const displayLabel = isTruncated
    ? `${name.slice(0, TRUNCATED_LENGTH)}....`
    : name;

  const headerText = name
    ? t('subtype.forType', { type: displayLabel })
    : t('subtype.addSubtitle', { subTypeOfUse: subTypeOfUseLabel });

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md text-white">
        <ListTree size={20} />
      </div>
      <div>
        <div className="text-lg font-bold text-blue-900">
          {isEdit ? t('subtype.edit', { subTypeOfUse: subTypeOfUseLabel }) : t('subtype.add', { subTypeOfUse: subTypeOfUseLabel })}
        </div>
        <div className="text-sm text-slate-500">
          {isTruncated ? (
            <Tooltip content={name} placement="bottom">
              <span className="cursor-help">{headerText}</span>
            </Tooltip>
          ) : (
            <span>{headerText}</span>
          )}
        </div>
      </div>
    </div>
  );
}


