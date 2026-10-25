"use client";

import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { SaveButton, AddButton, UpdateButton } from "@/components/common/ActionButtons";
import { SearchSelect } from "@/components/common/SearchSelect";
import { Input } from "@/components/common/Input";
import { ValidationMessage } from "@/components/common/ValidationMessage";
import { Badge } from "@/components/common/Badge";
import { Label } from "@/components/common/label";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import { GroupIconSelector } from "../../typeofusemaster/GroupIconSelector";
import type { ITypeOfUseDetails } from "@/types/RVRateMaster";
import type { UseGroup } from "@/types/typeOfUse.types";

interface GroupFormState {
  code: string;
  name: string;
  icon: string;
  errors: {
    code?: string;
    name?: string;
  };
  isSaved: boolean;
  isSaving: boolean;
  selectedExistingGroupId?: string;
  isMappingExisting: boolean;
}

interface GroupConfigurationCardProps {
  typeofuse: ITypeOfUseDetails;
  form: GroupFormState;
  existingGroups: UseGroup[];
  handleSelectExistingGroup: (id: number, val: string) => void;
  handleToggleMode: (id: number) => void;
  handleFieldChange: (id: number, field: 'code' | 'name' | 'icon', val: string) => void;
  handleSaveGroup: (id: number, tu: ITypeOfUseDetails) => void;
  isOpenPlot?: boolean;
  t: ReturnType<typeof import("next-intl").useTranslations>;
}

