// src/api/journalApi.ts

import axios from 'axios';

// NOTE: Update this URL if your Journal API is different
//const BASE_URL = 'http://localhost:5000/api/journal';
//const BASE_URL1 = 'http://localhost:5000/api/ledger';

const BASE_URL = 'https://accounting-backend-euge.onrender.com/api/journal'; 
const BASE_URL1 = 'https://accounting-backend-euge.onrender.com/api/ledger'; 

// --- FRONTEND TYPES ---

// Type for a single line item sent to the backend
export interface JournalLineData {
    ledgerId: string; // MongoDB ObjectId as a string
    ledgerName: string;
    debit: number;
    credit: number;
    lineNarration?: string;
}

// Type for the full Journal Entry data structure sent to the backend
export interface JournalDataToSend {
    companyId: string;
    date: string; // YYYY-MM-DD format
    voucherType: string;
    narration: string;
    lines: JournalLineData[]; // Array of line items
    totalDebit: number;
    totalCredit: number;
}
export interface LedgerOption {
    _id: string;
    name: string;
}
export interface LedgerReportEntry {
    journalId: string;
    date: string;
    voucherType: string;
    voucherNo: string;
    narration: string;
    lineNarration?: string;
    debit: number;
    credit: number;
    opponentLedgerName: string | null; 
    // otherPartyLedgerName: string | null; // Placeholder
}

export interface JournalEntry extends JournalDataToSend {
    _id: string; // MongoDB ID
    voucherNo: string; // Auto-generated number
    createdAt: string; // Timestamp
    // Add other fields returned by the server, like 'updatedAt'
}

// Type for the successful response body
interface JournalResponse {
    message: string;
    data: any; // The saved journal document from the backend
}

// Function to get the standard Axios headers including Authorization
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    };
};

// 1. Create Journal Entry API Call (POST)
// Corresponds to the backend route: POST /api/journal
export const createJournalEntry = async (data: JournalDataToSend): Promise<JournalResponse> => {
    // 1. Get Headers
    const headers = getAuthHeaders();
    
    // 2. Make Request
    try {
        const response = await axios.post(BASE_URL, data, headers);
        return response.data;
    } catch (error) {
        // Re-throw to allow component to handle the error
        if (axios.isAxiosError(error) && error.response) {
            // Include backend error message if available
            throw new Error(error.response.data.message || 'Failed to post Journal Entry.');
        }
        throw new Error('Network or server error during Journal Entry creation.');
    }
};

// 2. List Journal Entries API Call (GET)
// Corresponds to the backend route: GET /api/journal?companyId=...
export const listJournals = async (companyId: string): Promise<JournalEntry[]> => {
    const headers = getAuthHeaders();
    
    // Construct the URL with the companyId as a query parameter
    const URL_WITH_QUERY = `${BASE_URL}?companyId=${companyId}`;

    try {
        // Use axios.get and pass the headers
        const response = await axios.get(URL_WITH_QUERY, headers);
        // The response.data should be the array of JournalEntry objects
        return response.data; 
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || 'Failed to fetch Journal Entries list.');
        }
        throw new Error('Network or server error during Journal list fetching.');
    }
};

// 3. Get Journal Entry by ID API Call (GET /api/journal/details/:id)
export const getJournalById = async (id: string): Promise<JournalEntry> => {
    const headers = getAuthHeaders();
    
    // ✅ FIX: Use the new /details/:id route path
    const DETAIL_URL = `${BASE_URL}/details/${id}`; 

    try {
        const response = await axios.get(DETAIL_URL, headers);
        // The response.data should be the single JournalEntry object
        return response.data; 
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || 'Failed to fetch Journal Entry details.');
        }
        throw new Error('Network or server error during Journal detail fetching.');
    }
};

// 4. Get Ledger Report API Call (GET /api/journal/report/ledger?...)
export const getLedgerReport = async (companyId: string, ledgerId: string, startDate?: string, endDate?: string): Promise<LedgerReportEntry[]> => {
    const headers = getAuthHeaders();
    
    // Construct query parameters
    const params = new URLSearchParams({
        companyId,
        ledgerId,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
    });

    const REPORT_URL = `${BASE_URL}/report/ledger?${params.toString()}`;

    try {
        const response = await axios.get(REPORT_URL, headers);
        return response.data; 
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || 'Failed to generate ledger report.');
        }
        throw new Error('Network or server error during report generation.');
    }
};

// Function to fetch ledgers for a company (used for dropdowns)
export const getJournalLineLedgers = async (companyId: string): Promise<LedgerOption[]> => {
    const headers = getAuthHeaders();
    // Assuming /api/journal/ledgers/:companyId is the correct backend route
    const LEDGER_URL = `${BASE_URL}/ledgers/${companyId}`; 

    try {
        const response = await axios.get(LEDGER_URL, headers);
        return response.data; 
    } catch (error) {
        // ... error handling ..
        // .
        
        throw new Error('Failed to fetch ledger list.' + error);
    }
};

export interface LedgerDetails {
    _id: string;
    name: string;
    openingBalance: number;
    obType: 'Credit' | 'Debit';
}

// src/api/journalApi.ts

// NOTE: This assumes you have a backend route set up like /api/ledgers/details/:ledgerId
export const getLedgerDetails = async (ledgerId: string): Promise<LedgerDetails> => {
    const headers = getAuthHeaders();
    // Assuming your base ledger route is /api/ledgers
    const LEDGER_DETAIL_URL = `${BASE_URL1}/details/${ledgerId}`; 

    try {
        const response = await axios.get(LEDGER_DETAIL_URL, headers);
        // Ensure your backend sends { _id, name, openingBalance, balanceType }
        return response.data; 
    } catch (error) {
        throw new Error('Failed to fetch ledger details.' + error);
    }
};

// (You would add listJournals, getJournalById, etc., here)