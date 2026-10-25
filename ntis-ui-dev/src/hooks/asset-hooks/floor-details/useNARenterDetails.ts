/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { RenterDetailsData } from "@/types/asset/new-renter.types";
import { calculateDuration } from "@/lib/utils/asset-utils/new-add-new-asset/child-asset/date-utils";
import { useTransliteration } from "@/hooks/asset-hooks/useTransliteration";
import { useParams } from "next/navigation";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPAN(pan: string) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
}

export function useNARenterDetails(renterData: RenterDetailsData, isOpen: boolean, onSave: (data: any) => void, onClose: () => void, t: any) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [form, setForm] = useState({
    renterNameEnglish: "",
    renterNameLocal: "",
    agreementId: "",
    agreementFromDate: "",
    agreementToDate: "",
    rentMonthly: "",
    rentYearly: "",
    rentType: "",
    duration: "",
    rentFreq: "Monthly",
    securityDeposit: "",
    depositType: "Refundable",
    mobileNo: "",
    emailId: "",
    aadhaar: "",
    pan: "",
    tenantAddress: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { handleBlurTransliterate, scheduleAutoTransliterate } = useTransliteration(
    locale,
    form.renterNameLocal,
    (converted) => {
      setForm((prev) => ({ ...prev, renterNameLocal: converted }));
    }
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => { setForm({
        renterNameEnglish: renterData.renterNameEnglish || "",
        renterNameLocal: renterData.renterNameLocal || "",
        agreementId: renterData.agreementId || renterData.agreementNo || "",
        agreementFromDate: renterData.agreementFromDate ? renterData.agreementFromDate.substring(0, 10) : "",
        agreementToDate: renterData.agreementToDate ? renterData.agreementToDate.substring(0, 10) : "",
        rentMonthly: renterData.rentMonthly !== undefined && renterData.rentMonthly !== null ? String(renterData.rentMonthly) : "",
        rentYearly: renterData.rentYearly !== undefined && renterData.rentYearly !== null ? String(renterData.rentYearly) : "",
        rentType: renterData.rentType || "",
        duration: renterData.duration || "",
        rentFreq: renterData.rentFreq || "Monthly",
        securityDeposit: renterData.securityDeposit !== undefined && renterData.securityDeposit !== null ? String(renterData.securityDeposit) : "",
        depositType: renterData.depositType || "Refundable",
        mobileNo: renterData.mobileNo || "",
        emailId: renterData.emailId || "",
        aadhaar: renterData.aadhaar || "",
        pan: renterData.pan || "",
        tenantAddress: renterData.tenantAddress || "",
      });
      setErrors({});
    }, 0);
    }
  }, [isOpen, renterData]);

  useEffect(() => {
    if (form.agreementFromDate && form.agreementToDate) {
      const computed = calculateDuration(form.agreementFromDate, form.agreementToDate, t);
      setTimeout(() => { setForm((prev) => ({ ...prev, duration: computed })); }, 0);
    } else {
      setTimeout(() => { setForm((prev) => ({ ...prev, duration: "" })); }, 0);
    }
  }, [form.agreementFromDate, form.agreementToDate, t]);

  // Real-time date cross-validation
  useEffect(() => {
    if (form.agreementFromDate && form.agreementToDate) {
      if (new Date(form.agreementFromDate) >= new Date(form.agreementToDate)) {
        setTimeout(() => { setErrors((e) => ({ ...e, agreementToDate: 'Agreement end date must be after start date' })); }, 0);
      } else {
        setTimeout(() => { setErrors((e) => {
          if (e.agreementToDate === 'Agreement end date must be after start date') {
            const next = { ...e };
            delete next.agreementToDate;
            return next;
          }
          return e;
        }); }, 0);
      }
    } else {
      setTimeout(() => { setErrors((e) => {
        if (e.agreementToDate === 'Agreement end date must be after start date') {
          const next = { ...e };
          delete next.agreementToDate;
          return next;
        }
        return e;
      }); }, 0);
    }
  }, [form.agreementFromDate, form.agreementToDate]);

  const handleMonthlyRentChange = (val: string) => {
    const monthlyVal = val.replace(/[^\d.]/g, "");
    setForm((prev) => {
      const numericMonthly = parseFloat(monthlyVal);
      const calculatedYearly = !isNaN(numericMonthly) ? String(Math.round(numericMonthly * 12)) : "";
      return { ...prev, rentMonthly: monthlyVal, rentYearly: calculatedYearly };
    });
    if (errors.rentMonthly) setErrors((prev) => ({ ...prev, rentMonthly: "" }));
  };

  const handleFieldChange = (key: string, val: string) => {
    let sanitizedVal = val;
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('name') && typeof sanitizedVal === 'string') {
      sanitizedVal = sanitizedVal.replace(/\b\w/g, (char) => char.toUpperCase());
    }
    setForm((prev) => ({ ...prev, [key]: sanitizedVal }));
    
    if (key === 'renterNameEnglish') {
      scheduleAutoTransliterate(sanitizedVal);
    }
    
    // Clear the field's own non-cross error
    setTimeout(() => { setErrors((e) => {
      if (e[key] && e[key] !== 'Agreement end date must be after start date') {
        const next = { ...e };
        delete next[key];
        return next;
      }
      return e;
    }); }, 0);
  };

  const handleLocalNameBlur = async (val: string) => {
    await handleBlurTransliterate(val);
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};

    // ── Required fields ───────────────────────────────────────────────────────
    if (!form.renterNameEnglish.trim()) {
      newErrors.renterNameEnglish =
        t("floorDetails.renterNameEnglishRequired") || "Renter name is required";
    }

    if (form.rentType) {
      // Agreement dates and rent are required when a lease/rent type is chosen
      if (!form.agreementFromDate) {
        newErrors.agreementFromDate =
          t("floorDetails.agreementFromDateRequired") || "Agreement start date is required";
      }
      if (!form.agreementToDate) {
        newErrors.agreementToDate =
          t("floorDetails.agreementToDateRequired") || "Agreement end date is required";
      }
      if (!form.rentMonthly || parseFloat(form.rentMonthly) <= 0) {
        newErrors.rentMonthly =
          t("floorDetails.rentMonthlyRequired") || "Monthly rent is required";
      }
    }

    // ── Format validations (only when a value is provided) ────────────────────
    if (form.mobileNo && form.mobileNo.replace(/\D/g, "").length !== 10) {
      newErrors.mobileNo = "Mobile number must be exactly 10 digits";
    }

    if (form.emailId && !isValidEmail(form.emailId)) {
      newErrors.emailId = "Please enter a valid email address";
    }

    if (form.aadhaar && form.aadhaar.replace(/\D/g, "").length !== 12) {
      newErrors.aadhaar = "Aadhaar number must be exactly 12 digits";
    }

    if (form.pan && !isValidPAN(form.pan)) {
      newErrors.pan = "PAN must follow the format: AAAAA0000A";
    }

    if (form.rentMonthly && parseFloat(form.rentMonthly) < 0) {
      newErrors.rentMonthly = "Monthly rent cannot be negative";
    }

    if (form.securityDeposit && parseFloat(form.securityDeposit) < 0) {
      newErrors.securityDeposit = "Security deposit cannot be negative";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the highlighted errors before saving.");
      return;
    }

    onSave({
      renterNameEnglish: form.renterNameEnglish.trim(),
      renterNameLocal: form.renterNameLocal.trim(),
      agreementId: form.agreementId.trim(),
      agreementNo: form.agreementId.trim(),
      agreementFromDate: form.agreementFromDate,
      agreementToDate: form.agreementToDate,
      rentMonthly: parseFloat(form.rentMonthly) || 0,
      rentYearly: parseFloat(form.rentYearly) || 0,
      rentType: form.rentType,
      duration: form.duration,
      rentFreq: form.rentFreq,
      securityDeposit: form.securityDeposit ? parseFloat(form.securityDeposit) : 0,
      depositType: form.depositType,
      mobileNo: form.mobileNo,
      emailId: form.emailId,
      aadhaar: form.aadhaar,
      pan: form.pan,
      tenantAddress: form.tenantAddress ? form.tenantAddress.trim() : "",
    });
    onClose();
  };

  return { form, errors, handleMonthlyRentChange, handleFieldChange, handleLocalNameBlur, handleSave };
}
