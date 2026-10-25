'use client';


import { LayoutGrid, Home, User } from 'lucide-react';
import { SearchSelect, Button, AnimatedDigitInput } from '@/components/common';
import type { FloorRenterAndRoomsFieldsProps } from '@/types/asset/floor-details.types';
import { withSelectPlaceholder } from '@/lib/utils/asset-utils/new-add-new-asset/dropdown-placeholder.utils';

export function FloorRenterAndRoomsFields({
  t,
  formState,
  setFormState,
  setIsRenterDrawerOpen,
  handleRoomsDrawerOpen,
  handleOpenSpacesDrawerOpen,
}: FloorRenterAndRoomsFieldsProps) {
  return (
    <>
      <div className="flex flex-col">
        <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
          <User className="size-3 text-blue-600" />
          {t('floorDetails.renter')}
        </label>
        <div className="flex items-center gap-1">
          <div className="flex-1">
            <SearchSelect
              name="isRenter"
              options={withSelectPlaceholder([
                { label: t('floorDetails.no') || 'No', value: 'false' },
                { label: t('floorDetails.yes') || 'Yes', value: 'true' },
              ])}
              value={
                formState.isRenter === true || formState.isRenter === 'true'
                  ? 'true'
                  : 'false'
              }
              onChange={(_name, val) => {
                const isTrue = val === 'true';
                setFormState((p: Record<string, unknown>) => ({ ...p, isRenter: isTrue }));
                if (isTrue) {
                  setIsRenterDrawerOpen(true);
                }
              }}
              placeholder="--Select--"
            />
          </div>
          {formState.isRenter && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              icon={User}
              onClick={() => setIsRenterDrawerOpen(true)}
              title="Add/Edit Renter Details"
              className="h-8! px-2! bg-blue-50! hover:bg-blue-100! text-blue-600! border! border-blue-200! rounded-md! shadow-sm! shrink-0 cursor-pointer focus:ring-0! focus:ring-offset-0!"
            />
          )}
        </div>
      </div>

      <div className="flex flex-col">
        <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
          <Home className="size-3 text-indigo-600" />
          {formState.submissionType === 'Open Space'
            ? 'Open Spaces'
            : t('floorDetails.rooms')}
          <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-1">
          <div className="flex-1 min-w-0">
            <AnimatedDigitInput
              name={formState.submissionType === 'Open Space' ? 'openSpaces' : 'rooms'}
              maxLength={3}
              allowedPattern={/^[0-9]$/}
              placeholder="0"
              value={String(
                formState.submissionType === 'Open Space'
                  ? (formState.openSpaces ?? '')
                  : (formState.rooms ?? '')
              )}
              onChange={(val) => {
                const cleaned = String(val).replace(/[^0-9]/g, '').slice(0, 3);
                const count = cleaned === '' ? '' : Math.min(999, Math.max(0, parseInt(cleaned, 10) || 0));
                setFormState((prev: Record<string, unknown>) => ({
                  ...prev,
                  [formState.submissionType === 'Open Space' ? 'openSpaces' : 'rooms']: count,
                }));
              }}
              className="font-bold text-slate-800"
              fullWidth={true}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            icon={LayoutGrid}
            onClick={
              formState.submissionType === 'Open Space'
                ? handleOpenSpacesDrawerOpen
                : handleRoomsDrawerOpen
            }
            title={
              formState.submissionType === 'Open Space'
                ? 'Config Open Spaces'
                : 'Config Rooms'
            }
            className="h-8! px-2! bg-blue-50! hover:bg-blue-100! text-blue-600! border! border-blue-200! rounded-md! shadow-sm! shrink-0 cursor-pointer focus:ring-0! focus:ring-offset-0!"
          />
        </div>
      </div>
    </>
  );
}
