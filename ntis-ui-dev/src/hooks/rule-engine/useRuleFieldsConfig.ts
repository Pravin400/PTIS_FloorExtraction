import React from 'react';
import { FieldConfig } from '@/types/rule-engine';

interface UseRuleFieldsConfigProps {
  ruleScopeId: number;
  initialFields: FieldConfig[];
  onFetchFields: (scopeId: number) => Promise<FieldConfig[]>;
}

export function useRuleFieldsConfig({
  ruleScopeId,
  initialFields,
  onFetchFields,
}: UseRuleFieldsConfigProps) {
  const [fields, setFields] = React.useState<FieldConfig[]>(initialFields);

  const initialScopeIdRef = React.useRef(ruleScopeId);
  const isFirstMountRef = React.useRef(true);
  const fieldsLengthRef = React.useRef(initialFields.length);

  const fetchRef = React.useRef(onFetchFields);

  React.useLayoutEffect(() => {
    fetchRef.current = onFetchFields;
    fieldsLengthRef.current = fields.length;
  });

  React.useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      if (ruleScopeId === initialScopeIdRef.current && fieldsLengthRef.current > 0) {
        return;
      }
    }

    if (!ruleScopeId) return;

    let active = true;
    fetchRef.current(ruleScopeId).then((list) => {
      if (active) setFields(list);
    }).catch(() => {
      // Scope fetch failed — keep existing fields
    });
    return () => { active = false; };
  }, [ruleScopeId]);

  return { fields, setFields };
}
