// src/api/ledgerApi.ts

import axios from 'axios';

// --- Base URL for your Node/Express API ---
// NOTE: All requests MUST use this BASE_URL to reach port 5000.
//const BASE_URL = 'http://localhost:5000/api/ledger'; 
const BASE_URL = 'https://accounting-backend-euge.onrender.com/api/ledger'; 

// --- 1. Interface for Data Sent to the API (Payload/Request Body) ---
export interface LedgerData {
    _id?: string; 
    companyId: string;
    
    // Identification
    name: string;
    alias?: string;
    group: string ;

    // Accounting Details
    openingBalance?: number;
    obType?: 'Credit' | 'Debit';
    creditDays?: number;
    creditLimit?: number;

    // Address & Location
    address?: string; city?: string; pincode?: string; area?: string; state?: string;

    // Regulatory Details
    GSTIN?: string; VATIN?: string; PANNo?: string; ECCNo?: string; 
    dlrType?: 'Regular' | 'Composition' | 'Unregistered' | 'Consumer';
    CSTIN?: string;

    // Contact & Misc
    contactPerson?: string; aadharNo?: string; phoneNoO?: string; fax?: string; 
    mobileNo?: string; email?: string; website?: string;
    status?: 'Active' | 'Inactive';
}

// --- 2. Interface for Data Received from the API (Response/Mongoose Document) ---
export interface LedgerResponseData extends LedgerData {
    _id: string; // Guaranteed to be present on server response
    userId: string;
    createdAt: string;
    updatedAt: string;
}

// --- Utility for Authorization Headers ---
const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
        headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
        },
    };
};

// ===============================================
//           API ENDPOINT IMPLEMENTATIONS
// ===============================================

// 1. Create Ledger Account (POST /api/ledger)
export const createLedgerAccount = async (data: LedgerData) => {
    const headers = getAuthHeaders();
    const response = await axios.post(BASE_URL, data, headers); 
    return response.data as LedgerResponseData;
};

// 2. List Ledger Accounts (GET /api/ledger?companyId=...)
// This is the function required by the 'index.tsx' page.
export const getLedgers = async (companyId: string): Promise<LedgerResponseData[]> => {
    const headers = getAuthHeaders();
    // FIX: Use BASE_URL and append the query string.
    // Assuming your server uses the same endpoint for list as for create/update/single.
    const response = await axios.get(`${BASE_URL}?companyId=${companyId}`, headers);
    return response.data as LedgerResponseData[];
};

export const getCompanyLedgers = async (companyId: string): Promise<LedgerResponseData[]> => {
    const headers = getAuthHeaders();
    // FIX: Use BASE_URL and append the query string.
    // Assuming your server uses the same endpoint for list as for create/update/single.
    const response = await axios.get(`${BASE_URL}?companyId=${companyId}`, headers);
    return response.data as LedgerResponseData[];
};

// 3. Fetch Single Ledger by ID (GET /api/ledger/:ledgerId)
// This is the function required by the 'edit/[id].tsx' page.
export const getLedgerById = async (ledgerId: string): Promise<LedgerResponseData> => {
    const headers = getAuthHeaders();
    // FIX: Use BASE_URL and the ID parameter.
    const response = await axios.get(`${BASE_URL}/${ledgerId}`, headers); 
    return response.data as LedgerResponseData;
};

// 4. Update Ledger Account (PUT /api/ledger/:id)
export const updateLedgerAccount = async (id: string, data: LedgerData) => {
    const headers = getAuthHeaders();
    // Using LedgerData here is safer than Partial<LedgerData> since your component sends the full form data.
    const response = await axios.put(`${BASE_URL}/${id}`, data, headers);
    return response.data as LedgerResponseData;
};

// 5. Delete Ledger Account (DELETE /api/ledger/:id)
export const deleteLedgerAccount = async (id: string) => {
    const headers = getAuthHeaders();
    const response = await axios.delete(`${BASE_URL}/${id}`, headers);
    return response.data;
};

// --- Note on Removed Functions ---
// 1. 'listLedgerAccounts' was removed as 'getLedgers' now performs the same function with the correct URL.
// 2. 'fetchLedgerAccountById' was removed as 'getLedgerById' is a direct, more efficient API call.