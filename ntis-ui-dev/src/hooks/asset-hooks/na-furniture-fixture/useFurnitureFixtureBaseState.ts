/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useRef } from "react";
import { InventoryRow, InventoryForm, InvoiceForm, InventoryInvoice } from "@/types/asset/furniture-fixture.types";
import { emptyForm, emptyInvoiceForm, PAGE_SIZE } from "@/lib/utils/asset-utils/new-add-new-asset/furniture-fixture/FurnitureFixtureConstants";
import { enrichRows } from "@/lib/utils/asset-utils/new-add-new-asset/furniture-fixture/FurnitureFixtureCV";
import { useFurnitureFixtureOptions } from "./useFurnitureFixtureOptions";

export function useFurnitureFixtureBaseState(
  initialRowsFromServer: InventoryRow[],
  categories: any[],
  conditions: any[],
  itemNames: any[],
  itemModels: any[],
  initialDepartments: { label: string; value: string; id?: string | number }[] = []
) {
  const [rows, setRows] = useState<InventoryRow[]>(initialRowsFromServer);
  const [departments, setDepartments] = useState<{ label: string; value: string; id?: string | number }[]>(initialDepartments);

  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [form, setForm] = useState<InventoryForm>(emptyForm());
  const [editForm, setEditForm] = useState<InventoryForm>(emptyForm());
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>(emptyInvoiceForm());
  const [draftInvoice, setDraftInvoice] = useState<InventoryInvoice | null>(initialRowsFromServer[0]?.invoice ?? null);
  const [editDraftInvoice, setEditDraftInvoice] = useState<InventoryInvoice | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string>("");
  const [invoiceError, setInvoiceError] = useState<string>("");
  const [invoiceDrawerOpen, setInvoiceDrawerOpen] = useState<boolean>(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const options = useFurnitureFixtureOptions(categories, conditions, itemNames, itemModels, form, editForm);

  const enrichedRows = useMemo(() => enrichRows(rows, options.dynamicRates, options.dynamicConditions), [rows, options.dynamicRates, options.dynamicConditions]);

  const addPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const editPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const invoiceInputRef = useRef<HTMLInputElement | null>(null);

  const filteredRows = useMemo(() => filterCategory === "all" ? enrichedRows : enrichedRows.filter(r => r.category === filterCategory), [filterCategory, enrichedRows]);
  const paginatedRows = useMemo(() => filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [currentPage, filteredRows]);

  const existingInvoiceOptions = useMemo(() => {
    const unique = new Map<string, InventoryInvoice>();
    rows.forEach(r => r.invoice?.invoiceNumber && unique.set(`${r.invoice.invoiceNumber}__${r.invoice.invoiceDate || ""}`, r.invoice));
    if (unique.size === 0) return [{ label: "No invoice is available", value: "" }];
    return Array.from(unique.entries()).map(([k, inv]) => ({ label: `${inv.invoiceNumber}${inv.invoiceDate ? ` - ${inv.invoiceDate}` : ""}`, value: k }));
  }, [rows]);

  const resetAddForm = () => {
    setForm(emptyForm());
    setDraftInvoice(null);
    setFormError("");
    if (addPhotoInputRef.current) addPhotoInputRef.current.value = "";
  };

  const resetEditForm = () => {
    setEditForm(emptyForm());
    setEditDraftInvoice(null);
    setEditingId(null);
    setFormError("");
    setEditDrawerOpen(false);
    if (editPhotoInputRef.current) editPhotoInputRef.current.value = "";
    if (invoiceInputRef.current) invoiceInputRef.current.value = "";
  };

  return {
    rows, setRows, departments, setDepartments,
    filterCategory, setFilterCategory, form, setForm,
    editForm, setEditForm, invoiceForm, setInvoiceForm,
    draftInvoice, setDraftInvoice, editDraftInvoice, setEditDraftInvoice,
    editingId, setEditingId, formError, setFormError,
    invoiceError, setInvoiceError, invoiceDrawerOpen, setInvoiceDrawerOpen,
    editDrawerOpen, setEditDrawerOpen, currentPage, setCurrentPage,
    isSaving, setIsSaving, saveError, setSaveError,
    saveSuccess, setSaveSuccess,
    options, enrichedRows, addPhotoInputRef, editPhotoInputRef, invoiceInputRef,
    filteredRows, paginatedRows, existingInvoiceOptions,
    resetAddForm, resetEditForm
  };
}
