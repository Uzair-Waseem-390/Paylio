import { useState, useEffect } from 'react';
import axiosInstance from '../services/axios';
import { useAuth } from '../contexts/AuthContext';

export const useInvoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { isAuthenticated } = useAuth();

    const fetchInvoices = async (filters = {}) => {
        if (!isAuthenticated) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams();
            if (filters.start_date) params.append('start_date', filters.start_date);
            if (filters.end_date) params.append('end_date', filters.end_date);
            if (filters.status) params.append('status', filters.status);
            
            const url = `/invoices/${params.toString() ? `?${params}` : ''}`;
            const response = await axiosInstance.get(url);
            setInvoices(response.data);
        } catch (err) {
            setError(err.response?.data || 'Failed to fetch invoices');
        } finally {
            setLoading(false);
        }
    };

    const createInvoice = async (invoiceData) => {
        try {
            const response = await axiosInstance.post('/invoices/', invoiceData);
            await fetchInvoices(); // Refresh list
            return { success: true, data: response.data };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data || 'Failed to create invoice'
            };
        }
    };

    const updateInvoice = async (id, invoiceData) => {
        try {
            const response = await axiosInstance.patch(`/invoices/${id}/`, invoiceData);
            await fetchInvoices();
            return { success: true, data: response.data };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data || 'Failed to update invoice'
            };
        }
    };

    const deleteInvoice = async (id) => {
        try {
            await axiosInstance.delete(`/invoices/${id}/`);
            await fetchInvoices();
            return { success: true };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data || 'Failed to delete invoice'
            };
        }
    };

    const markAsReceived = async (id) => {
        try {
            const response = await axiosInstance.post(`/invoices/${id}/mark-received/`);
            await fetchInvoices();
            return { success: true, data: response.data };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data || 'Failed to mark as received'
            };
        }
    };

    const markAsPending = async (id) => {
        try {
            const response = await axiosInstance.post(`/invoices/${id}/mark-pending/`);
            await fetchInvoices();
            return { success: true, data: response.data };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data || 'Failed to mark as pending'
            };
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [isAuthenticated]);

    return {
        invoices,
        loading,
        error,
        fetchInvoices,
        createInvoice,
        updateInvoice,
        deleteInvoice,
        markAsReceived,
        markAsPending
    };
};