import React, { useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/Dashboard/DashboardLayout';
import { useCompany } from '../../../context/CompanyContext';
// FIXED: Import LedgerData from the API file where it is defined
import { createLedgerAccount, LedgerData } from '../../api/ledgerApi'; 
import { 
    Box, Typography, Paper, TextField, Button, CircularProgress, Alert, 
    Grid, InputLabel, Select, MenuItem, SelectChangeEvent, FormControl, Divider
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

// Initial state for the complex form
const initialLedgerState: LedgerData = {
    companyId: '', // To be filled from context
    name: '',
    group: '',
    alias: '',
    openingBalance: 0,
    obType: 'Debit',
    creditDays: 0,
    creditLimit: 0,
    address: '', city: '', pincode: '', area: '', state: '',
    GSTIN: '', VATIN: '', PANNo: '', ECCNo: '', dlrType: 'Unregistered', CSTIN: '',
    contactPerson: '', aadharNo: '', phoneNoO: '', fax: '', mobileNo: '', email: '', website: '',
    status: 'Active',
};

// --- Ledger Creation Component ---
const CreateLedgerPage = () => {
    const router = useRouter();
    const { selectedCompany } = useCompany();
    const [formData, setFormData] = useState<LedgerData>(initialLedgerState);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Grid Type Workaround
    const GridItem = Grid as any;

    // --- Handlers ---

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        let processedValue: string | number = value;
        // Ensure numeric fields are stored as numbers (even if the input value is a string)
        if (['openingBalance', 'creditDays', 'creditLimit'].includes(name)) {
            // Use parseFloat for potentially non-integer numbers, though currency is usually fine with int/float
            processedValue = Number(value);
        }

        setFormData(prev => ({ 
            ...prev, 
            [name]: processedValue 
        }));
    };
    
    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name as keyof LedgerData]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!selectedCompany) {
            setError("Error: Please select or create a company first.");
            return;
        }

        const dataToSend: LedgerData = {
            ...formData,
            companyId: selectedCompany._id,
        };

        if (!dataToSend.name || !dataToSend.group) {
            setError("Ledger Name and Group are required fields.");
            return; 
        }

        setIsLoading(true);
        try {
            await createLedgerAccount(dataToSend);
            router.push('/dashboard/ledger');
        } catch (err: any) {
            console.error('Ledger Creation Failed:', err);
            const errMsg = err.response?.data?.message || 'Failed to create ledger account. Check server status.';
            setError(errMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <Box>
                <Typography variant="h4" gutterBottom>
                    Create New Ledger Account
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 4 }}>
                    Company: **{selectedCompany?.name || 'Loading...'}**. Define your party, bank, or expense account.
                </Typography>

                <Paper sx={{ p: { xs: 2, md: 4 } }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit}>
                        
                        {/* ============================= SECTION 1: CORE DETAILS (FIXED FOR WIDTH) ============================= */}
                        <Typography variant="h6" gutterBottom sx={{ mt: 0, mb: 2 }}>
                            Core Details
                        </Typography>
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            
                            {/* 1. Ledger Name */}
                            <GridItem item xs={12} sm={6}>
                                <TextField
                                    label="Ledger Name" name="name" required fullWidth
                                    value={formData.name} onChange={handleTextChange}
                                    helperText="E.g., Cash, SBI Bank, Mr. X Customer"
                                />
                            </GridItem>
                            
                            {/* 2. Alias */}
                            <GridItem item xs={12} sm={6}>
                                <TextField
                                    label="Alias" name="alias" fullWidth
                                    value={formData.alias} onChange={handleTextChange}
                                    helperText="Internal short name or short code"
                                />
                            </GridItem>

                            {/* --- New Row for Group and Status (Fixes the Group Select width issue) --- */}
                            
                            {/* 3. Group */}
                                   <GridItem item xs={12} sm={6}>
    <FormControl fullWidth required>
        {/* 🛑 FIX 🛑: Use the 'shrink' prop to force the label up when the value is empty */}
        <InputLabel 
            shrink={!!formData.group || formData.group === ''} // Label shrinks if a value exists OR if it's the default empty string
        >
            Group
        </InputLabel>
        
        <Select
            label="Group" 
            name="group" 
            value={formData.group} 
            onChange={handleSelectChange}
            displayEmpty // Keeps "Select Group" visible
        >
            <MenuItem value="" disabled>Select Group</MenuItem> 
             <MenuItem value="Sundry Debtors">Sundry Debtors</MenuItem>
            <MenuItem value="Sundry Creditors">Sundry Creditors</MenuItem>
            <MenuItem value="Bank Accounts">Bank Accounts</MenuItem>
            <MenuItem value="Cash in Hand">Cash in Hand</MenuItem>
            <MenuItem value="Sales Accounts">Sales Accounts</MenuItem>
            <MenuItem value="Purchase Accounts">Purchase Accounts</MenuItem>
            <MenuItem value="Indirect Expenses">Indirect Expenses</MenuItem>
            {/* ... rest of your Menu Items */}
        </Select>
    </FormControl>
