'use client';

import { Info, Save, RotateCcw, Search } from 'lucide-react';
import { Label } from '@/components/common/label';
import { Select } from '@/components/common/select';
import { Card } from '@/components/common/Card';
import { RoleMasterData, DepartmentMasterData } from '@/types/screen-access.types';

interface RolePermissionHeaderProps {
  selectedDept: string;
  departments: DepartmentMasterData[];
  onDeptChange: (val: string) => void;
  selectedRole: string;
  roles: RoleMasterData[];
  pendingCount: number;
  isSaving: boolean;
  onRoleChange: (val: string) => void;
  onSave: () => void;
  onCancel: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  translations: {
    selectDept: string;
    selectRole: string;
    searchPlaceholder: string;
    pendingChanges: string;
    saveChanges: string;
    cancelChanges: string;
  };
}

export function RolePermissionHeader({
  selectedDept,
  departments,
  onDeptChange,
  selectedRole,
  roles,
  pendingCount,
  isSaving,
  onRoleChange,
  onSave,
  onCancel,
  searchTerm,
  onSearchChange,
  translations,
}: RolePermissionHeaderProps) {
  return (
    <Card className="p-6 mb-6 border-none shadow-sm flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-6">
        {/* Select Department */}
        <div className="space-y-1.5 min-w-[240px]">
          <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {translations.selectDept}
          </Label>
          <Select
            value={selectedDept}
            onChange={(_, val) => onDeptChange(val)}
            options={departments
              .filter((d) => (d as { isActive?: boolean }).isActive !== false)
              .map((d) => ({
                value: String(d.departmentMasterId ?? d.departmentId),
                label: d.departmentName,
              }))}
            ariaLabel={translations.selectDept}
            className="h-10 border-gray-200"
          />
        </div>

        {/* Select Role */}
        <div className="space-y-1.5 min-w-[240px]">
          <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {translations.selectRole}
          </Label>
          <Select
            value={selectedRole}
            onChange={(_, val) => onRoleChange(val)}
            options={roles
              .filter((r) => r.isActive !== false)
              .map((r) => ({ value: String(r.roleMasterId), label: r.roleName }))}
            ariaLabel={translations.selectRole}
            className="h-10 border-gray-200"
            disabled={!selectedDept || roles.length === 0}
          />
        </div>

        {/* Search Screens */}
        <div className="space-y-1.5 min-w-[280px]">
          <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {translations.searchPlaceholder}
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={translations.searchPlaceholder}
              className="w-full h-10 pl-9 pr-4 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all text-gray-800"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-sm font-medium animate-in fade-in slide-in-from-top-1">
            <Info className="w-4 h-4" />
            {translations.pendingChanges}
          </div>
        )}
        {pendingCount > 0 && (
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="h-10 px-6 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-md flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {translations.cancelChanges}
          </button>
        )}
        <button
          onClick={onSave}
          disabled={pendingCount === 0 || isSaving}
          className={`h-10 px-8 bg-indigo-700 hover:bg-indigo-800 text-white rounded-md shadow-lg shadow-indigo-500/20 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isSaving ? 'cursor-wait' : ''
          }`}
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {translations.saveChanges}
        </button>
      </div>
    </Card>
  );
}
