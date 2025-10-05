// pages/dashboard/reports/ledger.tsx

import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../../components/Dashboard/DashboardLayout';
import { useCompany } from '../../../context/CompanyContext';
import {
    Box, 
    Typography, 
    Paper, 
    Select, 
    MenuItem, 
    FormControl, 
    InputLabel, 
    Button,
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    CircularProgress, 
    Alert, 
    TextField,
    FormControlLabel, 
    Checkbox 
    // MuiGrid is removed here
} from '@mui/material';
import { Search as SearchIcon, Assessment as AssessmentIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';

// 🚨 Assuming your API types are defined here
import { 
    getLedgerReport, 
    LedgerReportEntry, 
    getJournalLineLedgers, 
    LedgerOption, 
    getLedgerDetails,
    LedgerDetails
} from '../../api/journalApi'; 
import dynamic from 'next/dynamic';
import LedgerPdfDocument from '@/components/Report/LedgerPdfDocument';

// Interface for the combined report data rows (including calculated balance)
interface ReportRow extends LedgerReportEntry {
    balance: number;
    balanceType: 'Dr' | 'Cr';
}
interface CalculatedReportData {
    dataWithBalance: ReportRow[];
    totalDebit: number;
    totalCredit: number;
    finalBalance: number;
    finalBalanceType: 'Dr' | 'Cr'; // <-- This is the key strict type
}
const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    {
        ssr: false, // This is essential for Next.js
        loading: () => <Button variant="outlined" disabled>Loading PDF...</Button>,
    }
);

