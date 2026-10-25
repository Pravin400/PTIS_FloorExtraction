"use client";

import React from "react";
import { FileSearch, IndianRupee, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Tabs, TabList, Tab, TabPanel, ValidationMessage } from "@/components/common";
import type { SearchTab } from "@/types/property-search";
import {
  SEARCH_BRAND_ACTIVE_TAB,
  SEARCH_BRAND_TAB_ACTIVE,
  SEARCH_BRAND_TAB_INACTIVE,
  SEARCH_BRAND_TAB_LIST,
} from "../form-field-styles";

interface SearchTabsProps {
  activeTab: SearchTab;
  quickPanel: React.ReactNode;
  kycPanel: React.ReactNode;
  valuesDuesPanel: React.ReactNode;
  validationError?: string | null;
  validationRef?: React.RefObject<HTMLDivElement | null>;
  onTabChange: (tab: SearchTab) => void;
  activeFiltersTags?: React.ReactNode;
}

const TAB_CLASS =
  "flex-1 justify-center rounded-t rounded-b-none !h-7 !min-h-0 !px-2.5 !py-0 !text-[11px] !gap-1 font-semibold leading-none [&_svg]:!h-3 [&_svg]:!w-3 transition-all duration-200 cursor-pointer";

export function SearchTabs({
  activeTab,
  quickPanel,
  kycPanel,
  valuesDuesPanel,
  validationError = null,
  validationRef,
  onTabChange,
  activeFiltersTags,
}: SearchTabsProps) {
  const t = useTranslations("propertySearch.form");

  return (
    <div className="rounded-lg border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100">
      <Tabs
        value={activeTab}
        onChange={(v) => onTabChange(v as SearchTab)}
        variant="pills"
        size="sm"
        fullWidth
        activeTabClassName={SEARCH_BRAND_ACTIVE_TAB}
      >
        <TabList
          scrollable={false}
          className={`!m-0 !rounded-none !border-0 !p-0.5 !gap-3 ${SEARCH_BRAND_TAB_LIST}`}
        >
          <Tab
            value="quick-search"
            icon={Search}
            className={`${TAB_CLASS} ${SEARCH_BRAND_TAB_INACTIVE} ${SEARCH_BRAND_TAB_ACTIVE}`}
          >
            {t("tabs.quickSearch")}
          </Tab>
          <Tab
            value="kyc"
            icon={FileSearch}
            className={`${TAB_CLASS} ${SEARCH_BRAND_TAB_INACTIVE} ${SEARCH_BRAND_TAB_ACTIVE}`}
          >
            {t("tabs.kyc")}
          </Tab>
          <Tab
            value="values-dues"
            icon={IndianRupee}
            className={`${TAB_CLASS} ${SEARCH_BRAND_TAB_INACTIVE} ${SEARCH_BRAND_TAB_ACTIVE}`}
          >
            {t("tabs.valuesDues")}
          </Tab>
        </TabList>

        <div className="border-t border-slate-200 bg-slate-50/30 px-1.5 pt-1 pb-1.5">
          <TabPanel
            value="quick-search"
            className="mt-0 animate-in fade-in duration-200"
          >
            {quickPanel}
          </TabPanel>
          <TabPanel value="kyc" className="mt-0 animate-in fade-in duration-200">
            {kycPanel}
          </TabPanel>
          <TabPanel value="values-dues" className="mt-0 animate-in fade-in duration-200">
            {valuesDuesPanel}
          </TabPanel>

          {activeFiltersTags}

          <div ref={validationRef} className={validationError ? "mt-2" : ""}>
            <ValidationMessage
              message={validationError ?? undefined}
              visible={Boolean(validationError)}
              type="error"
              className="mx-auto max-w-xl"
            />
          </div>
        </div>
      </Tabs>
    </div>
  );
}
