import type { ReportFormCopy, ReportJobsCopy, ReportWorkspaceCopy, ReportParamsPanelCopy } from '@/types/report.types';

type Translator = Awaited<ReturnType<typeof import('next-intl/server').getTranslations>>;

export function buildFormCopy(t: Translator): ReportFormCopy {
  return {
    pageTitle: t('pageTitle'),
    pageSubtitle: t('pageSubtitle'),
    fields: {
      reportType: t('fields.reportType'),
    },
    buttons: {
      generate: t('buttons.generate'),
      reset: t('buttons.reset'),
    },
    placeholders: {
      selectReport: t('placeholders.selectReport'),
      selectZone: t('placeholders.selectZone'),
      selectWard: t('placeholders.selectWard'),
      selectProperty: t('placeholders.selectProperty'),
      selectPartition: t('placeholders.selectPartition'),
      pendingZone: t('placeholders.pendingZone'),
      pendingWard: t('placeholders.pendingWard'),
      pendingProperty: t('placeholders.pendingProperty'),
    },
    validation: {
      reportRequired: t('validation.reportRequired'),
      dateRangeInvalid: t('validation.dateRangeInvalid'),
    },
    success: {
      downloaded: t('success.downloaded'),
    },
    errors: {
      generationFailed: t('errors.generationFailed'),
      loadFailed: t('errors.loadFailed'),
    },
    proTip: {
      title: t('proTip.title'),
      body: t('proTip.body'),
    },
    generationForm: {
      loadingParameters: t('generationForm.loadingParameters'),
      failedToLoadParameters: t('generationForm.failedToLoadParameters'),
      noParametersDefined: t.raw('generationForm.noParametersDefined'),
      back: t('generationForm.back'),
    },
    paramField: {
      selectPreviousFirst: t('generationForm.selectPreviousFirst'),
      loading: t('generationForm.loading'),
      select: t('generationForm.select'),
    },
  };
}

export function buildJobsCopy(t: Translator): ReportJobsCopy {
  return {
    title: t('jobs.title'),
    refresh: t('jobs.refresh'),
    empty: t('jobs.empty'),
    download: t('jobs.download'),
    preview: t('jobs.preview'),
    previewTitle: t('jobs.previewTitle'),
    columns: {
      report: t('jobs.columns.report'),
      status: t('jobs.columns.status'),
      requested: t('jobs.columns.requested'),
      completed: t('jobs.columns.completed'),
      actions: t('jobs.columns.actions'),
    },
    statuses: {
      Pending: t('jobs.statuses.pending'),
      Processing: t('jobs.statuses.processing'),
      Completed: t('jobs.statuses.completed'),
      Failed: t('jobs.statuses.failed'),
      Cancelled: t('jobs.statuses.cancelled'),
      Retrying: t('jobs.statuses.retrying'),
    },
  };
}

export function buildWorkspaceCopy(t: Translator): ReportWorkspaceCopy {
  return {
    steps: {
      selectCategory: t('workspace.steps.selectCategory'),
      selectReport: t('workspace.steps.selectReport'),
      setParameters: t('workspace.steps.setParameters'),
      generateReport: t('workspace.steps.generateReport'),
    },
    tabs: {
      generateReport: t('workspace.tabs.generateReport'),
      myReports: t('workspace.tabs.myReports'),
    },
    toast: {
      generatedSuccess: t('workspace.toast.generatedSuccess'),
      generationFailed: t('workspace.toast.generationFailed'),
      generatingPreview: t('workspace.toast.generatingPreview'),
      preparingDocument: t('workspace.toast.preparingDocument'),
    },
    reportsCount: t.raw('workspace.reportsCount'),
    emptyState: {
      title: t('workspace.emptyState.title'),
      subtitle: t('workspace.emptyState.subtitle'),
    },
    noReportsFound: t('workspace.noReportsFound'),
    reportsHeader: t.raw('workspace.reportsHeader'),
    configureParameters: t('workspace.configureParameters'),
    generating: {
      title: t('workspace.generating.title'),
      subtitle: t('workspace.generating.subtitle'),
      cancel: t('workspace.generating.cancel'),
    },
    preview: {
      title: t('workspace.preview.title'),
      downloadPdf: t('workspace.preview.downloadPdf'),
      idLabel: t.raw('workspace.preview.idLabel'),
    },
    confirm: {
      title: t('workspace.confirm.title'),
      description: t('workspace.confirm.description'),
      btnGo: t('workspace.confirm.btnGo'),
      btnClose: t('workspace.confirm.btnClose'),
    },
  };
}

export function buildParamsCopy(t: Translator): ReportParamsPanelCopy {
  return {
    emptyState: t('params.emptyState'),
    financialYear: t('params.financialYear'),
    zoneNo: t('params.zoneNo'),
    wardNo: t('params.wardNo'),
    propertySelection: t('params.propertySelection'),
    propertyNo: t('params.propertyNo'),
    fromPropertyToProperty: t('params.fromPropertyToProperty'),
    fromProperty: t('params.fromProperty'),
    toProperty: t('params.toProperty'),
    selectYear: t('params.selectYear'),
    selectZone: t('params.selectZone'),
    selectWard: t('params.selectWard'),
    selectProperty: t('params.selectProperty'),
    selectStartProperty: t('params.selectStartProperty'),
    selectEndProperty: t('params.selectEndProperty'),
    loading: t('params.loading'),
    selectZoneFirst: t('params.selectZoneFirst'),
    selectWardFirst: t('params.selectWardFirst'),
    validation: {
      financialYearRequired: t('params.validation.financialYearRequired'),
      zoneRequired: t('params.validation.zoneRequired'),
      wardRequired: t('params.validation.wardRequired'),
      fillAllRequired: t('params.validation.fillAllRequired'),
      networkError: t('params.validation.networkError'),
      failedToQueue: t('params.validation.failedToQueue'),
    },

    reportQueued: t.raw('params.reportQueued'),
    buttons: {
      reset: t('params.buttons.reset'),
      generate: t('params.buttons.generate'),
      queuing: t('params.buttons.queuing'),
    },
  };
}