const LedgerReportPage = () => {
    const { selectedCompany } = useCompany();
    const [ledgers, setLedgers] = useState<LedgerOption[]>([]);
    const [selectedLedgerId, setSelectedLedgerId] = useState<string>('');
    const [reportData, setReportData] = useState<LedgerReportEntry[]>([]);
    const [ledgerDetails, setLedgerDetails] = useState<LedgerDetails | null>(null); 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [printParticulars, setPrintParticulars] = useState(true); 

    const selectedLedger = useMemo(() => ledgers.find(l => l._id === selectedLedgerId), [ledgers, selectedLedgerId]);

    // 1. Fetch Ledger List for Dropdown (Unchanged)
    useEffect(() => {
        const fetchLedgers = async () => {
            if (selectedCompany?._id) {
                try {
                    const data = await getJournalLineLedgers(selectedCompany._id); 
                    setLedgers(data);
                } catch (err) {
                    console.error('Failed to fetch ledgers:', err);
                }
            }
        };
        fetchLedgers();
    }, [selectedCompany?._id]);

    // 2. Fetch Report Data and Ledger Details (Handler - Unchanged)
    const handleGenerateReport = async () => {
        if (!selectedCompany?._id || !selectedLedgerId) {
            setError("Please select a company and a ledger account.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setReportData([]);
        setLedgerDetails(null); 

        try {
            // Fetch Ledger Details (Opening Balance)
            const details = await getLedgerDetails(selectedLedgerId);
            setLedgerDetails(details);

            // Fetch Transactions
            const transactions = await getLedgerReport(
                selectedCompany._id, 
                selectedLedgerId, 
                startDate, 
                endDate
            );
            setReportData(transactions);
            
        } catch (err: any) {
            console.error("Report generation failed:", err); 
            setError(err.message || "Failed to fetch report data. Check console for details.");
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Calculate Running Balance and Totals
    const { dataWithBalance, totalDebit, totalCredit, finalBalance, finalBalanceType } = useMemo<CalculatedReportData>(() => {
        
        // 🚨 CRITICAL: Handle the initial null state for ledgerDetails
        if (!ledgerDetails) return { 
            dataWithBalance: [], 
            totalDebit: 0, 
            totalCredit: 0, 
            finalBalance: 0, 
            finalBalanceType: 'Dr' 
        };
        
        let totalDebit = 0;
        let totalCredit = 0;

        // Determine the initial balance and sign: Debit is positive, Credit is negative
        let initialBalance = ledgerDetails.openingBalance;
        // 🛑 NOTE: I'm assuming 'obType' is the correct property for opening balance type based on your logic flow.
        if (ledgerDetails.obType === 'Credit') {
            initialBalance = -initialBalance;
        }

        let currentBalance = initialBalance;
        
        // 1. Create the Opening Balance Row
        const openingRow: ReportRow = {
            journalId: 'OPENING', 
            date: 'N/A', 
            voucherType: 'Opening',
            voucherNo: 'OPN',

            narration: `Opening Balance carried forward`,
            lineNarration: '',
            opponentLedgerName: 'N/A', // <-- Added to satisfy ReportRow interface
            debit: ledgerDetails.obType === 'Debit' ? ledgerDetails.openingBalance : 0,
            credit: ledgerDetails.obType === 'Credit' ? ledgerDetails.openingBalance : 0,
            balance: initialBalance,
            // 🛑 FIX: Use type assertion for the literal type
            balanceType: (initialBalance >= 0 ? 'Dr' : 'Cr') as 'Dr' | 'Cr'
        };

        // Initialize totals with opening balance amounts
        totalDebit += openingRow.debit;
        totalCredit += openingRow.credit;

        // 2. Process Transaction Rows
        const transactionRows: ReportRow[] = reportData.map((entry) => {
            currentBalance = currentBalance + entry.debit - entry.credit;
            
            // Add transaction amounts to totals
            totalDebit += entry.debit;
            totalCredit += entry.credit;
            
            return {
                ...entry,
                balance: currentBalance,
                // 🛑 FIX: Use type assertion for the literal type
                balanceType: (currentBalance >= 0 ? 'Dr' : 'Cr') as 'Dr' | 'Cr'
            } as ReportRow;
        });
        
        // 3. Final Balance Calculation
        const finalBalanceAbsolute = Math.abs(currentBalance);
        
        // 🛑 FIX: Use type assertion for the final calculated value
        const finalBalanceType = (currentBalance >= 0 ? 'Dr' : 'Cr') as 'Dr' | 'Cr';

        return { 
            dataWithBalance: [openingRow, ...transactionRows], 
            totalDebit, 
            totalCredit, 
            finalBalance: finalBalanceAbsolute,
            finalBalanceType // This is now strictly typed as 'Dr' | 'Cr'
        };

    }, [reportData, ledgerDetails]);


    // --- Render Section ---

    if (isLoading) {
        return (
            <DashboardLayout>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Box>
                <Typography variant="h4" gutterBottom>
                    Ledger Statement Report
                </Typography>

                {/* Filter Controls - REPLACED GRID WITH BOX/FLEXBOX */}
                <Paper sx={{ p: 3, mb: 4 }}>
                    {/* Replicates Grid container spacing={2} alignItems="flex-end" */}
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: 2, 
                            alignItems: 'flex-end' 
                        }}
                    >
                        {/* Replicates MuiGrid item xs={12} sm={4} */}
                        <Box sx={{ width: { xs: '100%', sm: 'calc(33.33% - 16px)', md: 'calc(33.33% - 16px)' } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Ledger Account</InputLabel>
                                <Select
                                    value={selectedLedgerId}
                                    label="Ledger Account"
                                    onChange={(e) => setSelectedLedgerId(e.target.value as string)}
                                    disabled={!selectedCompany?._id || ledgers.length === 0}
                                >
                                    {ledgers.map((ledger) => (
                                        <MenuItem key={ledger._id} value={ledger._id}>
                                            {ledger.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Replicates MuiGrid item xs={6} sm={3} */}
                        <Box sx={{ width: { xs: 'calc(50% - 8px)', sm: 'calc(25% - 12px)', md: 'calc(16.66% - 12px)' } }}>
                            <TextField
                                fullWidth
                                label="Start Date"
                                type="date"
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </Box>
                        
                        {/* Replicates MuiGrid item xs={6} sm={3} */}
                        <Box sx={{ width: { xs: 'calc(50% - 8px)', sm: 'calc(25% - 12px)', md: 'calc(16.66% - 12px)' } }}>
                            <TextField
                                fullWidth
                                label="End Date"
                                type="date"
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </Box>
                        
                        {/* Replicates MuiGrid item xs={12} sm={3} - Checkbox (small on MD+) */}
                        <Box sx={{ width: { xs: '100%', sm: '100%', md: 'calc(16.66% - 12px)' } }}> 
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={printParticulars}
                                        onChange={(e) => setPrintParticulars(e.target.checked)}
                                    />
                                }
                                label="Include Particulars in PDF"
                            />
                        </Box>
                        
                        {/* Replicates MuiGrid item xs={12} sm={2} - Button 1 */}
                        <Box sx={{ width: { xs: 'calc(50% - 8px)', sm: 'calc(50% - 8px)', md: 'calc(8.33% - 10px)' } }}>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<SearchIcon />}
                                onClick={handleGenerateReport}
                                disabled={isLoading || !selectedLedgerId}
                            >
                                Generate
                            </Button>
                        </Box>

                        {/* Replicates MuiGrid item xs={12} sm={2} - Button 2 */}
                        <Box sx={{ width: { xs: 'calc(50% - 8px)', sm: 'calc(50% - 8px)', md: 'calc(8.33% - 10px)' } }}>
                            {(dataWithBalance.length > 0 && ledgerDetails) ? (
                                <PDFDownloadLink
                                    document={
                                        <LedgerPdfDocument
                                            reportTitle={`Ledger Statement for ${selectedLedger?.name || ''}`}
                                            ledgerName={selectedLedger?.name || ''}
                                            dataWithBalance={dataWithBalance as any} 
                                            ledgerDetails={ledgerDetails}
                                            totalDebit={totalDebit}
                                            totalCredit={totalCredit}
                                            finalBalance={finalBalance}
                                            finalBalanceType={finalBalanceType} 
                                            printParticulars={printParticulars}
                                            fromDate={startDate}
                                            toDate={endDate}
                                        />
                                    }
                                    fileName={`Ledger_Statement_${selectedLedger?.name}_${new Date().toLocaleDateString('en-US').replace(/\//g, '-')}.pdf`}
                                >
                                    {({ loading }) => (
                                        <Button 
                                            fullWidth 
                                            variant="outlined" 
                                            disabled={loading} 
                                            color="secondary"
                                        >
                                            <FileDownloadIcon sx={{ mr: 1 }} /> 
                                            {loading ? 'Preparing...' : 'Export PDF'}
                                        </Button>
                                    )}
                                </PDFDownloadLink>
                            ) : (
                                <Button fullWidth variant="outlined" disabled>Export PDF</Button>
                            )}
                        </Box>
                    </Box>
                </Paper>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {/* Report Table */}
                {(dataWithBalance.length > 0 && ledgerDetails) && (
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h5" gutterBottom>
                            <AssessmentIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                            Statement for: {selectedLedger?.name}
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Voucher No</TableCell>
                                        <TableCell>Particulars</TableCell>
                                        <TableCell>Narration</TableCell>
                                        <TableCell align="right">Debit (₹)</TableCell>
                                        <TableCell align="right">Credit (₹)</TableCell>
                                        <TableCell align="right">Balance (₹)</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {/* Mapped Rows */}
                                    {dataWithBalance.map((entry, index) => (
                                        <TableRow 
                                            key={entry.journalId + index} 
                                            hover 
                                            sx={{ 
                                                bgcolor: entry.voucherType === 'Opening' ? '#eef5ff' : 'inherit',
                                                fontWeight: entry.voucherType === 'Opening' ? 'bold' : 'normal',
                                            }}
                                        >
                                            <TableCell>
                                                {entry.voucherType === 'Opening' ? '-' : new Date(entry.date).toLocaleDateString('en-IN')}
                                            </TableCell>
                                            <TableCell>
                                                {entry.voucherNo} {entry.voucherType !== 'Opening' ? `(${entry.voucherType})` : ''}
                                            </TableCell>
                                            <TableCell>
                                                {entry.opponentLedgerName}
                                            </TableCell>
                                        
                                            <TableCell>
                                                <Typography variant="body2">{entry.narration}</Typography>
                                                {entry.lineNarration && entry.voucherType !== 'Opening' && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Line: {entry.lineNarration}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                {entry.debit > 0 ? entry.debit.toLocaleString('en-IN') : '-'}
                                            </TableCell>
                                            <TableCell align="right">
                                                {entry.credit > 0 ? entry.credit.toLocaleString('en-IN') : '-'}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                {Math.abs(entry.balance).toLocaleString('en-IN')} **{entry.balanceType}**
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    
                                    {/* 🛑 Total Row */}
                                    <TableRow sx={{ bgcolor: '#fff3e0', borderTop: '2px solid #ff9800' }}>
                                        <TableCell colSpan={4} align="right">
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                TOTALS
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {totalDebit.toLocaleString('en-IN')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {totalCredit.toLocaleString('en-IN')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: 'primary.main' }}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {finalBalance.toLocaleString('en-IN')} **{finalBalanceType}**
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        {/* Closing Balance summary */}
                        <Box sx={{ mt: 2, p: 1, border: '1px solid #ddd', bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'flex-end' }}>
                            <Typography variant="h6" fontWeight="bold">
                                Closing Balance: {finalBalance.toLocaleString('en-IN')} {finalBalanceType}
                            </Typography>
                        </Box>
                    </Paper>
                )}
            </Box>
        </DashboardLayout>
    );
};

export default LedgerReportPage;