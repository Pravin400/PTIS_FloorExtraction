import { Trash2, HelpCircle, List } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/common/Input';
import { FieldConfig } from '@/types/rule-engine';
import ValueInput from './ValueInput';
import { InputRow } from '@/hooks/rule-engine/useSimulatorPayload';

interface RuleSimulatorInputsProps {
  inputs: InputRow[];
  arrayFieldIds: Set<string>;
  getFieldConfig: (key: string) => FieldConfig | undefined;
  handleRowChange: (index: number, field: 'key' | 'value', val: string) => void;
  handleRemoveRow: (index: number) => void;
  t: ReturnType<typeof useTranslations>;
}

export default function RuleSimulatorInputs({
  inputs,
  arrayFieldIds,
  getFieldConfig,
  handleRowChange,
  handleRemoveRow,
  t,
}: RuleSimulatorInputsProps) {
  return (
    <>
      {inputs.map((row, index) => {
        const config = getFieldConfig(row.key);
        const isArrayField = arrayFieldIds.has(row.key) || (config && config.inputType === 'MULTISELECT');
        return (
          <div key={row.id || `sim-input-${index}`} className="flex flex-col gap-1">
            <div className="grid grid-cols-12 gap-3 items-center bg-white hover:bg-slate-50/20 p-2 rounded-xl border border-slate-200 shadow-sm transition duration-200">
              <div className="col-span-5">
                <Input
                  placeholder="e.g. usageType"
                  value={row.key}
                  onChange={(e) => handleRowChange(index, 'key', e.target.value)}
                  disabled={row.isExtracted}
                  className={row.isExtracted 
                    ? 'bg-slate-100/60 font-mono text-xs text-slate-800 font-extrabold border-slate-300 shadow-none' 
                    : 'font-mono text-xs text-slate-900 font-bold border-slate-300 focus:border-indigo-650'
                  }
                />
              </div>
              <div className="col-span-6">
                {config ? (
                  <ValueInput
                    config={config}
                    value={config.inputType === 'MULTISELECT' ? (row.value ? row.value.split(',') : []) : row.value}
                    onChange={(val) => {
                      const scalarVal = Array.isArray(val) ? val.join(',') : val;
                      handleRowChange(index, 'value', scalarVal);
                    }}
                  />
                ) : (
                  <Input
                    placeholder={isArrayField ? 'Enter values, comma-separated (e.g. 10, 28)' : 'Input value...'}
                    value={row.value}
                    onChange={(e) => handleRowChange(index, 'value', e.target.value)}
                    className="font-mono text-xs text-slate-900 border-slate-300 focus:border-indigo-650"
                  />
                )}
              </div>
              <div className="col-span-1 flex justify-center">
                {!row.isExtracted ? (
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(index)}
                    title="Delete parameter"
                    className="text-slate-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 transition duration-150"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                ) : (
                  <div className="text-slate-500 p-2" title="Auto-extracted from rule block criteria">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
            {isArrayField && !config && (
              <div className="flex items-center gap-1.5 pl-3 text-[10px] font-bold text-indigo-700">
                <List className="w-3 h-3" />
                <span>
                  {t.rich('simulation.multiValueHint', {
                    codeTag: (chunks: React.ReactNode) => <code className="bg-indigo-50 px-1 rounded">{chunks}</code>,
                  })}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

