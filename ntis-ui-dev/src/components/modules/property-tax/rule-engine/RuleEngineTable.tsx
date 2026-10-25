'use client';

/**
 * RuleEngineTable
 *
 * A module-specific wrapper around the shared MasterTable component.
 * Adds a smart default `getRowKey` fallback so all rule-engine tables
 * automatically produce stable, unique row keys without modifying the
 * shared common component.
 *
 * Priority order for auto key resolution:
 *   1. Caller-supplied `getRowKey` (if provided, used as-is)
 *   2. row.id
 *   3. row.ruleCode
 *   4. row.code
 *   5. row.uuid
 *   6. `re-row-{index}` (guaranteed-unique final fallback)
 */

import { MasterTable, MasterTableProps } from '@/components/common/MasterTable';

function resolveRowKey<T extends Record<string, unknown>>(row: T, index: number): React.Key {
  const baseKey = row['ruleCode'] || row['code'] || row['uuid'] || row['id'] || 're-row';
  return `${String(baseKey)}-${index}`;
}

export default function RuleEngineTable<T extends Record<string, unknown>>(
  props: MasterTableProps<T>
) {
  return (
    <MasterTable<T>
      {...props}
      getRowKey={props.getRowKey ?? resolveRowKey}
    />
  );
}
