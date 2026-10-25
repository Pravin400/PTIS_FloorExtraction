'use client';

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { OffSetForm } from "./OffSetForm";
import type { FullOffSetFormProps } from "@/types/offset-details.types";

/**
 * OffSetMinus - Modal wrapper for OffSetForm
 * Uses createPortal pattern (same as ConfirmProvider) instead of Radix Dialog.
 * Renders a portal-based overlay + centered modal.
 */
export function OffSetMinus(props: FullOffSetFormProps) {
    const {
        shouldShake,
        offsetModalOpen,
        offsetModalRef,
        offsetShapeRef,
    } = props;

    const [mounted, setMounted] = useState(false);

    // SSR-safe: wait until mounted before using createPortal
    useEffect(() => {
        setMounted(true);
    }, []);

    // Auto-focus the shape select when modal opens
    useEffect(() => {
        if (offsetModalOpen && offsetShapeRef?.current) {
            // Small delay for the portal to render
            const timer = setTimeout(() => {
                offsetShapeRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [offsetModalOpen, offsetShapeRef]);



    // Don't render if not mounted (SSR) or not open
    if (!mounted || typeof document === "undefined" || !offsetModalOpen) {
        return null;
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop - same style as ConfirmProvider */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => e.preventDefault()}
            />

            {/* Modal Content */}
            <div
                ref={offsetModalRef}
                role="dialog"
                aria-modal="true"
                aria-describedby="offset-description"
                data-modal-id="offset-details"
                className={`relative max-w-[95%] w-[95%] md:max-w-[600px] md:w-[600px] p-0 flex flex-col shadow-2xl transition-transform rounded-2xl overflow-hidden z-[10000] bg-white ${shouldShake ? "animate-shake-increment" : ""
                    }`}
            >
                <OffSetForm {...props} isInline={false} />
            </div>
        </div>,
        document.body
    );
}
