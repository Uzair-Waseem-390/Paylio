export const INVOICE_STATUS = {
    PENDING: 'Pending',
    RECEIVED: 'Received'
};

export const INVOICE_TEMPLATES = [
    { id: 'Template 1 (Modern)', name: 'Modern', description: 'Clean and modern design' },
    { id: 'Template 2 (Minimal)', name: 'Minimal', description: 'Simple and minimalistic' },
    { id: 'Template 3 (Corporate)', name: 'Corporate', description: 'Professional corporate style' },
    { id: 'Custom Template', name: 'Custom', description: 'Your custom template' }
];

export const STATUS_COLORS = {
    [INVOICE_STATUS.PENDING]: 'yellow',
    [INVOICE_STATUS.RECEIVED]: 'green'
};

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/token/',
        REGISTER: '/auth/register/',
        PROFILE: '/auth/profile/',
        REFRESH: '/auth/token/refresh/'
    },
    INVOICES: {
        BASE: '/invoices/',
        SUMMARY: '/invoices/summary/',
        MONTHLY: '/invoices/summary/monthly/',
        RECENT: '/invoices/summary/recent/',
        STATUS_DIST: '/invoices/summary/status-distribution/'
    }
};