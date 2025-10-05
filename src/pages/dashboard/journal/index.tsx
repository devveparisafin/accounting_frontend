import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/Dashboard/DashboardLayout';
import { useCompany } from '../../../context/CompanyContext';
// 🚨 Corrected Import: Assuming '../api/journalApi' is the correct relative path
import { listJournals } from '../../api/journalApi'; 

// Import MUI components
import {
    Box, Typography, Paper, Button, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
} from '@mui/material';
import { Add as AddIcon, Visibility as VisibilityIcon } from '@mui/icons-material';

// --- TYPE DEFINITIONS ---
// NOTE: JournalEntry should be imported from journalApi.ts for consistency
interface JournalDataToSend {
    companyId: string;
    date: string; // YYYY-MM-DD format
    voucherType: string;
    narration: string;
    lines: any[]; // Use 'any[]' or the actual JournalLineData[] if imported
    totalDebit: number;
    totalCredit: number;
}
interface JournalEntry extends JournalDataToSend {
    _id: string; // MongoDB ID
    voucherNo: string; // Auto-generated number
    createdAt: string; // Timestamp
}

const JournalIndexPage = () => {
    const router = useRouter();
    const { selectedCompany } = useCompany();
    
    const [journals, setJournals] = useState<JournalEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ==========================================================
    // --- DATA FETCHING: useEffect to get Journals ---
    // ==========================================================
    useEffect(() => {
        const fetchJournals = async () => {
            // 1. Check if a company is selected
            if (!selectedCompany?._id) {
                setIsLoading(false);
                setJournals([]);
                // Optional: set a user-friendly error if no company is selected
                // setError('Please select a company to view journal entries.'); 
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                // ✅ ACTUAL API CALL: Remove the temporary mock data block
                const data: JournalEntry[] = await listJournals(selectedCompany._id); 
                
                setJournals(data);
            } catch (err: any) {
                console.error('Failed to load journals:', err);
                // Use the error message from the API if available, otherwise a generic message
                const errorMessage = err.message || 'Failed to load journal entries from the server.';
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJournals();
        // Depend on selectedCompany._id so it re-fetches when company changes
    }, [selectedCompany?._id]);

    const handleNavigateToCreate = () => {
        router.push('/dashboard/journal/create');
    };
    
    const handleViewJournal = (id: string) => {
        // Navigates to the individual journal detail page
        router.push(`/dashboard/journal/${id}`); 
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        // Handles YYYY-MM-DD format
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    // Show loading, error, or main content
    if (isLoading) {
        return (
            <DashboardLayout>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                    <Typography variant="h6" sx={{ ml: 2 }}>Loading Journal Entries...</Typography>
                </Box>
            </DashboardLayout>
        );
    }
    
    if (error) {
        return (
            <DashboardLayout>
                <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h4">
                        Journal Entries ({selectedCompany?.name || 'No Company Selected'})
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleNavigateToCreate}
                        // Disable if no company is selected, as you can't create an entry without one
                        disabled={!selectedCompany?._id}
                    >
                        New Journal Entry
                    </Button>
                </Box>

                <Paper>
                    {journals.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary">
                                No Journal Entries found for this company.
                            </Typography>
                            <Button
                                variant="outlined"
                                sx={{ mt: 2 }}
                                startIcon={<AddIcon />}
                                onClick={handleNavigateToCreate}
                                disabled={!selectedCompany?._id}
                            >
                                Create the First Entry
                            </Button>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table stickyHeader aria-label="journal table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Voucher No.</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Narration</TableCell>
                                        <TableCell align="right">Total Amount (₹)</TableCell>
                                        <TableCell align="center">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {journals.map((journal) => (
                                        <TableRow hover key={journal._id}>
                                            <TableCell>{formatDate(journal.date)}</TableCell>
                                            <TableCell>{journal.voucherNo}</TableCell>
                                            <TableCell>{journal.voucherType}</TableCell>
                                            <TableCell sx={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {journal.narration}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                {/* Added optional chaining just in case */}
                                                {journal.totalDebit?.toLocaleString('en-IN') || '0.00'} 
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton 
                                                    onClick={() => handleViewJournal(journal._id)} 
                                                    color="info"
                                                    size="small"
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            </Box>
        </DashboardLayout>
    );
};

export default JournalIndexPage;