'use client';

import { ClassicReportDesigner } from './ClassicReportDesigner';
import type { ClassicReportDesignerProps } from '@/types/designer.types';

export interface HtmlReportDesignerWrapperProps extends ClassicReportDesignerProps {
  initialTemplates?: unknown[];
  initialDataSources?: unknown[];
  apiWarning?: string | null;
}

export function HtmlReportDesignerWrapper(props: HtmlReportDesignerWrapperProps) {
  return <ClassicReportDesigner {...props} />;
}
