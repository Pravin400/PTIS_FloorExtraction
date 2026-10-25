"use client";

import { useState } from "react";
import { Drawer } from "@/components/common/Drawer";
import { FloorFactorCVMaster } from "@/types/floor-cv-weightageMaster.types";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useFloorFactorEdit } from "@/hooks/weightageMaster/floorFactorCv/useFloorFactorEdit";
import { SearchSelect } from "@/components/common/SearchSelect";
import { ToggleSwitch } from "@/components/common/ToggleSwitch";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/label";
import { CancelButton, UpdateButton } from "@/components/common/ActionButtons";
import { Building2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface FloorFactorEditFormProps {
    initialData: FloorFactorCVMaster;
    locale: string;
    assessmentYearOptions: { label: string; value: string }[];
}

export function FloorFactorEditForm({ initialData, locale, assessmentYearOptions }: FloorFactorEditFormProps) {
    const tW = useTranslations("weightageMaster");
    const tCommon = useTranslations("common");
    const tF = useTranslations("floorFactorMaster");
    const router = useRouter();

    const {
        formData,
        setFormData,
        isSubmitting,
        handleSubmit
    } = useFloorFactorEdit(initialData);

    const aliasFloor = useAliasLabel("Floor", tW("defaults.floor"));
    const aliasAssessment = useAliasLabel("Assessment", tW("defaults.assessment"));
    const aliases = { floor: aliasFloor, assessment: aliasAssessment };

    const [open, setOpen] = useState(true);

    const handleClose = () => {
        setOpen(false);
        router.push(`/${locale}/property-tax/weightage-master`);
    };

    const onSubmit = async () => {
        const success = await handleSubmit();
        if (success) {
            handleClose();
        }
    };

    const header = (
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Building2 className="h-5 w-5" />
            </div>
            <div>
                <h2 className="text-base font-bold text-blue-700">{`${tCommon("buttons.edit")} ${tW("tabs.floor", aliases)}`}</h2>
                <p className="text-xs font-medium text-slate-500">{tW("subtitle") || "Update floor weightage details"}</p>
            </div>
        </div>
    );

    const footer = (
        <div className="flex gap-3 w-full justify-end bg-white px-2 py-1">
            <CancelButton
                onClick={handleClose}
                disabled={isSubmitting}
                label={tW("common.buttons.cancel") || "Cancel"}
            />
            <UpdateButton
                onClick={onSubmit}
                disabled={isSubmitting}
                label={isSubmitting ? tW("common.buttons.updating") || "Updating..." : tW("common.buttons.update") || "Update"}
            />
        </div>
    );

    return (
        <Drawer
            open={open}
            onClose={handleClose}
            title={header}
            width="md"
            footer={footer}
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
                                    name: tW("tabs.floor", aliases), 
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
                        label={tF("columns.factorWithLift") || "Factor With Lift"}
                        required
                        type="number"
                        step="0.01"
                        min="0.1"
                        max="100"
                        value={formData.factorWithLift}
                        onChange={(e) => setFormData(prev => ({ ...prev, factorWithLift: parseFloat(e.target.value) || 0 }))}
                        disabled={!formData.isActive}
                        fullWidth
                    />
                    <Input
                        label={tF("columns.factorWithoutLift") || "Factor Without Lift"}
                        required
                        type="number"
                        step="0.01"
                        min="0.1"
                        max="100"
                        value={formData.factorWithoutLift}
                        onChange={(e) => setFormData(prev => ({ ...prev, factorWithoutLift: parseFloat(e.target.value) || 0 }))}
                        disabled={!formData.isActive}
                        fullWidth
                    />
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-orange-200/60 bg-orange-50/50 px-4 py-3 text-sm font-medium text-orange-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{tF("messages.mandatoryFields") || "Fields marked with * are mandatory"}</span>
                </div>
            </div>
        </Drawer>
    );
}
