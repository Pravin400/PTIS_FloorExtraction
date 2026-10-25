import { mapTypeNameToKey } from "@/lib/utils/building-helpers";
import {
    FINANCIAL_TAX_CERTIFICATES,
    BUILDING_APPROVAL_CERTIFICATES,
    SAFETY_NOC_CERTIFICATES,
    PROPERTY_IDENTITY_CERTIFICATES
} from "./validation-constants";

export const MIN_CONSTRUCTION_YEAR = 1800;
export const MAX_CONSTRUCTION_YEAR = 2200;

export const toLocalIsoDate = (d = new Date()): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const hasValidDocumentGuid = (g?: string | null): boolean => {
    if (!g || typeof g !== "string") return false;
    const clean = g.trim().toLowerCase();
    return clean !== "" && !["null", "undefined", "temp-guid", "pending", "00000000-0000-0000-0000-000000000000"].includes(clean);
};

export const sanitizeCertificateNumber = (v: string, numericOnly: boolean): string => {
    const s = v.replace(/\s+/g, "");
    return numericOnly ? s.replace(/\D/g, "") : s;
};

export const ALLOWED_DOCUMENT_EXTENSIONS = ["pdf", "png", "jpg", "jpeg"] as const;
export const MAX_DOCUMENT_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const isValidDocumentFile = (file: File): boolean => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(ext as (typeof ALLOWED_DOCUMENT_EXTENSIONS)[number])) {
        return false;
    }
    if (file.size > MAX_DOCUMENT_FILE_SIZE) {
        return false;
    }
    return true;
};

export interface LengthRule {
    min: number;
    max: number;
}

export interface ValidationError {
    key: string;
    params?: Record<string, string | number>;
}

export const getCertificateLengthRule = (typeName?: string, typeCode?: string): LengthRule => {
    const typeKey = mapTypeNameToKey(typeName || "", typeCode);
    if (
        typeKey === "commencementCertificate" ||
        typeKey === "occupancyCertificate" ||
        typeKey === "possessionCertificate" ||
        typeKey === "buildCompletionCertificate"
    ) {
        return { min: 5, max: 50 };
    }
    if (typeKey === "index2") {
        return { min: 8, max: 25 };
    }
    if (typeKey === "electricBill") {
        return { min: 9, max: 12 };
    }
    if (typeKey === "aadharCard") {
        return { min: 12, max: 12 };
    }
    if (typeKey === "agreement" || typeKey === "saleDeed") {
        return { min: 3, max: 50 };
    }
    if (typeKey === "taxReceipt") {
        return { min: 4, max: 30 };
    }
    if (typeKey === "other") {
        return { min: 2, max: 50 };
    }
    if (typeName && FINANCIAL_TAX_CERTIFICATES.includes(typeName)) return { min: 6, max: 25 };
    if (typeName && BUILDING_APPROVAL_CERTIFICATES.includes(typeName)) return { min: 8, max: 40 };
    if (typeName && SAFETY_NOC_CERTIFICATES.includes(typeName)) return { min: 6, max: 30 };
    if (typeName && PROPERTY_IDENTITY_CERTIFICATES.includes(typeName)) return { min: 5, max: 30 };
    return { min: 1, max: 100 };
};

const isRepeatedNumber = (val: string): boolean => {
    if (val.length < 2) return false;
    return /^([a-zA-Z0-9])\1+$/.test(val);
};

const isDummyOrRepeated = (val: string): boolean => {
    if (/^(.)\1+$/.test(val)) return true;
    const lowercaseVal = val.toLowerCase();
    const dummyWords = [
        "dummy", "test", "demo", "placeholder", "nil", "none", "null", 
        "sample", "temp", "qwerty", "asdf", "xyz", "abc"
    ];
    const sequences = [
        "123456", "234567", "345678", "456789", "012345",
        "987654", "876543", "765432", "654321", "543210",
        "abcdef", "bcdefg", "cdefgh", "defghi", "efghij", "fghijk",
        "fedcba"
    ];
    if (dummyWords.some(word => lowercaseVal.includes(word)) || lowercaseVal === "na" || lowercaseVal === "n/a") {
        return true;
    }
    if (sequences.some(seq => lowercaseVal.includes(seq))) {
        return true;
    }
    return false;
};

