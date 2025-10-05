// src/context/CompanyContext.tsx

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { listCompanies } from '../pages/api/companyApi';
import { useAuth } from './AuthContext';

// Define the shape of a Company object
interface Company {
    _id: string; // The MongoDB ID
    name: string;
    shortCode: string;
    currencyCode: string;
    financialYearStart: string;
    address?: string;
}

// Define the shape of the Context State
interface CompanyContextType {
    companies: Company[];
    selectedCompany: Company | null;
    isLoading: boolean;
    error: string | null;
    fetchCompanies: () => Promise<void>;
    selectCompany: (companyId: string) => void;
}

// Create Context
const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

// 1. Company Provider Component
export const CompanyProvider = ({ children }: { children: ReactNode }) => {
    const { user, token, logout } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Data Fetching ---
    const fetchCompanies = useCallback(async () => {
        if (!token) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await listCompanies();
            setCompanies(data);

            // If a company is already selected (e.g., from localStorage), keep it.
            // Otherwise, select the first company if the list is not empty.
            if (data.length > 0) {
                const storedCompanyId = localStorage.getItem('selectedCompanyId');
                const initialCompany = storedCompanyId 
                    ? data.find((c: Company) => c._id === storedCompanyId) 
                    : data[0];

                setSelectedCompany(initialCompany || data[0]);
                localStorage.setItem('selectedCompanyId', (initialCompany || data[0])._id);
            } else {
                setSelectedCompany(null);
                localStorage.removeItem('selectedCompanyId');
            }

        } catch (err: any) {
            console.error("Failed to fetch companies:", err);
            setError("Could not load companies. Please try again.");
            // On a 401 error, log out the user
            if (err.response?.status === 401) {
                logout(); 
            }
        } finally {
            setIsLoading(false);
        }
    },[]);

    // --- Company Selection Logic ---
    const selectCompany = (companyId: string) => {
        const company = companies.find(c => c._id === companyId);
        if (company) {
            setSelectedCompany(company);
            localStorage.setItem('selectedCompanyId', companyId);
        }
    };

    // Fetch companies whenever the user logs in (token changes)
    useEffect(() => {
        if (user && token) {
            fetchCompanies();
        } else {
            setCompanies([]);
            setSelectedCompany(null);
        }
    }, [user, token,fetchCompanies]);

    return (
        <CompanyContext.Provider value={{ 
            companies, 
            selectedCompany, 
            isLoading, 
            error, 
            fetchCompanies, 
            selectCompany 
        }}>
            {children}
        </CompanyContext.Provider>
    );
};

// 2. Custom Hook for easy access
export const useCompany = () => {
    const context = useContext(CompanyContext);
    if (context === undefined) {
        throw new Error('useCompany must be used within a CompanyProvider');
    }
    return context;
};