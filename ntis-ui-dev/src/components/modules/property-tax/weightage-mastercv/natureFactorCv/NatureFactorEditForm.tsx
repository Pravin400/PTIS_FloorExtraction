"use client";

import { useState } from "react";
import { Drawer } from "@/components/common/Drawer";
import { NatureFactorCVMaster } from "@/types/natureofbuilding-cv-weightageMaster.types";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useNatureFactorEdit } from "@/hooks/weightageMaster/natureFactorCv/useNatureFactorEdit";
import { SearchSelect } from "@/components/common/SearchSelect";
import { ToggleSwitch } from "@/components/common/ToggleSwitch";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/label";
import { CancelButton, UpdateButton } from "@/components/common/ActionButtons";
import { Building2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface NatureFactorEditFormProps {
    initialData: NatureFactorCVMaster;
    locale: string;
    assessmentYearOptions: { label: string; value: string }[];
}

export function NatureFactorEditForm({ initialData, locale, assessmentYearOptions }: NatureFactorEditFormProps) {
    const tF = useTranslations("natureFactorCVMaster");
    const tW = useTranslations("weightageMaster");
    const router = useRouter();

    const [isOpen, setIsOpen] = useState(true);

    const aliasAssessment = useAliasLabel("Assessment", tW("defaults.assessment") || "Assessment");
    const aliasConstructionType = useAliasLabel("Construction_Type", tF("defaults.constructionType") || "Construction Type");
    const aliases = { 
        assessment: aliasAssessment || tW("defaults.assessment") || "Assessment",
        constructionType: aliasConstructionType || tF("defaults.constructionType") || "Construction Type"
    };

    const {
        formData,
        setFormData,
        isUpdating,
        handleSubmit
    } = useNatureFactorEdit(initialData, locale);

    const handleClose = () => {
        setIsOpen(false);
        setTimeout(() => {
            router.push(`/${locale}/property-tax/weightage-master/nature-weightage`);
        }, 300);
    };

    const handleSave = async () => {
        const success = await handleSubmit();
        if (success) {
            handleClose();
        }
    };

    return (
        <Drawer
            open={isOpen}
            onClose={handleClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
                        <Building2 size={20} />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-slate-800 tracking-tight">
                            {tF("titles.editNatureWeightage") || "Edit Nature Weightage"}
                        </div>
                        <div className="text-sm font-medium text-slate-500">
                            {tF("descriptions.updateNatureDetails") || "Update nature weightage details"}
                        </div>
                    </div>
                </div>
            }
            width="md"
            footer={
                <div className="flex items-center justify-end gap-3 w-full bg-white px-2 py-1">
                    <CancelButton
                        onClick={handleClose}
                        disabled={isUpdating}
                        label={tW("common.buttons.cancel") || "Cancel"}
                    />
                    <UpdateButton
                        onClick={handleSave}
                        disabled={isUpdating}
                        label={isUpdating ? tW("common.buttons.updating") || "Updating..." : tW("common.buttons.update") || "Update"}
                    />
                </div>
            }
        >
            <div className="p-6 space-y-6 bg-slate-50 min-h-full">
                
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-900">
                                {tW("common.labels.status")}
                            </div>
                            <div className="text-[13px] font-medium text-slate-500 mt-0.5">
                                {tW("common.labels.statusCurrently", { 
                                    name: tW("tabs.nature"), 
                                    status: formData.isActive ? tW("common.labels.active") : tW("common.labels.inactive") 
                                })}
                            </div>
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={formData.isActive}
                        onChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                        showPopup={false}
                    />
                </div>

                <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm space-y-5">
                    <div>
                        <Label required className="mb-1.5 font-semibold text-slate-700">
                            {tW("common.labels.assessmentYear", aliases)}
                        </Label>
                        <SearchSelect
                            options={assessmentYearOptions}
                            value={formData.yearRangeCVId ? String(formData.yearRangeCVId) : ""}
                            onChange={(_, value) => setFormData(prev => ({ ...prev, yearRangeCVId: Number(value) }))}
                            placeholder={tW("common.placeholders.selectAssessmentYear") || "Select Assessment Year"}
                            className="w-full"
                            disabled={!formData.isActive}
                        />
                    </div>
                    <Input
                        label={tF("columns.factor") || "Factor"}
                        required
                        type="number"
                        step="0.01"
                        min="0.1"
                        max="100"
                        value={formData.factor}
                        onChange={(e) => setFormData(prev => ({ ...prev, factor: parseFloat(e.target.value) || 0 }))}
                        disabled={!formData.isActive}
                        fullWidth
                    />
                </div>

                <div className="rounded-xl border border-orange-200/60 bg-orange-50/50 p-4 shadow-sm flex items-start gap-3">
                    <AlertCircle className="text-orange-500 mt-0.5 shrink-0" size={18} />
                    <div className="text-sm font-medium text-orange-800 leading-relaxed">
                        {tF("messages.mandatoryFields") || "Fields marked with * are mandatory"}
                    </div>
                </div>
            </div>
        </Drawer>
    );
}
