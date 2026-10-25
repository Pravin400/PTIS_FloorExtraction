"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/ActionButton";
import {
  UploadButton,
  ViewButton,
  DownloadIconButton,
  DeleteButton,
  CancelButton,
  SaveButton,
} from "@/components/common/ActionButtons";
import { useConfirm } from "@/components/common/ConfirmProvider";
import {
  fetchUlbDocumentsAction,
  uploadUlbDocumentAction,
  deleteUlbDocumentAction,
} from "@/app/[locale]/property-tax/taxzoningmaster/actions";
import { UlbDocument, TaxZoningDocumentKind } from "@/types/taxZoningRange.types";
import { TAX_ZONING_DOCUMENT_TYPE_CODE } from "@/lib/constants/document.constants";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

const KIND_TO_CODE: Record<TaxZoningDocumentKind, string> = {
  LIST: TAX_ZONING_DOCUMENT_TYPE_CODE.LIST,
  MAP: TAX_ZONING_DOCUMENT_TYPE_CODE.MAP,
};

const CODE_TO_KIND: Record<string, TaxZoningDocumentKind> = {
  [TAX_ZONING_DOCUMENT_TYPE_CODE.LIST]: "LIST",
  [TAX_ZONING_DOCUMENT_TYPE_CODE.MAP]: "MAP",
};

