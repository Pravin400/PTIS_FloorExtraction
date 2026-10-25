/**
 * On-The-Go Grievance Draft Persistence Service (Layer 5 - Domain Storage Service)
 * Path: src/lib/services/grievance/on-the-go-draft.service.ts
 *
 * Encapsulates browser localStorage persistence for on-the-go grievance drafts.
 */

import type { OnTheGoFormValues } from '@/types/grievance/on-the-go.types';

export const ON_THE_GO_DRAFT_KEY = 'amc_on_the_go_draft_v1';

export type OnTheGoDraftData = Partial<Omit<OnTheGoFormValues, 'photos'>>;

/**
 * Retrieves the saved On-The-Go form draft from localStorage.
 */
export function getOnTheGoDraft(): OnTheGoDraftData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ON_THE_GO_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Persists an in-progress On-The-Go form draft to localStorage.
 */
export function saveOnTheGoDraft(data: OnTheGoDraftData): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(ON_THE_GO_DRAFT_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears the stored On-The-Go form draft upon submission or reset.
 */
export function clearOnTheGoDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ON_THE_GO_DRAFT_KEY);
  } catch {
    // Ignore storage clear exceptions
  }
}
