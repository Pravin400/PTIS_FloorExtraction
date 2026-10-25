"use client";

import { useEffect } from "react";
import { CheckCircle2, Building2, Landmark, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useNAAssetForm } from "./NAAssetFormContext";
import { Modal, Button } from "@/components/common";
import { useSearchParams } from "next/navigation";
import { SuccessModalProps } from "@/types/asset/municipal-Asset/new-add-new-asset/add-new-asset.types";

export default function NAAssetSuccessModal({ assetName, assetCode, onGoToDashboard }: SuccessModalProps) {
  const t = useTranslations("newAddNewAsset");
  const { formData } = useNAAssetForm();
  const searchParams = useSearchParams();

  const isEditMode = searchParams?.get('mode') === 'edit' && Boolean(searchParams?.get('assetId') && Number(searchParams?.get('assetId')) > 0);

  useEffect(() => {
    const timer = setTimeout(() => {
      onGoToDashboard();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onGoToDashboard]);

  const normalizedCategory = (formData.category || "").toLowerCase();
  
  const getCategoryIcon = () => {
    if (normalizedCategory.includes("building")) return <Building2 className="w-16 h-16" />;
    if (normalizedCategory.includes("land")) return <Landmark className="w-16 h-16" />;
    if (normalizedCategory.includes("infrastructure")) return <Activity className="w-16 h-16" />;
    return <CheckCircle2 className="w-16 h-16" />;
  };

  const getCategoryColor = () => {
    if (normalizedCategory.includes("building")) return { primary: "#1E5AA8", secondary: "#9CC7F0", bg: "#EAF4FD" };
    if (normalizedCategory.includes("land")) return { primary: "#059669", secondary: "#88C9A0", bg: "#D9F2E1" };
    if (normalizedCategory.includes("infrastructure")) return { primary: "#DC2626", secondary: "#FCA5A5", bg: "#FEF2F2" };
    return { primary: "#10B981", secondary: "#6EE7B7", bg: "#D1FAE5" };
  };

  const colors = getCategoryColor();

  const titleText = isEditMode 
    ? (t.has("wizard.successModal.updateTitle") ? t("wizard.successModal.updateTitle") : "Asset Successfully Updated!") 
    : (t.has("wizard.successModal.successTitle") ? t("wizard.successModal.successTitle") : "Asset Successfully Registered!");

  const subtitleText = isEditMode
    ? (t.has("wizard.successModal.updateSubtitle") ? t("wizard.successModal.updateSubtitle") : "Your asset details have been updated in the system")
    : (t.has("wizard.successModal.successSubtitle") ? t("wizard.successModal.successSubtitle") : "Your asset has been registered in the system");

  const noteText = isEditMode
    ? (t.has("wizard.successModal.updateNote") ? t("wizard.successModal.updateNote") : "The asset has been successfully updated in the Municipal Corporation Estate Management System. You can now view and manage it from the Asset Register.")
    : (t.has("wizard.successModal.successNote") ? t("wizard.successModal.successNote") : "The asset has been successfully registered in the Municipal Corporation Estate Management System. You can now view and manage it from your dashboard.");

  return (
    <Modal
      open={true}
      onClose={onGoToDashboard}
      title={titleText}
      maxWidth="sm"
      footer={
        <div className="w-full text-center">
          <Button
            variant="primary"
            onClick={onGoToDashboard}
            className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:scale-105 shadow-lg cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              boxShadow: `0 4px 12px ${colors.primary}40`
            }}
          >
            {isEditMode ? "Return to Asset Register" : (t.has("wizard.dashboardRedirect") ? t("wizard.dashboardRedirect") : "Go to Dashboard")}
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2 font-medium">
            {isEditMode 
              ? "Redirecting to asset register in 5 seconds..." 
              : (t.has("wizard.successModal.autoCloseText") ? t("wizard.successModal.autoCloseText") : "Redirecting to dashboard in 5 seconds...")}
          </p>
        </div>
      }
    >
      <div className="relative text-center pb-4">
        <div
          className="pt-4 pb-6 px-6 text-center rounded-xl mb-4"
          style={{ background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.secondary}40 100%)` }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", damping: 15 }}
            className="inline-flex items-center justify-center rounded-full p-4 mb-4"
            style={{
              backgroundColor: colors.primary,
              boxShadow: `0 0 30px ${colors.primary}60, 0 10px 20px ${colors.primary}40`
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", damping: 10 }}
              style={{ color: "white" }}
            >
              {getCategoryIcon()}
            </motion.div>
          </motion.div>

          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", damping: 12 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500"
              style={{ boxShadow: "0 0 30px rgba(34, 197, 94, 0.6), 0 10px 20px rgba(34, 197, 94, 0.4)" }}
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-gray-600 font-medium mt-2"
          >
            {subtitleText}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3 text-left"
        >
          {assetCode && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
              <span className="text-xs font-semibold text-gray-600">{t.has("wizard.assetNoLabel") ? t("wizard.assetNoLabel") : "Asset Code"}</span>
              <span className="text-sm font-bold font-mono" style={{ color: colors.primary }}>
                {assetCode}
              </span>
            </div>
          )}

          {formData.category && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
              <span className="text-xs font-semibold text-gray-600">{t.has("basicInfo.propertyDetails.assetCategory") ? t("basicInfo.propertyDetails.assetCategory") : "Category"}</span>
              <span
                className="text-sm font-bold capitalize px-3 py-1 rounded-full"
                style={{ backgroundColor: colors.bg, color: colors.primary }}
              >
                {formData.category}
              </span>
            </div>
          )}

          {formData.assetType && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
              <span className="text-xs font-semibold text-gray-600">{t.has("basicInfo.propertyDetails.assetType") ? t("basicInfo.propertyDetails.assetType") : "Asset Type"}</span>
              <span className="text-sm font-bold text-gray-800">{formData.assetType}</span>
            </div>
          )}

          {assetName && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
              <span className="text-xs font-semibold text-gray-600">{t.has("wizard.assetNameLabel") ? t("wizard.assetNameLabel") : "Asset Name"}</span>
              <span className="text-sm font-bold text-gray-800">{assetName}</span>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-5 p-4 rounded-xl border-2"
          style={{ background: `linear-gradient(135deg, ${colors.bg} 0%, white 100%)`, borderColor: colors.secondary }}
        >
          <p className="text-xs text-gray-700 text-center leading-relaxed font-medium">
            {noteText}
          </p>
        </motion.div>

        <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-full h-full"
            style={{ color: colors.primary }}
          >
            {getCategoryIcon()}
          </motion.div>
        </div>
      </div>
    </Modal>
  );
}
