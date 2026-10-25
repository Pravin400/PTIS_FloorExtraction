/* eslint-disable i18next/no-literal-string */
"use client"
import React from "react";
import { Tabs } from "@/components/common";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { SocietyFormProps } from "@/types/property-society-details.types";
import { SocietyFormFields } from "./SocietyFormFields";
import { SocietyFormActions } from "./SocietyFormActions";
import { useSocietyForm } from "@/hooks/ptis/QuickDataEntry/Society/useSocietyForm";
import { SocietyTabSection } from "./redesign/SocietyTabSection";
import { ApartmentEditConfirmModal } from "./redesign/ApartmentEditConfirmModal";
import { useRedesignSocietyForm } from "./redesign/useRedesignSocietyForm";

const RedesignSocietyFormContent: React.FC<SocietyFormProps> = (props) => {
    const {
        formData,
        updateField,
        fieldErrors,
        touchedFields,
        handleBlurField,
        availableWings,
        managerWingScope,
        setManagerWingScope,
        secretaryWingScope,
        setSecretaryWingScope,
        isConfirmOpen,
        setIsConfirmOpen,
        detectedDiffs,
        handleReviewChanges,
        handleConfirmSubmit,
        isSubmitting,
    } = useRedesignSocietyForm({
        open: true,
        propertyId: props.propertyIdSearch,
        propertyMasterData: props.propertyMasterData || undefined,
        societyData: props.societyData,
        locale: props.locale,
        onSuccess: () => {
            // Updated successfully
        },
    });

    if (isConfirmOpen) {
        return (
            <ApartmentEditConfirmModal
                onBack={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmSubmit}
                isSubmitting={isSubmitting}
                diffs={detectedDiffs}
                availableWings={availableWings}
                managerWingScope={managerWingScope}
                secretaryWingScope={secretaryWingScope}
            />
        );
    }

    return (
        <div className="p-3 sm:p-4 space-y-4 w-full font-sans">
            <SocietyTabSection
                formData={formData}
                onChange={updateField}
                fieldErrors={fieldErrors}
                touchedFields={touchedFields}
                onBlur={handleBlurField}
                availableWings={availableWings}
                managerWingScope={managerWingScope}
                onManagerWingScopeChange={setManagerWingScope}
                secretaryWingScope={secretaryWingScope}
                onSecretaryWingScopeChange={setSecretaryWingScope}
            />

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-end gap-3 pt-3 pb-6 border-t border-slate-200">
                <button
                    type="button"
                    onClick={handleReviewChanges}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                >
                    <span>Review & Update</span>
                </button>
            </div>
        </div>
    );
};

const StandardSocietyFormContent: React.FC<SocietyFormProps> = (props) => {
    const {
        formRef,
        hasChanges,
        isUpdating,
        managerMobileCountryCode,
        setManagerMobileCountryCode,
        secretaryMobileCountryCode,
        setSecretaryMobileCountryCode,
        managerMobileInput,
        secretaryMobileInput,
        managerEmail,
        setManagerEmail,
        secretaryEmail,
        setSecretaryEmail,
        societyEmail,
        setSocietyEmail,
        landOwnerName,
        setLandOwnerName,
        builderName,
        setBuilderName,
        societyName,
        setSocietyName,
        managerName,
        setManagerName,
        secretaryName,
        setSecretaryName,
        societyAddress,
        setSocietyAddress,
        wingId,
        wingOptions,
        handleWingChange,
        showError,
        canSubmit,
        handleSubmit,
        checkFormChanges,
        setFocusedField,
    } = useSocietyForm(props);

    const t = useTranslations("quickDataEntry");

    return (
        <form ref={formRef} onSubmit={handleSubmit} onChange={checkFormChanges} noValidate>
            <Tabs defaultValue="society">
                <Tabs.TabPanel value="society" className="mt-0 p-4 space-y-3">
                    <div className="bg-white rounded-xl shadow-md border-2 border-purple-100 p-4">
                        <h3 className="text-sm font-bold text-purple-800 mb-3 pb-2 border-b-2 border-purple-200">
                            {t('society.title')}
                        </h3>

                        <SocietyFormFields
                            t={t}
                            managerMobileInput={managerMobileInput}
                            secretaryMobileInput={secretaryMobileInput}
                            managerMobileCountryCode={managerMobileCountryCode}
                            setManagerMobileCountryCode={setManagerMobileCountryCode}
                            secretaryMobileCountryCode={secretaryMobileCountryCode}
                            setSecretaryMobileCountryCode={setSecretaryMobileCountryCode}
                            managerEmail={managerEmail}
                            setManagerEmail={setManagerEmail}
                            secretaryEmail={secretaryEmail}
                            setSecretaryEmail={setSecretaryEmail}
                            societyEmail={societyEmail}
                            setSocietyEmail={setSocietyEmail}
                            landOwnerName={landOwnerName}
                            setLandOwnerName={setLandOwnerName}
                            builderName={builderName}
                            setBuilderName={setBuilderName}
                            societyName={societyName}
                            setSocietyName={setSocietyName}
                            managerName={managerName}
                            setManagerName={setManagerName}
                            secretaryName={secretaryName}
                            setSecretaryName={setSecretaryName}
                            societyAddress={societyAddress}
                            setSocietyAddress={setSocietyAddress}
                            wingId={wingId}
                            wingOptions={wingOptions}
                            handleWingChange={handleWingChange}
                            showError={showError}
                            onFocusField={setFocusedField}
                            onBlurField={() => setFocusedField(null)}
                        />

                        <SocietyFormActions
                            t={t}
                            isUpdating={isUpdating}
                            hasChanges={hasChanges}
                            canSubmit={canSubmit()}
                        />
                    </div>
                </Tabs.TabPanel>
            </Tabs>
        </form>
    );
};

const SocietyForm = (props: SocietyFormProps) => {
    const searchParams = useSearchParams();
    const returnTab = searchParams.get('returnTab');
    const isApartment = returnTab === 'apartment' || searchParams.get('from') === 'apartment';

    if (isApartment) {
        return <RedesignSocietyFormContent {...props} />;
    }

    return <StandardSocietyFormContent {...props} />;
};

export default SocietyForm;
