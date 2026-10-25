'use client';

/**
 * AddRouteButton - Client Component for Adding Routes
 * Shows a dialog to add new routes with form validation
 * Uses client-side translations for interactive form
 */

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
// Note: [locale] is the actual folder name (Next.js dynamic route segment), not a variable
import { createRoute } from '@/app/[locale]/dashboard/actions';
import type { DashboardData } from '@/types/service.types';
import { Plus, Loader2, X } from 'lucide-react';

export function AddRouteButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const tDashboard = useTranslations('dashboard');
  const tCommon = useTranslations('common');

  const [formData, setFormData] = useState({
    route: '',
    status: 'Active' as DashboardData['status'],
    vehicles: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await createRoute(formData);

      if (result.success) {
        // Reset form and close dialog
        setFormData({ route: '', status: 'Active', vehicles: 0 });
        setIsOpen(false);
      } else {
        alert(result.error || tCommon('errors.createError'));
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus size={20} />
        {tCommon('buttons.addRoute')}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{tDashboard('form.title')}</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={isPending}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tDashboard('form.routeName')}
                </label>
                <input
                  type="text"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder={tDashboard('form.routePlaceholder')}
                  required
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tDashboard('form.statusLabel')}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as DashboardData['status'] })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  disabled={isPending}
                >
                  <option value="Active">{tCommon('status.active')}</option>
                  <option value="Delayed">{tCommon('status.delayed')}</option>
                  <option value="Completed">{tCommon('status.completed')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tDashboard('form.vehiclesLabel')}
                </label>
                <input
                  type="number"
                  value={formData.vehicles}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicles: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  min="0"
                  required
                  disabled={isPending}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isPending}
                >
                  {tCommon('buttons.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {tCommon('actions.adding')}
                    </>
                  ) : (
                    tCommon('buttons.submit')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
