// src/components/Dashboard/DashboardLayout.tsx - FINAL, STABLE CODE

import React, { useState, forwardRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { useRouter } from 'next/router';
import NextLink, { LinkProps } from 'next/link';
import { 
    AppBar, 
    Toolbar, 
    IconButton, 
    Typography, 
    Drawer, 
    List, 
    // IMPORTANT: Using ListItemButton for all clickable items
    
    ListItemButton, 
    ListItemIcon, 
    ListItemText, 
    Box, 
    CssBaseline, 
    Divider,
    Menu,       
    MenuItem,   
    CircularProgress, 
    
    Alert,
} from '@mui/material';

// --- Icons ---
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircle from '@mui/icons-material/AccountCircle';
import BusinessIcon from '@mui/icons-material/Business';
import AccountTreeIcon from '@mui/icons-material/AccountTree'; 
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AddIcon from '@mui/icons-material/Add'; 
import ListAltIcon from '@mui/icons-material/ListAlt';

const drawerWidth = 240;

// --- CRITICAL FIX: Custom Link Component ---
// This component correctly merges NextLink with MUI's ListItemButton types.
// We must explicitly use passHref and legacyBehavior inside this wrapper
// to prevent the MUI component from rejecting the href prop.
const LinkComponent = forwardRef<HTMLAnchorElement, LinkProps>(
    function LinkComponent(props, ref) {
        // We ensure we pass the necessary props to NextLink
        const { href, as, replace, scroll, shallow, prefetch, locale, ...other } = props as any;
        return (
            <NextLink 
                href={href} 
                as={as} 
                replace={replace} 
                scroll={scroll} 
                shallow={shallow} 
                prefetch={prefetch} 
                locale={locale} 
                passHref 
                // legacyBehavior is often required for MUI v5+ with NextLink
                // to correctly forward the ref and avoid prop errors.
                legacyBehavior 
            >
                {/* The MUI component will wrap this <a> tag */}
                <a ref={ref} {...other} />
            </NextLink>
        );
    },
);

// --- Sidebar Menu Definition ---
const primaryMenuItems = [
    { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { text: 'Company Setup', path: '/dashboard/company', icon: <BusinessIcon /> },
    { text: 'Ledger Accounts', path: '/dashboard/ledger', icon: <AccountTreeIcon /> }, 
    { text: 'Journal Entries', path: '/dashboard/journal', icon: <ListAltIcon /> }, 
];

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const router = useRouter();
    const { logout } = useAuth();
    const { 
        companies, 
        selectedCompany, 
        selectCompany, 
        isLoading: isCompanyLoading,
        error: companyError 
    } = useCompany(); 
    
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        if (companies.length > 1) {
            setAnchorEl(event.currentTarget);
        } else if (companies.length === 0) {
            router.push('/dashboard/company/create');
        }
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleCompanySelect = (companyId: string) => {
        selectCompany(companyId);
        handleClose();
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    let companyDisplayName = 'Loading...';
    if (!isCompanyLoading) {
        if (selectedCompany) {
            companyDisplayName = selectedCompany.name;
        } else if (companies.length === 0) {
            companyDisplayName = 'Setup Company';
        } else {
            companyDisplayName = 'Select Company';
        }
    }


    const drawer = (
        <div>
            {/* Toolbar acts as a spacer at the top of the sidebar */}
            <Toolbar /> 
            <Divider />
            <List>
                {primaryMenuItems.map((item) => (
                    // 🎯 FIX: Using ListItemButton, which is the correct clickable component.
                    // It does not accept the 'button' prop.
                    <ListItemButton 
                        key={item.text}
                        // We use component="a" to let the ListItemButton wrap the anchor tag from LinkComponent
                        component={LinkComponent as any} 
                        href={item.path}
                        selected={router.pathname === item.path || router.pathname.startsWith(item.path + '/')}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItemButton>
                ))}
            </List>
            <Divider />
            <List>
                {/* 🎯 LOGOUT FIX: Use ListItemButton and remove 'button' and 'component' props */}
                <ListItemButton onClick={handleLogout}> 
                    <ListItemIcon><LogoutIcon /></ListItemIcon>
                    <ListItemText primary="Logout" />
                </ListItemButton>
            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            {/* CssBaseline resets browser styles for a consistent look */}
            <CssBaseline /> 
            
            {/* App Bar (Header) */}
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    
                    {/* Company Switcher / Display Area */}
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                        {isCompanyLoading ? (
                            <CircularProgress color="inherit" size={20} sx={{ mr: 1 }} />
                        ) : (
                            <IconButton
                                edge="start"
                                color="inherit"
                                aria-label="company-switcher"
                                onClick={handleMenu}
                                disabled={companies.length === 0 && router.pathname === '/dashboard/company/create'}
                                sx={{ borderRadius: 1 }}
                            >
                                <BusinessIcon sx={{ mr: 1 }} />
                                <Typography 
                                    variant="h6" 
                                    noWrap 
                                    component="div"
                                    sx={{ 
                                        fontSize: '1rem', 
                                        fontWeight: 600,
                                        mr: 0.5
                                    }}
                                >
                                    {companyDisplayName}
                                </Typography>
                                {companies.length > 1 ? (
                                    <KeyboardArrowDownIcon />
                                ) : companies.length === 0 ? (
                                    <AddIcon fontSize="small" />
                                ) : null}
                            </IconButton>
                        )}
                        
                        {/* Company Switcher Menu */}
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                            keepMounted
                            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                        >
                            <MenuItem disabled sx={{ fontWeight: 'bold' }}>Select Active Company:</MenuItem>
                            <Divider />
                            {companies.map((company) => (
                                <MenuItem 
                                    key={company._id}
                                    selected={company._id === selectedCompany?._id}
                                    onClick={() => handleCompanySelect(company._id)}
                                >
                                    {company.name}
                                </MenuItem>
                            ))}
                            <Divider />
                            <NextLink href="/dashboard/company/create" passHref legacyBehavior>
                                <MenuItem onClick={handleClose} component="a">
                                    <AddIcon sx={{ mr: 1 }} fontSize="small" /> Create New Company
                                </MenuItem>
                            </NextLink>
                        </Menu>
                    </Box>

                    {/* Right-side Icons (e.g., User Profile/Settings) */}
                    <IconButton color="inherit">
                        <AccountCircle />
                    </IconButton>
                </Toolbar>
            </AppBar>
            
            {/* Sidebar Drawer */}
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="mailbox folders"
            >
                {/* Mobile Drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                {/* Desktop Drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            
            {/* Main Content Area */}
            <Box
                component="main"
                sx={{ 
                    flexGrow: 1, 
                    p: 3, 
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    mt: { xs: '56px', sm: '64px' } // Margin to clear the fixed AppBar
                }}
            >
                {companyError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        Error loading companies: {companyError}
                    </Alert>
                )}
                {children}
            </Box>
        </Box>
    );
};

export default DashboardLayout;