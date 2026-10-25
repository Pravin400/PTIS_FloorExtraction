import { useCallback } from 'react';

/**
 * TO REMOVE ENTER KEY FUNCTIONALITY IN THE FUTURE:
 * 1. Delete this entire file (`useEnterKeyNavigation.ts`).
 * 2. In `FloorSubmissionForm.tsx`, `RoomWiseSubmission.tsx`, and `usePropertyBasicForm.ts`:
 *    - Remove the import `useEnterKeyNavigation`.
 *    - Remove the hook initialization `const handleKeyDown = useEnterKeyNavigation();`.
 *    - Remove the `onKeyDownCapture={handleKeyDown}` prop from the main wrapper/form elements.
 *    - (For `Propertybasicform.tsx` remove `handleKeyDown` from the destructured variables of `usePropertyBasicForm` and the `onKeyDownCapture` prop).
 */
export const useEnterKeyNavigation = () => {
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter') {
            const activeElement = document.activeElement as HTMLElement;
            const activeTag = activeElement?.tagName.toLowerCase();
            const isCombobox = activeElement?.getAttribute('role') === 'combobox';
            
            // Allow default behavior for textareas
            if (activeTag === 'textarea') return;
            
            const isNavigableButton = activeTag === 'button' && (activeElement?.getAttribute('data-enter-navigable') === 'true' || isCombobox);

            // For normal buttons, do not intercept Enter
            if (activeTag === 'button' && !isNavigableButton) return;
            
            // If it's a combobox, check if an item is actively highlighted via arrow keys
            if (isCombobox) {
                // When you use arrow keys in SearchSelect, it sets aria-activedescendant.
                // If it's set, the user wants to select that item.
                const hasActiveDescendant = activeElement.hasAttribute('aria-activedescendant');
                
                if (hasActiveDescendant) {
                    // Let the combobox handle Enter to select the highlighted item
                    return;
                }
                
                // If no item is explicitly highlighted, the user wants to navigate to the next field.
                // We stop propagation so the combobox doesn't trigger its own Enter behavior
                // (which by default auto-selects the first item incorrectly).
                e.stopPropagation();
            }
            
            // Prevent form submission on inputs and comboboxes
            if (activeTag !== 'button' || isCombobox) {
                e.preventDefault();
            }
            
            const form = e.currentTarget as HTMLElement;
            
            // Find all focusable inputs, selects, comboboxes, and specific navigable buttons
            const focusableElements = Array.from(
                form.querySelectorAll('input:not([disabled]):not([readonly]), select:not([disabled]):not([readonly]), button[role="combobox"]:not([disabled]), [data-enter-navigable="true"]:not([disabled])')
            ) as HTMLElement[];
            
            const currentIndex = focusableElements.indexOf(activeElement);
            
            if (currentIndex > -1 && currentIndex < focusableElements.length - 1) {
                setTimeout(() => {
                    focusableElements[currentIndex + 1].focus();
                }, 10);
            }
        }
    }, []);

    return handleKeyDown;
};