export const validateDocumentNumber = (
    number: string | null | undefined,
    typeName?: string,
    typeCode?: string
): ValidationError | null => {
    if (!number || number.trim() === "") {
        return { key: "common.validation.numberRequired" };
    }

    const trimmedNumber = number.trim();

    if (/\s/.test(trimmedNumber)) {
        return { key: "common.validation.numberNoSpaces" };
    }

    if (/^0+$/.test(trimmedNumber)) {
        return { key: "common.validation.numberAllZeros" };
    }

    if (isRepeatedNumber(trimmedNumber)) {
        return { key: "common.validation.numberRepeated" };
    }

    const typeKey = mapTypeNameToKey(typeName || "", typeCode);

    if (
        typeKey === "commencementCertificate" ||
        typeKey === "occupancyCertificate" ||
        typeKey === "possessionCertificate" ||
        typeKey === "buildCompletionCertificate"
    ) {
        const copRegex = /^[A-Za-z0-9\/\-]{5,50}$/;
        if (!copRegex.test(trimmedNumber)) {
            return { key: "common.validation.numberInvalidCOP" };
        }
    } else if (typeKey === "electricBill") {
        const electricRegex = /^\d{9,12}$/;
        if (!electricRegex.test(trimmedNumber)) {
            return { key: "common.validation.numberInvalidElectric" };
        }
    } else if (typeKey === "index2") {
        const index2Regex = /^[A-Za-z0-9]{2,8}[-\/]\d{1,8}[-\/]\d{4}$/;
        if (!index2Regex.test(trimmedNumber)) {
            return { key: "common.validation.numberInvalidIndex2" };
        }
    } else if (typeKey === "aadharCard") {
        if (!/^\d{12}$/.test(trimmedNumber)) {
            return { key: "common.validation.numberInvalidAadhar" };
        }
        if (/^[01]/.test(trimmedNumber)) {
            return { key: "common.validation.numberInvalidAadharStart" };
        }
    } else if (typeKey === "agreement") {
        const agreementRegex = /^[A-Za-z0-9\/\-]{3,50}$/;
        if (!agreementRegex.test(trimmedNumber)) {
            return { key: "common.validation.numberInvalidAgreement" };
        }
    } else if (typeKey === "saleDeed") {
        const saleDeedRegex = /^[A-Za-z0-9\/\-]{3,50}$/;
        if (!saleDeedRegex.test(trimmedNumber)) {
            return { key: "common.validation.numberInvalidSaleDeed" };
        }
    } else if (typeKey === "taxReceipt") {
        const taxReceiptRegex = /^[A-Za-z0-9\/\-]{4,30}$/;
        if (!taxReceiptRegex.test(trimmedNumber)) {
            return { key: "common.validation.numberInvalidTaxReceipt" };
        }
    } else if (typeKey === "other") {
        const otherRegex = /^[A-Za-z0-9\/\-_]{2,50}$/;
        if (!otherRegex.test(trimmedNumber)) {
            return { key: "common.validation.numberInvalidOther" };
        }
    } else {
        const rule = getCertificateLengthRule(typeName, typeCode);
        if (trimmedNumber.length < rule.min || trimmedNumber.length > rule.max) {
            return { key: "common.validation.numberLength", params: { min: rule.min, max: rule.max } };
        }
        const allowedCharsRegex = /^[a-zA-Z0-9\-_/]+$/;
        if (!allowedCharsRegex.test(trimmedNumber)) {
            return { key: "common.validation.numberInvalidCharacters" };
        }
    }

    if (isDummyOrRepeated(trimmedNumber)) {
        return { key: "common.validation.numberDummyText" };
    }

    return null;
};

export const parseDateString = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr || dateStr.trim() === "") return null;
    const cleanStr = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.trim();
    const parts = cleanStr.split(/[-/]/);
    if (parts.length !== 3) return null;

    let year: number;
    let month: number;
    let day: number;

    if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
    } else {
        return null;
    }

    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

    const utcTime = Date.UTC(year, month, day);
    const dateObj = new Date(utcTime);
    const dateIsValid = !isNaN(utcTime) && 
                        dateObj.getUTCFullYear() === year && 
                        dateObj.getUTCMonth() === month && 
                        dateObj.getUTCDate() === day;
    return dateIsValid ? dateObj : null;
};

export const validateDocumentDate = (
    date: string | null | undefined
): ValidationError | null => {
    if (!date || date.trim() === "") {
        return { key: "common.validation.dateRequired" };
    }

    const dateObj = parseDateString(date);
    if (!dateObj) {
        return { key: "common.validation.invalidDate" };
    }

    const now = new Date();
    const todayTime = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    if (dateObj.getTime() > todayTime) {
        return { key: "common.validation.dateFuture" };
    }
    if (dateObj.getTime() < Date.UTC(1900, 0, 1)) {
        return { key: "common.validation.dateBefore1900" };
    }

    return null;
};
