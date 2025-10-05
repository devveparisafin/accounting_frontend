// pages/dashboard/ledger/index.tsx

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCompany } from '../../../context/CompanyContext';
import DashboardLayout from '../../../components/Dashboard/DashboardLayout';
import { 
    Box, Typography, Button, Paper, CircularProgress, Alert, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { getLedgers, LedgerData } from '../../api/ledgerApi'; // Assuming this function exists

// Define the columns for the table display
const LEDGER_COLUMNS = [
    { id: 'name', label: 'Ledger Name' },
    { id: 'group', label: 'Group' },
    { id: 'openingBalance', label: 'Opening Balance' },
    { id: 'dlrType', label: 'Dealer Type' },
    { id: 'status', label: 'Status' },
    { id: 'actions', label: 'Actions' },
];

const LedgerListPage = () => {
    const router = useRouter();
    const { selectedCompany } = useCompany();
    const [ledgers, setLedgers] = useState<LedgerData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedCompany) {
            // Handle case where company context is not yet loaded
            setIsLoading(false);
            return;
        }

        const fetchLedgers = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch ledgers for the selected company
                const data: LedgerData[] = await getLedgers(selectedCompany._id); 
                setLedgers(data);
            } catch (err: any) {
                console.error('Failed to fetch ledgers:', err);
                setError(err.response?.data?.message || 'Failed to load ledger list.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLedgers();
    }, [selectedCompany]);

    const handleEdit = (ledgerId: string) => {
        router.push(`/dashboard/ledger/edit/${ledgerId}`);
    };

    return (
        <DashboardLayout>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4">
                    Ledger Accounts List
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => router.push('/dashboard/ledger/create')}
                >
                    Create New Ledger
                </Button>
            </Box>

            <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 2 }}>
                    Company: {selectedCompany?.name || 'Please Select Company'}
                </Typography>
                
                {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                
                {!isLoading && !error && (
                    <TableContainer>
                        <Table stickyHeader aria-label="ledger accounts table">
                            <TableHead>
                                <TableRow>
                                    {LEDGER_COLUMNS.map((column) => (
                                        <TableCell key={column.id}>
                                            {column.label}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ledgers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={LEDGER_COLUMNS.length} align="center">
                                            No ledger accounts found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    ledgers.map((ledger) => (
                                        <TableRow hover role="checkbox" tabIndex={-1} key={ledger.name}>
                                            <TableCell>{ledger.name}</TableCell>
                                            <TableCell>{ledger.group}</TableCell>
                                            <TableCell>{ledger.obType} {ledger.openingBalance!.toFixed(2)}</TableCell>
                                            <TableCell>{ledger.dlrType}</TableCell>
                                            <TableCell>{ledger.status}</TableCell>
                                            <TableCell>
                                                <Button 
                                                    size="small" 
                                                    startIcon={<EditIcon />}
                                                    onClick={() => handleEdit(ledger._id!)} // Assuming _id exists
                                                >
                                                    Edit
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </DashboardLayout>
    );
};

export default LedgerListPage;