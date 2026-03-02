import { useState, useCallback } from 'react';
import axiosInstance from '../services/axios';
import { useAuth } from '../contexts/AuthContext';

export const useSummary = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { isAuthenticated } = useAuth();

    const fetchSummary = useCallback(async (startDate = null, endDate = null) => {
        if (!isAuthenticated) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            
            const url = `/invoices/summary/${params.toString() ? `?${params}` : ''}`;
            const response = await axiosInstance.get(url);
            setSummary(response.data);
        } catch (err) {
            setError(err.response?.data || 'Failed to fetch summary');
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const fetchMonthlyData = async () => {
        try {
            const response = await axiosInstance.get('/invoices/summary/monthly/');
            return response.data;
        } catch (err) {
            throw err.response?.data || 'Failed to fetch monthly data';
        }
    };

    const fetchStatusDistribution = async (startDate, endDate) => {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            
            const url = `/invoices/summary/status-distribution/${params.toString() ? `?${params}` : ''}`;
            const response = await axiosInstance.get(url);
            return response.data;
        } catch (err) {
            throw err.response?.data || 'Failed to fetch status distribution';
        }
    };

    return {
        summary,
        loading,
        error,
        fetchSummary,
        fetchMonthlyData,
        fetchStatusDistribution
    };
};