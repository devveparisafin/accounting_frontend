// pages/dashboard/ledger/edit/[id].tsx

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCompany } from '../../../../context/CompanyContext';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import { 
    Box, Typography, Paper, TextField, Button, CircularProgress, Alert, 
    Grid, InputLabel, Select, MenuItem, SelectChangeEvent, Tabs, Tab, FormControl
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
// Assuming these functions and LedgerData are correctly exported from your API file
import { getLedgerById, updateLedgerAccount, LedgerData } from '../../../api/ledgerApi'; 

// --- Initial State (Placeholder structure, will be overwritten by API data) ---
// Note: This must match the imported LedgerData structure, including the optional _id.
const emptyLedgerState: LedgerData = {
    _id: '', // Crucial for identification, should match the type in ledgerApi.ts
    companyId: '', name: '', group: '', alias: '', openingBalance: 0, obType: 'Debit',
    creditDays: 0, creditLimit: 0, address: '', city: '', pincode: '', area: '', state: '',
    GSTIN: '', VATIN: '', PANNo: '', ECCNo: '', dlrType: 'Unregistered', CSTIN: '',
    contactPerson: '', aadharNo: '', phoneNoO: '', fax: '', mobileNo: '', email: '', website: '',
    status: 'Active',
};

// --- Tab Panel Component (Reused from create.tsx) ---
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}
function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

