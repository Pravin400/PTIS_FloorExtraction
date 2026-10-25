"use client";


import { Modal } from "@/components/common/Modal";
import { useTranslations } from "next-intl";
import type { TypeOfUseItem } from "@/types/typeOfUse.types";

interface TypeOfUseModalProps {
  open: boolean;
  items: TypeOfUseItem[];
  onClose: () => void;
  propertyDescription?: string | null;
  typeOfUseLabel?: string;
}

export default function TypeOfUseModal({
  open,
  items,
  onClose,
  propertyDescription = null,
  typeOfUseLabel,
}: TypeOfUseModalProps) {
  const t = useTranslations("propertyType.propertyType");
  const typeOfUse = typeOfUseLabel || t("aliasFallback.typeOfUse");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("modal.title", { typeOfUse })}
      subtitle={propertyDescription ? t("modal.propertySubtitle", { description: propertyDescription }) : t("modal.subtitle", { typeOfUse })}
      count={items.length}
      maxWidth="xl"
      footer={
        <button
          onClick={onClose}
          className="
            px-5 py-2 text-sm font-medium
            text-gray-600 bg-gray-100
            rounded-lg border border-gray-200 hover:bg-gray-200
            transition-colors
          "
        >
          {t("modal.close")}
        </button>
      }
    >
      {/* Ultra-compact professional layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-0">
        {items.map((item) => (
          <div
            key={item.id}
            className="
              flex items-baseline gap-3 py-2
              border-b border-dashed border-gray-200
              last:border-0
            "
          >
            <span className="
              shrink-0 font-mono text-xs font-bold
              text-blue-600 bg-blue-50
              px-2 py-0.5 rounded
            ">
              {item.id}
            </span>

            <span
              className="text-sm text-gray-600 truncate"
              title={item.description}
            >
              {item.description}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