</GridItem>
                            
                            {/* 4. Status */}
                            
                             <GridItem item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        label="Status" name="status" 
                                        value={formData.status}
                                        onChange={handleSelectChange}
                                    >
                                        <MenuItem value="Active">Active</MenuItem>
                                        <MenuItem value="Inactive">Inactive</MenuItem>
                                    </Select>
                                </FormControl>
                            </GridItem>
                        </Grid>

                        <Divider sx={{ my: 4 }} />

                        {/* ============================= SECTION 2: ACCOUNTING DETAILS (ADJUSTED FOR CONSISTENCY) ============================= */}
                        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                            Accounting Details
                        </Typography>
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            {/* Opening Balance and Type (Combined 6/12 width) */}
                            <GridItem item xs={12} sm={6} container spacing={2}>
                                <GridItem item xs={8} sm={8}> {/* 8/12 of the 6-col space */}
                                    <TextField
                                        label="Opening Balance" name="openingBalance" type="number"
                                        fullWidth
                                        value={formData.openingBalance!.toString()} 
                                        onChange={handleTextChange}
                                    />
                                </GridItem>
                                <GridItem item xs={4} sm={4}> {/* 4/12 of the 6-col space */}
                                    <FormControl fullWidth>
                                        <InputLabel>Type</InputLabel>
                                        <Select
                                            label="Type" name="obType"
                                            value={formData.obType}
                                            onChange={handleSelectChange}
                                        >
                                            <MenuItem value="Debit">Debit</MenuItem>
                                            <MenuItem value="Credit">Credit</MenuItem>
                                        </Select>
                                    </FormControl>
                                </GridItem>
                            </GridItem>
                            
                            {/* Credit Days and Limit (Separate 3/12 widths for clarity) */}
                            <GridItem item xs={12} sm={3}>
                                <TextField
                                    label="Credit Days" name="creditDays" type="number"
                                    fullWidth
                                    value={formData.creditDays!.toString()}
                                    onChange={handleTextChange}
                                    helperText="Credit period (days)"
                                />
                            </GridItem>
                            <GridItem item xs={12} sm={3}>
                                <TextField
                                    label="Credit Limit" name="creditLimit" type="number"
                                    fullWidth
                                    value={formData.creditLimit!.toString()}
                                    onChange={handleTextChange}
                                    helperText="Max outstanding"
                                />
                            </GridItem>
                        </Grid>

                        <Divider sx={{ my: 4 }} />

                        {/* ============================= SECTION 3: ADDRESS & CONTACT ============================= */}
                        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                            Address & Contact
                        </Typography>
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <GridItem item xs={12}>
                                <TextField
                                    label="Address" name="address" fullWidth multiline rows={2}
                                    value={formData.address} onChange={handleTextChange}
                                />
                            </GridItem>
                            {/* Location fields */}
                            <GridItem item xs={12} sm={4}>
                                <TextField label="City" name="city" value={formData.city} onChange={handleTextChange} fullWidth />
                            </GridItem>
                            <GridItem item xs={12} sm={4}>
                                <TextField label="State" name="state" value={formData.state} onChange={handleTextChange} fullWidth />
                            </GridItem>
                            <GridItem item xs={12} sm={4}>
                                <TextField label="Pincode" name="pincode" value={formData.pincode} onChange={handleTextChange} fullWidth />
                            </GridItem>
                            {/* Contact fields */}
                            <GridItem item xs={12} sm={6}>
                                <TextField label="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={handleTextChange} fullWidth />
                            </GridItem>
                            <GridItem item xs={12} sm={6}>
                                <TextField label="Mobile No" name="mobileNo" type="tel" value={formData.mobileNo} onChange={handleTextChange} fullWidth />
                            </GridItem>
                            <GridItem item xs={12} sm={6}>
                                <TextField label="Email" name="email" type="email" value={formData.email} onChange={handleTextChange} fullWidth />
                            </GridItem>
                            <GridItem item xs={12} sm={6}>
                                <TextField label="Website" name="website" value={formData.website} onChange={handleTextChange} fullWidth />
                            </GridItem>
                        </Grid>

                        <Divider sx={{ my: 4 }} />

                        {/* ============================= SECTION 4: REGULATORY DETAILS (ADJUSTED FOR GROUPING) ============================= */}
                        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                            Regulatory Details
                        </Typography>
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            
                            {/* Row 1: Primary Tax IDs & Dealer Type */}
                            <GridItem item xs={12} sm={6}>
                                <TextField label="GSTIN" name="GSTIN" value={formData.GSTIN} onChange={handleTextChange} fullWidth />
                            </GridItem>
                            <GridItem item xs={12} sm={6}>
                                <TextField label="PAN No" name="PANNo" value={formData.PANNo} onChange={handleTextChange} fullWidth />
                            </GridItem>

                            <GridItem item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Dealer Type</InputLabel>
                                    <Select
                                        label="Dealer Type" name="dlrType" 
                                        value={formData.dlrType}
                                        onChange={handleSelectChange}
                                    >
                                        <MenuItem value="Regular">Regular</MenuItem>
                                        <MenuItem value="Composition">Composition</MenuItem>
                                        <MenuItem value="Unregistered">Unregistered</MenuItem>
                                        <MenuItem value="Consumer">Consumer</MenuItem>
                                    </Select>
                                </FormControl>
                            </GridItem>
                            <GridItem item xs={12} sm={6}>
                                <TextField label="Aadhar No" name="aadharNo" value={formData.aadharNo} onChange={handleTextChange} fullWidth />
                            </GridItem>
                            
                            {/* Row 2: Secondary/Other IDs */}
                            <GridItem item xs={12} sm={4}>
                                <TextField label="CST IN" name="CSTIN" value={formData.CSTIN} onChange={handleTextChange} fullWidth />
                            </GridItem>
                            <GridItem item xs={12} sm={4}>
                                <TextField label="VAT IN" name="VATIN" value={formData.VATIN} onChange={handleTextChange} fullWidth />
                            </GridItem>
                            <GridItem item xs={12} sm={4}>
                                <TextField label="ECC No" name="ECCNo" value={formData.ECCNo} onChange={handleTextChange} fullWidth />
                            </GridItem>
                        </Grid>
                        
                        {/* --- Submit Button --- */}
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="success"
                                size="large"
                                disabled={isLoading || !selectedCompany}
                                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            >
                                {isLoading ? 'Saving Ledger...' : 'Save Ledger Account'}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </DashboardLayout>
    );
};

export default CreateLedgerPage;