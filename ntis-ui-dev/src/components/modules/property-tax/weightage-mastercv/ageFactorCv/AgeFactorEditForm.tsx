"use client";

import { useState } from "react";
import { Drawer } from "@/components/common/Drawer";
import { SearchSelect } from "@/components/common/SearchSelect";
import { ToggleSwitch } from "@/components/common/ToggleSwitch";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/label";
import { CancelButton, UpdateButton } from "@/components/common/ActionButtons";
import { AgeFactorCVMaster } from "@/types/ageFactorCv.types";
import { useAgeFactorEdit } from "@/hooks/weightageMaster/ageFactorCv/useAgeFactorEdit";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Building2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface AgeFactorEditFormProps {
    initialData: AgeFactorCVMaster
    locale: string;
    assessmentYearOptions: { label: string; value: string }[];
    allAgeFactors: AgeFactorCVMaster[];
}

export function AgeFactorEditForm({ initialData, locale, assessmentYearOptions, allAgeFactors }: AgeFactorEditFormProps) {
    const tW = useTranslations("weightageMaster");
    const tF = useTranslations("ageFactorMaster");
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(true);

    const aliasAssessment = useAliasLabel("Assessment", tF("defaults.assessment") || "Assessment");
    const aliasConstructionType = useAliasLabel("Construction_Type", tF("defaults.constructionType") || "Construction Type");
    const aliases = {
        assessment: aliasAssessment,
        constructionType: aliasConstructionType
    };

    const {
        formData,
        setFormData,
        isUpdating,
        handleSubmit,
    } = useAgeFactorEdit(initialData, allAgeFactors);

    const handleClose = () => {
        setIsOpen(false);
        setTimeout(() => {
            router.push(`/${locale}/property-tax/weightage-master/age-weightage`);
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
                            {tF("edit.title") || "Edit Age Weightage"}
                        </div>
                        <div className="text-sm font-medium text-slate-500">
                            {tF("edit.description") || "Update the details of age weightage"}
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
                                {tF("edit.ageStatus", {
                                    status: formData.isActive
                                        ? tF("edit.active")
                                        : tF("edit.inactive"),
                                })}
                            </div>
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={formData.isActive}
                        onChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
                        showPopup={false}
                    />
                </div>

                <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm space-y-5">
                    <Input
                        label={tF("columns.ageFrom") || "Age From"}
                        required
                        type="text"
                        inputMode="numeric"
                        minLength={1}
                        maxLength={3}
                        value={formData.ageFrom}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');

                            if (value.length <= 3) {
                                setFormData((prev) => ({
                                    ...prev,
                                    ageFrom: value,
                                }));
                            }
                        }}
                        disabled={!formData.isActive}
                        fullWidth
                    />
                    <Input
                        label={tF("columns.ageTo") || "Age To"}
                        required
                        type="text"
                        inputMode="numeric"
                        minLength={1}
                        maxLength={3}
                        value={formData.ageTo}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');

                            if (value.length <= 3) {
                                setFormData((prev) => ({
                                    ...prev,
                                    ageTo: value,
                                }));
                            }
                        }}
                        disabled={!formData.isActive}
                        fullWidth
                    />
                    <div>
                        <Label required className="mb-1.5 font-semibold text-slate-700">
                            {tF("columns.assessmentYear", aliases)}
                        </Label>
                        <SearchSelect
                            options={assessmentYearOptions}
                            value={formData.yearRangeCVId ? String(formData.yearRangeCVId) : ""}
                            onChange={(_, value) => setFormData((prev) => ({ ...prev, yearRangeCVId: Number(value) }))}
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
                        onChange={(e) => setFormData((prev) => ({ ...prev, factor: parseFloat(e.target.value) || 0 }))}
                        disabled={!formData.isActive}
                        fullWidth
                    />
                </div>

                <div className="rounded-xl border border-orange-200/60 bg-orange-50/50 p-4 shadow-sm flex items-start gap-3">
                    <AlertCircle className="text-orange-500 mt-0.5 shrink-0" size={18} />
                    <div className="text-sm font-medium text-orange-800 leading-relaxed">
                        {tF("errors.mandatoryFields") || "Fields marked with * are mandatory"}
                    </div>
                </div>
            </div>
        </Drawer>
    );
}
