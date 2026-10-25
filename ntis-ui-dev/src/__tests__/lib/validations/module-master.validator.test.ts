import { describe, expect, it } from 'vitest';
import {
  validateModuleMaster,
  normalizeModuleData,
  validateModuleMasterDto,
} from '@/lib/api/configuration-settings/module-master/module-master.validator';
import * as CONST from '@/lib/api/configuration-settings/module-master/module-master.constants';

describe('module-master.validator', () => {
  describe('validateModuleMaster', () => {
    it('returns no errors for valid module data', () => {
      const errors = validateModuleMaster({
        departmentId: 1,
        moduleCode: 'MODULE_001',
        moduleName: 'Module Master',
        moduleNameLocal: 'Module Master',
        moduleIcon: 'layers',
        moduleLabel: 'Module',
        moduleDescription: 'Module master configuration',
        isActive: true,
      });

      expect(errors).toEqual({});
    });

    it('validates required departmentId', () => {
      const errors = validateModuleMaster({
        departmentId: 0,
        moduleCode: 'MOD',
        moduleName: 'Module',
        moduleNameLocal: '',
        moduleIcon: '',
        moduleLabel: '',
        moduleDescription: '',
        isActive: true,
      });

      expect(errors.departmentId).toBe('departmentIdRequired');
    });

    it('validates required moduleCode', () => {
      const errors = validateModuleMaster({
        departmentId: 1,
        moduleCode: '',
        moduleName: 'Module',
        moduleNameLocal: '',
        moduleIcon: '',
        moduleLabel: '',
        moduleDescription: '',
        isActive: true,
      });

      expect(errors.moduleCode).toBe('moduleCodeRequired');
    });

    it('validates moduleCode max length', () => {
      const errors = validateModuleMaster({
        departmentId: 1,
        moduleCode: 'A'.repeat(CONST.MODULE_CODE_MAX + 1),
        moduleName: 'Module',
        moduleNameLocal: '',
        moduleIcon: '',
        moduleLabel: '',
        moduleDescription: '',
        isActive: true,
      });

      expect(errors.moduleCode).toBe('moduleCodeLength');
    });

    it('validates moduleCode format and allows underscore', () => {
      const validErrors = validateModuleMaster({
        departmentId: 1,
        moduleCode: 'MODULE_001',
        moduleName: 'Module',
        moduleNameLocal: '',
        moduleIcon: '',
        moduleLabel: '',
        moduleDescription: '',
        isActive: true,
      });

      expect(validErrors.moduleCode).toBeUndefined();

      const invalidErrors = validateModuleMaster({
        departmentId: 1,
        moduleCode: 'MODULE-001',
        moduleName: 'Module',
        moduleNameLocal: '',
        moduleIcon: '',
        moduleLabel: '',
        moduleDescription: '',
        isActive: true,
      });

      expect(invalidErrors.moduleCode).toBe('moduleCodeFormat');
    });

    it('validates required moduleName', () => {
      const errors = validateModuleMaster({
        departmentId: 1,
        moduleCode: 'MOD',
        moduleName: '',
        moduleNameLocal: '',
        moduleIcon: '',
        moduleLabel: '',
        moduleDescription: '',
        isActive: true,
      });

      expect(errors.moduleName).toBe('moduleNameRequired');
    });

    it('validates max lengths for optional fields', () => {
      const errors = validateModuleMaster({
        departmentId: 1,
        moduleCode: 'MOD',
        moduleName: 'A'.repeat(CONST.MODULE_NAME_MAX + 1),
        moduleNameLocal: 'A'.repeat(CONST.MODULE_NAME_LOCAL_MAX + 1),
        moduleIcon: 'A'.repeat(CONST.MODULE_ICON_MAX + 1),
        moduleLabel: 'A'.repeat(CONST.MODULE_LABEL_MAX + 1),
        moduleDescription: 'A'.repeat(CONST.MODULE_DESCRIPTION_MAX + 1),
        isActive: true,
      });

      expect(errors.moduleName).toBe('moduleNameLength');
      expect(errors.moduleNameLocal).toBe('moduleNameLocalLength');
      expect(errors.moduleIcon).toBe('moduleIconLength');
      expect(errors.moduleLabel).toBe('moduleLabelLength');
      expect(errors.moduleDescription).toBe('moduleDescriptionLength');
    });
  });

  describe('normalizeModuleData', () => {
    it('normalizes moduleCode by trimming, uppercasing, keeping underscore, and removing invalid characters', () => {
      const result = normalizeModuleData({
        departmentId: 1,
        moduleCode: ' mod_01-test@ ',
        moduleName: 'Module',
      });

      expect(result.moduleCode).toBe('MOD_01TEST');
    });

    it('truncates moduleCode to max length', () => {
      const result = normalizeModuleData({
        departmentId: 1,
        moduleCode: 'A'.repeat(CONST.MODULE_CODE_MAX + 10),
        moduleName: 'Module',
      });

      expect(result.moduleCode).toHaveLength(CONST.MODULE_CODE_MAX);
    });

    it('sanitizes moduleName and removes numbers/special characters', () => {
      const result = normalizeModuleData({
        departmentId: 1,
        moduleCode: 'MOD',
        moduleName: ' Module 123 @ Master! ',
      });

      expect(result.moduleName).toBe('Module   Master');
    });

    it('truncates moduleName to max length', () => {
      const result = normalizeModuleData({
        departmentId: 1,
        moduleCode: 'MOD',
        moduleName: 'A'.repeat(CONST.MODULE_NAME_MAX + 10),
      });

      expect(result.moduleName).toHaveLength(CONST.MODULE_NAME_MAX);
    });

    it('sanitizes moduleNameLocal and keeps letters, spaces, underscore, and hyphen', () => {
      const result = normalizeModuleData({
        departmentId: 1,
        moduleCode: 'MOD',
        moduleName: 'Module',
        moduleNameLocal: ' Local_Name-Test@123 ',
      });

      expect(result.moduleNameLocal).toBe('Local_Name-Test');
    });

    it('truncates optional text fields to configured max lengths', () => {
      const result = normalizeModuleData({
        departmentId: 1,
        moduleCode: 'MOD',
        moduleName: 'Module',
        moduleNameLocal: 'A'.repeat(CONST.MODULE_NAME_LOCAL_MAX + 10),
        moduleIcon: 'A'.repeat(CONST.MODULE_ICON_MAX + 10),
        moduleLabel: 'A'.repeat(CONST.MODULE_LABEL_MAX + 10),
        moduleDescription: 'A'.repeat(CONST.MODULE_DESCRIPTION_MAX + 10),
      });

      expect(result.moduleNameLocal).toHaveLength(CONST.MODULE_NAME_LOCAL_MAX);
      expect(result.moduleIcon).toHaveLength(CONST.MODULE_ICON_MAX);
      expect(result.moduleLabel).toHaveLength(CONST.MODULE_LABEL_MAX);
      expect(result.moduleDescription).toHaveLength(CONST.MODULE_DESCRIPTION_MAX);
    });

    it('normalizes isActive using parseBoolean behavior', () => {
      expect(
        normalizeModuleData({
          departmentId: 1,
          moduleCode: 'MOD',
          moduleName: 'Module',
          isActive: true,
        }).isActive
      ).toBe(true);

      expect(
        normalizeModuleData({
          departmentId: 1,
          moduleCode: 'MOD',
          moduleName: 'Module',
          isActive: false,
        }).isActive
      ).toBe(false);

      expect(
        normalizeModuleData({
          departmentId: 1,
          moduleCode: 'MOD',
          moduleName: 'Module',
          isActive: 'true' as unknown as boolean,
        }).isActive
      ).toBe(true);

      expect(
        normalizeModuleData({
          departmentId: 1,
          moduleCode: 'MOD',
          moduleName: 'Module',
          isActive: 'false' as unknown as boolean,
        }).isActive
      ).toBe(false);

      expect(
        normalizeModuleData({
          departmentId: 1,
          moduleCode: 'MOD',
          moduleName: 'Module',
          isActive: 1 as unknown as boolean,
        }).isActive
      ).toBe(true);

      expect(
        normalizeModuleData({
          departmentId: 1,
          moduleCode: 'MOD',
          moduleName: 'Module',
          isActive: 0 as unknown as boolean,
        }).isActive
      ).toBe(false);
    });

    it('defaults missing isActive to true', () => {
      const result = normalizeModuleData({
        departmentId: 1,
        moduleCode: 'MOD',
        moduleName: 'Module',
      });

      expect(result.isActive).toBe(true);
    });
  });

  describe('validateModuleMasterDto', () => {
    it('returns first validation error by priority order', () => {
      const error = validateModuleMasterDto({
        departmentId: 0,
        moduleCode: '',
        moduleName: '',
      });

      expect(error).toBe('departmentIdRequired');
    });

    it('returns null for valid normalized DTO data', () => {
      const error = validateModuleMasterDto({
        departmentId: 1,
        moduleCode: 'module_001',
        moduleName: 'Module Master',
        isActive: true,
      });

      expect(error).toBeNull();
    });
  });
});
