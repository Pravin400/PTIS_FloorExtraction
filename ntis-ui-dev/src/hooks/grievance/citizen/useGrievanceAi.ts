'use client';

/**
 * Grievance AI Assistant Hook
 * Path: src/hooks/grievance/citizen/useGrievanceAi.ts
 *
 * Handles Gemini AI image vision diagnosis and text/voice description refinement.
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { GrievanceAiAnalysisDto } from '@/types/grievance/grievance-ai.types';
import {
  scanGrievanceAiImagesAction,
  generateGrievanceAiFromPhotosAction,
  refineGrievanceDescriptionAction,
} from '@/lib/actions/grievance/citizen/grievance-ai.actions';

export interface UseGrievanceAiProps {
  t?: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function useGrievanceAi(props?: UseGrievanceAiProps) {
  const t = props?.t;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<GrievanceAiAnalysisDto | null>(null);


  const getNonCivicTextReason = useCallback(
    (data: GrievanceAiAnalysisDto) => {
      return (
        t?.('aiNonCivicDescription') ||
        data.rejectionReasonLocal ||
        data.rejectionReason ||
        'The entered description does not appear to describe a recognizable civic issue.'
      );
    },
    [t]
  );

  /**
   * Scan uploaded raw image files directly with Gemini Vision (Stateless in-memory scan)
   */
  const scanImages = useCallback(async (files: File[]): Promise<GrievanceAiAnalysisDto | null> => {
    if (!files || !files.length) return null;

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('photos', f, f.name));

      const res = await scanGrievanceAiImagesAction(formData);
      if (res.success && res.data) {
        setAiAnalysis(res.data);

        if (!res.data.isValidCivicIssue) {
          // Dedicated inline banner is rendered directly beneath the photo with action buttons
        } else if (res.data.isImageUnclear) {
          toast.warning(
            t?.('aiPhotoUnclearWarning') ||
              'Photo appears blurry or dark. Officers may need a clearer photo.'
          );
        } else {
          const detectedMsg = res.data.grievanceTypeName
            ? (t?.('aiDetected', { issue: res.data.grievanceTypeName }) || `AI detected: ${res.data.grievanceTypeName}`)
            : (t?.('aiPhotoAnalyzed') || 'Photo analyzed with Gemini AI');
          toast.success(detectedMsg);
        }
        return res.data;
      }
      const isCleanMsg =
        res.message &&
        !res.message.includes('<') &&
        !res.message.toLowerCase().includes('fetch failed') &&
        !res.message.includes('503') &&
        !res.message.includes('404');
      const userFriendlyMsg = isCleanMsg
        ? res.message
        : (t?.('aiVisionUnavailable') || 'AI auto-detection unavailable. Please select your department and issue manually.');
      toast.info(userFriendlyMsg);
      return null;
    } catch (err) {
      console.warn('[Grievance AI Scan error]:', err);
      toast.info(
        t?.('aiVisionUnavailable') ||
          'AI vision scan unavailable. Please select options manually.'
      );
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [t]);

  /**
   * Scan uploaded photo IDs with Gemini Vision
   */
  const analyzePhotos = useCallback(async (photoIds: number[]): Promise<GrievanceAiAnalysisDto | null> => {
    const validIds = photoIds.filter((id) => id > 0);
    if (!validIds.length) return null;

    setIsAnalyzing(true);
    try {
      const res = await generateGrievanceAiFromPhotosAction(validIds);
      if (res.success && res.data) {
        setAiAnalysis(res.data);

        if (!res.data.isValidCivicIssue) {
          // Handled contextually by the inline banner in the modal to avoid duplicate floating toasts
        } else if (res.data.isImageUnclear) {
          toast.warning(
            t?.('aiPhotoUnclearWarning') ||
              'Photo appears blurry or dark. Officers may need a clearer photo.'
          );
        } else {
          const detectedMsg = res.data.grievanceTypeName
            ? (t?.('aiDetected', { issue: res.data.grievanceTypeName }) || `AI detected: ${res.data.grievanceTypeName}`)
            : (t?.('aiPhotoAnalyzed') || 'Photo analyzed with Gemini AI');
          toast.success(detectedMsg);
        }
        return res.data;
      }
      return null;
    } catch {
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [t]);

  /**
   * Refine informal text or speech transcription into formal bilingual complaint
   */
  const refineText = useCallback(async (text: string): Promise<GrievanceAiAnalysisDto | null> => {
    const clean = text?.trim() || '';
    if (!clean || clean.length < 3) {
      toast.warning(
        t?.('aiEnterDescriptionPrompt') ||
          'Please enter a description to refine.'
      );
      return null;
    }

    setIsRefining(true);
    try {
      const res = await refineGrievanceDescriptionAction(clean);
      if (res.success && res.data) {
        setAiAnalysis(res.data);

        // 1. Guard against non-civic issue or gibberish text
        if (!res.data.isValidCivicIssue) {
          const reason = getNonCivicTextReason(res.data);
          toast.warning(reason);
          return res.data;
        }

        // 2. Guard against empty suggested description (supports bilingual English/Local)
        const hasPolishedText = Boolean(
          res.data.suggestedDescription?.trim() ||
          res.data.suggestedDescriptionLocal?.trim()
        );
        if (!hasPolishedText) {
          toast.info(
            t?.('aiNoRefinementNeeded') ||
              'No refinements found. Please provide more detail about the issue.'
          );
          return null;
        }

        toast.success(
          t?.('aiDescriptionPolished') ||
            'Description polished with Gemini AI'
        );
        return res.data;
      }
      toast.error(res.message || t?.('aiRefineServiceUnavailable') || 'AI refinement service unavailable');
      return null;
    } catch {
      toast.error(
        t?.('aiRefineFailed') ||
          'Failed to refine description'
      );
      return null;
    } finally {
      setIsRefining(false);
    }
  }, [t, getNonCivicTextReason]);

  const clearAiAnalysis = useCallback(() => {
    setAiAnalysis(null);
  }, []);

  return {
    isAnalyzing,
    isRefining,
    aiAnalysis,
    scanImages,
    analyzePhotos,
    refineText,
    clearAiAnalysis,
    setAiAnalysis,
  };
}
