// pages/dashboard/journal/create.tsx

import React, { useState, useMemo, useEffect } from 'react';
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
    // ✅ NEW: Type field for user selection
    type: 'Dr' | 'Cr'; 
    // ✅ NEW: Single input field for the user-entered amount
    amount: number; 
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

interface Ledger {
    _id: string;
    name: string;
    group?: string; 
}


// --- INITIAL STATE (UPDATED for new fields) ---
const initialLineDefaults: Omit<JournalLine, 'id'> = {
    ledgerId: '', 
    ledgerName: '', 
    debit: 0, 
    credit: 0, 
    lineNarration: '',
    type: 'Dr', // Default to Debit
    amount: 0,
}

const initialLines: JournalLine[] = [
    { id: Date.now(), ...initialLineDefaults },
    { id: Date.now() + 1, ...initialLineDefaults },
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

// --- Custom Ledger Select Component (Unchanged, passing new props) ---
interface LedgerSelectProps {
    value: string;
    onChange: (ledgerId: string) => void;
    id: number;
    ledgers: Ledger[];
    disabled: boolean;
}

const LedgerSelect: React.FC<LedgerSelectProps> = ({ value, onChange, id, ledgers, disabled }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLedgers = useMemo(() => {
        if (!searchTerm) return ledgers;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return ledgers.filter(ledger =>
            ledger.name.toLowerCase().includes(lowerCaseSearch)
        );
    }, [searchTerm, ledgers]);

    return (
        <FormControl fullWidth size="small" required disabled={disabled}>
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

    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [isLedgerLoading, setIsLedgerLoading] = useState(true);

    const GridItem = Grid as any;

    // Ledger Fetching Effect (Unchanged)
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

    // ✅ UPDATED: handleLineChange now correctly maps 'amount' and 'type' to 'debit' and 'credit'
    const handleLineChange = (id: number, field: keyof JournalLine, value: any) => {
        const updatedLines = formData.lines.map(line => {
            if (line.id === id) {
                const updatedLine = { ...line, [field]: value };

                // --- CORE LOGIC CHANGE ---
                if (field === 'type' || field === 'amount') {
                    const type = updatedLine.type;
                    const amount = Number(updatedLine.amount) || 0;

                    if (type === 'Dr') {
                        updatedLine.debit = amount;
                        updatedLine.credit = 0;
                    } else if (type === 'Cr') {
                        updatedLine.credit = amount;
                        updatedLine.debit = 0;
                    }
                }

                // If Ledger is being selected, update the name too
                if (field === 'ledgerId') {
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
            ...initialLineDefaults, // Use the updated defaults
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
    
    // handleSubmit function (Unchanged)
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
        
        // 2. Prepare data structure for the backend API (The backend only needs debit/credit, not type/amount)
        const dataToSend: JournalDataToSend = {
            companyId: selectedCompany._id,
            date: formData.date,
            voucherType: formData.voucherType,
            narration: formData.narration,
            totalDebit: formData.totalDebit,
            totalCredit: formData.totalCredit,
            // Map lines to the backend type (stripping the local 'id', 'type', and 'amount')
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
                        
                        {/* ============================= SECTION 1: HEADER DETAILS (Unchanged) ============================= */}
                        <Typography variant="h6" gutterBottom sx={{ mt: 0, mb: 2 }}>
                            Entry Details
                        </Typography>
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                           
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
                        </Grid>
                        
                        <Divider sx={{ my: 4 }} />

                        {/* ============================= SECTION 2: ENHANCED ENTRY GRID (UPDATED) ============================= */}
                        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                            Account Entries
                        </Typography>

                        {/* --- Table Header (UPDATED COLUMNS) --- */}
                        <Grid container spacing={2} sx={{ mb: 2, fontWeight: 'bold' }}>
                            <GridItem item xs={2} md={1}>Type</GridItem> {/* ✅ NEW: Type */}
                            <GridItem item xs={10} md={3.5}>Ledger Account</GridItem>
                            <GridItem item xs={12} md={2}>Amount ({selectedCompany?.currencyCode || '₹'})</GridItem> {/* ✅ COMBINED */}
                            <GridItem item xs={12} md={5.5}>Line Narration</GridItem> {/* ✅ WIDER */}
                        </Grid>
                        
                        {/* --- Dynamic Row Rendering (UPDATED INPUTS) --- */}
                        {formData.lines.map((line) => (
                            <Grid container spacing={2} key={line.id} alignItems="center" sx={{ mb: 2 }}>
                                
                                {/* 1. Type Select (1/12 width) */}
                                <GridItem item xs={2} md={1}>
                                    <FormControl fullWidth size="small" required>
                                        <Select
                                            value={line.type}
                                            onChange={(e) => handleLineChange(line.id, 'type', e.target.value as 'Dr' | 'Cr')}
                                        >
                                            <MenuItem value="Dr">Dr</MenuItem>
                                            <MenuItem value="Cr">Cr</MenuItem>
                                        </Select>
                                    </FormControl>
                                </GridItem>

                                {/* 2. Ledger Select (3.5/12 width) */}
                                <GridItem item xs={10} md={3.5}>
                                    <LedgerSelect 
                                        id={line.id}
                                        value={line.ledgerId} 
                                        onChange={(val) => handleLineChange(line.id, 'ledgerId', val)} 
                                        ledgers={ledgers}
                                        disabled={isLedgerLoading}
                                    />
                                </GridItem>
                                
                                {/* 3. Amount Input (2/12 width) */}
                                <GridItem item xs={12} md={2}>
                                    <TextField
                                        label="Amount" fullWidth size="small"
                                        type="number"
                                        // Use line.amount for displaying the value entered by the user
                                        value={line.amount > 0 ? line.amount : ''} 
                                        onChange={(e) => handleLineChange(line.id, 'amount', Number(e.target.value) || 0)}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">{selectedCompany?.currencyCode || '₹'}</InputAdornment>,
                                        }}
                                    />
                                </GridItem>
                                
                                {/* 4. Line Narration & Delete Button (5.5/12 width) */}
                                <GridItem item xs={12} md={5.5} sx={{ display: 'flex', alignItems: 'center' }}>
                                    
                                    {/* Line Narration */}
                                    <TextField
                                        label="Remark" size="small" fullWidth
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
                        
                        {/* --- ADD ROW BUTTON (Unchanged) --- */}
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
                         <GridItem item xs={12}>
                                <TextField
                                    label="Remark"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    
                                    value={formData.narration}
                                    onChange={(e) => setFormData(prev => ({ ...prev, narration: e.target.value }))}
                                />
                            </GridItem>
                             <Divider sx={{ my: 4 }} />

                        {/* ============================= SECTION 3: TOTALS & BALANCE CHECK (Unchanged) ============================= */}
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
                        
                        {/* --- Submit Button (Unchanged) --- */}
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="success"
                                size="large"
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