const ALLOWED_EXTENSIONS: Record<TaxZoningDocumentKind, string[]> = {
  LIST: ["pdf"],
  MAP: ["pdf", "jpg", "jpeg", "png"],
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export default function DocumentsShowcase() {
  const t = useTranslations("taxZoningRange");
  const tUi = useTranslations("taxZoningRange.ui.certifiedDocs");
  const zoneLabel = useAliasLabel("Tax Zone", t("aliasFallback.taxZone"));
  const { confirm } = useConfirm();
  const [activeModal, setActiveModal] = useState<TaxZoningDocumentKind | null>(null);
  const [docs, setDocs] = useState<Record<TaxZoningDocumentKind, UlbDocument | null>>({
    LIST: null,
    MAP: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tempFile, setTempFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadDocs = async () => {
    const result = await fetchUlbDocumentsAction(Object.values(TAX_ZONING_DOCUMENT_TYPE_CODE));
    if (result.success) {
      const next: Record<TaxZoningDocumentKind, UlbDocument | null> = {
        LIST: null,
        MAP: null,
      };
      result.data.forEach((d) => {
        const kind = CODE_TO_KIND[d.documentTypeCode];
        if (kind) next[kind] = d;
      });
      setDocs(next);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDocs();
  }, []);

  const validateSelectedFile = (file: File, kind: TaxZoningDocumentKind): boolean => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowed = ALLOWED_EXTENSIONS[kind];

    if (!allowed.includes(ext)) {
      const formattedAllowed = allowed.map((a) => a.toUpperCase()).join(", ");
      toast.error(t("messages.invalidDocumentType", { allowedTypes: formattedAllowed }));
      return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(t("messages.maxFileSizeExceeded"));
      return false;
    }

    return true;
  };

  const handleOpenModal = (kind: TaxZoningDocumentKind) => {
    setActiveModal(kind);
    setTempFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setTempFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeModal) return;

    if (!validateSelectedFile(file, activeModal)) {
      e.target.value = "";
      setTempFile(null);
      return;
    }

    setTempFile(file);
  };

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempFile || !activeModal) return;

    if (!validateSelectedFile(tempFile, activeModal)) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", tempFile);
      formData.set("documentTypeCode", KIND_TO_CODE[activeModal]);

      const result = await uploadUlbDocumentAction(formData);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message || t("messages.uploadCertificateSuccess"));
      handleCloseModal();
      await loadDocs();
    });
  };

  const handleViewOrDownload = (doc: UlbDocument | null, mode: "view" | "download") => {
    if (!doc?.documentGuid) return;
    window.open(`/api/documents/${doc.documentGuid}/${mode}`, "_blank");
  };

  const handleDelete = (kind: TaxZoningDocumentKind) => {
    const doc = docs[kind];
    if (!doc) return;
    confirm({
      variant: "delete",
      title: t("messages.deleteConfirmTitle"),
      description: t("messages.deleteConfirmDescription"),
      meta: { id: doc.id, name: doc.originalFileName ?? doc.documentTypeName },
      onConfirm: async () => {
        const result = await deleteUlbDocumentAction(doc.id);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success(result.message || t("messages.deleteCertificateSuccess"));
        await loadDocs();
      },
    });
  };

  const renderDoc = (
    kind: TaxZoningDocumentKind,
    title: string,
    badge: string,
    badgeClass: string,
    subtitle: string
  ) => {
    const doc = docs[kind];
    return (
      <article className="min-h-[64px] grid grid-cols-[42px_1fr_auto] items-center gap-3 p-2 border border-[#cbdced] rounded-[10px] bg-gradient-to-b from-white to-[#f8fbff] hover:border-[#8bb9df] hover:-translate-y-[1px] transition-all">
        <div className={`w-[42px] h-[42px] rounded-[9px] flex items-center justify-center ${badgeClass} shadow-[0_4px_10px_rgba(29,62,104,.10)]`}>
          <span className="font-black text-[9px]">{badge}</span>
        </div>
        <div className="min-w-0">
          <h3 className="m-0 text-[#0b315c] text-[11px] font-semibold truncate">{title}</h3>
          <div className="mt-0.5 text-[#718096] text-[8px] font-bold uppercase tracking-wider">{subtitle}</div>
          {doc?.originalFileName ? (
            <div className="mt-1 text-[#147247] text-[10px] font-bold truncate">{doc.originalFileName}</div>
          ) : (
            <div className="mt-1 text-[#53677d] text-[9px]">{tUi("notUploaded")}</div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {doc?.documentGuid ? (
            <>
              <ViewButton title="View" onClick={() => handleViewOrDownload(doc, "view")} />
              <DownloadIconButton title="Download" onClick={() => handleViewOrDownload(doc, "download")} />
              <DeleteButton title="Delete" onClick={() => handleDelete(kind)} />
            </>
          ) : (
            <UploadButton onClick={() => handleOpenModal(kind)} className="h-[27px] text-[10px] font-bold" />
          )}
        </div>
      </article>
    );
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-[0_6px_20px_rgba(24,66,112,.08)] border border-[#b9d0e7] overflow-hidden relative mb-3">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#48a6e8] to-[#17508e] z-10"></div>

        <div className="min-h-[42px] px-4 py-2 flex items-center justify-between gap-3 bg-gradient-to-r from-[#e9f5ff] via-[#f8fbff] to-[#edf7ff] border-b border-[#d8e2ef] pl-5">
          <div className="flex items-center gap-2">
            <div className="min-w-[25px] h-[25px] flex items-center justify-center rounded-lg bg-[#17508e] text-white font-extrabold text-[11px]">
              1
            </div>
            <div>
              <h2 className="m-0 text-[14px] text-[#0b2f5b] font-semibold">{tUi("heading")}</h2>
            </div>
          </div>
        </div>

        <div className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {renderDoc("LIST", tUi("listTitle"), "PDF", "bg-gradient-to-br from-[#fff1f2] to-[#ffe2e5] border border-[#f2bcc2] text-[#bd2133]", tUi("listSubtitle"))}
            {renderDoc("MAP", tUi("mapTitle", { zone: zoneLabel }), "MAP", "bg-gradient-to-br from-[#ecfbf5] to-[#e2f4ff] border border-[#b9ddcf] text-[#344b8e]", tUi("mapSubtitle"))}
          </div>
        </div>
      </div>

      <Modal
        open={activeModal !== null}
        onClose={handleCloseModal}
        title={<span className="text-[17px] font-bold text-[#0b2f5b]">{activeModal === "LIST" ? tUi("listUploadModalTitle") : tUi("mapUploadModalTitle", { zone: zoneLabel })}</span>}
        maxWidth="md"
      >
        <form onSubmit={handleSaveDoc} className="p-5 flex flex-col gap-4 text-[#172033]">
          <div className="flex flex-col gap-1">
            <Input
              type="file"
              label={`${tUi("selectFile")} *`}
              accept={activeModal === "LIST" ? ".pdf" : ".pdf,.jpg,.jpeg,.png"}
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 px-4 bg-[#eef5fd] border border-[#cfe0f2] text-[#123d70] text-[12px] font-extrabold rounded-lg hover:bg-[#e2effc]"
              >
                {tUi("chooseFile")}
              </Button>
              <span className="text-[12px] font-bold text-[#147247] truncate max-w-[200px]">
                {tempFile ? tempFile.name : tUi("noFileSelected")}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <CancelButton
              label={tUi("cancel")}
              onClick={handleCloseModal}
              className="h-9 px-4 text-[12px] rounded-lg"
            />
            <SaveButton
              type="submit"
              label={isPending ? tUi("saving") : tUi("saveDocument")}
              disabled={!tempFile || isPending}
              className="h-9 px-4 text-[12px] rounded-lg"
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
