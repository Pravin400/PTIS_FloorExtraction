"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useFieldRegistryState } from "@/hooks/commonDetailsUpdate/useFieldRegistryState";
import { FieldRegistryForm } from "./FieldRegistryForm";
import { FieldRegistryTable } from "./FieldRegistryTable";
import { PagedResponse } from "@/types/common.types";
import { BulkUpdateMaster, FieldRegistrySchema, ActionResult, FieldRegistryTable as FieldRegistryTableType, SourceTableField } from "@/types/common-details-update/common-details-update.types";

interface FieldRegistryProps {
  t: (key: string) => string;
  initialFields?: PagedResponse<BulkUpdateMaster> | BulkUpdateMaster[];
  initialSchemas?: FieldRegistrySchema[];
  initialSourceTables?: FieldRegistryTableType[];
  initialSourceTableFields?: SourceTableField[];
  setFieldRegistryStatusAction?: (updateCode: string, isActive: boolean) => Promise<ActionResult<unknown>>;
  actions?: Record<string, any>;
}

const EMPTY_ARRAY: any[] = [];
const EMPTY_OBJECT = {};

export const FieldRegistry = ({
  t,
  initialFields = EMPTY_ARRAY,
  initialSchemas = EMPTY_ARRAY,
  initialSourceTables = EMPTY_ARRAY,
  initialSourceTableFields = EMPTY_ARRAY,
  actions = EMPTY_OBJECT
}: FieldRegistryProps) => {
  const state = useFieldRegistryState(initialFields, initialSchemas as any, initialSourceTables, initialSourceTableFields, actions);

  return (
    <div className="space-y-2">
      {/* 1. Add Field Config Form Card (Single Responsive Row, Save button in header) */}
      <FieldRegistryForm t={t} state={state} />

      {/* 2. Paginated MasterTable List */}
      <FieldRegistryTable t={t} state={state} />
    </div>
  );
};

export default FieldRegistry;
