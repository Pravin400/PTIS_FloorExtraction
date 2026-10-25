'use client';

import { Building2, CheckCircle2 } from 'lucide-react';
import { DepartmentStepProps } from '@/types/user-management';

export function DepartmentStep({ departments, formData, toggleDepartment }: DepartmentStepProps) {
  return (
    <div className="pr-4">
      <div className="grid grid-cols-2 gap-4 pb-4">
        {departments.map((dept) => {
          const deptId = String(dept.id || dept.departmentMasterId);
          const isSelected = formData.departmentIds.includes(deptId);

          return (
            <div
              key={deptId}
              onClick={() => toggleDepartment(deptId)}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 shadow-md ring-1 ring-indigo-500/20'
                  : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700">{dept.departmentName}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    {dept.departmentCode}
                  </p>
                </div>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-200'
                }`}
              >
                {isSelected && <CheckCircle2 className="w-4 h-4" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
