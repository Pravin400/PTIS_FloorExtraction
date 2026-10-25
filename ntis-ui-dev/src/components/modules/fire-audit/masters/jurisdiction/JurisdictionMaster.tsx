"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AddButton, CancelButton, MasterTable, PageContainer, SaveButton } from "@/components/common";
import { saveJurisdictionOverlayAction } from "@/app/[locale]/fire-audit/masters/jurisdiction/actions";
import type {
  JurisdictionOverlayInput,
  JurisdictionOverlayRow,
  JurisdictionScope,
} from "@/types/fire-audit/jurisdiction.types";
import {
  jurisdictionLegalBasisSummary,
  jurisdictionNeedsSetup,
  jurisdictionScope,
} from "@/types/fire-audit/jurisdiction.types";

const PAGE_SIZE = 8;
const SCOPES: JurisdictionScope[] = ["National", "State", "ULB"];

type StatusFilter = "all" | "active" | "inactive";

interface Draft {
  id: number | null;
  scope: JurisdictionScope;
  stateCode: string;
  stateName: string;
  actTitle: string;
  rulesTitle: string;
  municipalActTitle: string;
  byeLawTitle: string;
  sectionRefs: string;
  issuingAuthorityLabel: string;
  certificateFormCode: string;
  auditReportFormCode: string;
  hasOwnFireBrigade: boolean;
  validityMonths: string;
  reminderOffsetsCsv: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
}

interface FieldErrors {
  authority?: string;
  validity?: string;
  stateName?: string;
}

const EMPTY_DRAFT: Draft = {
  id: null,
  scope: "ULB",
  stateCode: "",
  stateName: "",
  actTitle: "",
  rulesTitle: "",
  municipalActTitle: "",
  byeLawTitle: "",
  sectionRefs: "",
  issuingAuthorityLabel: "",
  certificateFormCode: "",
  auditReportFormCode: "",
  hasOwnFireBrigade: true,
  validityMonths: "12",
  reminderOffsetsCsv: "60, 30, 7",
  effectiveFrom: "",
  effectiveTo: "",
  isActive: true,
};

function overlayToDraft(row: JurisdictionOverlayRow): Draft {
  return {
    id: row.id,
    scope: jurisdictionScope(row),
    stateCode: row.stateCode,
    stateName: row.stateName,
    actTitle: row.actTitle,
    rulesTitle: row.rulesTitle,
    municipalActTitle: row.municipalActTitle,
    byeLawTitle: row.byeLawTitle,
    sectionRefs: row.sectionRefs,
    issuingAuthorityLabel: row.issuingAuthorityLabel,
    certificateFormCode: row.certificateFormCode,
    auditReportFormCode: row.auditReportFormCode,
    hasOwnFireBrigade: row.hasOwnFireBrigade,
    validityMonths: row.validityMonths == null ? "" : String(row.validityMonths),
    reminderOffsetsCsv: row.reminderOffsetsCsv,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
    isActive: row.isActive,
  };
}

function draftToInput(draft: Draft): JurisdictionOverlayInput {
  return {
    id: draft.id,
    scope: draft.scope,
    stateCode: draft.stateCode.trim(),
    stateName: draft.stateName.trim(),
    actTitle: draft.actTitle.trim(),
    rulesTitle: draft.rulesTitle.trim(),
    municipalActTitle: draft.municipalActTitle.trim(),
    byeLawTitle: draft.byeLawTitle.trim(),
    sectionRefs: draft.sectionRefs.trim(),
    issuingAuthorityLabel: draft.issuingAuthorityLabel.trim(),
    certificateFormCode: draft.certificateFormCode.trim(),
    auditReportFormCode: draft.auditReportFormCode.trim(),
    hasOwnFireBrigade: draft.hasOwnFireBrigade,
    validityMonths: Number(draft.validityMonths),
    reminderOffsetsCsv: draft.reminderOffsetsCsv.trim(),
    effectiveFrom: draft.effectiveFrom,
    effectiveTo: draft.effectiveTo,
    isActive: draft.isActive,
  };
}

