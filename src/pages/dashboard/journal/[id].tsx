// pages/dashboard/journal/[id].tsx

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/Dashboard/DashboardLayout';
// 🚨 Adjust this import path as necessary for your project structure
import { getJournalById, JournalEntry, JournalLineData } from '../../api/journalApi'; 
import {
    Box, Typography, Paper, CircularProgress, Alert, Divider, // Grid is removed here
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const JournalDetailPage = () => {
    const router = useRouter();
    // Get the ID from the URL parameter (e.g., the [id] part of the path)
    const { id } = router.query; 

    const [journal, setJournal] = useState<JournalEntry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ==========================================================
    // --- DATA FETCHING: Get Single Journal Entry ---
    // ==========================================================
    useEffect(() => {
        const fetchJournal = async () => {
            // Ensure ID is available and is a string
            if (!id || Array.isArray(id)) {
                setIsLoading(false);
                setError('Invalid or missing Journal ID in URL.');
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                // Call the API function which now hits /api/journal/details/:id
                const data: JournalEntry = await getJournalById(id);
                setJournal(data);
            } catch (err: any) {
                console.error('Failed to load journal details:', err);
                const errorMessage = err.message || 'Journal Entry not found or failed to load.';
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJournal();
    }, [id]); // Re-fetch only when the ID changes

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    // --- Loading and Error States ---
    if (isLoading) {
        return (
            <DashboardLayout>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                    <Typography variant="h6" sx={{ ml: 2 }}>Loading Journal Details...</Typography>
                </Box>
            </DashboardLayout>
        );
    }
    
    if (error || !journal) {
        return (
            <DashboardLayout>
                <Alert severity="error" sx={{ m: 4 }}>{error || 'Journal Entry not found.'}</Alert>
                <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push('/dashboard/journal')}>
                    Back to List
                </Button>
            </DashboardLayout>
        );
    }

    // --- Main Content ---
    return (
        <DashboardLayout>
            <Box>
                <Button 
                    variant="outlined" 
                    startIcon={<ArrowBackIcon />} 
                    onClick={() => router.push('/dashboard/journal')}
                    sx={{ mb: 3 }}
                >
                    Back to Journal List
                </Button>

                <Paper sx={{ p: 4 }}>
                    <Typography variant="h4" gutterBottom>
                        Journal Entry Details
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    {/* Header Details - Replaced MuiGrid container with Flex Box */}
                    <Box 
                        // Replaces Grid container spacing={2}
                        sx={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: 2, // Replaces spacing={2}
                            mb: 3
                        }} 
                    >
                        {/* Replaced MuiGrid item xs={12} sm={4} with Box + responsive width */}
                        <Box sx={{ width: { xs: '100%', sm: 'calc(33.33% - 8px)' } }}>
                            <Typography variant="subtitle2" color="text.secondary">Voucher No.</Typography>
                            <Typography variant="body1" fontWeight="bold">{journal.voucherNo}</Typography>
                        </Box>

                        {/* Replaced MuiGrid item xs={12} sm={4} with Box + responsive width */}
                        <Box sx={{ width: { xs: '100%', sm: 'calc(33.33% - 8px)' } }}>
                            <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                            <Typography variant="body1">{formatDate(journal.date)}</Typography>
                        </Box>
                        
                        {/* Replaced MuiGrid item xs={12} sm={4} with Box + responsive width */}
                        <Box sx={{ width: { xs: '100%', sm: 'calc(33.33% - 8px)' } }}>
                            <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                            <Typography variant="body1">{journal.voucherType}</Typography>
                        </Box>
                        
                        {/* Replaced MuiGrid item xs={12} with Box (full width) */}
                        <Box sx={{ width: '100%' }}>
                            <Typography variant="subtitle2" color="text.secondary">Narration</Typography>
                            <Typography variant="body1">{journal.narration}</Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Line Items Table: This displays all entries (Cash and Bank) */}
                    <Typography variant="h6" gutterBottom>
                        Journal Lines
                    </Typography>
                    <TableContainer component={Paper} elevation={0}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Ledger Account</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Debit (₹)</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Credit (₹)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {journal.lines.map((line: JournalLineData, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {/* ledgerName is now directly available from the backend */}
                                            <Typography variant="body2" fontWeight="bold">{line.ledgerName}</Typography>
                                            {line.lineNarration && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Narration: {line.lineNarration}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            {line.debit > 0 ? line.debit.toLocaleString('en-IN') : '-'}
                                        </TableCell>
                                        <TableCell align="right">
                                            {line.credit > 0 ? line.credit.toLocaleString('en-IN') : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {/* Totals Row */}
                                <TableRow sx={{ fontWeight: 'bold', borderTop: '2px solid' }}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>TOTAL</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                        {journal.totalDebit.toLocaleString('en-IN')}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                        {journal.totalCredit.toLocaleString('en-IN')}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>
        </DashboardLayout>
    );
};

export default JournalDetailPage;