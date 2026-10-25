// Simple alert utilities to replace SweetAlert2
interface SwalOptions {
    title?: string;
    text?: string;
    html?: string;
    icon?: string;
    showCancelButton?: boolean;
    confirmButtonText?: string;
    cancelButtonText?: string;
    timer?: number;
    showConfirmButton?: boolean;
}

export const Swal = {
    fire: (options: SwalOptions) => {
        if (options.showCancelButton) {
            // This is a confirmation dialog
            const confirmed = typeof window !== 'undefined' ? window.confirm(options.text || options.title) : false;
            return Promise.resolve({ isConfirmed: confirmed });
        } else {
            // This is just an alert
            const message = options.html || options.text || options.title || "";
            // Remove HTML tags for simple display
            const plainText = message.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            if (typeof window !== 'undefined') {
                alert(plainText);
            }
            return Promise.resolve({ isConfirmed: true });
        }
    },
    getPopup: () => null as unknown,
    getConfirmButton: () => null as unknown,
    showLoading: () => null as unknown,
};
