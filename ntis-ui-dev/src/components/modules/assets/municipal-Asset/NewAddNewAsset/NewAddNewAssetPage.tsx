'use client';

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ClipboardList, MapPin, Briefcase, CheckCircle, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useLocaleRouter } from "@/hooks/asset/municipal-Asset/useLocaleRouter";
import { activateAssetAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/activation/action";
import NAAssetSuccessModal from "./NAAssetSuccessModal";
import { NAProgressSteps } from "./components/NAProgressSteps";
import { NAFooter } from "./components/NAFooter";
import { NABasicInfoStepContent } from "./components/NABasicInfoStepContent";
import { useNAFormOrchestrator } from "@/hooks/asset/municipal-Asset/new-add-new-asset/useNAFormOrchestrator";
import { useNAInitialDataLoaders } from "@/hooks/asset/municipal-Asset/new-add-new-asset/useNAInitialDataLoaders";
import { useNAAssetForm } from "./NAAssetFormContext";
import { LocationOwnershipContent } from "./ownership";
import { AssetsFacilitiesContent } from "./AssetsFacilities/AssetsFacilitiesContent";
import { ReviewSubmitContent } from "./review-submit";
import type {
  NewAddNewAssetPageProps,
  FloorCvRollup,
} from "@/types/asset/municipal-Asset/new-add-new-asset/new-add-new-asset-page.types";

export function NewAddNewAssetPage(props: NewAddNewAssetPageProps) {
  const t = useTranslations("newAddNewAsset");
  const { push } = useLocaleRouter();
  const { onSubmitHook } = useNAAssetForm();

  const orchestrator = useNAFormOrchestrator({
    zones: props.zones,
    departments: props.departments,
    moujas: props.moujas,
    ownershipTypes: props.ownershipTypes,
    assetConditions: props.assetConditions,
    wards: props.wards,
    subzones: props.subzones,
    designations: props.designations,
    prefetchedFields: props.prefetchedFields,
  });

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "";
  const categoryKey = category.toUpperCase();

  const isMovable =
    orchestrator.formData.isMovableCategory !== undefined
      ? Boolean(orchestrator.formData.isMovableCategory)
      : props.initialWizardData?.isMovableCategory !== undefined
        ? Boolean(props.initialWizardData.isMovableCategory)
        : /movable|vehicle|equipment|furniture|जंगम|वाहन|उपकरण/i.test(category) || categoryKey === "MOVABLE";

  const isLandCategory =
    Number(props.initialWizardData?.categoryId || orchestrator.formData.categoryId || 0) === 2 ||
    /land|plot|जमीन|भूखंड/i.test(category);

  const isBuilding = !isMovable && !isLandCategory;

  const hasInventory =
    orchestrator.formData.hasInventory !== undefined
      ? Boolean(orchestrator.formData.hasInventory)
      : props.initialWizardData?.hasInventory !== undefined
        ? Boolean(props.initialWizardData.hasInventory)
        : false;

  const stepsList = [
    { key: "basic-info", title: t("stepper.steps.basicInfo.title"), subtitle: t("stepper.steps.basicInfo.subtitle"), icon: ClipboardList },
    !isMovable && { key: "location", title: t("stepper.steps.location.title"), subtitle: t("stepper.steps.location.subtitle"), icon: MapPin },
    hasInventory && { key: "inventory", title: t("stepper.steps.inventory.title"), subtitle: t("stepper.steps.inventory.subtitle"), icon: Briefcase },
    { key: "review", title: t("stepper.steps.review.title"), subtitle: t("stepper.steps.review.subtitle"), icon: CheckCircle },
  ].filter(Boolean) as { key: string; title: string; subtitle: string; icon: LucideIcon }[];

  const steps = stepsList.map((s, idx) => ({ id: idx + 1, key: s.key, title: s.title, subtitle: s.subtitle, icon: s.icon }));

  const detectedStepKey = props.activeStepKey || (() => {
    if (!pathname) return undefined;
    const lower = pathname.toLowerCase();
    if (lower.includes("/location")) return "location";
    if (lower.includes("/inventory")) return "inventory";
    if (lower.includes("/review")) return "review";
    if (lower.includes("/basic-info") || lower.includes("/basic-information")) return "basic-info";
    return undefined;
  })();

  const routeStepIndex = detectedStepKey ? steps.findIndex((s) => s.key === detectedStepKey) : -1;
  const initialStepNumber = routeStepIndex >= 0 ? routeStepIndex + 1 : 1;

  const [currentStep, setCurrentStep] = useState(initialStepNumber);
  const resolvedAssetId = Number(
    orchestrator.assetId ||
    orchestrator.formData.id ||
    orchestrator.formData.assetId ||
    props.initialWizardData?.id ||
    props.initialWizardData?.assetId ||
    searchParams.get("assetId") ||
    searchParams.get("id") ||
    0
  );
  const [completedSteps, setCompletedSteps] = useState<number[]>(() => (resolvedAssetId > 0 ? [1] : []));

  const [prevResolvedAssetId, setPrevResolvedAssetId] = useState(resolvedAssetId);
  if (resolvedAssetId !== prevResolvedAssetId) {
    setPrevResolvedAssetId(resolvedAssetId);
    if (resolvedAssetId > 0 && !completedSteps.includes(1)) {
      setCompletedSteps((prev) => (prev.includes(1) ? prev : [...prev, 1]));
    }
  }
  const [cvRollup, setCvRollup] = useState<FloorCvRollup | number | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isFinalSubmitting, setIsFinalSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState<{ assetName: string; assetCode: string } | null>(null);

  const [prevRouteStepIndex, setPrevRouteStepIndex] = useState(routeStepIndex);
  if (routeStepIndex !== prevRouteStepIndex) {
    setPrevRouteStepIndex(routeStepIndex);
    if (routeStepIndex >= 0) {
      setCurrentStep(routeStepIndex + 1);
    }
  }

  const goToStep = (step: number) => {
    if (step >= 1 && step <= steps.length) {
      if (currentStep === steps.length && step !== currentStep) {
        setIsConfirmed(false);
      }
      const targetStep = steps[step - 1];
      const assetId = Number(orchestrator.assetId || orchestrator.formData.id || orchestrator.formData.assetId || searchParams.get("assetId") || searchParams.get("id") || 0);
      if (assetId > 0 && detectedStepKey && targetStep) {
        const queryStr = searchParams.toString();
        push(`/assets/municipal-Asset/new-add-new-asset/${assetId}/${targetStep.key}${queryStr ? `?${queryStr}` : ""}`);
      } else {
        setCurrentStep(step);
      }
    }
  };

  const handleFinalSubmit = async () => {
    if (isFinalSubmitting) return;

    const assetId = Number(orchestrator.assetId || orchestrator.formData.id || orchestrator.formData.assetId);
    if (!assetId || assetId <= 0) {
      toast.error(t("notifications.assetIdNotFound"));
      return;
    }

    if (currentStep === steps.length && !isConfirmed) {
      toast.error(t("notifications.pleaseConfirmDeclaration") || "Please confirm the declaration before submitting.");
      return;
    }

    setIsFinalSubmitting(true);
    try {
      const result = await activateAssetAction(assetId);
      if (result.success) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("naAssetFormData");
          sessionStorage.removeItem("newAssetFormData");
        }
        setSuccessModal({
          assetName: orchestrator.formData.assetName || "",
          assetCode: orchestrator.formData.assetCode || "",
        });
      } else {
        if (result.validationErrors && result.validationErrors.length > 0) {
          toast.error(`${result.error} (${result.validationErrors.join(", ")})`);
        } else {
          toast.error(result.error || t("notifications.finalSubmitFailed"));
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t("notifications.unexpectedSubmitError");
      toast.error(errorMsg);
    } finally {
      setIsFinalSubmitting(false);
    }
  };

  const handleSaveAndNext = async () => {
    if (currentStep === 1) {
      orchestrator.handleSaveAndNext(() => {
        setCompletedSteps((prev) => Array.from(new Set([...prev, 1])));
        const assetId = Number(orchestrator.assetId || orchestrator.formData.id || orchestrator.formData.assetId || searchParams.get("assetId") || searchParams.get("id") || 0);
        if (assetId > 0 && detectedStepKey && steps[1]) {
          const queryParams = new URLSearchParams(searchParams.toString());
          queryParams.set("id", String(assetId));
          queryParams.set("assetId", String(assetId));
          const queryStr = queryParams.toString();
          push(`/assets/municipal-Asset/new-add-new-asset/${assetId}/${steps[1].key}${queryStr ? `?${queryStr}` : ""}`);
        } else {
          setCurrentStep(2);
        }
      });
      return;
    }

    if (onSubmitHook) {
      const isStepValid = await onSubmitHook();
      if (!isStepValid) return;
    }

    if (currentStep === steps.length) {
      await handleFinalSubmit();
      return;
    }

    setCompletedSteps((prev) => Array.from(new Set([...prev, currentStep])));
    const nextStep = steps[currentStep];
    const assetId = Number(orchestrator.assetId || orchestrator.formData.id || orchestrator.formData.assetId || searchParams.get("assetId") || searchParams.get("id") || 0);
    if (assetId > 0 && detectedStepKey && nextStep) {
      const queryStr = searchParams.toString();
      push(`/assets/municipal-Asset/new-add-new-asset/${assetId}/${nextStep.key}${queryStr ? `?${queryStr}` : ""}`);
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handleSaveAsDraft = () => {
    if (currentStep === 1) {
      orchestrator.handleSaveAsDraft();
    }
  };

  const handlePrevious = () => {
    if (currentStep === 1) {
      push("/assets/municipal-Asset");
      return;
    }
    const prevStep = steps[currentStep - 2];
    const assetId = Number(orchestrator.assetId || orchestrator.formData.id || orchestrator.formData.assetId || searchParams.get("assetId") || searchParams.get("id") || 0);
    if (assetId > 0 && detectedStepKey && prevStep) {
      const queryStr = searchParams.toString();
      push(`/assets/municipal-Asset/new-add-new-asset/${assetId}/${prevStep.key}${queryStr ? `?${queryStr}` : ""}`);
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  };

  useNAInitialDataLoaders({ orchestrator, currentStep, setCvRollup });

  const activeStepKey = steps[currentStep - 1]?.key;

  return (
    <div className="flex h-[calc(100dvh-104px)] w-full bg-[#F8FAFC] overflow-hidden" style={{ fontFamily: "Inter, Arial, sans-serif" }}>
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        <NAProgressSteps currentStep={currentStep} completedSteps={completedSteps} onStepClick={goToStep} steps={steps} />

        {activeStepKey === "basic-info" ? (
          <NABasicInfoStepContent {...props} orchestrator={orchestrator} currentStep={currentStep} cvRollup={cvRollup} />
        ) : activeStepKey === "location" ? (
          <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6">
            <LocationOwnershipContent
              onPrevious={handlePrevious}
              onSaveAsDraft={handleSaveAsDraft}
              onSaveAndNext={handleSaveAndNext}
            />
          </div>
        ) : activeStepKey === "inventory" ? (
          <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6">
            <AssetsFacilitiesContent
              parentAssetId={props.parentAssetId ?? (resolvedAssetId > 0 ? resolvedAssetId : null)}
              initialLookups={props.initialLookups}
              initialBatches={props.initialBatches}
              assetCategoryId={
                props.initialWizardData?.categoryId
                  ? Number(props.initialWizardData.categoryId)
                  : orchestrator.formData.categoryId
                    ? Number(orchestrator.formData.categoryId)
                    : undefined
              }
            />
          </div>
        ) : activeStepKey === "review" ? (
          <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
            <ReviewSubmitContent
              assetId={resolvedAssetId}
              isBuilding={isBuilding}
              formData={orchestrator.formData}
              ownershipTypes={props.ownershipTypes}
              initialValuationData={props.initialValuationData}
              onEditStep={(stepNum) => {
                setIsConfirmed(false);
                const targetKey = stepNum === 1 ? "basic-info" : stepNum === 2 ? "location" : stepNum === 3 ? "inventory" : "review";
                const foundIdx = steps.findIndex((s) => s.key === targetKey);
                if (foundIdx !== -1) {
                  goToStep(foundIdx + 1);
                }
              }}
              isConfirmed={isConfirmed}
              setIsConfirmed={setIsConfirmed}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 flex items-center justify-center">
            <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md text-center shadow-sm">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-800 mb-1">
                {t("stepper.steps.review.title")}
              </h3>
              <p className="text-sm text-slate-500">
                {t("stepper.steps.review.subtitle") || "Final verification and submission workflow will be enabled in the upcoming release."}
              </p>
            </div>
          </div>
        )}

        <NAFooter
          currentStep={currentStep}
          totalSteps={steps.length}
          onPrevious={handlePrevious}
          onSaveAsDraft={handleSaveAsDraft}
          onSaveAndNext={handleSaveAndNext}
          isSaving={orchestrator.isSubmitting}
          isFinalSubmitting={isFinalSubmitting}
        />
      </div>

      {successModal && (
        <NAAssetSuccessModal
          assetName={successModal.assetName}
          assetCode={successModal.assetCode}
          onGoToDashboard={() => {
            setSuccessModal(null);
            push("/assets/municipal-Asset");
          }}
        />
      )}
    </div>
  );
}
