/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslations } from 'next-intl';
import { Card } from '@/components/common/Card';
import { AlertCircle } from 'lucide-react';
import { Action } from '@/hooks/add-taxes/useAddTaxesState';

interface ValidateEligibilityPanelProps {
  actions: any[];
  selectedAction: Action;
  setSelectedAction: (a: Action) => void;
}

export function ValidateEligibilityPanel({ actions, selectedAction, setSelectedAction }: ValidateEligibilityPanelProps) {
  const t = useTranslations('addTaxes');

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">{t('validateEligibility.title')}</h3>
        <p className="text-[11px] text-gray-500 mt-1">{t('validateEligibility.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        {actions.map(a => {
          const isSelected = selectedAction === a.id;
          return (
            <div
              key={a.id}
              onClick={() => setSelectedAction(a.id as Action)}
              className={`cursor-pointer border rounded-lg p-3 flex items-start gap-3 transition-all ${isSelected ? a.borderColor + ' ' + a.bg : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <a.icon className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-green-600' : a.iconColor}`} />
              <div className="flex-1">
                <div className={`text-sm font-medium ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>{a.title}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{a.desc}</div>
              </div>
              <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isSelected ? 'bg-green-600 text-white' : 'bg-gray-100 ' + a.color}`}>
                {a.status}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-2 text-[11px] text-blue-600 mt-8">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <span>{t('validateEligibility.infoNote')}</span>
      </div>
    </Card>
  );
}
