/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { useToast } from "@/components/common";
import { useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BulkUpdateMaster,
  FieldRegistrySchema,
  FieldRegistryTable,
  SourceTableField,
  CommonDetailsUpdateActions,
  BulkUpdateDefinitionPayload
} from "@/types/common-details-update/common-details-update.types";
import {
  addBulkUpdateDefinitionAction,
  getSourceTablesAction,
  getSourceTableFieldsAction
} from "@/app/[locale]/property-tax/common-details-update/actions";

interface FieldConfigForm {
  fieldName: string[];
  displayName: string;
  controlType: string;
  dataType: string;
  placeholder: string;
  isRequired: boolean;
  maxLength: string;
  validationRegex: string;
}

export const useFieldRegistryForm = (
  _fields: BulkUpdateMaster[],
  refreshFieldsList: () => Promise<void>,
  initialSchemas: FieldRegistrySchema[] = [],
  initialSourceTables: FieldRegistryTable[] = [],
  initialSourceTableFields: SourceTableField[] = [],
  actions?: CommonDetailsUpdateActions
) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const t = useTranslations("commonDetailsUpdate");
  const toast = useToast();

  const [sourceModule, setSourceModuleState] = useState(searchParams.get("sourceModule") || "");
  const [sourceTable, setSourceTableState] = useState(searchParams.get("sourceTable") || "");

  const [updateCode, setUpdateCode] = useState("");
  const [displaySequence, setDisplaySequence] = useState("");
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("");
  const [approvalRequired, setApprovalRequired] = useState(false);

  const [fieldConfigs, setFieldConfigs] = useState<FieldConfigForm[]>([
    {
      fieldName: [],
      displayName: "",
      controlType: "",
      dataType: "",
      placeholder: "",
      isRequired: false,
      maxLength: "",
      validationRegex: "",
    }
  ]);

  const [tables, setTables] = useState<FieldRegistryTable[]>(initialSourceTables);
  const [sourceTableFields, setSourceTableFields] = useState<SourceTableField[]>(initialSourceTableFields);

  useEffect(() => {
    setSourceTableFields(initialSourceTableFields);
  }, [initialSourceTableFields]);

  useEffect(() => {
    let isMounted = true;
    const fetchTables = actions?.getSourceTablesAction || getSourceTablesAction;
    if (fetchTables) {
      fetchTables().then((res) => {
        if (isMounted && res?.success && res?.data) {
          setTables(res.data as FieldRegistryTable[]);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [actions?.getSourceTablesAction]);

  useEffect(() => {
    let isMounted = true;
    if (sourceTable) {
      const fetchFields = actions?.getSourceTableFieldsAction || getSourceTableFieldsAction;
      if (fetchFields) {
        fetchFields(Number(sourceTable)).then((res) => {
          if (isMounted && res?.success && res?.data) {
            setSourceTableFields(res.data as SourceTableField[]);
          }
        });
      }
    } else {
      setSourceTableFields([]);
    }
    return () => {
      isMounted = false;
    };
  }, [sourceTable, actions?.getSourceTableFieldsAction]);

  const [loadingTables] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const schemas = initialSchemas;
  const loadingSchemas = false;

  const setSourceModule = (val: string) => {
    setSourceModuleState(val);
    setSourceTableState("");
    setFieldConfigs(prev => prev.map(config => ({ ...config, fieldName: [], isRequired: false })));
    
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (val) params.set("sourceModule", val); else params.delete("sourceModule");
      params.delete("sourceTable");
      window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    }
  };

  const setSourceTable = (val: string) => {
    if (val === sourceTable && searchParams.get("sourceTable") === val) return;
    setSourceTableState(val);
    setFieldConfigs(prev => prev.map(config => ({ ...config, fieldName: [], isRequired: false })));
    
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("sourceTable") === val) return;
      if (val) params.set("sourceTable", val); else params.delete("sourceTable");
      window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    }
  };

  const addFieldConfig = () => {
    setFieldConfigs([
      ...fieldConfigs,
      {
        fieldName: [],
        displayName: "",
        controlType: "",        
        dataType: "",
        placeholder: "",
        isRequired: false,
        maxLength: "",
        validationRegex: "",
      }
    ]);
  };

  const updateFieldConfig = (index: number, updates: Partial<FieldConfigForm>) => {
    const newConfigs = [...fieldConfigs];
    newConfigs[index] = { ...newConfigs[index], ...updates };
    setFieldConfigs(newConfigs);
  };

  const deleteFieldConfig = (index: number) => {
    if (fieldConfigs.length > 1) {
      setFieldConfigs(fieldConfigs.filter((_, i) => i !== index));
    }
  };

  const handleAddFieldToRegistry = async () => {
    if (
      !updateCode ||
      !sourceTable 
    ) {
      toast.error(t("messages.fillRequiredMasterFields"));
      return;
    }

    for (const config of fieldConfigs) {
      if (config.fieldName.length === 0) {
        toast.error(t("messages.selectAtLeastOneFieldName"));
        return;
      }
    }

    // Client-side pre-validation for duplicate Group Name
    if (_fields && _fields.length > 0 && updateCode) {
      const normInput = updateCode.trim().toLowerCase();
      const isDuplicate = _fields.some(
        (f) =>
          (f.updateName && f.updateName.trim().toLowerCase() === normInput) ||
          (f.updateCode && f.updateCode.trim().toLowerCase() === normInput)
      );
      if (isDuplicate) {
        toast.error(t("messages.groupAlreadyExists"));
        return;
      }
    }

    setSubmitting(true);
    
    // We need to map fieldName string arrays back to their numeric IDs in sourceTableFields
    const selectedFieldIds: number[] = [];
    for (const config of fieldConfigs) {
      for (const fn of config.fieldName) {
        const foundField = sourceTableFields.find(f => f.tableFieldName === fn);
        if (foundField) {
          selectedFieldIds.push(foundField.id);
        }
      }
    }

    const payload: BulkUpdateDefinitionPayload = {
      updateName: updateCode, // "updateCode" is what the user typed in "Update Name" input
      tableId: Number(sourceTable),
      tableFieldIds: selectedFieldIds,
      isApprovalRequired: approvalRequired,
    };
    
    const res = await addBulkUpdateDefinitionAction(payload);
    if (res.success) {
      toast.success(t("messages.fieldSavedSuccessfully"));
      setSourceModuleState("");
      setSourceTableState("");
      setUpdateCode("");
      setDisplaySequence("");
      setDescription("");
      setIconName("");
      setApprovalRequired(false);
      setFieldConfigs([{
        fieldName: [],
        displayName: "",
        controlType: "",
        dataType: "",
        placeholder: "",
        isRequired: false,
        maxLength: "",
        validationRegex: "",
      }]);
      await refreshFieldsList();
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        params.delete("sourceModule");
        params.delete("sourceTable");
        params.delete("databaseColumn");
        window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
      }
    } else {
      toast.error(res.error || t("messages.saveFailed"));
    }
    setSubmitting(false);
  };

  return {
    sourceModule, setSourceModule,
    sourceTable, setSourceTable,
    updateCode, setUpdateCode,
    displaySequence, setDisplaySequence,
    description, setDescription,
    iconName, setIconName,
    approvalRequired, setApprovalRequired,
    fieldConfigs,
    addFieldConfig,
    updateFieldConfig,
    deleteFieldConfig,
    schemas, tables, sourceTableFields,
    loadingSchemas, loadingTables, submitting,
    handleAddFieldToRegistry,
  };
};