// --- Edit Ledger Component ---
const EditLedgerPage = () => {
    const router = useRouter();
    const { id } = router.query; // Get the ID from the URL (e.g., from /edit/12345)
    const { selectedCompany } = useCompany();
    const [formData, setFormData] = useState<LedgerData>(emptyLedgerState);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);

    // Grid Type Workaround for conflicting MUI/TS types
    const GridItem = Grid as any;

    // --- Data Fetching Effect ---
    useEffect(() => {
        // Prevent fetching if the router hasn't populated the ID yet
        if (!id || Array.isArray(id)) return; 

        const ledgerId = id as string;

        const fetchLedgerData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch existing ledger data by ID
                const data: LedgerData = await getLedgerById(ledgerId);
                // Ensure number fields are numbers, even if received as strings
                setFormData({
                    ...data,
                    openingBalance: Number(data.openingBalance || 0),
                    creditDays: Number(data.creditDays || 0),
                    creditLimit: Number(data.creditLimit || 0),
                });
            } catch (err: any) {
                console.error('Failed to fetch ledger:', err);
                setError(err.response?.data?.message || `Failed to load ledger data for ID: ${ledgerId}.`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLedgerData();
    }, [id]);

    // --- Handlers (Reused and adapted from create.tsx) ---
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        let processedValue: string | number = value;
        if (['openingBalance', 'creditDays', 'creditLimit'].includes(name)) {
            // Coerce to number when updating state
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

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!formData.name || !formData.group) {
            setError("Ledger Name and Group are required fields (Tab 1).");
            setActiveTab(0);
            return;
        }

        // Must have an ID to update
        if (!formData._id) {
            setError("Cannot update: Ledger ID is missing.");
            return;
        }

        setIsLoading(true);
        try {
            // Send the updated data
            await updateLedgerAccount(formData._id, formData); 
            router.push('/dashboard/ledger');
        } catch (err: any) {
            console.error('Ledger Update Failed:', err);
            setError(err.response?.data?.message || 'Failed to update ledger account.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render Logic ---
    if (isLoading && !formData._id) {
        return <DashboardLayout><Box sx={{ py: 5, textAlign: 'center' }}><CircularProgress /><Typography>Loading Ledger Data...</Typography></Box></DashboardLayout>;
    }

    if (error && !formData._id) {
        return <DashboardLayout><Alert severity="error">{error}</Alert></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <Box>
                <Typography variant="h4" gutterBottom>
                    Edit Ledger Account: {formData.name}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 4 }}>
                    Company: **{selectedCompany?.name || 'Loading...'}**. Ledger ID: {formData._id}
                </Typography>

                <Paper sx={{ p: { xs: 2, md: 4 } }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                            <Tabs value={activeTab} onChange={handleTabChange}>
                                <Tab label="Core & Accounting" />
                                <Tab label="Address & Contact" />
                                <Tab label="Regulatory & Misc." />
                            </Tabs>
                        </Box>

                        {/* ============================= TAB 1: Core & Accounting ============================= */}
                        <TabPanel value={activeTab} index={0}>
                            <Grid container spacing={3}>
                                <GridItem item xs={12} sm={6}>
                                    <TextField label="Ledger Name" name="name" required fullWidth
                                        value={formData.name} onChange={handleTextChange}
                                        helperText="E.g., Cash, SBI Bank, Mr. X Customer"
                                    />
                                </GridItem>
                                <GridItem item xs={12} sm={6}>
                                    <TextField label="Alias" name="alias" fullWidth
                                        value={formData.alias} onChange={handleTextChange}
                                        helperText="Internal short name or short code"
                                    />
                                </GridItem>
                                
                                <GridItem item xs={12} sm={6}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Group</InputLabel>
                                        <Select label="Group" name="group" 
                                            value={formData.group} 
                                            onChange={handleSelectChange}
                                        >
                                            <MenuItem value="Sundry Debtors">Sundry Debtors</MenuItem>
                                            <MenuItem value="Sundry Creditors">Sundry Creditors</MenuItem>
                                            <MenuItem value="Bank Accounts">Bank Accounts</MenuItem>
                                            <MenuItem value="Cash in Hand">Cash in Hand</MenuItem>
                                            <MenuItem value="Sales Accounts">Sales Accounts</MenuItem>
                                            <MenuItem value="Purchase Accounts">Purchase Accounts</MenuItem>
                                            <MenuItem value="Indirect Expenses">Indirect Expenses</MenuItem>
                                        </Select>
                                    </FormControl>
                                </GridItem>
                                
                                <GridItem item xs={12} sm={4}>
                                    <TextField label="Opening Balance" name="openingBalance" type="number" fullWidth
                                        // Non-null assertion is safe here as state is initialized
                                        value={formData.openingBalance!.toString()} 
                                        onChange={handleTextChange}
                                    />
                                </GridItem>
                                <GridItem item xs={12} sm={2}>
                                    <FormControl fullWidth>
                                        <InputLabel>OB Type</InputLabel>
                                        <Select label="OB Type" name="obType" value={formData.obType}
                                            onChange={handleSelectChange}
                                        >
                                            <MenuItem value="Debit">Debit</MenuItem>
                                            <MenuItem value="Credit">Credit</MenuItem>
                                        </Select>
                                    </FormControl>
                                </GridItem>
                                
                                <GridItem item xs={12} sm={6}>
                                    <TextField label="Credit Days" name="creditDays" type="number" fullWidth
                                        // Non-null assertion is safe here as state is initialized
                                        value={formData.creditDays!.toString()}
                                        onChange={handleTextChange}
                                        helperText="Credit period for this party (0 for cash)"
                                    />
                                </GridItem>
                                <GridItem item xs={12} sm={6}>
                                    <TextField label="Credit Limit" name="creditLimit" type="number" fullWidth
                                        // Non-null assertion is safe here as state is initialized
                                        value={formData.creditLimit!.toString()}
                                        onChange={handleTextChange}
                                        helperText="Max allowed outstanding balance"
                                    />
                                </GridItem>
                            </Grid>
                        </TabPanel>

                        {/* ============================= TAB 2: Address & Contact ============================= */}
                        <TabPanel value={activeTab} index={1}>
                            <Grid container spacing={3}>
                                <GridItem item xs={12}>
                                    <TextField label="Address" name="address" fullWidth multiline rows={2}
                                        value={formData.address} onChange={handleTextChange}
                                    />
                                </GridItem>
                                <GridItem item xs={12} sm={4}>
                                    <TextField label="City" name="city" value={formData.city} onChange={handleTextChange} fullWidth />
                                </GridItem>
                                <GridItem item xs={12} sm={4}>
                                    <TextField label="State" name="state" value={formData.state} onChange={handleTextChange} fullWidth />
                                </GridItem>
                                <GridItem item xs={12} sm={4}>
                                    <TextField label="Pincode" name="pincode" value={formData.pincode} onChange={handleTextChange} fullWidth />
                                </GridItem>
                                
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
                        </TabPanel>

                        {/* ============================= TAB 3: Regulatory & Misc. ============================= */}
                        <TabPanel value={activeTab} index={2}>
                            <Grid container spacing={3}>
                                <GridItem item xs={12} sm={6}>
                                    <TextField label="GSTIN" name="GSTIN" value={formData.GSTIN} onChange={handleTextChange} fullWidth />
                                </GridItem>
                                <GridItem item xs={12} sm={6}>
                                    <TextField label="PAN No" name="PANNo" value={formData.PANNo} onChange={handleTextChange} fullWidth />
                                </GridItem>
                                
                                <GridItem item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Dealer Type</InputLabel>
                                        <Select label="Dealer Type" name="dlrType" value={formData.dlrType}
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
                                    <FormControl fullWidth>
                                        <InputLabel>Status</InputLabel>
                                        <Select label="Status" name="status" value={formData.status}
                                            onChange={handleSelectChange}
                                        >
                                            <MenuItem value="Active">Active</MenuItem>
                                            <MenuItem value="Inactive">Inactive</MenuItem>
                                        </Select>
                                    </FormControl>
                                </GridItem>
                                
                                <GridItem item xs={12} sm={6}>
                                    <TextField label="Aadhar No" name="aadharNo" value={formData.aadharNo} onChange={handleTextChange} fullWidth />
                                </GridItem>
                                <GridItem item xs={12} sm={6}>
                                    <TextField label="CST IN" name="CSTIN" value={formData.CSTIN} onChange={handleTextChange} fullWidth />
                                </GridItem>
                            </Grid>
                        </TabPanel>

                        {/* --- Submit Button --- */}
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="success"
                                size="large"
                                disabled={isLoading || !formData._id}
                                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            >
                                {isLoading ? 'Updating Ledger...' : 'Update Ledger Account'}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </DashboardLayout>
    );
};

export default EditLedgerPage;