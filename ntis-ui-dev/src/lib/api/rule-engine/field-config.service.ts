import { apiClient } from '@/services/api.service';
import { FieldConfig } from '@/types/rule-engine';
import { getRuleOperators, getOperatorsForDataType } from './operators.service';
import { mapFieldTypeToDataType, mapInputType, mapSourceType } from './mappers';

interface ApiRuleField {
  ruleScopeId: number;
  rulesFieldId: number;
  fieldName: string;
  fieldType: string;
  dataType: string;
  inputType: string;
  hasApiSource: boolean;
  hasStaticValues: boolean;
  isRequired: boolean;
  apiEndpoint?: string;
  apiMethod?: string;
  apiParameters?: string;
  /** JSON string of ApiResponseMapping config — null when not configured */
  apiResponseMapping?: string | null;
  staticValuesJson?: string;
  defaultValue?: string;
  validationRegex?: string;
  minValue: number;
  maxValue: number;
  minLength: number;
  maxLength: number;
  databaseColumnName?: string | null;
  displayOrder: number;
}

/**
 * Fetches fields and dynamic configurations specific to a selected RuleScope.
 * Calls /RuleFields/by-scope/{scopeId} and merges with active operator definitions.
 */
export async function getFieldConfigurations(scopeId: number): Promise<FieldConfig[]> {
  const [fieldsResponse, allOperators] = await Promise.all([
    apiClient.get<ApiRuleField[]>(`/RuleFields/by-scope/${scopeId}`),
    getRuleOperators(),
  ]);

  if (!fieldsResponse.success || !fieldsResponse.data) return [];

  return fieldsResponse.data.map((item) => {
    const dataType  = mapFieldTypeToDataType(item.fieldType, item.dataType);
    const staticJson = item.staticValuesJson;
    const sourceType = mapSourceType(item.hasApiSource, item.hasStaticValues, staticJson);
    const inputType  = mapInputType(item.inputType, dataType, item.hasStaticValues, staticJson);

    return {
      id: item.rulesFieldId,
      fieldId: item.databaseColumnName || item.fieldName,
      fieldName: item.fieldName,
      databaseColumnName: item.databaseColumnName || undefined,
      dataType,
      inputType,
      sourceType,
      staticValuesJson:   staticJson                     || undefined,
      apiEndpoint:        item.apiEndpoint               || undefined,
      apiMethod:          item.apiMethod                 || undefined,
      apiParameters:      item.apiParameters             || undefined,
      apiResponseMapping: item.apiResponseMapping        || undefined,
      isRequired:         !!item.isRequired,
      defaultValue:       item.defaultValue              || undefined,
      validationRegex:    item.validationRegex           || undefined,
      numericMin:         item.minValue ?? undefined,
      numericMax:         item.maxValue ?? undefined,
      textMinLength:      item.minLength ?? undefined,
      textMaxLength:      item.maxLength ?? undefined,
      supportedOperators: getOperatorsForDataType(allOperators, dataType),
      placeholder:        `Select or enter ${item.fieldName}`,
    };
  });
}

/**
 * Creates a new RuleField with configuration.
 */
export async function createRuleField(payload: unknown): Promise<{ success: boolean; message: string; data?: unknown }> {
  const response = await apiClient.post<unknown>('/RuleFields', payload);
  return {
    success: response.success,
    message: response.message || '',
    data: response.data,
  };
}

/**
 * Updates an existing RuleField and configuration.
 */
export async function updateRuleField(id: number, payload: unknown): Promise<{ success: boolean; message: string; data?: unknown }> {
  const response = await apiClient.put<unknown>(`/RuleFields/${id}`, payload);
  return {
    success: response.success,
    message: response.message || '',
    data: response.data,
  };
}

/**
 * Deletes a RuleField by ID.
 */
export async function deleteRuleField(id: number): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete<unknown>(`/RuleFields/${id}`);
  return {
    success: response.success,
    message: response.message || '',
  };
}
