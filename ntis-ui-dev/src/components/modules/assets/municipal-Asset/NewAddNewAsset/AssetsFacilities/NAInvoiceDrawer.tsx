import type { NAInvoiceDrawerProps } from "@/types/asset/municipal-Asset/new-add-new-asset";
import React, { useRef } from "react";
import { useTranslations } from "next-intl";
import { Drawer, Button, UploadButton, Input } from "@/components/common";
import { FileText, Receipt, Calendar, Eye, Trash2, UploadCloud } from "lucide-react";

const toDisplayDate = (val: string) => {
  if (!val) return '';
  const ymdMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) return `${ymdMatch[3]}/${ymdMatch[2]}/${ymdMatch[1]}`;
  const parts = val.split('/');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return val;
};

const toValueDate = (val: string) => {
  if (!val) return '';
  const parts = val.split('/');
  if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return val;
};

const formatManualDate = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 8);
  let res = '';
  if (digits.length > 0) res += digits.slice(0, 2);
  if (digits.length > 2) res += '/' + digits.slice(2, 4);
  if (digits.length > 4) res += '/' + digits.slice(4, 8);
  return res;
};




export function NAInvoiceDrawer({
  // component

  open,
  onClose,
  invoiceForm,
  updateInvoiceForm,
  invoiceInputRef,
  handleInvoiceUpload,
  saveInvoiceDetails,
  editingRow = null,
  onPreview,
  onDownload,
}: NAInvoiceDrawerProps) {
  const t = useTranslations("newAddNewAsset");
  const invoiceDoc = editingRow?.documents?.find((d: { documentTypeId?: number | string; documentTypeCode?: string }) => d.documentTypeId === 2 || String(d.documentTypeCode || '').toLowerCase().includes("invoice")
  );

  const invoiceDateRef = useRef<HTMLInputElement>(null);

  const triggerInvoiceDatePicker = () => {
    if (invoiceDateRef.current) {
      try {
        if (typeof invoiceDateRef.current.showPicker === 'function') invoiceDateRef.current.showPicker();
        else invoiceDateRef.current.click();
      } catch (_e) {
        invoiceDateRef.current.click();
      }
    }
  };

  const handleInvoiceDateTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatManualDate(e.target.value).slice(0, 10);
    const valDate = toValueDate(formatted);
    updateInvoiceForm("invoiceDate", valDate);
  };
  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="md"
      
      title={
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 id="drawer-title" className="text-[16px] font-bold text-slate-800">
              {t("addInvoiceDetails") || "Add Invoice Details"}
            </h3>
            <p className="text-[12px] font-medium text-slate-500 mt-0.5">
              {t("invoiceSubtitle") || "Invoice details can be reused for multiple items."}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="ghost" onClick={onClose} className="!text-slate-600 hover:!bg-slate-100">{t("cancel") || "Cancel"}</Button>
          <Button variant="primary" icon={Receipt} onClick={saveInvoiceDetails} className="!bg-blue-600 hover:!bg-blue-700 shadow-sm">{t("saveDetails") || "Save Details"}</Button>
        </div>
      }
    >
      <div className="p-6 bg-slate-50/50 min-h-full">
        <div className="rounded-xl bg-white p-5 border border-slate-200 shadow-sm space-y-5">
              <div className="space-y-1.5">
                <span className="text-[13px] font-semibold text-slate-700">{t("uploadInvoiceDoc") || "Upload Invoice Document"}</span>
                <Input
                  ref={invoiceInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleInvoiceUpload}
                />
                {(invoiceForm.invoiceFileName || invoiceForm.invoiceFile) ? (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/50 text-[12px] shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-800 truncate max-w-[200px]" title={invoiceForm.invoiceFileName || "Uploaded Invoice"}>
                          {invoiceForm.invoiceFileName || "Uploaded Invoice"}
                        </span>
                        <span className="text-[11px] text-blue-600 font-semibold">
                          {invoiceForm.invoiceFile ? `${(invoiceForm.invoiceFile.size / 1024).toFixed(1)} KB` : (invoiceDoc?.fileSize ? `${(invoiceDoc.fileSize / 1024).toFixed(1)} KB` : "Document Uploaded")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (invoiceForm.invoiceFile) {
                            window.open(URL.createObjectURL(invoiceForm.invoiceFile), "_blank");
                          } else if (invoiceDoc) {
                            onPreview(invoiceDoc);
                          }
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        title="View Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t("view") || "View"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => invoiceInputRef.current?.click()}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        title="Replace Document"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{t("replace") || "Replace"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateInvoiceForm("invoiceFileName", "");
                          updateInvoiceForm("invoiceFile", null);
                          if (invoiceInputRef.current) invoiceInputRef.current.value = "";
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100/70 rounded-lg transition-colors cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t("delete") || "Delete"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <UploadButton
                    label="Choose file..."
                    className="w-full justify-start cursor-pointer"
                    onClick={() => invoiceInputRef.current?.click()}
                  />
                )}
              </div>

              <Input
                label="Invoice Number"
                placeholder="e.g. INV-2024-001"
                value={invoiceForm.invoiceNumber || ""}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateInvoiceForm("invoiceNumber", event.target.value)}
                maxLength={50}
              />

              <div className="space-y-1.5 flex flex-col">
                <span className="text-[13px] font-semibold text-slate-700">{t("invoiceDate") || "Invoice Date"}</span>
                <div className="relative w-full">
                  <input
                    type="date"
                    ref={invoiceDateRef}
                    tabIndex={-1}
                    value={invoiceForm.invoiceDate && invoiceForm.invoiceDate.length === 10 && invoiceForm.invoiceDate.includes('-') && invoiceForm.invoiceDate.split('-')[0].length === 4 ? invoiceForm.invoiceDate : ''}
                    onChange={(e) => updateInvoiceForm("invoiceDate", e.target.value)}
                    className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
                  />
                  <input
                    type="text"
                    placeholder="dd/mm/yyyy"
                    maxLength={10}
                    value={toDisplayDate(invoiceForm.invoiceDate || '')}
                    onChange={handleInvoiceDateTextChange}
                    className="w-full h-10 pl-3 pr-10 text-[13px] font-bold text-[#1c2aab] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors placeholder:text-slate-400"
                  />
                  <div 
                    onClick={triggerInvoiceDatePicker}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600"
                  >
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
              </div>


          {invoiceDoc?.documentGuid && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[12px] flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-500 mb-0.5">{t("existingInvoiceDoc") || "Existing Invoice Document"}</p>
                <p className="font-bold text-slate-700 truncate max-w-[240px]" title={invoiceDoc.fileName}>{invoiceDoc.fileName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="!text-blue-600 hover:!bg-blue-50 !font-bold text-xs"
                  onClick={() => onPreview(invoiceDoc)}
                >{t("view")}</Button>
                <Button
                  variant="ghost"
                  className="!text-emerald-600 hover:!bg-emerald-50 !font-bold text-xs"
                  onClick={() => onDownload(invoiceDoc)}
                >{t("download") || "Download"}</Button>
              </div>
            </div>
          )}


        </div>
      </div>
    </Drawer>
  );
}
