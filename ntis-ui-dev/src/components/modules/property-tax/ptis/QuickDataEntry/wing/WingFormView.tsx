'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Building2, Plus, Layers, Home, AlertCircle } from 'lucide-react';
import { Button } from '@/components/common';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { SocietyDetailItem } from '@/types/zone-master/properties/societyDetails.types';
import { SocietyWingDetailItem } from '@/types/zone-master/properties/society-wing-details.types';
import { WingItem } from '@/types/zone-master/properties/wing.types';
import { PropertyBasicDetailsApiItem } from '@/types/property-basic-details.types';
import { WingSummaryCards } from './WingSummaryCards';
import { AddEditWingModal, WingModalPayload } from './AddEditWingModal';
import {
  createSocietyDetailAction,
  updateSocietyDetailAction,
  deleteSocietyDetailAction,
} from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Wing/action';
import { useQdeSaveTracker } from '@/hooks/ptis/QuickDataEntry/useQdeSaveTracker';

interface WingFormViewProps {
  propertyId: number;
  locale: string;
  basicDetails: PropertyBasicDetailsApiItem | null;
  societyWings: SocietyDetailItem[];
  wingStats: SocietyWingDetailItem[];
  wingMaster: WingItem[];
}

export default function WingFormView({
  propertyId,
  basicDetails,
  societyWings: initialSocietyWings,
  wingStats: initialWingStats,
  wingMaster,
}: WingFormViewProps) {
  const t = useTranslations('quickDataEntry');
  const router = useRouter();
  const { confirm } = useConfirm();
  const { markChangesSaved } = useQdeSaveTracker(propertyId);

  const [societyWings, setSocietyWings] = useState<SocietyDetailItem[]>(initialSocietyWings);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SocietyDetailItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category determination
  const categoryName = (basicDetails?.categoryName || '').toLowerCase();
  const isIndividual = categoryName.includes('individual');

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (wing: SocietyDetailItem) => {
    setEditingRecord(wing);
    setIsModalOpen(true);
  };

  const handleSaveWing = async (data: WingModalPayload) => {
    setIsSubmitting(true);
    try {
      if (data.editingId) {
        // Update existing wing
        const existing = societyWings.find((w) => w.id === data.editingId);
        const result = await updateSocietyDetailAction(propertyId, data.editingId, {
          isActive: existing?.isActive ?? true,
          propertyId,
          wingId: data.wingId,
          wingName: data.wingName,
          managerName: data.managerName,
          managerNameEnglish: data.managerNameEnglish,
          managerMobileNo: data.managerMobileNo,
          managerEmailId: data.managerEmailId,
          secretaryName: data.secretaryName,
          secretaryNameEnglish: data.secretaryNameEnglish,
          secretaryMobileNo: data.secretaryMobileNo,
          secretaryEmailId: data.secretaryEmailId,
          societyName: existing?.societyName || '',
        });

        if (!result.success || !result.data) {
          toast.error(result.error || t('wing.errors.updateFailed'));
          return;
        }

        setSocietyWings((prev) =>
          prev.map((item) => (item.id === data.editingId ? (result.data as SocietyDetailItem) : item))
        );
        toast.success(t('wing.success.wingUpdated'));
        markChangesSaved();
      } else {
        // Create new wing
        const result = await createSocietyDetailAction(propertyId, {
          isActive: true,
          wingId: data.wingId,
          wingName: data.wingName,
        });

        if (!result.success || !result.data) {
          toast.error(result.error || t('wing.errors.createFailed'));
          return;
        }

        setSocietyWings((prev) => [...prev, result.data as SocietyDetailItem]);
        toast.success(t('wing.success.wingCreated'));
        markChangesSaved();
      }

      setIsModalOpen(false);
      setEditingRecord(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('wing.errors.updateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWing = (wing: SocietyDetailItem) => {
    confirm({
      title: t('common.warning') || 'Warning',
      description: `Are you sure you want to delete "${wing.wingName}"?`,
      variant: 'delete',
      confirmText: 'Delete',
      cancelText: t('common.cancel') || 'Cancel',
      onConfirm: async () => {
        try {
          const result = await deleteSocietyDetailAction(propertyId, wing.id);
          if (!result.success) {
            toast.error(result.error || t('wing.errors.deleteFailed'));
            return;
          }

          setSocietyWings((prev) => prev.filter((item) => item.id !== wing.id));
          toast.success(t('wing.success.wingDeleted'));
          markChangesSaved();
          router.refresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : t('wing.errors.deleteFailed'));
        }
      },
    });
  };

  const totalProperties = initialWingStats.reduce(
    (acc, curr) => acc + (curr.propertyCount || 0),
    0
  );
  const totalAmenities = initialWingStats.reduce(
    (acc, curr) => acc + (curr.aminityCount || 0),
    0
  );

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Property Context Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">
                {basicDetails?.categoryName || t('wing.title')}
              </h2>
              {basicDetails?.categoryName && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {basicDetails.categoryName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-0.5">
              {basicDetails?.wardNo && (
                <span>
                  <strong>{t('wing.wardNo')}:</strong> {basicDetails.wardNo}
                </span>
              )}
              {basicDetails?.propertyNo && (
                <span>
                  <strong>{t('wing.propertyNo')}:</strong> {basicDetails.propertyNo}
                </span>
              )}
              <span>
                <strong>{t('wing.totalWings')}:</strong> {societyWings.length}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Add Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('wing.addWing')}</span>
        </Button>
      </div>

      {/* Individual Property Notice (if individual) */}
      {isIndividual && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold">{t('common.warning')}: </span>
            {t('wing.individualPropertyNotice')}
          </div>
        </div>
      )}

      {/* Statistics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">{t('wing.totalWings')}</div>
            <div className="text-lg font-bold text-gray-900">{societyWings.length}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Home className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">{t('wing.totalProperties')}</div>
            <div className="text-lg font-bold text-gray-900">{totalProperties}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">{t('wing.amenities')}</div>
            <div className="text-lg font-bold text-gray-900">{totalAmenities}</div>
          </div>
        </div>
      </div>

      {/* Wing Cards Section */}
      {societyWings.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              {t('wing.wingList')}
            </h3>
          </div>

          <WingSummaryCards
            wings={societyWings}
            wingStats={initialWingStats}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteWing}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-gray-800">{t('wing.noWingsFound')}</h4>
            <p className="text-xs text-gray-500">{t('wing.addFirstWing')}</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('wing.addWing')}</span>
          </Button>
        </div>
      )}

      {/* Add / Edit Wing Modal */}
      <AddEditWingModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveWing}
        editingRecord={editingRecord}
        wingMaster={wingMaster}
        existingWings={societyWings}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
