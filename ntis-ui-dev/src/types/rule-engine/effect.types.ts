export interface EffectTypeConfig {
  effectTypeId: number;
  effectType: string;
  dataType: string;
  inputType: string;
  hasApiSource: boolean;
  apiEndpoint: string | null;
  apiMethod: string | null;
  apiParameters: string | null;
  staticApiEndpoint?: string | null;
  staticApiInputType?: string | null;
  staticApiMethod?: string | null;
  staticApiParamter?: string | null;
  staticApiResponseMapping?: string | null;
  hasStaticValues: boolean;
  staticValuesJson: string | null;
  isRequired: boolean;
  defaultValue: string | null;
  validationRegex: string | null;
  minValue: number | null;
  maxValue: number | null;
  minLength: number | null;
  maxLength: number | null;
  expressionTemplate: string | null;
}

export interface EffectState {
  effectType: string;
  value: number | string;
  isPercentage: boolean;
  multiplierField?: string;
  overrideRate?: number | string;
  overrideRateLabel?: string;
  parameterCode?: string;
}

export interface DryRunEffect {
  effectType?: string;
  effectValue?: string | number;
  parameterCode?: string;
  computedValue?: string | number;
}
