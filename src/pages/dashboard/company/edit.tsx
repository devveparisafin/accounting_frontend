// pages/dashboard/company/edit.tsx

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/Dashboard/DashboardLayout';
import PrivateRoute from '../../../components/PrivateRoute';
import { useCompany } from '../../../context/CompanyContext';
import { 
    Box, 
    Typography, 
    Paper, 
    TextField, 
    Button, 
    CircularProgress, 
    Alert, 
    Grid,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
    Link as MuiLink
} from '@mui/material';
import NextLink from 'next/link';
import EditIcon from '@mui/icons-material/Edit';
import { updateCompany, fetchCompanyById } from '../../../pages/api/companyApi';

// Initial state structure (must match form data)
const initialFormData = {
    name: '',
    financialYearStart: '', // Expected format YYYY-MM-DD
    currencyCode: '',
    address: '',
};

const currencies = [
    { code: 'INR', name: 'Indian Rupee (₹)' },
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'British Pound (£)' },
];

const EditCompanyPage = () => {
    const router = useRouter();
    const companyId = router.query.id as string;
    
    const { fetchCompanies } = useCompany();
    
    const [formData, setFormData] = useState(initialFormData);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    // --- Data Fetching Effect ---
    useEffect(() => {
        if (!companyId) return;

        const loadCompanyData = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                const companyData = await fetchCompanyById(companyId);

                // Format the date to YYYY-MM-DD for the HTML date input
                const dateOnly = companyData.financialYearStart.split('T')[0];

                setFormData({
                    name: companyData.name,
                    financialYearStart: dateOnly,
                    currencyCode: companyData.currencyCode,
                    address: companyData.address || '',
                });
            } catch (err: any) {
                console.error('Failed to load company:', err);
                setLoadError("Could not load company details. Access denied or company does not exist.");
            } finally {
                setIsLoading(false);
            }
        };

        loadCompanyData();
    }, [companyId]);

    // --- Handlers ---
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        setFormData(prev => ({ ...prev, currencyCode: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSaving(true);

        if (!formData.name || !formData.financialYearStart || !formData.currencyCode) {
            setError("Please fill in all required fields.");
            setIsSaving(false);
            return;
        }

        try {
            // Send only the fields that were modified to the PUT endpoint
            await updateCompany(companyId, formData);
            
            // Force the context to refresh and select the updated company
            await fetchCompanies();
            
            // Success! Redirect back to the company list
            router.push('/dashboard/company'); 
            
        } catch (err: any) {
            console.error('Company Update Failed:', err);
            const errMsg = err.response?.data?.message || 'Failed to update company. Check server logs.';
            setError(errMsg);
        } finally {
            setIsSaving(false);
        }
    };

    // Using GridItem alias to bypass the known TypeScript error on Grid item prop
    const GridItem = Grid as any;

    if (isLoading) {
        return (
            <DashboardLayout>
                <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>
            </DashboardLayout>
        );
    }
    
    if (loadError) {
        return (
            <DashboardLayout>
                <Alert severity="error">{loadError}</Alert>
                <NextLink href="/dashboard/company" passHref legacyBehavior>
                     <MuiLink component="button" variant="body2" sx={{ mt: 2, textDecoration: 'none' }}>
                        <Button variant="contained">Back to Company List</Button>
                     </MuiLink>
                </NextLink>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Box>
                <Typography variant="h4" gutterBottom>
                    <EditIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Edit Company: {formData.name}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 4 }}>
                    Modify the essential details of your business.
                </Typography>

                <Paper sx={{ p: { xs: 2, md: 4 }, maxWidth: 800 }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            {/* Company Name */}
                            <GridItem item xs={12}>
                                <TextField
                                    label="Company Name"
                                    name="name"
                                    required
                                    fullWidth
                                    value={formData.name}
                                    onChange={handleTextChange}
                                />
                            </GridItem>
                            
                            {/* Financial Year Start Date */}
                            <GridItem item xs={12} sm={6}>
                                <InputLabel shrink htmlFor="financialYearStart">
                                    Financial Year Start Date (YYYY-MM-DD)
                                </InputLabel>
                                <TextField
                                    id="financialYearStart"
                                    name="financialYearStart"
                                    type="date"
                                    required
                                    fullWidth
                                    value={formData.financialYearStart}
                                    onChange={handleTextChange}
                                    InputLabelProps={{ shrink: true }} 
                                />
                            </GridItem>

                            {/* Currency Code */}
                            <GridItem item xs={12} sm={6}>
                                <InputLabel shrink htmlFor="currencyCode">
                                    Base Currency
                                </InputLabel>
                                <Select
                                    id="currencyCode"
                                    name="currencyCode"
                                    required
                                    fullWidth
                                    value={formData.currencyCode} 
                                    onChange={handleSelectChange} 
                                >
                                    {currencies.map((curr) => (
                                        <MenuItem key={curr.code} value={curr.code}>
                                            {curr.name} ({curr.code})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </GridItem>

                            {/* Address (Optional) */}
                            <GridItem item xs={12}>
                                <TextField
                                    label="Company Address (Optional)"
                                    name="address"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={formData.address}
                                    onChange={handleTextChange}
                                />
                            </GridItem>
                            
                            {/* Submit Button */}
                            <GridItem item xs={12}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    disabled={isSaving}
                                    startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <NextLink href="/dashboard/company" passHref legacyBehavior>
                                    <MuiLink component="button" variant="body2" sx={{ ml: 2, textDecoration: 'none' }}>
                                        <Button variant="outlined" color="secondary" disabled={isSaving}>
                                            Cancel
                                        </Button>
                                    </MuiLink>
                                </NextLink>
                            </GridItem>
                        </Grid>
                    </Box>
                </Paper>
            </Box>
        </DashboardLayout>
    );
};

const ProtectedEditCompany = () => (
    <PrivateRoute>
        <EditCompanyPage />
    </PrivateRoute>
);

export default ProtectedEditCompany;