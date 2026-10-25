"use client";

import { Briefcase, AlertCircle, CheckCircle2 } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import { AddButton, CancelButton } from "@/components/common/ActionButtons";
import { Input } from "@/components/common/Input";
import { ValidationMessage } from "@/components/common/ValidationMessage";
import { ToggleSwitch } from "@/components/common/ToggleSwitch";
import { TextArea } from "@/components/common/Textarea";
import { Label } from "@/components/common/label";
import { cn } from "@/lib/utils/cn";
import { useDepartmentForm } from "@/hooks/configuration-settings/department-master/useDepartmentForm";
import { DepartmentMasterFormProps } from "@/types/departmentMaster.types";

export default function DepartmentMasterForm({
    open: initialOpen,
    editingDepartment,
    onSuccess,
    onClose,
}: DepartmentMasterFormProps) {
    const {
        formData,
        errors,
        submittedOnce,
        touched,
        isSubmitting,
        open,
        handleChange,
        handleBlur,
        handleToggleStatus,
        handleSubmit,
        handleCancel,
        isEdit,
        t,
        tCommon,
    } = useDepartmentForm({ initialOpen, editingDepartment, onSuccess, onClose });

    const showError = (field: keyof typeof formData) => {
        const hasError = !!errors[field];
        if (!hasError) return false;

        const isFieldEmpty = !formData[field]?.toString().trim();
        if (isFieldEmpty) {
            return submittedOnce;
        }
        return submittedOnce || touched[field];
    };

    return (
        <Drawer
            open={open}
            onClose={handleCancel}
            className="border-l-4 border-[#4F6A94]"
            title={
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
                        <Briefcase size={20} />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-blue-900">
                            {isEdit ? t('form.title.edit') : t('form.title.add')}
                        </div>
                        <div className="text-sm text-slate-500">
                            {isEdit ? t('form.subtitle.edit') : t('form.subtitle.add')}
                        </div>
                    </div>
                </div>
            }
            footer={
                <>
                    <CancelButton label={tCommon('buttons.cancel')} onClick={handleCancel} disabled={isSubmitting} />
                    <AddButton
                        label={isEdit ? t('form.buttons.update') : t('form.buttons.save')}
                        type="submit"
                        form="department-form"
                        isLoading={isSubmitting}
                    />
                </>
            }
        >
            <form
                id="department-form"
                onSubmit={handleSubmit}
                className="space-y-6 bg-[#F8FAFF] p-5 flex flex-col items-stretch"
            >
                <div className="w-full rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 flex flex-col items-stretch space-y-4 text-left">
                    <Input
                        name="departmentCode"
                        label={t('form.fields.departmentCode')}
                        placeholder={t('form.fields.departmentCodePlaceholder')}
                        required={true}
                        value={formData.departmentCode}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={isEdit || isSubmitting}
                        fullWidth
                    />
                    <ValidationMessage
                        message={errors.departmentCode}
                        visible={showError("departmentCode")}
                    />

                    <Input
                        name="departmentName"
                        label={t('form.fields.departmentName')}
                        placeholder={t('form.fields.departmentNamePlaceholder')}
                        required={true}
                        value={formData.departmentName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={isSubmitting}
                        fullWidth
                    />
                    <ValidationMessage
                        message={errors.departmentName}
                        visible={showError("departmentName")}
                    />

                    <Input
                        name="departmentNameLocal"
                        label={t('form.fields.departmentNameLocal')}
                        placeholder={t('form.fields.departmentNameLocalPlaceholder')}
                        value={formData.departmentNameLocal}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={isSubmitting}
                        fullWidth
                    />
                    <ValidationMessage
                        message={errors.departmentNameLocal}
                        visible={showError("departmentNameLocal")}
                    />



                    <div className="w-full flex flex-col items-stretch">
                        <Label htmlFor="departmentDescription" className="mb-1.5 justify-start text-left">
                            {t('form.fields.departmentDescription')}
                        </Label>
                        <TextArea
                            id="departmentDescription"
                            name="departmentDescription"
                            value={formData.departmentDescription}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            rows={3}
                            placeholder={t('form.fields.departmentDescriptionPlaceholder')}
                            disabled={isSubmitting}
                        />
                    </div>
                    <ValidationMessage
                        message={errors.departmentDescription}
                        visible={showError("departmentDescription")}
                    />

                    {isEdit && (
                        <div className="w-full pt-2 border-t border-[#DCEAFF]">
                            <div className="w-full flex items-center justify-between p-3 rounded-lg bg-white border border-blue-100 shadow-sm transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-9 w-9 flex items-center justify-center rounded-full transition-colors",
                                        formData.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                                    )}>
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm text-blue-900">{t('form.fields.isActive')}</div>
                                        <div className="text-xs text-gray-500">
                                            {t('form.fields.statusText', { status: formData.isActive ? tCommon('status.active') : tCommon('status.inactive') })}
                                        </div>
                                    </div>
                                </div>
                                <ToggleSwitch
                                    checked={formData.isActive}
                                    onChange={handleToggleStatus}
                                    showPopup={false}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    <AlertCircle size={16} />
                    <span>{tCommon('note.mandatory')}</span>
                </div>
            </form>
        </Drawer>
    );
}
