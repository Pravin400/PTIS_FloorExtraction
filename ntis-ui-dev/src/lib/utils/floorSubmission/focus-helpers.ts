import type React from 'react';

/**
 * Utility functions for programmatic focus management in the Floor and Room Submission views.
 * Designed to keep the UI components clean, modular, and maintainable.
 */

/**
 * Focuses a DOM element by its ID. If the element is disabled, it automatically 
 * falls back to the next available editable input/select/textarea in the closest container.
 * 
 * @param targetId ID of the target element to focus.
 * @param containerSelector CSS selector of the container to scan for fallbacks.
 */
export const focusFieldOrFallback = (targetId: string, containerSelector: string) => {
  const targetElement = document.getElementById(targetId) as HTMLInputElement | HTMLButtonElement | null;
  if (!targetElement) return;

  if (!targetElement.disabled) {
    targetElement.focus();
    if (typeof (targetElement as HTMLInputElement).select === 'function') {
      (targetElement as HTMLInputElement).select();
    }
  } else {
    const container = targetElement.closest(containerSelector);
    if (container) {
      const inputs = Array.from(
        container.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
          'input:not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled])'
        )
      );
      
      const editableInputs = inputs.filter((el) => {
        if (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'hidden') {
          return false;
        }
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return false;
        }
        if (el.id === targetId) {
          return false;
        }
        return true;
      });

      if (editableInputs.length > 0) {
        editableInputs[0].focus();
        if (typeof (editableInputs[0] as HTMLInputElement).select === 'function') {
          (editableInputs[0] as HTMLInputElement).select();
        }
      }
    }
  }
};

/**
 * Focuses the Outer field combobox button and triggers a click to open its dropdown options.
 * 
 * @param focusRefs MutableRefObject containing the registered focus elements.
 */
export const focusAndOpenOuterField = (
  focusRefs?: React.MutableRefObject<Record<string, HTMLElement | null>> | null
) => {
  const outerBtn = focusRefs?.current?.['outer'];
  if (outerBtn) {
    outerBtn.focus();
    outerBtn.click();
  }
};

/**
 * Focuses the Select Shape dropdown's custom button inside the Offset Form drawer.
 * 
 * @param offsetModalOpen Boolean indicating if the Offset modal/drawer is currently open.
 * @param containerId The ID of the wrapping select container.
 */
export const focusOffsetShapeSelect = (offsetModalOpen: boolean, containerId: string = 'offset-shape-select-container') => {
  if (!offsetModalOpen) return;
  const selectButton = document.querySelector(`#${containerId} button[role="combobox"]`) as HTMLButtonElement | null;
  if (selectButton && !selectButton.disabled) {
    selectButton.focus();
  }
};