function rowToInput(row: JurisdictionOverlayRow, isActive: boolean): JurisdictionOverlayInput {
  return {
    id: row.id,
    scope: jurisdictionScope(row),
    stateCode: row.stateCode,
    stateName: row.stateName,
    actTitle: row.actTitle,
    rulesTitle: row.rulesTitle,
    municipalActTitle: row.municipalActTitle,
    byeLawTitle: row.byeLawTitle,
    sectionRefs: row.sectionRefs,
    issuingAuthorityLabel: row.issuingAuthorityLabel,
    certificateFormCode: row.certificateFormCode,
    auditReportFormCode: row.auditReportFormCode,
    hasOwnFireBrigade: row.hasOwnFireBrigade,
    validityMonths: row.validityMonths ?? 0,
    reminderOffsetsCsv: row.reminderOffsetsCsv,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
    isActive,
  };
}

interface JurisdictionMasterProps {
  data?: JurisdictionOverlayRow[];
  locale: string;
  loadError?: string | null;
}

function PillButton({
  children,
  onClick,
  pressed = false,
  tone = "filter",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  pressed?: boolean;
  tone?: "filter" | "quiet" | "danger";
  disabled?: boolean;
}) {
  const toneClass =
    tone === "danger"
      ? "border-[#f3c7c3] bg-white text-[#d94a27] hover:bg-[#fff4f1]"
      : tone === "quiet"
        ? "border-[#e4e7eb] bg-white text-[#3c4b57] hover:bg-[#f7f8f9]"
        : pressed
          ? "border-[#1c2830] bg-[#1c2830] text-white"
          : "border-[#e4e7eb] bg-white text-[#3c4b57] hover:bg-[#f7f8f9]";

  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-xs font-medium transition-colors duration-75 disabled:cursor-not-allowed disabled:opacity-40 ${toneClass}`}
    >
      {children}
    </button>
  );
}

function ScopePill({ label, filled }: { label: string; filled: boolean }) {
  return (
    <span
      className={
        filled
          ? "inline-flex h-6 items-center rounded-full bg-[#e7f1fb] px-2.5 text-xs font-medium text-[#1d4f86]"
          : "inline-flex h-6 items-center rounded-full border border-[#d5e4f2] bg-white px-2.5 text-xs font-medium text-[#2f628f]"
      }
    >
      {label}
    </span>
  );
}

function StatusPill({
  active,
  needsSetup,
  labels,
}: {
  active: boolean;
  needsSetup: boolean;
  labels: { active: string; inactive: string; needsSetup: string };
}) {
  if (needsSetup) {
    return (
      <span className="inline-flex h-6 items-center rounded-full bg-[#fbf3d8] px-2.5 text-xs font-medium text-[#9a6b12]">
        {labels.needsSetup}
      </span>
    );
  }
  if (active) {
    return (
      <span className="inline-flex h-6 items-center rounded-full bg-[#e7f6ee] px-2.5 text-xs font-medium text-[#1f7a45]">
        {labels.active}
      </span>
    );
  }
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-[#f3f4f6] px-2.5 text-xs font-medium text-[#6b7280]">
      {labels.inactive}
    </span>
  );
}

const fieldClass =
  "mt-1 h-10 w-full rounded-lg border border-[#d8e2e6] bg-white px-3 text-sm text-[#153746] outline-none focus:border-[#16324f]";

function Field({
  label,
  required = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-medium text-[#607681]">
      {label}
      {required ? <span className="text-[#d94a27]"> *</span> : null}
      {children}
      {error ? <span className="mt-1 block text-xs text-[#d94a27]">{error}</span> : null}
    </label>
  );
}

export function JurisdictionMaster({ data, locale, loadError = null }: JurisdictionMasterProps) {
  void locale;
  const t = useTranslations("fireAudit.masters.jurisdiction");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState<JurisdictionOverlayRow[]>(() => data ?? []);
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadNotice, setLoadNotice] = useState<string | null>(loadError);

  const noticeFor = (code: string | null | undefined) => {
    if (!code) return null;
    if (code === "session") return t("form.errors.session");
    if (code === "council") return t("form.errors.council");
    if (code === "load") return t("form.errors.load");
    if (code === "save") return t("form.errors.save");
    return code;
  };
  const notice = saveError ?? noticeFor(loadNotice);

  const persist = (input: JurisdictionOverlayInput, closeOnSuccess: boolean) => {
    setSaveError(null);
    startTransition(async () => {
      const result = await saveJurisdictionOverlayAction(input);
      if (!result.success || !result.data) {
        setSaveError(noticeFor(result.error) ?? t("form.errors.save"));
        return;
      }
      setRows(result.data);
      setSelectedId(input.id);
      setLoadNotice(null);
      setPage(1);
      if (closeOnSuccess) {
        setDraft(null);
        setErrors({});
      }
    });
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const scope = jurisdictionScope(row);
      if (scopeFilter !== "all" && scope !== scopeFilter) return false;
      if (statusFilter === "active" && !row.isActive) return false;
      if (statusFilter === "inactive" && row.isActive) return false;
      if (!query) return true;
      return [row.issuingAuthorityLabel, jurisdictionLegalBasisSummary(row), row.auditReportFormCode, scope]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [rows, search, scopeFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const scopeName = (scope: JurisdictionScope) => t(`scopes.${scope}`);
  const textOrUnset = (value: string) => (value.trim() ? value : t("notSet"));

  const openAdd = () => {
    setErrors({});
    setDraft({ ...EMPTY_DRAFT });
  };

  const openEdit = (row: JurisdictionOverlayRow) => {
    setSelectedId(row.id);
    setErrors({});
    setDraft(overlayToDraft(row));
  };

  const closeEditor = () => {
    setDraft(null);
    setErrors({});
  };

  const saveDraft = () => {
    if (!draft) return;
    const nextErrors: FieldErrors = {};
    if (!draft.issuingAuthorityLabel.trim()) nextErrors.authority = t("form.errors.authority");
    const months = Number(draft.validityMonths);
    if (!draft.validityMonths.trim() || !Number.isFinite(months) || months < 1) {
      nextErrors.validity = t("form.errors.validity");
    }
    if (draft.scope === "State" && !draft.stateName.trim()) nextErrors.stateName = t("form.errors.stateName");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    persist(draftToInput(draft), true);
  };

  const toggleActive = (row: JurisdictionOverlayRow) => {
    setSelectedId(row.id);
    persist(rowToInput(row, !row.isActive), false);
  };

  const effectiveLabel = (row: JurisdictionOverlayRow) => {
    if (!row.effectiveFrom) return t("notDated");
    return `${row.effectiveFrom} → ${row.effectiveTo || t("ongoing")}`;
  };

  return (
    <PageContainer className="!bg-[#f4f6f8]">
      <div className="mx-auto max-w-[1500px] space-y-4 p-4 sm:p-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-[#153746]">{t("title")}</h1>
            <p className="mt-1 max-w-[68ch] text-sm text-[#607681]">{t("subtitle")}</p>
          </div>
          <AddButton
            label={t("addRule")}
            onClick={openAdd}
            disabled={isPending}
            className="!h-11 w-full !rounded-full !bg-[#d94a27] !px-4 !text-white !shadow-none hover:!bg-[#b9381d] sm:w-auto"
          />
        </header>

        {notice ? (
          <p className="rounded-xl border border-[#f3c7c3] bg-[#fff4f1] px-4 py-3 text-sm text-[#9a3412]" role="alert">
            {notice}
          </p>
        ) : null}

        {draft ? (
          <section className="rounded-2xl border border-[#d8e2e6] bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#153746]">
                  {draft.id == null ? t("form.addTitle") : t("form.editTitle")}
                </h2>
                <p className="text-sm text-[#607681]">{t("form.scopePriority")}</p>
              </div>
              <div className="flex gap-2">
                <CancelButton onClick={closeEditor} disabled={isPending} />
                <SaveButton label={t("form.save")} onClick={saveDraft} isLoading={isPending} disabled={isPending} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <label className="text-xs font-medium text-[#607681]">
                {t("form.scope")} <span className="text-[#d94a27]">*</span>
                <select
                  value={draft.scope}
                  onChange={(event) => setDraft({ ...draft, scope: event.target.value as JurisdictionScope })}
                  className={fieldClass}
                >
                  {SCOPES.map((scope) => (
                    <option key={scope} value={scope}>
                      {scopeName(scope)}
                    </option>
                  ))}
                </select>
              </label>

              {draft.scope === "State" ? (
                <>
                  <Field label={t("form.stateName")} required error={errors.stateName}>
                    <input
                      value={draft.stateName}
                      onChange={(event) => setDraft({ ...draft, stateName: event.target.value })}
                      className={fieldClass}
                    />
                  </Field>
                  <Field label={t("form.stateCode")}>
                    <input
                      value={draft.stateCode}
                      onChange={(event) => setDraft({ ...draft, stateCode: event.target.value })}
                      className={fieldClass}
                    />
                  </Field>
                </>
              ) : (
                <p className="self-end pb-2 text-sm text-[#153746]">
                  {draft.scope === "ULB" ? t("form.councilNote") : t("scopes.National")}
                </p>
              )}

              <Field label={t("form.validity")} required error={errors.validity}>
                <input
                  type="number"
                  min={1}
                  value={draft.validityMonths}
                  onChange={(event) => setDraft({ ...draft, validityMonths: event.target.value })}
                  className={fieldClass}
                />
              </Field>
              <Field label={t("form.authority")} required error={errors.authority}>
                <input
                  value={draft.issuingAuthorityLabel}
                  onChange={(event) => setDraft({ ...draft, issuingAuthorityLabel: event.target.value })}
                  className={fieldClass}
                />
              </Field>
              <Field label={t("form.actTitle")}>
                <input
                  value={draft.actTitle}
                  onChange={(event) => setDraft({ ...draft, actTitle: event.target.value })}
                  className={fieldClass}
                />
              </Field>
              <Field label={t("form.rulesTitle")}>
                <input
                  value={draft.rulesTitle}
                  onChange={(event) => setDraft({ ...draft, rulesTitle: event.target.value })}
                  className={fieldClass}
                />
              </Field>
              <Field label={t("form.municipalActTitle")}>
                <input
                  value={draft.municipalActTitle}
                  onChange={(event) => setDraft({ ...draft, municipalActTitle: event.target.value })}
                  className={fieldClass}
                />
              </Field>
              <Field label={t("form.byeLawTitle")}>
                <input
                  value={draft.byeLawTitle}
                  onChange={(event) => setDraft({ ...draft, byeLawTitle: event.target.value })}
                  className={fieldClass}
                />
              </Field>
              <Field label={t("form.sectionRefs")}>
                <input
                  value={draft.sectionRefs}
                  onChange={(event) => setDraft({ ...draft, sectionRefs: event.target.value })}
                  className={fieldClass}
                />
              </Field>
              <Field label={t("form.auditForm")}>
                <input
                  value={draft.auditReportFormCode}
                  onChange={(event) => setDraft({ ...draft, auditReportFormCode: event.target.value })}
                  className={fieldClass}
                />
              </Field>
              <Field label={t("form.certificateForm")}>
                <input
                  value={draft.certificateFormCode}
                  onChange={(event) => setDraft({ ...draft, certificateFormCode: event.target.value })}
                  className={fieldClass}
                />
              </Field>
              <Field label={t("form.reminderOffsets")}>
                <input
                  value={draft.reminderOffsetsCsv}
                  placeholder="60, 30, 7"
                  onChange={(event) => setDraft({ ...draft, reminderOffsetsCsv: event.target.value })}
                  className={fieldClass}
                />
              </Field>
              <Field label={t("form.from")}>
                <input
                  type="date"
                  value={draft.effectiveFrom}
                  onChange={(event) => setDraft({ ...draft, effectiveFrom: event.target.value })}
                  className={fieldClass}
                />
              </Field>
              <Field label={t("form.to")}>
                <input
                  type="date"
                  value={draft.effectiveTo}
                  onChange={(event) => setDraft({ ...draft, effectiveTo: event.target.value })}
                  className={fieldClass}
                />
              </Field>

              <div className="flex flex-wrap items-end gap-4 pb-2">
                <label className="flex min-h-10 items-center gap-2 text-sm text-[#153746]">
                  <input
                    type="checkbox"
                    checked={draft.hasOwnFireBrigade}
                    onChange={(event) => setDraft({ ...draft, hasOwnFireBrigade: event.target.checked })}
                    className="h-4 w-4 rounded border-[#d8e2e6]"
                  />
                  {t("form.hasOwnFireBrigade")}
                </label>
                <label className="flex min-h-10 items-center gap-2 text-sm text-[#153746]">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
                    className="h-4 w-4 rounded border-[#d8e2e6]"
                  />
                  {t("form.active")}
                </label>
              </div>
            </div>
          </section>
        ) : null}

        {!draft ? <section className="overflow-hidden rounded-2xl border border-[#d8e2e6] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#eef0f2] p-4 lg:flex-row lg:items-end">
            <label className="block min-w-0 flex-1 text-xs font-medium text-[#607681]">
              {t("searchLabel")}
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder={t("search")}
                className={fieldClass}
              />
            </label>
            <label className="block text-xs font-medium text-[#607681]">
              {t("scopeLabel")}
              <select
                value={scopeFilter}
                onChange={(event) => {
                  setScopeFilter(event.target.value);
                  setPage(1);
                }}
                className={`${fieldClass} min-w-40`}
              >
                <option value="all">{t("allScopes")}</option>
                {SCOPES.map((scope) => (
                  <option key={scope} value={scope}>
                    {scopeName(scope)}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              {(["all", "active", "inactive"] as const).map((key) => (
                <PillButton
                  key={key}
                  pressed={statusFilter === key}
                  onClick={() => {
                    setStatusFilter(key);
                    setPage(1);
                  }}
                >
                  {t(`filters.${key}`)}
                </PillButton>
              ))}
              <PillButton
                tone="quiet"
                onClick={() => {
                  setSearch("");
                  setScopeFilter("all");
                  setStatusFilter("all");
                  setPage(1);
                }}
              >
                {t("filters.reset")}
              </PillButton>
            </div>
          </div>

          <MasterTable<JurisdictionOverlayRow>
            containerClassName="!gap-0"
            cardClassName="!rounded-none !border-0 !shadow-none"
            theadClassName="!border-b !border-[#eef0f2] !bg-[#faf9f7] !bg-none [&_th]:!font-medium [&_th]:!text-[#7b8794]"
            rowClassName={(row) => (row.id === selectedId ? "bg-[#f7f4ef]" : "bg-white hover:bg-[#fbfaf8]")}
            tableClassName="min-w-[920px]"
            maxBodyHeightClassName="max-h-[52vh]"
            columns={[
              {
                key: "scope",
                label: t("columns.scope"),
                width: "150px",
                render: (_value, row) => (
                  <ScopePill label={scopeName(jurisdictionScope(row))} filled={jurisdictionScope(row) === "ULB"} />
                ),
              },
              {
                key: "issuingAuthorityLabel",
                label: t("columns.authority"),
                render: (value) => (
                  <span className={value ? "text-sm text-[#24323c]" : "text-sm text-[#9aa3ad]"}>
                    {value ? String(value) : t("needsAuthority")}
                  </span>
                ),
              },
              {
                key: "actTitle",
                label: t("columns.legalBasis"),
                render: (_value, row) => (
                  <span className="line-clamp-2 text-sm text-[#4d5b66]">
                    {textOrUnset(jurisdictionLegalBasisSummary(row))}
                  </span>
                ),
              },
              {
                key: "auditReportFormCode",
                label: t("columns.auditForm"),
                width: "140px",
                render: (value) => <span className="text-sm text-[#4d5b66]">{textOrUnset(String(value ?? ""))}</span>,
              },
              {
                key: "effectiveFrom",
                label: t("columns.effective"),
                width: "190px",
                render: (_value, row) => <span className="text-sm text-[#4d5b66]">{effectiveLabel(row)}</span>,
              },
              {
                key: "isActive",
                label: t("columns.active"),
                width: "130px",
                render: (value, row) => (
                  <StatusPill
                    active={Boolean(value)}
                    needsSetup={jurisdictionNeedsSetup(row)}
                    labels={{
                      active: t("status.active"),
                      inactive: t("status.inactive"),
                      needsSetup: t("status.needsSetup"),
                    }}
                  />
                ),
              },
            ]}
            data={pageRows}
            loading={isPending}
            emptyText={rows.length === 0 ? `${t("empty")}. ${t("emptyHint")}` : t("empty")}
            paginationConfig={{ enabled: false }}
            actionLabel={tCommon("table.columns.actions")}
            getRowKey={(row) => row.id}
            onRowClick={(row) => setSelectedId(row.id)}
            renderActions={(row) => (
              <>
                <PillButton tone="quiet" disabled={isPending} onClick={() => openEdit(row)}>
                  {t("actions.edit")}
                </PillButton>
                <PillButton tone="danger" disabled={isPending} onClick={() => toggleActive(row)}>
                  {row.isActive ? t("actions.deactivate") : t("actions.activate")}
                </PillButton>
              </>
            )}
            footerClassName="!border-[#eef0f2] !bg-white"
            footerLeftContent={
              <span className="text-sm text-[#7b8794]">
                {t("showing", {
                  start,
                  end: Math.min(safePage * PAGE_SIZE, filtered.length),
                  total: filtered.length,
                })}
              </span>
            }
            footerRightContent={
              <div className="flex gap-2">
                <PillButton tone="quiet" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                  {t("previous")}
                </PillButton>
                <PillButton tone="quiet" disabled={safePage >= pageCount} onClick={() => setPage(safePage + 1)}>
                  {t("next")}
                </PillButton>
              </div>
            }
          />
        </section> : null}
      </div>
    </PageContainer>
  );
}