export function GroupConfigurationCard({
  typeofuse,
  form,
  existingGroups,
  handleSelectExistingGroup,
  handleToggleMode,
  handleFieldChange,
  handleSaveGroup,
  t,
}: GroupConfigurationCardProps) {
  const useLabel = useAliasLabel("Use", t("aliasFallback.use"));

  if (!form) return null;

  const isFormValid = () => {
    if (form.isMappingExisting) {
      return !!form.selectedExistingGroupId;
    }
    return (
      form.code.trim().length > 0 &&
      form.name.trim().length > 0 &&
      form.icon.trim().length > 0 &&
      Object.keys(form.errors).length === 0
    );
  };

  return (
    <Card 
      variant="default" 
      padding="md" 
      className={cn(
        "bg-white border-[#DCEAFF] shadow-sm transition-all duration-300 border-l-4",
        form.isSaved ? "border-l-emerald-500 shadow-emerald-50/30" : "border-l-blue-500 shadow-blue-50/30"
      )}
    >
      {/* Title bar */}
      <CardHeader 
        className={cn(
          "flex flex-row items-center justify-between border-b border-[#DCEAFF] -mx-6 -mt-6 px-6 pt-4 pb-3 rounded-t-lg mb-4 bg-gradient-to-r",
          form.isSaved 
            ? "from-emerald-50/60 to-teal-50/10" 
            : "from-blue-50/60 to-indigo-50/10"
        )}
      >
        <div className="flex items-center gap-2.5">
          <Badge 
            variant="default" 
            size="sm" 
            className="px-2 py-0.5 font-bold text-xs bg-blue-600 border-blue-600 text-white rounded-md shadow-xs font-sans"
          >
            {typeofuse.typeOfUseCode}
          </Badge>
          <CardTitle className="text-sm font-bold text-slate-800 font-sans tracking-wide">
            {typeofuse.description}
          </CardTitle>
        </div>
        <div className="flex items-center gap-3">
          {form.isSaved && (
            <Badge variant="success" size="sm" icon={CheckCircle} className="bg-emerald-100/70 text-emerald-800 border border-emerald-200 shadow-xs font-bold font-sans">
              {t('configureRates.saved')}
            </Badge>
          )}
          {!form.isSaving && typeofuse.typeOfUseCode !== 'OP' && (
            form.isMappingExisting ? (
              <AddButton
                size="sm"
                label={t('configureRates.createNewGroup')}
                onClick={() => handleToggleMode(typeofuse.id)}
              />
            ) : (
              <UpdateButton
                size="sm"
                label={t('configureRates.updateUseGroup', { use: useLabel })}
                onClick={() => handleToggleMode(typeofuse.id)}
              />
            )
          )}
        </div>
      </CardHeader>

      {typeofuse.typeOfUseCode === 'OP' ? (
        <CardContent className="flex flex-col gap-3 py-3 w-full">
          <div className="flex flex-col">
            <Label className="text-xs font-semibold text-slate-500 mb-1.5 font-sans">
              {t('configureRates.associatedUseGroup', { use: useLabel })}
            </Label>
            <Badge variant="secondary" size="md" className="w-fit py-1.5 px-3 font-semibold text-xs rounded-full border border-slate-200 text-slate-700 bg-slate-50/80 shadow-xs">
              {typeofuse.typeOfUseGroupCode || t('configureRates.notApplicable')} - {typeofuse.groupName || t('configureRates.notApplicable')}
            </Badge>
          </div>
        </CardContent>
      ) : form.isMappingExisting ? (
        <CardContent className="flex flex-col sm:flex-row items-end gap-4 w-full">
          <div className="flex flex-col flex-1 w-full">
            <SearchSelect
              label={t('configureRates.selectExistingGroup')}
              options={existingGroups
                .filter(g => g.isOpenPlot)
                .map(g => ({
                  label: `${g.typeOfUseGroupCode} - ${g.groupName}`,
                  value: String(g.typeOfUseGroupId)
                }))}
              value={form.selectedExistingGroupId || ""}
              onChange={(_, val) => handleSelectExistingGroup(typeofuse.id, val)}
              placeholder={t('configureRates.selectGroupPlaceholder')}
              disabled={form.isSaving}
            />
          </div>

          <div className="self-stretch sm:self-auto flex items-end">
            <SaveButton
              label={t('configureRates.save')}
              size="md"
              onClick={() => handleSaveGroup(typeofuse.id, typeofuse)}
              disabled={!form.selectedExistingGroupId || form.isSaved || form.isSaving}
              isLoading={form.isSaving}
              className="w-full sm:w-28 h-10"
            />
          </div>
        </CardContent>
      ) : (
        <CardContent className="flex flex-col lg:flex-row items-start gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full">
            {/* Group ID Code */}
            <div className="flex flex-col">
              <Input
                label={t('configureRates.groupIdCode')}
                name={`code_${typeofuse.id}`}
                value={form.code}
                onChange={(e) => handleFieldChange(typeofuse.id, 'code', e.target.value)}
                placeholder={t('configureRates.codePlaceholder')}
                required
                fullWidth
                disabled={form.isSaved || form.isSaving}
              />
              <ValidationMessage
                message={form.errors.code}
                visible={!!form.errors.code}
              />
            </div>

            {/* Group Name */}
            <div className="flex flex-col">
              <Input
                label={t('configureRates.groupName')}
                name={`name_${typeofuse.id}`}
                value={form.name}
                onChange={(e) => handleFieldChange(typeofuse.id, 'name', e.target.value)}
                placeholder={t('configureRates.namePlaceholder')}
                required
                fullWidth
                disabled={form.isSaved || form.isSaving}
              />
              <ValidationMessage
                message={form.errors.name}
                visible={!!form.errors.name}
              />
            </div>

            {/* Icon Type */}
            <div className="flex flex-col">
              <GroupIconSelector
                value={form.icon}
                onChange={(iconVal) => handleFieldChange(typeofuse.id, 'icon', iconVal)}
                label={t('configureRates.iconType')}
                required
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="lg:mt-[24px] self-stretch lg:self-start flex items-end">
            <SaveButton
              label={t('configureRates.save')}
              size="md"
              onClick={() => handleSaveGroup(typeofuse.id, typeofuse)}
              disabled={!isFormValid() || form.isSaved || form.isSaving}
              isLoading={form.isSaving}
              className="w-full lg:w-28"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
