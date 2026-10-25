import { useMemo } from 'react';

/**
 * Hook to generate a formatted timestamp string (e.g. DD/MM/YYYY HH:mm:ss) 
 * once on component mount.
 */
export const useFormattedDate = () => {
    return useMemo(() => {
        const now = new Date();
        return `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB')}`;
    }, []);
};
