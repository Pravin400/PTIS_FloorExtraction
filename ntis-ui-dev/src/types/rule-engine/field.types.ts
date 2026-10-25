export type DataType = 'STRING' | 'INTEGER' | 'DECIMAL' | 'DATE' | 'BOOLEAN';

export interface ApiResponseMapping {
  responsePath?: string;
  valuePath: string;
  labelPath: string;
  displayTemplate?: string;
  additionalFields?: Record<string, string>;
}

export type InputType =
  | 'DROPDOWN'
  | 'TEXTBOX'
  | 'DATEPICKER'
  | 'CHECKBOX'
  | 'RADIO'
  | 'MULTISELECT';

export type SourceType = 'STATIC' | 'API' | 'MASTER_TABLE' | 'NONE';

export interface OperatorItem {
  id: number;
  code: string;
  label: string;
  isDefault: boolean;
}

export interface StaticValue {
  value: string;
  label: string;
}

export interface FieldConfig {
  id: number;
  fieldId: string;
  fieldName?: string;
  databaseColumnName?: string;
  dataType: DataType;
  inputType: InputType;
  sourceType: SourceType;
  staticValuesJson?: string;
  apiEndpoint?: string;
  apiMethod?: string;
  apiParameters?: string;
  apiResponseMapping?: string;
  masterTableName?: string;
  valueColumn?: string;
  displayColumn?: string;
  filterColumn?: string;
  filterValue?: string;
  isRequired: boolean;
  supportsNA?: boolean;
  defaultValue?: string;
  validationRegex?: string;
  numericMin?: number;
  numericMax?: number;
  textMinLength?: number;
  textMaxLength?: number;
  placeholder?: string;
  helpText?: string;
  dependsOnFieldId?: string;
  dependencyMapping?: string;
  supportedOperators?: OperatorItem[];
}
