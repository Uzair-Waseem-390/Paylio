import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInvoices } from '../hooks/useInvoices';
import { formatCurrency, formatDate } from '../utils/formatting';
import { INVOICE_STATUS, INVOICE_TEMPLATES } from '../constants';
import InvoiceForm from '../components/invoices/InvoiceForm';

const Invoices = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    
    const { 
        invoices, 
        loading, 
        error, 
        fetchInvoices, 
        deleteInvoice, 
        markAsReceived, 
        markAsPending 
    } = useInvoices();

    useEffect(() => {
        // Check URL params for actions
        if (searchParams.get('create') === 'true') {
            setShowForm(true);
        }
        
        const editId = searchParams.get('edit');
        if (editId) {
            const invoice = invoices.find(inv => inv.id === parseInt(editId));
            if (invoice) {
                setSelectedInvoice(invoice);
                setShowForm(true);
            }
        }

        fetchInvoices();
    }, []);

    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    const applyFilters = () => {
        fetchInvoices({
            start_date: filters.startDate,
            end_date: filters.endDate,
            status: filters.status
        });
        setShowFilters(false);
    };

    const clearFilters = () => {
        setFilters({ startDate: '', endDate: '', status: '' });
        fetchInvoices();
        setShowFilters(false);
    };

    const handleDeleteClick = (invoice) => {
        setInvoiceToDelete(invoice);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (invoiceToDelete) {
            const result = await deleteInvoice(invoiceToDelete.id);
            if (result.success) {
                setShowDeleteModal(false);
                setInvoiceToDelete(null);
            }
        }
    };

    const handleStatusChange = async (invoice) => {
        if (invoice.status === INVOICE_STATUS.PENDING) {
            await markAsReceived(invoice.id);
        } else {
            await markAsPending(invoice.id);
        }
    };

    const handlePrint = (invoice) => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('You need to be logged in to print invoices');
            return;
        }
        console.log('Token being sent:', token.substring(0, 20) + '...');

        window.open(`http://127.0.0.1:8000/api/invoices/${invoice.id}/render/?token=${token}`, '_blank');
    };

    const InvoiceRow = ({ invoice }) => (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">#{invoice.id}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{invoice.client_name}</div>
                <div className="text-sm text-gray-500">{invoice.client_email}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{formatCurrency(invoice.total_amount)}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    invoice.status === 'Received' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                }`}>
                    {invoice.status}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(invoice.due_date)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button
                    onClick={() => {
                        setSelectedInvoice(invoice);
                        setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                >
                    Edit
                </button>
                <button
                    onClick={() => handlePrint(invoice)}
                    className="text-gray-600 hover:text-gray-900"
                >
                    Print
                </button>
                <button
                    onClick={() => handleStatusChange(invoice)}
                    className={`${
                        invoice.status === 'Pending' 
                            ? 'text-green-600 hover:text-green-900' 
                            : 'text-yellow-600 hover:text-yellow-900'
                    }`}
                >
                    {invoice.status === 'Pending' ? 'Mark Received' : 'Mark Pending'}
                </button>
                <button
                    onClick={() => handleDeleteClick(invoice)}
                    className="text-red-600 hover:text-red-900"
                >
                    Delete
                </button>
            </td>
        </tr>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filter
                    </button>
                    <button
                        onClick={() => {
                            setSelectedInvoice(null);
                            setShowForm(true);
                        }}
                        className="flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Invoice
                    </button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All</option>
                                <option value="Pending">Pending</option>
                                <option value="Received">Received</option>
                            </select>
                        </div>
                        <div className="flex items-end space-x-2">
                            <button
                                onClick={applyFilters}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Apply
                            </button>
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoices Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading invoices...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-red-600">Error loading invoices: {error}</p>
                    </div>
                ) : invoices.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {invoices.map(invoice => (
                                    <InvoiceRow key={invoice.id} invoice={invoice} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by creating your first invoice.</p>
                        <div className="mt-6">
                            <button
                                onClick={() => {
                                    setSelectedInvoice(null);
                                    setShowForm(true);
                                }}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Invoice
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Invoice Form Modal */}
            {showForm && (
                <InvoiceForm
                    invoice={selectedInvoice}
                    onClose={() => {
                        setShowForm(false);
                        setSelectedInvoice(null);
                        setSearchParams({});
                    }}
                    onSuccess={() => {
                        fetchInvoices();
                        setShowForm(false);
                        setSelectedInvoice(null);
                        setSearchParams({});
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Are you sure you want to delete invoice #{invoiceToDelete?.id} for {invoiceToDelete?.client_name}? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setInvoiceToDelete(null);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Invoices;