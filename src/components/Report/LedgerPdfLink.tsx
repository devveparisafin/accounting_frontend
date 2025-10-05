// components/Report/LedgerPdfLink.tsx

import React from 'react';
// 🚨 This is the client-side-only import we need to isolate
import { PDFDownloadLink } from '@react-pdf/renderer'; 
import { Button } from '@mui/material';
import { FileDownload as FileDownloadIcon } from '@mui/icons-material';
import { JSX } from '@emotion/react/jsx-runtime';

// Define the required props for the component
interface LedgerPdfLinkProps {
    // This prop will hold your LedgerPdfDocument JSX element
    document: JSX.Element; 
    // The filename for the downloaded PDF
    fileName: string; 
}

/**
 * A client-side wrapper for the PDFDownloadLink component.
 * This component is designed to be dynamically imported (ssr: false)
 * to prevent hydration errors from @react-pdf/renderer.
 */
const LedgerPdfLink: React.FC<LedgerPdfLinkProps> = ({ document, fileName }) => (
    <PDFDownloadLink
        document={document}
        fileName={fileName}
    >
        {/* Render function provided by PDFDownloadLink */}
        {({ loading }) => (
            <Button 
                fullWidth 
                variant="outlined" 
                disabled={loading} 
                color="secondary"
            >
                <FileDownloadIcon sx={{ mr: 1 }} /> 
                {loading ? 'Preparing PDF...' : 'Export PDF'}
            </Button>
        )}
    </PDFDownloadLink>
);

export default LedgerPdfLink;