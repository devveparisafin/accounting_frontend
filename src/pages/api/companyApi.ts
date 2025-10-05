// src/api/companyApi.ts - UPDATED

import axios from 'axios';

//const BASE_URL = 'http://localhost:5000/api/company';

const BASE_URL = 'https://accounting-backend-euge.onrender.com/api/company'; // Using relative path for Next.js API routes
interface CompanyData {
    name: string;
    shortCode: string;
    financialYearStart: string; // ISO Date string (YYYY-MM-DD)
    address?: string;
    currencyCode: string;
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    };
};

// 1. Create Company API Call (POST)
export const createCompany = async (data: CompanyData) => {
    const headers = getAuthHeaders();
    const response = await axios.post(BASE_URL, data, headers);
    return response.data;
};

// 2. List Companies API Call (GET)
export const listCompanies = async () => {
    const headers = getAuthHeaders();
    const response = await axios.get(BASE_URL, headers);
    return response.data;
};

// 3. Update Company API Call (PUT) - NEW
export const updateCompany = async (id: string, data: Partial<CompanyData>) => {
    const headers = getAuthHeaders();
    const response = await axios.put(`${BASE_URL}/${id}`, data, headers);
    return response.data;
};

// 4. Delete Company API Call (DELETE) - NEW
export const deleteCompany = async (id: string) => {
    const headers = getAuthHeaders();
    const response = await axios.delete(`${BASE_URL}/${id}`, headers);
    return response.data;
};

// 5. Fetch Company by ID API Call (GET /api/company/:id - using listCompanies logic for now) - NEW UTILITY
// NOTE: Since the backend only has GET /api/company to list ALL, we'll fetch all 
// and find the one we need. A real-world app would have GET /api/company/:id.
export const fetchCompanyById = async (id: string) => {
    const companies = await listCompanies();
    const company = companies.find((c: any) => c._id === id);
    if (!company) {
        throw new Error('Company not found.');
    }
    return company;
};