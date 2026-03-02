export const validateInvoice = (data) => {
    const errors = {};

    if (!data.client_name?.trim()) {
        errors.client_name = 'Client name is required';
    }

    if (!data.client_email?.trim()) {
        errors.client_email = 'Client email is required';
    } else if (!/\S+@\S+\.\S+/.test(data.client_email)) {
        errors.client_email = 'Email is invalid';
    }

    if (!data.client_address?.trim()) {
        errors.client_address = 'Client address is required';
    }

    if (!data.description?.trim()) {
        errors.description = 'Description is required';
    }

    if (!data.amount || data.amount <= 0) {
        errors.amount = 'Amount must be greater than 0';
    }

    if (data.tax_percentage && (data.tax_percentage < 0 || data.tax_percentage > 100)) {
        errors.tax_percentage = 'Tax percentage must be between 0 and 100';
    }

    if (!data.issue_date) {
        errors.issue_date = 'Issue date is required';
    }

    if (!data.due_date) {
        errors.due_date = 'Due date is required';
    } else if (data.issue_date && new Date(data.due_date) < new Date(data.issue_date)) {
        errors.due_date = 'Due date cannot be before issue date';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};