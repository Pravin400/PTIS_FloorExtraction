/* eslint-disable i18next/no-literal-string */
'use client';

import React, { useState } from 'react';
import { AssessmentUnit } from '@/types/property-tax/apartment';
import { Modal } from '@/components/common/Modal';
import { Save } from 'lucide-react';

interface PtisUnitEditModalProps {
  unit: AssessmentUnit | null;
  onClose: () => void;
  onSave: (updated: AssessmentUnit) => void;
}

const EditForm: React.FC<{
  initialUnit: AssessmentUnit;
  onClose: () => void;
  onSave: (updated: AssessmentUnit) => void;
}> = ({ initialUnit, onClose, onSave }) => {
  const [formData, setFormData] = useState<AssessmentUnit>(initialUnit);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const footer = (
    <div className="flex items-center justify-end gap-2 w-full">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 rounded-xl text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-100 font-semibold text-xs transition-colors"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="edit-unit-form"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white bg-sky-600 hover:bg-sky-700 font-semibold text-xs shadow-xs transition-colors"
      >
        <Save className="w-3.5 h-3.5" />
        Save Changes
      </button>
    </div>
  );

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Edit Survey Details"
      subtitle={`Property #${formData.propFull ?? formData.prop} (${formData.wgFl})`}
      maxWidth="md"
      footer={footer}
    >
      <form id="edit-unit-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-600 font-semibold mb-1">Carpet Area (CPT sqft)</label>
            <input
              type="number"
              min={0}
              value={formData.cpt}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cpt: Number(e.target.value) || 0,
                  bua: Math.round((Number(e.target.value) || 0) * 1.25),
                  rv: Math.round((Number(e.target.value) || 0) * formData.rate * 0.8),
                  tax: Math.round((Number(e.target.value) || 0) * formData.rate * 2.4),
                })
              }
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono text-zinc-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-600 font-semibold mb-1">Built Up Area (BUA sqft)</label>
            <input
              type="number"
              min={0}
              value={formData.bua}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bua: Number(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono text-zinc-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-600 font-semibold mb-1">Usage Type</label>
            <select
              value={formData.use}
              onChange={(e) => setFormData({ ...formData, use: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Industrial">Industrial</option>
            </select>
          </div>

          <div>
            <label className="block text-zinc-600 font-semibold mb-1">Owner Name</label>
            <input
              type="text"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-600 font-semibold mb-1">Occupancy</label>
            <select
              value={formData.ocpr}
              onChange={(e) => setFormData({ ...formData, ocpr: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="Self">Self</option>
              <option value="Tenant">Tenant</option>
            </select>
          </div>

          <div>
            <label className="block text-zinc-600 font-semibold mb-1">Monthly Rent (₹)</label>
            <input
              type="number"
              min={0}
              value={formData.rent || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rent: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono text-zinc-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export const PtisUnitEditModal: React.FC<PtisUnitEditModalProps> = ({
  unit,
  onClose,
  onSave,
}) => {
  if (!unit) return null;
  return <EditForm key={unit.id || unit.prop} initialUnit={unit} onClose={onClose} onSave={onSave} />;
};
