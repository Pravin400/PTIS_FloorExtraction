'use client';
/* eslint-disable i18next/no-literal-string */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import type {
  RetrospectiveRule,
  CreateRetrospectiveRuleInput,
  EvidenceCategory,
  RuleStatus,
} from '@/types/retrospective-rule.types';
import { SaveButton, CancelButton } from '@/components/common';

interface RetrospectiveRuleModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  rule: RetrospectiveRule | null;
  errors: Record<string, string>;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (input: CreateRetrospectiveRuleInput) => Promise<boolean>;
}

export const RetrospectiveRuleModal: React.FC<RetrospectiveRuleModalProps> = ({
  isOpen,
  mode,
  rule,
  errors,
  isSubmitting,
  onClose,
  onSave,
}) => {
  const getInitialFormData = (): CreateRetrospectiveRuleInput => {
    if (rule && (mode === 'edit' || mode === 'view')) {
      return {
        ruleCode: rule.ruleCode,
        ruleTitle: rule.ruleTitle,
        conditionDescription: rule.conditionDescription,
        evidenceCategory: rule.evidenceCategory,
        startLogicTitle: rule.startLogicTitle,
        startLogicBoundary: rule.startLogicBoundary,
        commonTaxationBadge: rule.commonTaxationBadge,
        commonTaxationDescription: rule.commonTaxationDescription,
        unauthorizedPenalty: rule.unauthorizedPenalty,
        status: rule.status,
      };
    }
    return {
      ruleCode: `FUR-0${Math.floor(Math.random() * 90 + 10)}`,
      ruleTitle: '',
      conditionDescription: '',
      evidenceCategory: 'Authorized: OC or CC available',
      startLogicTitle: 'Rolling 6-year boundary',
      startLogicBoundary: 'Boundary: 6 years',
      commonTaxationBadge: 'Current-year for all years',
      commonTaxationDescription: 'Current-year percentage for all years',
      unauthorizedPenalty: 'Not applicable — OC/CC available',
      status: 'Active',
    };
  };

  const [formData, setFormData] = useState<CreateRetrospectiveRuleInput>(getInitialFormData);
  const [prevRuleId, setPrevRuleId] = useState<string | undefined>(rule?.id);

  if (rule?.id !== prevRuleId) {
    setPrevRuleId(rule?.id);
    setFormData(getInitialFormData());
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') {
      onClose();
      return;
    }
    await onSave(formData);
  };

  const isReadOnly = mode === 'view';

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'create' && 'Create Retrospective Rule'}
              {mode === 'edit' && 'Edit Retrospective Rule'}
              {mode === 'view' && 'Retrospective Rule Details'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isReadOnly
                ? 'Inspect source wording and policy boundaries.'
                : 'Configure decision parameters and boundary logic.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rule Title */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Rule Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={formData.ruleTitle}
                onChange={(e) => setFormData({ ...formData, ruleTitle: e.target.value })}
                placeholder="e.g. OC older than six years"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#6B1F38]/20 focus:border-[#6B1F38] disabled:bg-gray-50"
              />
              {errors.ruleTitle && (
                <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.ruleTitle}</p>
              )}
            </div>

            {/* Rule Code */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Rule Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={formData.ruleCode}
                onChange={(e) => setFormData({ ...formData, ruleCode: e.target.value })}
                placeholder="e.g. FUR-01"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#6B1F38]/20 focus:border-[#6B1F38] disabled:bg-gray-50"
              />
              {errors.ruleCode && (
                <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.ruleCode}</p>
              )}
            </div>
          </div>

          {/* Condition Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Condition Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              disabled={isReadOnly}
              value={formData.conditionDescription}
              onChange={(e) => setFormData({ ...formData, conditionDescription: e.target.value })}
              placeholder="e.g. Only OC is available and the OC date is before 6 year from the current date"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#6B1F38]/20 focus:border-[#6B1F38] disabled:bg-gray-50"
            />
            {errors.conditionDescription && (
              <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.conditionDescription}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Evidence Category */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Evidence Category
              </label>
              <select
                disabled={isReadOnly}
                value={formData.evidenceCategory}
                onChange={(e) => setFormData({ ...formData, evidenceCategory: e.target.value as EvidenceCategory })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#6B1F38]/20 focus:border-[#6B1F38] disabled:bg-gray-50"
              >
                <option value="Authorized: OC or CC available">Authorized: OC or CC available</option>
                <option value="Unauthorized: OC & CC unavailable">Unauthorized: OC & CC unavailable</option>
                <option value="Partial Evidence">Partial Evidence</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Rule Status <span className="text-rose-500">*</span>
              </label>
              <select
                disabled={isReadOnly}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as RuleStatus })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#6B1F38]/20 focus:border-[#6B1F38] disabled:bg-gray-50"
              >
                <option value="Active">Active</option>
                <option value="Review">Review</option>
                <option value="Draft">Draft</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Logic Title */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Start Logic Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={formData.startLogicTitle}
                onChange={(e) => setFormData({ ...formData, startLogicTitle: e.target.value })}
                placeholder="e.g. Rolling 6-year boundary"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#6B1F38]/20 focus:border-[#6B1F38] disabled:bg-gray-50"
              />
            </div>

            {/* Start Logic Boundary */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Boundary Info
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={formData.startLogicBoundary}
                onChange={(e) => setFormData({ ...formData, startLogicBoundary: e.target.value })}
                placeholder="e.g. Boundary: 6 years"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#6B1F38]/20 focus:border-[#6B1F38] disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Unauthorized Penalty */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Unauthorized Penalty
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={formData.unauthorizedPenalty}
              onChange={(e) => setFormData({ ...formData, unauthorizedPenalty: e.target.value })}
              placeholder="e.g. Not applicable — OC/CC available"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#6B1F38]/20 focus:border-[#6B1F38] disabled:bg-gray-50"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <CancelButton
              onClick={onClose}
              label={isReadOnly ? 'Close' : 'Cancel'}
            />
            {!isReadOnly && (
              <SaveButton
                type="submit"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                label={isSubmitting ? 'Saving...' : 'Save Rule'}
                className="bg-[#6B1F38] hover:bg-[#58182D] text-white"
              />
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
