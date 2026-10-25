import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRules, getRuleById, createRule, updateRule, deleteRule } from '@/lib/api/rule-engine/rule.service';
import { apiClient } from '@/services/api.service';
import { RuleItem } from '@/types/rule-engine';

// Mock the apiClient
vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Rule Service API Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const mockRuleItem: RuleItem = {
    id: 101,
    ruleCode: 'PT_RE_001',
    ruleName: 'Test Rule',
    ruleScopeId: 1,
    isActive: true,
    conditionsJson: '{"id":"cond-1","logicalOperator":"AND","conditions":[],"groups":[]}',
    effectJson: '{"effectType":"Decrease %","value":10,"isPercentage":true}',
    targetFiltersJson: '{"propertyTypes":[]}',
    description: 'A mock rule description',
    ruleCategory: 'TAX',
  };

  describe('getRules', () => {
    it('should fetch paginated rules successfully', async () => {
      const mockBackendResponse = {
        success: true,
        data: {
          items: [
            {
              id: 101,
              ruleCode: 'PT_RE_001',
              ruleName: 'Test Rule',
              ruleScopeId: 1,
              isEnabled: true,
              conditionsJson: '{"id":"cond-1","logicalOperator":"AND","conditions":[],"groups":[]}',
              effectJson: '{"effectType":"Decrease %","value":10,"isPercentage":true}',
              targetFiltersJson: '{"propertyTypes":[]}',
              description: 'A mock rule description',
              ruleCategory: 'TAX',
              createdDate: '2026-05-29T10:00:00Z',
              updatedDate: '2026-05-29T11:00:00Z',
            },
          ],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockBackendResponse);

      const result = await getRules(1, 10, 'Test', undefined, 1);

      expect(apiClient.get).toHaveBeenCalledWith('/RuleEngine?PageNumber=1&PageSize=10&SearchTerm=Test&RuleScopeId=1');
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        id: 101,
        ruleCode: 'PT_RE_001',
        ruleName: 'Test Rule',
        ruleScopeId: 1,
        isActive: true,
        conditionsJson: '{"id":"cond-1","logicalOperator":"AND","conditions":[],"groups":[]}',
        effectJson: '{"effectType":"Decrease %","value":10,"isPercentage":true}',
        targetFiltersJson: '{"propertyTypes":[]}',
        description: 'A mock rule description',
        ruleCategory: 'TAX',
        createdDate: '2026-05-29T10:00:00Z',
        updatedDate: '2026-05-29T11:00:00Z',
      });
    });

    it('should return empty result structure when backend response fails', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ success: false, error: 'Network Error' });

      const result = await getRules(1, 10);

      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('getRuleById', () => {
    it('should return visual RuleItem for valid ID', async () => {
      const mockBackendResponse = {
        success: true,
        data: {
          id: 101,
          ruleCode: 'PT_RE_001',
          ruleName: 'Test Rule',
          ruleScopeId: 1,
          isEnabled: true,
          conditionsJson: '{"id":"cond-1"}',
          effectJson: '{"effectType":"Decrease %"}',
          targetFiltersJson: '{}',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockBackendResponse);

      const result = await getRuleById(101);

      expect(apiClient.get).toHaveBeenCalledWith('/RuleEngine/101');
      expect(result).not.toBeNull();
      expect(result?.id).toBe(101);
      expect(result?.isActive).toBe(true);
    });

    it('should return null when API call fails', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ success: false });

      const result = await getRuleById(999);

      expect(result).toBeNull();
    });
  });

  describe('createRule', () => {
    it('should send payload without ruleJson and return mapped result', async () => {
      const mockBackendResponse = {
        success: true,
        data: {
          data: {
            id: 102,
            ruleCode: 'PT_RE_002',
            ruleName: 'Created Rule',
            ruleScopeId: 1,
            isEnabled: true,
            conditionsJson: '{}',
            effectJson: '{}',
            targetFiltersJson: '{}',
          },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockBackendResponse);

      const result = await createRule(mockRuleItem, 42);

      expect(apiClient.post).toHaveBeenCalledWith('/RuleEngine', {
        ruleCode: 'PT_RE_001',
        ruleName: 'Test Rule',
        description: 'A mock rule description',
        ruleScopeId: 1,
        propertyRuleEvaluationMasterId: 0,
        ruleCategory: 'TAX',
        conditionsJson: '{"id":"cond-1","logicalOperator":"AND","conditions":[],"groups":[]}',
        effectJson: '{"effectType":"Decrease %","value":10,"isPercentage":true}',
        targetFiltersJson: '{"propertyTypes":[]}',
        isEnabled: true,
        changeReason: undefined,
        isActive: true,
        createdBy: 42,
        updatedBy: 42,
        priority: undefined,
        stopProcessing: undefined,
        skipRuleIds: undefined,
        exclusionReason: undefined,
      });
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(102);
    });
  });

  describe('updateRule', () => {
    it('should call PUT and update record', async () => {
      const mockBackendResponse = {
        success: true,
        data: {
          id: 101,
          ruleCode: 'PT_RE_001',
          ruleName: 'Test Rule Updated',
          ruleScopeId: 1,
          isEnabled: true,
          conditionsJson: '{}',
          effectJson: '{}',
          targetFiltersJson: '{}',
        },
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockBackendResponse);

      const result = await updateRule(101, mockRuleItem, 42);

      expect(apiClient.put).toHaveBeenCalledWith('/RuleEngine/101', expect.any(Object));
      expect(result.success).toBe(true);
    });
  });

  describe('deleteRule', () => {
    it('should successfully request DELETE', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ success: true });

      const result = await deleteRule(101);

      expect(apiClient.delete).toHaveBeenCalledWith('/RuleEngine/101');
      expect(result.success).toBe(true);
    });
  });
});
