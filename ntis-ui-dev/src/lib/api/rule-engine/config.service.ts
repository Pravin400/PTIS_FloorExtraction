/**
 * Rule Engine Config Service — Barrel Re-export
 *
 * Each module is responsible for one concern:
 *   mappers.ts              — pure field-type + response-mapping functions
 *   operators.service.ts    — getRuleOperators, getOperatorsForDataType
 *   reference.service.ts    — getScopes, getCorporations, getEffectTypes, getRateSections
 *   field-config.service.ts — getFieldConfigurations
 *   dynamic-options.service.ts — getDynamicFieldOptions
 */

export { mapFieldTypeToDataType, mapInputType, mapSourceType, mapApiResponseWithMapping, mapApiResponseToOptions } from './mappers';
export { getRuleOperators, getOperatorsForDataType } from './operators.service';
export { getScopes, getCorporations, getEffectTypes, getEffectTypeConfigs, getRateSections, getRuleCategories } from './reference.service';
export { getFieldConfigurations, createRuleField, updateRuleField, deleteRuleField } from './field-config.service';
export { getDynamicFieldOptions } from './dynamic-options.service';
