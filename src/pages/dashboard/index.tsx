// pages/dashboard/index.tsx

import React from 'react';
import DashboardLayout from '../../components/Dashboard/DashboardLayout'; 
import PrivateRoute from '../../components/PrivateRoute'; 
import { 
    Box, // ✅ We will use Box for the layout
    Typography, 
    Paper, 
    Divider,
    // Removed the conflicting Grid import
} from '@mui/material';
import { useAuth } from '../../context/AuthContext'; 
import { useRouter } from 'next/router'; 

// Import all necessary icons
import AddIcon from '@mui/icons-material/Add'; 
import AssessmentIcon from '@mui/icons-material/Assessment'; 
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'; 
import ListAltIcon from '@mui/icons-material/ListAlt'; 
import ShowChartIcon from '@mui/icons-material/ShowChart'; 

// Helper component for quick action buttons
interface ActionCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    color: 'primary' | 'secondary' | 'info';
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, icon, onClick, color }) => (
    <Paper 
        sx={{ 
            p: 2, 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            borderLeft: `5px solid`,
            // Dynamically set border color based on prop
            borderColor: (theme) => theme.palette[color].main, 
            transition: '0.3s',
            '&:hover': {
                boxShadow: 6,
                transform: 'translateY(-2px)'
            },
            cursor: 'pointer'
        }} 
        onClick={onClick}
        elevation={2}
    >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box sx={{ mr: 1.5, fontSize: 28, color: (theme) => theme.palette[color].main }}>
                {icon}
            </Box>
            <Typography variant="h6" component="div" fontWeight="bold">
                {title}
            </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
            {description}
        </Typography>
    </Paper>
);


const DashboardIndexPage = () => {
    const { user } = useAuth();
    const router = useRouter(); 
    
    // --- Navigation Handlers ---

    // Transactions
    const handleNewJournal = () => router.push('/dashboard/journal/create');
    const handleViewJournals = () => router.push('/dashboard/journal'); 
    const handleManageLedgers = () => router.push('/dashboard/ledger'); 

    // Reports
    const handleViewLedgerReport = () => router.push('/dashboard/reports/ledger');
    const handleViewFinancialReport = () => router.push('/dashboard/reports/financial'); 


    return (
        <DashboardLayout>
            <Typography variant="h4" gutterBottom>
                Welcome back, {user?.name || 'User'}!
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                Accounting Command Center
            </Typography>

            {/* --- Section 1: Transactions & Management --- */}
            <Typography variant="h5" sx={{ mt: 3, mb: 2 }}>
                1. Transactions & Setup
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {/* 🎯 FLEXBOX CONTAINER REPLACEMENT (Replicates container spacing={3}) */}
            <Box 
                sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 3 // Replaces spacing={3}
                }}
            >
                {/* 🎯 FLEXBOX ITEM 1 (Replicates item xs=12, sm=6, lg=4) */}
                <Box 
                    sx={{ 
                        width: { 
                            xs: '100%',     // 12/12 = 100%
                            sm: 'calc(50% - 12px)', // 6/12 width - adjusted for gap
                            lg: 'calc(33.33% - 16px)' // 4/12 width - adjusted for gap
                        },
                        minWidth: 0 // Essential for correct Flexbox wrapping
                    }}
                >
                    <ActionCard
                        title="New Journal Entry"
                        description="Record a new transaction: receipt, payment, or general voucher."
                        icon={<AddIcon />}
                        onClick={handleNewJournal}
                        color="secondary"
                    />
                </Box>
                
                {/* 🎯 FLEXBOX ITEM 2 (Replicates item xs=12, sm=6, lg=4) */}
                <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', lg: 'calc(33.33% - 16px)' }, minWidth: 0 }}>
                    <ActionCard
                        title="View All Journals"
                        description="Review, edit, or delete existing transaction records."
                        icon={<ListAltIcon />}
                        onClick={handleViewJournals}
                        color="primary"
                    />
                </Box>

                {/* 🎯 FLEXBOX ITEM 3 (Replicates item xs=12, sm=6, lg=4) */}
                <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', lg: 'calc(33.33% - 16px)' }, minWidth: 0 }}>
                    <ActionCard
                        title="Manage Accounts/Ledgers"
                        description="View or create new accounts for your Chart of Accounts."
                        icon={<AccountBalanceIcon />}
                        onClick={handleManageLedgers}
                        color="info"
                    />
                </Box>
            </Box>

            {/* --- Section 2: Reports & Analysis --- */}
            <Typography variant="h5" sx={{ mt: 5, mb: 2 }}>
                2. Reporting & Analysis
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {/* 🎯 FLEXBOX CONTAINER REPLACEMENT (Replicates container spacing={3}) */}
            <Box 
                sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 3 
                }}
            >
                {/* 🎯 FLEXBOX ITEM 4 (Replicates item xs=12, sm=6, lg=4) */}
                <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', lg: 'calc(33.33% - 16px)' }, minWidth: 0 }}>
                    <ActionCard
                        title="Ledger Statement"
                        description="Generate detailed reports for any specific account or ledger."
                        icon={<AssessmentIcon />}
                        onClick={handleViewLedgerReport}
                        color="primary"
                    />
                </Box>
                
                {/* 🎯 FLEXBOX ITEM 5 (Replicates item xs=12, sm=6, lg=4) */}
                <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', lg: 'calc(33.33% - 16px)' }, minWidth: 0 }}>
                    <ActionCard
                        title="Financial Statements"
                        description="Generate Profit & Loss (Income) and Balance Sheet reports."
                        icon={<ShowChartIcon />}
                        onClick={handleViewFinancialReport}
                        color="secondary"
                    />
                </Box>
            </Box>
            

            {/* Placeholder for Recent Activity */}
            <Box sx={{ mt: 5 }}>
                <Typography variant="h5">Recent Activity</Typography>
                <Paper sx={{ p: 3, mt: 2 }}>
                    <Typography>User created a new ledger account 'Client A Outstanding'.</Typography>
                    <Typography color="text.secondary" variant="caption">5 minutes ago</Typography>
                </Paper>
            </Box>
        </DashboardLayout>
    );
};

// Wrap the Dashboard with the Private Route
const ProtectedDashboardPage = () => (
    <PrivateRoute>
        <DashboardIndexPage />
    </PrivateRoute>
);

export default ProtectedDashboardPage;