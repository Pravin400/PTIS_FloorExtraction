 
import { toast } from "sonner";
import { InventoryForm, InvoiceForm, InventoryInvoice } from "@/types/asset/furniture-fixture.types";

export function useFurnitureFixtureFormHandlers(
  setForm: React.Dispatch<React.SetStateAction<InventoryForm>>,
  setEditForm: React.Dispatch<React.SetStateAction<InventoryForm>>,
  setInvoiceForm: React.Dispatch<React.SetStateAction<InvoiceForm>>,
  invoiceForm: InvoiceForm,
  editDrawerOpen: boolean,
  setDraftInvoice: React.Dispatch<React.SetStateAction<InventoryInvoice | null>>,
  setEditDraftInvoice: React.Dispatch<React.SetStateAction<InventoryInvoice | null>>,
  setInvoiceError: (error: string) => void,
  setInvoiceDrawerOpen: (open: boolean) => void
) {
  const handleAddPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size cannot exceed 5MB.");
        e.target.value = "";
        return;
      }
      const allowedExtensions = ['.bmp', '.doc', '.docx', '.gif', '.jpeg', '.jpg', '.pdf', '.png', '.ppt', '.pptx', '.tif', '.tiff', '.txt', '.webp', '.xls', '.xlsx'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(fileExt)) {
        toast.error(`Invalid file type. Allowed extensions: ${allowedExtensions.join(', ')}`);
        e.target.value = "";
        return;
      }
      setForm(prev => ({ ...prev, photoName: file.name, photoUrl: URL.createObjectURL(file), photoFile: file }));
    }
  };

  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size cannot exceed 5MB.");
        e.target.value = "";
        return;
      }
      const allowedExtensions = ['.bmp', '.doc', '.docx', '.gif', '.jpeg', '.jpg', '.pdf', '.png', '.ppt', '.pptx', '.tif', '.tiff', '.txt', '.webp', '.xls', '.xlsx'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(fileExt)) {
        toast.error(`Invalid file type. Allowed extensions: ${allowedExtensions.join(', ')}`);
        e.target.value = "";
        return;
      }
      setEditForm(prev => ({ ...prev, photoName: file.name, photoUrl: URL.createObjectURL(file), photoFile: file }));
    }
  };

  const handleInvoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size cannot exceed 5MB.");
        e.target.value = "";
        return;
      }
      const allowedExtensions = ['.bmp', '.doc', '.docx', '.gif', '.jpeg', '.jpg', '.pdf', '.png', '.ppt', '.pptx', '.tif', '.tiff', '.txt', '.webp', '.xls', '.xlsx'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(fileExt)) {
        toast.error(`Invalid file type. Allowed extensions: ${allowedExtensions.join(', ')}`);
        e.target.value = "";
        return;
      }
      setInvoiceForm(prev => ({ ...prev, invoiceFileName: file.name, invoiceFile: file }));
    }
  };

  const saveInvoiceDetails = () => {
    if (!invoiceForm.invoiceMode) return setInvoiceError("Please select invoice mode.");
    if (invoiceForm.invoiceMode === "reuse" && !invoiceForm.existingInvoiceKey) return setInvoiceError("No invoice is available to reuse.");
    if (invoiceForm.invoiceMode === "upload" && (!invoiceForm.invoiceNumber.trim() || !invoiceForm.invoiceDate)) {
      return setInvoiceError("Please enter invoice number and date.");
    }
    const inv = {
      invoiceMode: invoiceForm.invoiceMode,
      invoiceNumber: invoiceForm.invoiceNumber.trim(),
      invoiceDate: invoiceForm.invoiceDate,
      invoiceFileName: invoiceForm.invoiceFileName,
      invoiceFile: invoiceForm.invoiceFile,
    };
    if (editDrawerOpen) setEditDraftInvoice(inv);
    else setDraftInvoice(inv);
    setInvoiceDrawerOpen(false);
  };

  return { handleAddPhotoUpload, handleEditPhotoUpload, handleInvoiceUpload, saveInvoiceDetails };
}
