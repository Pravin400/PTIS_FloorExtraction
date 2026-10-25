  /**
   * Config Master Service Registry
   * Adheres to SRP by delegating to domain-specific services.
   * All read operations are cached via React.cache().
   * 
   * NOTE: Wraps domain service calls in ApiResponse for backward compatibility with page.tsx
   */

  import * as categoryApi from './category.service';
  import * as keyApi from './key.service';
  import * as valueApi from './value.service';
  import type { ApiResponse } from '@/types/common.types';
  import { logError } from '@/lib/utils/logger';
  import type { 
    ConfigCategory, 
    ConfigItem, 
    ConfigValueMaster
  } from '@/types/configMaster.types';

  export class ConfigMasterService {
    // Categories
    async getAllCategories(): Promise<ApiResponse<ConfigCategory[]>> {
      try {
        // Parallelize fetching categories and keys (Medium Priority 2 Fix)
        const [categories, keysRes] = await Promise.all([
          categoryApi.getAllCategories(),
          keyApi.getAllConfigKeys(keyApi.BULK_CONFIG_KEYS_PARAMS)
        ]);
        
        // If keys fetch failed, still return categories with default counts
        
        // Don't mutate cached results - create new array with updated counts
        const categoriesWithCounts = categories.map((cat: ConfigCategory) => {
          if (keysRes.success && Array.isArray(keysRes.data)) {
            const allKeys = keysRes.data;
            const catKeys = allKeys.filter((k: ConfigItem) => String(k.categoryId) === String(cat.id));
            return {
              ...cat,
              total: catKeys.length,
              count: catKeys.filter((k: ConfigItem) => k.isEnabled).length,
            };
          }
          // Return category with default counts if keys fetch failed
          return {
            ...cat,
            total: cat.total ?? 0,
            count: cat.count ?? 0,
          };
        });

        return { success: true, data: categoriesWithCounts };
      } catch (err) {
        logError('configMasterService.getAllCategories failed', { error: err instanceof Error ? err : undefined });
        return { success: false, data: [], error: String(err) };
      }
    }

    getCategoryById = categoryApi.getCategoryById;
    createConfigCategory = categoryApi.createCategory;
    updateConfigCategory = categoryApi.updateCategory;
    deleteConfigCategory = categoryApi.deleteCategory;

    // Keys
    async getAllConfigKeys(params?: { 
      categoryId?: string; 
      pageNumber?: number; 
      pageSize?: number 
    }): Promise<ApiResponse<ConfigItem[]>> {
      return keyApi.getAllConfigKeys(params);
    }

    getConfigKeyById = keyApi.getConfigKeyById;

    async getItemsByCategory(categoryId: string): Promise<ApiResponse<ConfigItem[]>> {
      return keyApi.getItemsByCategory(categoryId);
    }

    createConfigKey = keyApi.createConfigKey;
    updateConfigKey = keyApi.updateConfigKey;
    deleteConfigKey = keyApi.deleteConfigKey;

    // Values
    async getAllConfigValuesFull(configKeyId: number): Promise<ApiResponse<ConfigValueMaster[]>> {
      return valueApi.getAllConfigValuesFull(configKeyId);
    }

    getConfigValueById = valueApi.getConfigValueById;
    
    createConfigValue = valueApi.createConfigValue;
    updateConfigValue = valueApi.updateConfigValue;
    deleteConfigValue = valueApi.deleteConfigValue;
  }

  export const configMasterService = new ConfigMasterService();
