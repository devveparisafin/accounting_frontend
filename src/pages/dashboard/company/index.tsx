// pages/dashboard/company/index.tsx - CONVERTED TO LIST VIEW

import React, { useState } from 'react';
import DashboardLayout from '../../../components/Dashboard/DashboardLayout';
import PrivateRoute from '../../../components/PrivateRoute';
import { useCompany } from '../../../context/CompanyContext';
import { 
    Box, 
    Typography, 
    Paper, 
    Button,
    CircularProgress, 
    Alert, 
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import NextLink from 'next/link';
import BusinessIcon from '@mui/icons-material/Business';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { deleteCompany } from '../../api/companyApi';

// Helper function to format the date display
const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateString;
    }
};

const CompanyManagementPage = () => {
    
    const { companies, selectedCompany, isLoading, error, fetchCompanies, selectCompany } = useCompany();
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const [isDeleting, setIsDeleting] = useState(false);


    const handleDeleteClick = (companyId: string) => {
        setCompanyToDelete(companyId);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setCompanyToDelete(null);
        setOpenDeleteDialog(false);
    };

    const handleConfirmDelete = async () => {
        if (!companyToDelete) return;
        
        setIsDeleting(true);
        try {
            await deleteCompany(companyToDelete);
            await fetchCompanies(); // Refresh the list of companies

            // If the deleted company was the selected one, unselect it.
            if (companyToDelete === selectedCompany?._id) {
                // The context logic should handle selecting a new default or setting null,
                // but we explicitly tell it to select the first one if available.
                const remainingCompanies = companies.filter(c => c._id !== companyToDelete);
                if (remainingCompanies.length > 0) {
                    selectCompany(remainingCompanies[0]._id);
                }
            }
            
            handleCloseDeleteDialog();
        } catch (err: any) {
            console.error("Delete failed:", err);
            alert(`Error deleting company: ${err.response?.data?.message || 'Server error'}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <DashboardLayout>
            <Box>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
                    Company Management
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 4 }}>
                    View and manage all companies associated with your account.
                </Typography>

                <Box mb={2} display="flex" justifyContent="flex-end">
                    <NextLink href="/dashboard/company/create" passHref legacyBehavior>
                        <Button variant="contained" startIcon={<AddIcon />}>
                            Add New Company
                        </Button>
                    </NextLink>
                </Box>
                
                {isLoading && companies.length === 0 ? (
                    <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : companies.length === 0 ? (
                    <Alert severity="info">
                        No companies found. Click "Add New Company" to get started!
                    </Alert>
                ) : (
                    <Paper>
                        <TableContainer>
                            <Table aria-label="company list">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Code</TableCell>
                                        <TableCell>Financial Year Start</TableCell>
                                        <TableCell>Base Currency</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {companies.map((company) => (
                                        <TableRow 
                                            key={company._id} 
                                            sx={{ 
                                                // Highlight the currently selected company
                                                backgroundColor: company._id === selectedCompany?._id ? theme.palette.action.hover : 'inherit' 
                                            }}
                                        >
                                            <TableCell component="th" scope="row">
                                                {company.name}
                                            </TableCell>
                                            <TableCell>{company.shortCode}</TableCell>
                                            <TableCell>{formatDate(company.financialYearStart)}</TableCell>
                                            <TableCell>{company.currencyCode}</TableCell>
                                            <TableCell align="right">
                                                <NextLink href={`/dashboard/company/edit?id=${company._id}`} passHref>
                                                    <IconButton aria-label="edit" color="primary" size="small">
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </NextLink>
                                                <IconButton 
                                                    aria-label="delete" 
                                                    color="error" 
                                                    size="small"
                                                    onClick={() => handleDeleteClick(company._id)}
                                                    disabled={companies.length === 1} // Prevent deleting the last company
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {companies.length === 1 && (
                            <Box p={2}>
                                <Alert severity="warning">You cannot delete the last remaining company.</Alert>
                            </Box>
                        )}
                    </Paper>
                )}
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog
                fullScreen={fullScreen}
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
                aria-labelledby="responsive-dialog-title"
            >
                <DialogTitle id="responsive-dialog-title">{"Confirm Deletion"}</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this company? All associated data (ledgers, transactions) will be permanently lost. This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button autoFocus onClick={handleCloseDeleteDialog} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirmDelete} 
                        color="error" 
                        variant="contained" 
                        disabled={isDeleting}
                        startIcon={isDeleting ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
};

const ProtectedCompanyManagementPage = () => (
    <PrivateRoute>
        <CompanyManagementPage />
    </PrivateRoute>
);

export default ProtectedCompanyManagementPage;