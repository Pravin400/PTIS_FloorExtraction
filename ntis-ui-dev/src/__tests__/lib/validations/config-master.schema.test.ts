import { describe, it, expect } from 'vitest';
import { CreateConfigKeySchema, CreateConfigCategorySchema } from '@/lib/validations/config-master.schema';

describe('CreateConfigCategorySchema Validations', () => {
  it('validates a valid category', () => {
    const data = {
      categoryCode: 'SYS_CONF',
      categoryName: 'System Configurations',
      displayOrder: 1,
      isActive: true,
    };
    const result = CreateConfigCategorySchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects short category code and name', () => {
    const data = {
      categoryCode: 'SY',
      categoryName: 'Sy',
      displayOrder: 1,
      isActive: true,
    };
    const result = CreateConfigCategorySchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.categoryCode?.[0]).toContain('at least 3 characters');
      expect(errors.categoryName?.[0]).toContain('at least 3 characters');
    }
  });

  it('rejects negative display order', () => {
    const data = {
      categoryCode: 'SYS_CONF',
      categoryName: 'System Configurations',
      displayOrder: -1,
      isActive: true,
    };
    const result = CreateConfigCategorySchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.displayOrder?.[0]).toContain('cannot be negative');
    }
  });

  it('rejects display order exceeding 99999', () => {
    const data = {
      categoryCode: 'SYS_CONF',
      categoryName: 'System Configurations',
      displayOrder: 100000,
      isActive: true,
    };
    const result = CreateConfigCategorySchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.displayOrder?.[0]).toContain('cannot exceed 99999');
    }
  });
});

describe('CreateConfigKeySchema Validations', () => {
  const baseData = {
    categoryId: 1,
    configCode: 'MAX_ATTEMPTS',
    configName: 'Maximum Login Attempts',
    description: 'Number of permitted login attempts',
    dataType: 'int',
    controlType: 'number',
    defaultValue: '5',
    isActive: true,
  };

  it('validates a valid config key with integer datatype', () => {
    const result = CreateConfigKeySchema.safeParse(baseData);
    expect(result.success).toBe(true);
  });

  it('rejects negative integer as default value', () => {
    const result = CreateConfigKeySchema.safeParse({
      ...baseData,
      defaultValue: '-5',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.defaultValue?.[0]).toContain('must be a valid positive integer');
    }
  });

  it('rejects integer default value exceeding 32-bit bounds', () => {
    const result = CreateConfigKeySchema.safeParse({
      ...baseData,
      defaultValue: '999999999999',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.defaultValue?.[0]).toContain('must not exceed 2147483647');
    }
  });

  it('rejects decimal value for integer datatype', () => {
    const result = CreateConfigKeySchema.safeParse({
      ...baseData,
      defaultValue: '5.5',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.defaultValue?.[0]).toContain('must be a valid positive integer');
    }
  });

  it('validates a valid decimal datatype', () => {
    const result = CreateConfigKeySchema.safeParse({
      ...baseData,
      dataType: 'decimal',
      controlType: 'number',
      defaultValue: '12.34',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative decimal value', () => {
    const result = CreateConfigKeySchema.safeParse({
      ...baseData,
      dataType: 'decimal',
      controlType: 'number',
      defaultValue: '-0.45',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.defaultValue?.[0]).toContain('must be a valid positive decimal number');
    }
  });

  it('rejects non-numeric default value for decimal datatype', () => {
    const result = CreateConfigKeySchema.safeParse({
      ...baseData,
      dataType: 'decimal',
      controlType: 'number',
      defaultValue: '12.34.56',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.defaultValue?.[0]).toContain('must be a valid positive decimal number');
    }
  });

  it('validates a valid boolean datatype', () => {
    const result = CreateConfigKeySchema.safeParse({
      ...baseData,
      dataType: 'boolean',
      controlType: 'checkbox',
      defaultValue: 'true',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid boolean value', () => {
    const result = CreateConfigKeySchema.safeParse({
      ...baseData,
      dataType: 'boolean',
      controlType: 'checkbox',
      defaultValue: 'maybe',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.defaultValue?.[0]).toContain("must be 'true' or 'false'");
    }
  });

  it('validates a valid datetime datatype', () => {
    const result = CreateConfigKeySchema.safeParse({
      ...baseData,
      dataType: 'datetime',
      controlType: 'calendar',
      defaultValue: '2026-05-23T14:04',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid datetime format', () => {
    const result = CreateConfigKeySchema.safeParse({
      ...baseData,
      dataType: 'datetime',
      controlType: 'calendar',
      defaultValue: 'invalid-date-string',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.defaultValue?.[0]).toContain('must be a valid date and time');
    }
  });

  it('rejects HTML tags and angle brackets in description', () => {
    const result = CreateConfigKeySchema.safeParse({
      ...baseData,
      description: 'Permitted login attempts <script>alert("hack")</script>',
    });
    expect(result.success).toBe(false);
  });

  it('accepts special characters without angle brackets in description', () => {
    const result = CreateConfigKeySchema.safeParse({
      ...baseData,
      description: 'Permitted login attempts &!@#$%^&*()_+~`|}{[]:;?,./',
    });
    expect(result.success).toBe(true);
  });

  it('rejects description exceeding 255 characters', () => {
    const result = CreateConfigKeySchema.safeParse({
      ...baseData,
      description: 'a'.repeat(256),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.description?.[0]).toContain('cannot exceed 255 characters');
    }
  });
});
