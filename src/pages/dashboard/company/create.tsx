// pages/dashboard/company/create.tsx

import React, { useState } from 'react';
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
    SelectChangeEvent, // REQUIRED IMPORT
    Link
} from '@mui/material';
import NextLink from 'next/link';
import { createCompany } from '../../api/companyApi'; 

// --- UPDATED INITIAL STATE ---
const initialFormData = {
    name: '',
    // ✅ NEW: Field for the Company Short Code
    shortCode: '', 
    financialYearStart: '',
    currencyCode: 'INR',
    address: '',
};

const currencies = [
    { code: 'INR', name: 'Indian Rupee (₹)' },
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'British Pound (£)' },
];

const CreateCompanyPage = () => {
    // NOTE: TypeScript adjustment if not using a specific interface for formData
    const [formData, setFormData] = useState<typeof initialFormData>(initialFormData); 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const {fetchCompanies} =  useCompany();

    // 1. Handler for standard TextField (Name, Short Code, Address)
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        // Special logic for shortCode: convert to uppercase and limit characters (e.g., max 5)
        const formattedValue = name === 'shortCode' ? value.toUpperCase().slice(0, 5) : value;

        setFormData(prev => ({ 
            ...prev, 
            [name]: formattedValue 
        }));
    };
    
    // 2. Handler for Select (Currency Code)
    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        setFormData(prev => ({
            ...prev,
            currencyCode: e.target.value,
        }));
    };

    // 3. Handler for Date Field (Financial Year Start)
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            financialYearStart: e.target.value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!formData.name || !formData.shortCode || !formData.financialYearStart || !formData.currencyCode) {
            setError("Please fill in all required fields (Name, Short Code, Financial Year Start, Currency).");
            setIsLoading(false);
            return;
        }
        
        // Basic validation for shortCode
        if (formData.shortCode.length < 2) {
             setError("Company Short Code must be at least 2 characters.");
             setIsLoading(false);
             return;
        }

        try {
            // formData now includes shortCode and is passed to the API
            await createCompany(formData); 
            await fetchCompanies();
            router.push('/dashboard'); 
            
        } catch (err: any) {
            console.error('Company Creation Failed:', err);
            const errMsg = err.response?.data?.message || 'Failed to create company. Check server status.';
            setError(errMsg);
        } finally {
            setIsLoading(false);
        }
    };

    // Using GridItem alias to bypass the known TypeScript error on Grid item prop
    const GridItem = Grid as any;

    return (
        <DashboardLayout>
            <Box>
                <Typography variant="h4" gutterBottom>
                    Set Up Your First Company
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 4 }}>
                    Start by providing the essential details for your business. The **Short Code** is used for unique voucher numbers.
                </Typography>

                <Paper sx={{ p: { xs: 2, md: 4 }, maxWidth: 800 }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            {/* 1. Company Name - Uses handleTextChange */}
                            <GridItem item xs={12} sm={6}>
                                <TextField
                                    label="Company Name"
                                    name="name"
                                    required
                                    fullWidth
                                    value={formData.name}
                                    onChange={handleTextChange}
                                />
                            </GridItem>
                            
                            {/* ✅ 2. Company Short Code - Uses handleTextChange */}
                            <GridItem item xs={12} sm={6}>
                                <TextField
                                    label="Company Short Code (e.g., ABC)"
                                    name="shortCode"
                                    required
                                    fullWidth
                                    // Hint to the user about its purpose
                                    helperText="Used as a prefix for unique voucher numbers (Max 5 letters, Uppercase)" 
                                    value={formData.shortCode}
                                    onChange={handleTextChange}
                                    inputProps={{ maxLength: 5 }}
                                />
                            </GridItem>
                            
                            {/* 3. Financial Year Start Date - Uses handleDateChange */}
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
                                    onChange={handleDateChange}
                                    InputLabelProps={{ shrink: true }} 
                                />
                            </GridItem>

                            {/* 4. Currency Code - Uses handleSelectChange */}
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

                            {/* 5. Address (Optional) - Uses handleTextChange */}
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
                                    disabled={isLoading}
                                    startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                                >
                                    {isLoading ? 'Creating...' : 'Create Company'}
                                </Button>
                                <NextLink href="/dashboard" passHref legacyBehavior>
                                    <Link component="button" variant="body2" sx={{ ml: 2, textDecoration: 'none' }}>
                                        <Button variant="outlined" color="secondary" disabled={isLoading}>
                                            Cancel
                                        </Button>
                                    </Link>
                                </NextLink>
                            </GridItem>
                        </Grid>
                    </Box>
                </Paper>
            </Box>
        </DashboardLayout>
    );
};

const ProtectedCreateCompany = () => (
    <PrivateRoute>
        <CreateCompanyPage />
    </PrivateRoute>
);

export default ProtectedCreateCompany;