// pages/dashboard/journal/create.tsx

import React, { useState, useMemo, useEffect } from 'react'; // 🛑 UPDATED: Added useEffect
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/Dashboard/DashboardLayout';
import { useCompany } from '../../../context/CompanyContext';
import { 
    Box, Typography, Paper, TextField, Button, CircularProgress, Alert, 
    Grid, InputLabel, Select, MenuItem, FormControl, Divider, IconButton, 
    InputAdornment 
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';

// 🛑 NEW: Import API services and types
import { getCompanyLedgers } from '../../api/ledgerApi'; 
import { createJournalEntry, JournalDataToSend } from '../../api/journalApi'; 


// --- TYPE DEFINITIONS ---
interface JournalLine {
    id: number;
    ledgerId: string;
    ledgerName: string; 
    debit: number;
    credit: number;
    lineNarration: string;
}

interface JournalData {
    companyId: string;
    date: string;
    voucherType: string;
    narration: string;
    lines: JournalLine[];
    totalDebit: number;
    totalCredit: number;
}

// 🛑 NEW: Ledger Type for fetched data
interface Ledger {
    _id: string;
    name: string;
    group?: string; 
}


// --- INITIAL STATE (Unchanged) ---
const initialLines: JournalLine[] = [
    { id: Date.now(), ledgerId: '', ledgerName: '', debit: 0, credit: 0, lineNarration: '' },
    { id: Date.now() + 1, ledgerId: '', ledgerName: '', debit: 0, credit: 0, lineNarration: '' },
];

const initialJournalState: JournalData = {
    companyId: '',
    date: new Date().toISOString().split('T')[0],
    voucherType: 'Journal',
    narration: '',
    lines: initialLines,
    totalDebit: 0,
    totalCredit: 0,
};

// 🛑 MOCK LEDGERS REMOVED (Replaced by API fetch)


// --- Custom Ledger Select Component ---
interface LedgerSelectProps {
    value: string;
    onChange: (ledgerId: string) => void;
    id: number;
    ledgers: Ledger[]; // 🛑 UPDATED: Accepts the fetched list
    disabled: boolean; // 🛑 NEW: To disable while loading
}

const LedgerSelect: React.FC<LedgerSelectProps> = ({ value, onChange, id, ledgers, disabled }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter the list based on the search term
    const filteredLedgers = useMemo(() => {
        if (!searchTerm) return ledgers; // 🛑 UPDATED: Use 'ledgers' prop
        const lowerCaseSearch = searchTerm.toLowerCase();
        return ledgers.filter(ledger =>
            ledger.name.toLowerCase().includes(lowerCaseSearch)
        );
    }, [searchTerm, ledgers]); // 🛑 UPDATED: Dependency on 'ledgers' prop

    return (
        <FormControl fullWidth size="small" required disabled={disabled}> {/* 🛑 UPDATED: Use disabled prop */}
            <InputLabel id={`ledger-label-${id}`} shrink={!!searchTerm || !!value}>
                Ledger Account
            </InputLabel>
            <Select
                labelId={`ledger-label-${id}`}
                label="Ledger Account"
                value={value}
                onChange={(e) => {
                    if (e.target.value !== searchTerm) {
                        onChange(e.target.value as string);
                        setSearchTerm(''); 
                    }
                }}
                MenuProps={{
                    PaperProps: {
                        sx: { maxHeight: 300 } 
                    }
                }}
            >
                <Box sx={{ p: 1, position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'white' }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search Ledgers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()} 
                    />
                </Box>
                
                {/* 🛑 UPDATED: Conditional rendering for loading/no data */}
                {filteredLedgers.length > 0 ? (
                    filteredLedgers.map(ledger => (
                        <MenuItem key={ledger._id} value={ledger._id}>
                            {ledger.name}
                        </MenuItem>
                    ))
                ) : (
                    <MenuItem disabled>
                        {disabled ? "Loading ledgers..." : "No Ledgers Found"}
                    </MenuItem>
                )}
            </Select>
        </FormControl>
    );
};


// --- Journal Entry Creation Component ---
const CreateJournalPage = () => {
    const router = useRouter();
    const { selectedCompany } = useCompany();
    const [formData, setFormData] = useState<JournalData>(initialJournalState);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 🛑 NEW: State for fetched ledgers and loading
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [isLedgerLoading, setIsLedgerLoading] = useState(true);

    const GridItem = Grid as any;

    // 🛑 NEW: Ledger Fetching Effect
    useEffect(() => {
        const fetchLedgers = async () => {
            if (!selectedCompany?._id) {
                setLedgers([]);
                setIsLedgerLoading(false);
                setError("No company selected. Cannot load ledgers.");
                return;
            }

            setIsLedgerLoading(true);
            setError(null);
            try {
                const data = await getCompanyLedgers(selectedCompany._id); 
                setLedgers(data);
            } catch (err: any) {
                console.error('Ledger fetch error:', err);
                // Extract message from Axios response if available
                const message = err.response?.data?.message || err.message || 'Failed to load ledger accounts.';
                setError(message);
                setLedgers([]);
            } finally {
                setIsLedgerLoading(false);
            }
        };

        fetchLedgers();
    }, [selectedCompany?._id]); 

    // ==========================================================
    // --- CORE LOGIC ---
    // ==========================================================

    const calculateTotals = (currentLines: JournalLine[]) => {
        const totalDebit = currentLines.reduce((sum, line) => sum + line.debit, 0);
        const totalCredit = currentLines.reduce((sum, line) => sum + line.credit, 0);
        
        setFormData(prev => ({
            ...prev,
            totalDebit,
            totalCredit,
            lines: currentLines,
        }));
    };

    const handleLineChange = (id: number, field: keyof JournalLine, value: any) => {
        const updatedLines = formData.lines.map(line => {
            if (line.id === id) {
                const updatedLine = { ...line, [field]: value };

                // Enforce Debit OR Credit rule
                if (field === 'debit' && value > 0) {
                    updatedLine.credit = 0;
                } else if (field === 'credit' && value > 0) {
                    updatedLine.debit = 0;
                }

                // If Ledger is being selected, update the name too
                if (field === 'ledgerId') {
                    // 🛑 UPDATED: Use fetched 'ledgers' state
                    const ledger = ledgers.find(l => l._id === value); 
                    updatedLine.ledgerName = ledger ? ledger.name : '';
                }
                
                return updatedLine;
            }
            return line;
        });
        
        calculateTotals(updatedLines);
    };

    const addLine = () => {
        const newLine: JournalLine = {
            id: Date.now(), 
            ledgerId: '', 
            ledgerName: '',
            debit: 0, 
            credit: 0, 
            lineNarration: '' 
        };
        calculateTotals([...formData.lines, newLine]);
    };

    const removeLine = (id: number) => {
        if (formData.lines.length <= 2) {
            setError("A Journal Entry must have at least two lines.");
            return;
        }
        const updatedLines = formData.lines.filter(line => line.id !== id);
        calculateTotals(updatedLines);
    };
    
    // 🛑 UPDATED: handleSubmit function uses the actual API
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!selectedCompany) {
            setError("Error: No company selected.");
            return;
        }

        // 1. Validation: Balance & completeness check
        const isBalanced = formData.totalDebit === formData.totalCredit;
        const hasUnfilledLine = formData.lines.some(line => 
            !line.ledgerId || (line.debit === 0 && line.credit === 0)
        );

        if (!isBalanced || formData.totalDebit === 0) {
            setError("Journal Entry must be balanced (Total Debit must equal Total Credit) and must not be zero.");
            return;
        }
        if (hasUnfilledLine) {
             setError("Every line must have a selected ledger account and a non-zero Debit or Credit amount.");
             return;
        }
        
        // 2. Prepare data structure for the backend API
        const dataToSend: JournalDataToSend = {
            companyId: selectedCompany._id,
            date: formData.date,
            voucherType: formData.voucherType,
            narration: formData.narration,
            totalDebit: formData.totalDebit,
            totalCredit: formData.totalCredit,
            // Map lines to the backend type (stripping the local 'id')
            lines: formData.lines.map(line => ({
                ledgerId: line.ledgerId,
                ledgerName: line.ledgerName,
                debit: line.debit,
                credit: line.credit,
                lineNarration: line.lineNarration,
            }))
        };
        
        // 3. API Call
        setIsLoading(true);
        try {
            await createJournalEntry(dataToSend); 
            router.push('/dashboard/journal'); 
        } catch (err: any) {
            console.error('Journal Creation Failed:', err);
            // Enhanced Axios error handling
            const message = err.response?.data?.message || err.message || 'Failed to post Journal Entry.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const isBalanced = formData.totalDebit === formData.totalCredit;

    return (
        <DashboardLayout>
            <Box>
                <Typography variant="h4" gutterBottom>
                    Create Journal Entry
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 4 }}>
                    Company: **{selectedCompany?.name || 'Loading...'}**. Ensure Debits equal Credits.
                    {isLedgerLoading && <CircularProgress size={16} sx={{ ml: 2 }} />} 
                </Typography>

                <Paper sx={{ p: { xs: 2, md: 4 } }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit}>
                        
                        {/* ============================= SECTION 1: HEADER DETAILS ============================= */}
                        <Typography variant="h6" gutterBottom sx={{ mt: 0, mb: 2 }}>
                            Entry Details
                        </Typography>
                        {/* 🛑 NEW: Input fields for Date, Voucher Type, Narration */}
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <GridItem item xs={12} sm={4}>
                                <TextField
                                    label="Date"
                                    type="date"
                                    fullWidth
                                    size="small"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </GridItem>
                            <GridItem item xs={12} sm={4}>
                                <FormControl fullWidth size="small" required>
                                    <InputLabel id="voucher-type-label">Voucher Type</InputLabel>
                                    <Select
                                        labelId="voucher-type-label"
                                        label="Voucher Type"
                                        value={formData.voucherType}
                                        onChange={(e) => setFormData(prev => ({ ...prev, voucherType: e.target.value as string }))}
                                    >
                                        <MenuItem value="Journal">Journal</MenuItem>
                                        <MenuItem value="Payment">Payment</MenuItem>
                                        <MenuItem value="Receipt">Receipt</MenuItem>
                                        <MenuItem value="Contra">Contra</MenuItem>
                                    </Select>
                                </FormControl>
                            </GridItem>
                            <GridItem item xs={12}>
                                <TextField
                                    label="Narration (Total Entry Description)"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    required
                                    value={formData.narration}
                                    onChange={(e) => setFormData(prev => ({ ...prev, narration: e.target.value }))}
                                />
                            </GridItem>
                        </Grid>
                        
                        <Divider sx={{ my: 4 }} />

                        {/* ============================= SECTION 2: ENHANCED ENTRY GRID ============================= */}
                        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                            Account Entries
                        </Typography>

                        {/* --- Table Header --- */}
                        <Grid container spacing={2} sx={{ mb: 2, fontWeight: 'bold' }}>
                            <GridItem item xs={12} md={3.5}>Ledger Account</GridItem>
                            <GridItem item xs={12} md={2}>Debit ({selectedCompany?.currencyCode || '₹'})</GridItem>
                            <GridItem item xs={12} md={2}>Credit ({selectedCompany?.currencyCode || '₹'})</GridItem>
                            <GridItem item xs={12} md={4.5}>Line Narration</GridItem>
                        </Grid>
                        
                        {/* --- Dynamic Row Rendering --- */}
                        {formData.lines.map((line) => (
                            <Grid container spacing={2} key={line.id} alignItems="center" sx={{ mb: 2 }}>
                                
                                {/* 1. Ledger Select (3.5/12 width) */}
                                <GridItem item xs={12} md={3.5}>
                                    <LedgerSelect 
                                        id={line.id}
                                        value={line.ledgerId} 
                                        onChange={(val) => handleLineChange(line.id, 'ledgerId', val)} 
                                        ledgers={ledgers} // 🛑 UPDATED: Pass fetched data
                                        disabled={isLedgerLoading} // 🛑 UPDATED: Pass loading state
                                    />
                                </GridItem>
                                
                                {/* 2. Debit Input (2/12 width) */}
                                <GridItem item xs={12} md={2}>
                                    <TextField
                                        label="Debit" fullWidth size="small"
                                        type="number"
                                        value={line.debit > 0 ? line.debit : ''}
                                        onChange={(e) => handleLineChange(line.id, 'debit', Number(e.target.value) || 0)}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">{selectedCompany?.currencyCode || '₹'}</InputAdornment>, // 🛑 UPDATED: Use company currency
                                        }}
                                    />
                                </GridItem>
                                
                                {/* 3. Credit Input (2/12 width) */}
                                <GridItem item xs={12} md={2}>
                                    <TextField
                                        label="Credit" fullWidth size="small"
                                        type="number"
                                        value={line.credit > 0 ? line.credit : ''}
                                        onChange={(e) => handleLineChange(line.id, 'credit', Number(e.target.value) || 0)}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">{selectedCompany?.currencyCode || '₹'}</InputAdornment>, // 🛑 UPDATED: Use company currency
                                        }}
                                    />
                                </GridItem>

                                {/* 4. Line Narration & Delete Button (4.5/12 width) */}
                                <GridItem item xs={12} md={4.5} sx={{ display: 'flex', alignItems: 'center' }}>
                                    
                                    {/* Line Narration */}
                                    <TextField
                                        label="Line Note (Optional)" size="small" fullWidth
                                        value={line.lineNarration}
                                        onChange={(e) => handleLineChange(line.id, 'lineNarration', e.target.value)}
                                    />
                                    
                                    {/* Delete Button */}
                                    <IconButton 
                                        onClick={() => removeLine(line.id)} 
                                        color="error"
                                        disabled={formData.lines.length <= 2}
                                        size="small"
                                        sx={{ ml: 1 }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </GridItem>
                            </Grid>
                        ))}
                        
                        {/* --- ADD ROW BUTTON --- */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
                            <Button
                                onClick={addLine}
                                startIcon={<AddIcon />}
                                variant="outlined"
                                color="primary"
                            >
                                Add Account Line
                            </Button>
                        </Box>
                        
                        <Divider sx={{ my: 4 }} />

                        {/* ============================= SECTION 3: TOTALS & BALANCE CHECK ============================= */}
                        <Grid container spacing={3} justifyContent="flex-end" sx={{ mt: 2 }}>
                            <GridItem item xs={12} sm={6} md={4}>
                                <Typography variant="h6" color="text.secondary">
                                    Total Debit: <span style={{ float: 'right', fontWeight: 'bold', color: formData.totalDebit > 0 ? 'inherit' : 'gray' }}>
                                        {selectedCompany?.currencyCode || '₹'} {formData.totalDebit.toFixed(2)}
                                    </span>
                                </Typography>
                                <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                                    Total Credit: <span style={{ float: 'right', fontWeight: 'bold', color: formData.totalCredit > 0 ? 'inherit' : 'gray' }}>
                                        {selectedCompany?.currencyCode || '₹'} {formData.totalCredit.toFixed(2)}
                                    </span>
                                </Typography>
                                <Typography variant="h5" sx={{ mt: 2, color: isBalanced ? 'success.main' : 'error.main' }}>
                                    Difference: <span style={{ float: 'right', fontWeight: 'bold' }}>
                                        {selectedCompany?.currencyCode || '₹'} {(formData.totalDebit - formData.totalCredit).toFixed(2)}
                                    </span>
                                </Typography>
                                {!isBalanced && (
                                    <Alert severity="warning" sx={{ mt: 2 }}>Entry is Unbalanced!</Alert>
                                )}
                            </GridItem>
                        </Grid>
                        

                        {/* --- Submit Button --- */}
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="success"
                                size="large"
                                // 🛑 UPDATED: Disable if ledgers are still loading
                                disabled={isLoading || !isBalanced || formData.totalDebit === 0 || !selectedCompany || isLedgerLoading}
                                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            >
                                {isLoading ? 'Posting Entry...' : 'Post Journal Entry'}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </DashboardLayout>
    );
};

export default CreateJournalPage;