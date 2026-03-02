import React, { useState } from 'react';
import { useInvoices } from '../../hooks/useInvoices';
import { validateInvoice } from '../../utils/validation';
import { INVOICE_TEMPLATES } from '../../constants';

const InvoiceForm = ({ invoice, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        client_name: invoice?.client_name || '',
        client_email: invoice?.client_email || '',
        client_address: invoice?.client_address || '',
        description: invoice?.description || '',
        amount: invoice?.amount || '',
        tax_percentage: invoice?.tax_percentage || '',
        issue_date: invoice?.issue_date || '',
        due_date: invoice?.due_date || '',
        template_name: invoice?.template_name || 'Template 1 (Modern)',
        status: invoice?.status || 'Pending'
    });
    
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const { createInvoice, updateInvoice } = useInvoices();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        // Clear field error when user types
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form
        const validation = validateInvoice(formData);
        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        setLoading(true);
        setErrors({});

        let result;
        if (invoice) {
            // Update existing invoice
            result = await updateInvoice(invoice.id, formData);
        } else {
            // Create new invoice
            result = await createInvoice(formData);
        }

        if (result.success) {
            onSuccess();
        } else {
            setErrors({ general: result.error });
        }

        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full my-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {invoice ? 'Edit Invoice' : 'Create New Invoice'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {errors.general && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                        <p className="text-red-700">{errors.general}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Step 1: Client Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Client Details</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Client Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="client_name"
                                value={formData.client_name}
                                onChange={handleChange}
                                className={`w-full border ${
                                    errors.client_name ? 'border-red-300' : 'border-gray-300'
                                } rounded-lg px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                                placeholder="Enter client name"
                            />
                            {errors.client_name && (
                                <p className="mt-1 text-sm text-red-600">{errors.client_name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Client Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="client_email"
                                value={formData.client_email}
                                onChange={handleChange}
                                className={`w-full border ${
                                    errors.client_email ? 'border-red-300' : 'border-gray-300'
                                } rounded-lg px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                                placeholder="client@example.com"
                            />
                            {errors.client_email && (
                                <p className="mt-1 text-sm text-red-600">{errors.client_email}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Client Address <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="client_address"
                                value={formData.client_address}
                                onChange={handleChange}
                                rows="2"
                                className={`w-full border ${
                                    errors.client_address ? 'border-red-300' : 'border-gray-300'
                                } rounded-lg px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                                placeholder="Enter client address"
                            />
                            {errors.client_address && (
                                <p className="mt-1 text-sm text-red-600">{errors.client_address}</p>
                            )}
                        </div>
                    </div>

                    {/* Step 2: Invoice Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Invoice Details</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className={`w-full border ${
                                    errors.description ? 'border-red-300' : 'border-gray-300'
                                } rounded-lg px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                                placeholder="e.g., Website Development"
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount ($) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    className={`w-full border ${
                                        errors.amount ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                                    placeholder="0.00"
                                />
                                {errors.amount && (
                                    <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tax Percentage (%)
                                </label>
                                <input
                                    type="number"
                                    name="tax_percentage"
                                    value={formData.tax_percentage}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    className={`w-full border ${
                                        errors.tax_percentage ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                                    placeholder="0"
                                />
                                {errors.tax_percentage && (
                                    <p className="mt-1 text-sm text-red-600">{errors.tax_percentage}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Issue Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="issue_date"
                                    value={formData.issue_date}
                                    onChange={handleChange}
                                    className={`w-full border ${
                                        errors.issue_date ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                                />
                                {errors.issue_date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.issue_date}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Due Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="due_date"
                                    value={formData.due_date}
                                    onChange={handleChange}
                                    className={`w-full border ${
                                        errors.due_date ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                                />
                                {errors.due_date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Template Selection */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Select Template</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {INVOICE_TEMPLATES.map(template => (
                                <label
                                    key={template.id}
                                    className={`border rounded-lg p-4 cursor-pointer ${
                                        formData.template_name === template.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="template_name"
                                        value={template.id}
                                        checked={formData.template_name === template.id}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    <div className="flex items-start">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{template.name}</p>
                                            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                                        </div>
                                        {formData.template_name === template.id && (
                                            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Step 4: Save Buttons */}
                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white ${
                                loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {invoice ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                invoice ? 'Update Invoice' : 'Create Invoice'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InvoiceForm;