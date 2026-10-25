export const getTabColors = (value: string) => {
    switch (value) {
        case 'geo-sequencing':
            return {
                text: 'text-violet-600',
                bgSolid: 'bg-violet-600',
                bgLight: 'bg-violet-50',
                border: 'border-violet-600',
                ring: 'ring-violet-200',
                bgTint: 'bg-violet-600/20',
            };
        case 'internal-survey':
            return {
                text: 'text-blue-500',
                bgSolid: 'bg-blue-500',
                bgLight: 'bg-blue-50',
                border: 'border-blue-500',
                ring: 'ring-blue-200',
                bgTint: 'bg-blue-500/20',
            };
        case 'quality-check':
            return {
                text: 'text-emerald-500',
                bgSolid: 'bg-emerald-500',
                bgLight: 'bg-emerald-50',
                border: 'border-emerald-500',
                ring: 'ring-emerald-200',
                bgTint: 'bg-emerald-500/20',
            };
        case 'assessment':
            return {
                text: 'text-blue-500',
                bgSolid: 'bg-blue-500',
                bgLight: 'bg-blue-50',
                border: 'border-blue-500',
                ring: 'ring-blue-200',
                bgTint: 'bg-blue-500/20',
            };
        case 'approval-by-ulb':
            return {
                text: 'text-green-500',
                bgSolid: 'bg-green-500',
                bgLight: 'bg-green-50',
                border: 'border-green-500',
                ring: 'ring-green-200',
                bgTint: 'bg-green-500/20',
            };
        case 'notice-distribution':
            return {
                text: 'text-amber-500',
                bgSolid: 'bg-amber-500',
                bgLight: 'bg-amber-100',
                border: 'border-amber-500',
                ring: 'ring-amber-200',
                bgTint: 'bg-amber-500/20',
            };
        case 'hearing-appeals':
            return {
                text: 'text-red-500',
                bgSolid: 'bg-red-500',
                bgLight: 'bg-red-50',
                border: 'border-red-500',
                ring: 'ring-red-200',
                bgTint: 'bg-red-500/20',
            };
        case 'bills-distribution':
            return {
                text: 'text-indigo-500',
                bgSolid: 'bg-indigo-500',
                bgLight: 'bg-indigo-50',
                border: 'border-indigo-500',
                ring: 'ring-indigo-200',
                bgTint: 'bg-indigo-500/20',
            };
        case 'bill-generation':
            return {
                text: 'text-violet-600',
                bgSolid: 'bg-violet-600',
                bgLight: 'bg-violet-50',
                border: 'border-violet-600',
                ring: 'ring-violet-200',
                bgTint: 'bg-violet-600/20',
            };
        default:
            return {
                text: 'text-indigo-500',
                bgSolid: 'bg-indigo-500',
                bgLight: 'bg-slate-50',
                border: 'border-indigo-500',
                ring: 'ring-indigo-200',
                bgTint: 'bg-indigo-500/20',
            };
    }
};
