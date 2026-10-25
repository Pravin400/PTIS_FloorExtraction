"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Database, ArrowLeft, Loader2, HelpCircle, Edit, FileSpreadsheet, ToggleLeft, ClipboardList } from "lucide-react";
import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PageContainer, Tabs, Tab, TabList, TabPanel, TableHeader, Button } from "@/components/common";
import { CommonDetailsUpdatePageProps } from "@/types/common-details-update/common-details-update.types";
import { useCommonDetailsUpdate } from "@/hooks/commonDetailsUpdate/useCommonDetailsUpdate";
import { UpdateFieldsTabContent } from "./UpdateFieldsTabContent";
import { FieldRegistry } from "./FieldRegistry";
import { JobsAudit } from "./JobsAudit";
import { ExcelUpload } from "./ExcelUpload";
import { cn } from "@/lib/utils/cn";
import { useLocale } from "next-intl";
import { Modal } from "@/components/common/Modal";
import { OkButton } from "@/components/common/ActionButtons";

export default function CommonDetailsUpdatePage(
  props: CommonDetailsUpdatePageProps
) {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isFieldListCollapsed, setIsFieldListCollapsed] = useState(false);
  const [isGuidelineOpen, setIsGuidelineOpen] = useState(false);

  // Tab state from URL params
  const tabFromUrl = searchParams.get("tab") || "updateFields";
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);
  const [isTabSwitching, setIsTabSwitching] = useState(false);

  const fromPtis = searchParams.get("from") === "ptis";

  const handleBackToPtis = () => {
    const pId = searchParams.get("propertyId");
    const wId = searchParams.get("wardId");
    const wNo = searchParams.get("wardNo");
    const pNo = searchParams.get("propertyNo");
    const partNo = searchParams.get("partitionNo");

    const params = new URLSearchParams();
    if (pId) params.set("propertyId", pId);
    if (wId) params.set("wardId", wId);
    if (wNo) params.set("wardNo", wNo);
    if (pNo) params.set("propertyNo", pNo);
    if (partNo) params.set("partitionNo", partNo);

    router.push(`/${locale}/property-tax/ptis?${params.toString()}`);
  };

  const updateData = useCommonDetailsUpdate(props);
  const { t } = updateData;

  // Handle tab change - client-side instant tab switch with loading feedback
  const handleTabChange = (val: string | number) => {
    const newTab = String(val);
    if (newTab === activeTab) return;

    setIsTabSwitching(true);
    setActiveTab(newTab);

    if (typeof window !== "undefined") {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("tab", newTab);
      
      // Remove all filter/data params when navigating between tabs to ensure a clean state
      for (const key of Array.from(newParams.keys())) {
        if (key !== "tab" && key !== "from") {
          newParams.delete(key);
        }
      }

      if (newTab === "fieldRegistry") {
        newParams.set("pageNumber", "1");
        newParams.set("pageSize", "10");
      } else if (newTab === "auditMonitor") {
        newParams.set("auditPage", "1");
        newParams.set("auditPageSize", "10");
      }
      
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }

    setTimeout(() => {
      setIsTabSwitching(false);
    }, 150);
  };

  // Ensure default pagination parameters exist in URL if tab is directly loaded
  useState(() => {
    if (typeof window === "undefined") return;
    const currentTab = searchParams.get("tab") || "updateFields";
    let needsUpdate = false;
    const newParams = new URLSearchParams(searchParams.toString());

    if (currentTab === "fieldRegistry") {
      if (!newParams.has("pageNumber")) {
        newParams.set("pageNumber", "1");
        needsUpdate = true;
      }
      if (!newParams.has("pageSize")) {
        newParams.set("pageSize", "10");
        needsUpdate = true;
      }
    } else if (currentTab === "auditMonitor") {
      if (!newParams.has("auditPage")) {
        newParams.set("auditPage", "1");
        needsUpdate = true;
      }
      if (!newParams.has("auditPageSize")) {
        newParams.set("auditPageSize", "10");
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }
  });


  return (
    <PageContainer>
      <div className="space-y-2 h-full flex flex-col">
        {/* TableHeader with Screen Objective inside */}
        <TableHeader
          title={t("title")}
          subtitle={t("subtitle")}
          icon={Database}
          rightContent={
            <div className="flex items-center gap-3">
                {fromPtis && (
                <Button
                  type="button"
                  variant={"default" as any}
                  onClick={handleBackToPtis}
                  className="px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100/70 hover:border-blue-300 hover:shadow-sm active:scale-95 transition-all duration-200 rounded-lg cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t("buttons.backToPTIS")}</span>
                  </div>
                </Button>
              )}
              <Button
                type="button"
                variant={"default" as any}
                onClick={() => setIsGuidelineOpen(true)}
                className="focus:border-none px-3 py-2 text-xs font-bold text-slate-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 hover:shadow-sm active:scale-95 transition-all duration-200 rounded-lg cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t("buttons.guideline")}</span>
                </div>
              </Button>
            
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg max-w-xs">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-400" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">{t("screenObjective.title")}</p>
                  <p className="text-[11px] text-amber-700 leading-tight">{t("screenObjective.description")}</p>
                </div>
              </div>
            </div>
          }
        />

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="pills"
          size="md"
          className="flex-1 flex flex-col min-h-0"
        >
          <TabList className="border-b border-gray-200 pb-1 mb-0 gap-2">
            <Tab
              value="updateFields"
              icon={Edit}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors",
                activeTab === "updateFields"
                  ? "bg-[#0F5FC2] text-white border-[#0F5FC2]"
                  : "bg-white text-gray-600 border-transparent hover:bg-gray-50"
              )}
            >
              {t("tabs.updateFields")}
            </Tab>
            <Tab
              value="excelupload"
              icon={FileSpreadsheet}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors",
                activeTab === "excelupload"
                  ? "bg-[#0F5FC2] text-white border-[#0F5FC2]"
                  : "bg-white text-gray-600 border-transparent hover:bg-gray-50"
              )}
            >
              {t("tabs.excelupload")}
            </Tab>
            <Tab
              value="fieldRegistry"
              icon={ToggleLeft}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors",
                activeTab === "fieldRegistry"
                  ? "bg-[#0F5FC2] text-white border-[#0F5FC2]"
                  : "bg-white text-gray-600 border-transparent hover:bg-gray-50"
              )}
            >
              {t("tabs.fieldRegistry")}
            </Tab>
            <Tab
              value="auditMonitor"
              icon={ClipboardList}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors",
                activeTab === "auditMonitor"
                  ? "bg-[#0F5FC2] text-white border-[#0F5FC2]"
                  : "bg-white text-gray-600 border-transparent hover:bg-gray-50"
              )}
            >
              {t("tabs.auditMonitor")}
            </Tab>
          </TabList>

          {isTabSwitching ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-3 min-h-[300px] bg-white rounded-b-lg border border-t-0 border-gray-200">
              <Loader2 className="w-8 h-8 text-[#0F5FC2] animate-spin" />
              <p className="text-sm font-medium text-gray-600">{t("messages.loadingTabData")}</p>
            </div>
          ) : (
            <>
              {/* Update Fields Tab */}
              <TabPanel value="updateFields" className="flex-1 min-h-0 overflow-auto">
                <UpdateFieldsTabContent
                  t={t}
                  updateData={updateData}
                  isFieldListCollapsed={isFieldListCollapsed}
                  setIsFieldListCollapsed={setIsFieldListCollapsed}
                  locale={locale}
                />
              </TabPanel>

              {/* Field Registry Tab */}
              <TabPanel value="fieldRegistry" className="flex-1 min-h-0 mt-2 overflow-auto">
                <FieldRegistry
                  t={t}
                  initialFields={props.initialFieldRegistries || props.menuItems}
                  initialSchemas={props.initialSchemas}
                  initialSourceTables={props.initialSourceTables}
                  initialSourceTableFields={props.initialSourceTableFields}
                  setFieldRegistryStatusAction={props.setFieldRegistryStatusAction}
                  actions={props.actions}
                />
              </TabPanel>

              {/* Audit & Monitor Tab */}
              <TabPanel value="auditMonitor" className="flex-1 min-h-0 overflow-auto">
                <JobsAudit 
                  initialData={props.initialUpdateHistory} 
                  initialAllData={props.initialAllUpdateHistory}
                  initialUpdateHistoryDetail={props.initialUpdateHistoryDetail}
                  actions={props.actions} 
                />
              </TabPanel>

              {/* Excel Upload Tab */}
              <TabPanel value="excelupload" className="flex-1 min-h-0 mt-2 overflow-auto">
                <ExcelUpload 
                  initialExcelTemplateFields={Array.isArray(props.initialFieldRegistries) 
                    ? props.initialFieldRegistries 
                    : (props.initialFieldRegistries?.items || props.menuItems || [])}
                  updateData={updateData}
                  actions={props.actions}
                  locale={locale}
                />
              </TabPanel>
            </>
          )}
        </Tabs>
      </div>

      <Modal
        open={isGuidelineOpen}
        onClose={() => setIsGuidelineOpen(false)}
        title={t("guideline.title")}
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-3">
            <OkButton
              size="sm"
              onClick={() => setIsGuidelineOpen(false)}
            />
          </div>
        }
      >
        <div className="space-y-4 text-sm text-slate-700 p-2">
          <div className="flex items-start gap-2">
            <span className="font-bold text-slate-800 min-w-[130px]">{t("guideline.updateFieldsLabel")}:</span>
            <span>{t("guideline.updateFieldsDesc")}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-slate-800 min-w-[130px]">{t("guideline.fieldRegistryLabel")}:</span>
            <span>{t("guideline.fieldRegistryDesc")}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-slate-800 min-w-[130px]">{t("guideline.excelUploadLabel")}:</span>
            <span>{t("guideline.excelUploadDesc")}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-slate-800 min-w-[130px]">{t("guideline.auditMonitorLabel")}:</span>
            <span>{t("guideline.auditMonitorDesc")}</span>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
