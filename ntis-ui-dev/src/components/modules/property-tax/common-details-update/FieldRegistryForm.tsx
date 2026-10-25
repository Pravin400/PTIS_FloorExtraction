'use client';

import { useMemo } from 'react';
import { Database } from 'lucide-react';
import {
  Card,
  CardContent,
  Input,
  SearchSelect,
  MultiSelect,
  SaveButton,
} from '@/components/common';

import { useFieldRegistryState } from '@/hooks/commonDetailsUpdate/useFieldRegistryState';

interface FieldRegistryFormProps {
  t: (key: string) => string;
  state: ReturnType<typeof useFieldRegistryState>;
}

export const FieldRegistryForm = ({ t, state }: FieldRegistryFormProps) => {
  const {
    sourceTable,
    setSourceTable,
    updateCode,
    setUpdateCode,
    fieldConfigs,
    updateFieldConfig,
    tables,
    sourceTableFields,
    loadingTables,
    submitting,
    handleAddFieldToRegistry,
  } = state;

  const tableOptions = useMemo(() => {
    const options = tables.map((t) => ({
      label: t.moduleLabel ? `${t.moduleLabel} ${t.tableName}` : t.tableName,
      value: String(t.id)
    }));
    if (sourceTable && !options.some(o => o.value === sourceTable)) {
      const sTable = sourceTable.toLowerCase();
      const sTableClean = sTable.replace(/[\s_]/g, '');

      const matchedTable = tables.find(t => {
        if (!t) return false;
        if (String(t.id) === String(sourceTable)) return true;

        const tName = t.tableName ? t.tableName.toLowerCase() : '';
        const tNameClean = tName.replace(/[\s_]/g, '');

        const refName = t.referenceTableName ? t.referenceTableName.toLowerCase() : '';
        const refNameClean = refName.replace(/[\s_]/g, '');
        const refLastPart = refName.split('.').pop() || '';
        const refLastPartClean = refLastPart.replace(/[\s_]/g, '');

        return (
          tName === sTable ||
          tNameClean === sTableClean ||
          refName === sTable ||
          refNameClean === sTableClean ||
          refLastPart === sTable ||
          refLastPartClean === sTableClean
        );
      });

      const displayLabel = matchedTable
        ? (matchedTable.moduleLabel ? `${matchedTable.moduleLabel} ${matchedTable.tableName}` : matchedTable.tableName)
        : sourceTable;
      options.push({ label: displayLabel, value: sourceTable });
    }
    return options;
  }, [tables, sourceTable]);
  const columnOptions = useMemo(() => {
    return sourceTableFields.map((col) => ({
      value: col.tableFieldName,
      label: col.tableFieldName,
    }));
  }, [sourceTableFields]);

  const disableSave = !updateCode || !sourceTable || submitting;

  return (
    <Card
      variant="default"
      padding="none"
      className="border border-blue-200 rounded-xl overflow-visible bg-white relative z-50"
    >
      <div className="bg-[#F8FAFF] px-4 py-3 border-b border-blue-200 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#1E3A8A] flex items-center gap-2">
              <Database className="w-4 h-4" />
              {t('fieldRegistry.addFieldFromDb.title')}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('fieldRegistry.addFieldFromDb.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-2 pb-0 bg-blue-50/30">
        <div className="flex flex-wrap gap-4 items-end pb-3">
          <div className="w-[265px] [&_ul]:!max-h-[260px] [&_[role=listbox]]:!max-h-[260px]">
            <div className="block text-sm font-medium mb-1.5 text-slate-700">
              {t('fieldRegistry.addFieldFromDb.sourceTable')} <span className="text-red-500 ml-0.5">*</span>
            </div>
            <SearchSelect
              value={sourceTable}
              onChange={(_, val) => setSourceTable(val)}
              options={tableOptions}
              placeholder={loadingTables ? '...' : t('fieldRegistry.addFieldFromDb.selectTable')}
            />
          </div>
          
          {fieldConfigs.map((config, index) => (
            <div key={index} className="flex items-end gap-4">
              <div className="w-[255px]">
                <div className="block text-sm font-medium mb-1.5 text-slate-700">
                  {t('fieldRegistry.addFieldFromDb.fieldName')} <span className="text-red-500 ml-0.5">*</span>
                </div>
                <MultiSelect
                  id={`field-name-${index}`}
                  value={config.fieldName}
                  onChange={(val) => {
                    const oldFirstVal = (config.fieldName && config.fieldName.length > 0) ? config.fieldName[0] : '';
                    const newFirstVal = (val && val.length > 0) ? val[0] : '';
                    
                    updateFieldConfig(index, {
                      fieldName: val,
                    });

                    if (val.length === 0) {
                      // If user unselected everything, clear updateCode if it matched the last selected
                      if (updateCode === oldFirstVal) {
                        setUpdateCode('');
                      }
                    } else if (newFirstVal) {
                      // If user selected something new or changed the first selected item
                      if (!updateCode || updateCode === oldFirstVal) {
                        setUpdateCode(newFirstVal);
                      }
                    }
                  }}
                  options={[
                    ...columnOptions.filter(o => config.fieldName.includes(o.value)),
                    ...columnOptions.filter(o => !config.fieldName.includes(o.value))
                  ]}
                  placeholder={config.fieldName && config.fieldName.length > 0 ? config.fieldName.join(", ") : t('fieldRegistry.addFieldFromDb.selectFieldName') || 'Select Field Name'}
                  selectSize="sm"
                  disabled={submitting || !sourceTable}
                  className="text-sm [&>button]:h-9 [&>button]:py-1.5 [&>button:disabled]:opacity-60 [&>div.absolute]:!max-h-96 [&>div.absolute>div[role=listbox]]:!max-h-[260px]"
                />
              </div>
            </div>
          ))}

          <div className="w-[215px]">
            <div className="block text-sm font-medium mb-1.5 text-slate-700">
              {t('fieldRegistry.addFieldFromDb.updateCode')} <span className="text-red-500 ml-0.5">*</span>
            </div>
            <Input
              required
              type="text"
              value={updateCode}
              onChange={(e) => setUpdateCode(e.target.value)}
              placeholder={t('fieldRegistry.addFieldFromDb.updateNamePlaceholder')}
              className="w-full h-9 text-slate-900"
              disabled={submitting}
            />
          </div>

          <div className="flex items-center">
            <SaveButton
              size="sm"
              type="button"
              label={t('fieldRegistry.addFieldFromDb.saveFields')}
              onClick={handleAddFieldToRegistry}
              disabled={disableSave}
              className="h-9 font-semibold shadow-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
