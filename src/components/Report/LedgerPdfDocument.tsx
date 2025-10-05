// components/LedgerPdfDocument.tsx

import React from 'react';
import { 
    Document, 
    Page, 
    Text, 
    View, 
    StyleSheet, 
    
} from '@react-pdf/renderer';

// --- 1. Interfaces ---
interface ReportRow {
    journalId: string;
    date: string;
    voucherType: string;
    voucherNo: string;
    narration: string;
    lineNarration: string;
    debit: number;
    credit: number;
    balance: number;
    balanceType: 'Dr' | 'Cr';
    opponentLedgerName: string | null; 
}

interface LedgerDetails {
    _id: string;
    name: string;
    openingBalance: number;
    obType: 'Debit' | 'Credit'; 
}

interface LedgerPdfProps {
    reportTitle: string;
    ledgerName: string;
    dataWithBalance: ReportRow[];
    ledgerDetails: LedgerDetails;
    totalDebit: number;
    totalCredit: number;
    finalBalance: number;
    finalBalanceType: 'Dr' | 'Cr';
    fromDate: string; 
    toDate: string; 
    printParticulars: boolean;
}


// --- 2. Utility Function ---
const formatReportDate = (dateString: string) => {
    if (!dateString || dateString === 'N/A') return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; 

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const formatAmount = (amount: number) => 
    amount.toLocaleString('en-IN', { minimumFractionDigits: 2 });


// --- 3. Base Style for Table Cells ---
const tableColBase = { 
    borderStyle: 'solid' as const, 
    borderWidth: 1, 
    borderLeftWidth: 0, 
    borderTopWidth: 0,
    borderColor: '#000',
    padding: 3,
    overflow: 'hidden' as const,
};

// Helper for table column styles (must be outside the component if used in a StyleSheet, but for dynamic widths, 
// using it with inline styles is cleaner for this case)

// --- 4. Component Definition ---
const LedgerPdfDocument = ({ 
    reportTitle, 
    ledgerName, 
    dataWithBalance, 
    ledgerDetails,
    totalDebit,
    totalCredit,
    finalBalance,
    finalBalanceType,
    fromDate, 
    toDate, 
    printParticulars, 
}: LedgerPdfProps) => {
    
    // ⭐ CORRECTED DYNAMIC WIDTH CALCULATIONS
    const DATE_WIDTH = '12%';
    const VOUCHER_WIDTH = '15%';
    const DEBIT_WIDTH = '12%';
    const CREDIT_WIDTH = '12%';
    const BALANCE_WIDTH = '14%';
    const PARTICULARS_WIDTH = '20%'; 
    
    // Remaining space for narration: 100% - (12+15+12+12+14) = 35%
    const currentNarrationWidth = printParticulars ? '15%' : '35%';

    // ⭐ CRITICAL FIX: The combined width of Date (12) + Voucher (15) + [Particulars (20)] + Narration (15 or 35) 
    // must be calculated correctly.
    // WITH PARTICULARS: 12 + 15 + 20 + 15 = 62%
    // WITHOUT PARTICULARS: 12 + 15 + 35 = 62%
    const combinedTotalRowWidth = '62%'; 

    const styles = StyleSheet.create({
        page: {
            padding: 30,
            fontFamily: 'Helvetica',
            fontSize: 10,
        },
        header: {
            fontSize: 16,
            marginBottom: 4, 
            textAlign: 'center',
            textTransform: 'uppercase',
        },
        subHeader: {
            fontSize: 11,
            marginBottom: 2, 
            textAlign: 'center',
        },
        dateRange: { 
            fontSize: 9,
            marginBottom: 15,
            textAlign: 'center',
            color: '#333',
            fontWeight: 'bold',
        },
        ledgerInfo: {
            fontSize: 9,
            marginBottom: 10,
            padding: 5,
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
        },
        table: { 
            display: 'flex', 
            width: '100%',
            flexDirection: 'column', 
            borderStyle: 'solid', 
            borderWidth: 1, 
            borderColor: '#000',
            borderRightWidth: 0, 
            borderBottomWidth: 0,
            marginTop: 10,
        }, 
        tableRow: { 
            flexDirection: 'row',
            // ⭐ REMOVED: borderRightWidth: 1. It causes double borders and issues with cell widths.
        }, 
        tableCellHeader: {
            // Inherits tableColBase for padding/bordering
            fontSize: 9, 
            backgroundColor: '#e0e0e0',
            padding: 4,
            fontWeight: 'bold',
        },
        tableCell: { 
            fontSize: 8,
            lineHeight: 1.2,
        },
        footerRow: {
            borderTopWidth: 2,
            borderStyle: 'solid',
            borderColor: '#000', 
            fontWeight: 'bold',
            fontSize: 10,
        },
        footerCell: {
            padding: 3, 
            borderTopWidth: 0,
            // textAlign is set per column for precision
        },
    });

    // Helper for table column styles
    const getColStyle = (width: string, textAlign: 'left' | 'right' = 'left') => ({ 
        ...tableColBase, 
        width: width, 
        textAlign: textAlign 
    });


    return (
        <Document>
            <Page size="A4" style={styles.page}>
                
                {/* Report Header */}
                <Text style={styles.header}>{reportTitle}</Text>
                <Text style={styles.subHeader}>Account: {ledgerName}</Text>
                <Text style={styles.dateRange}>
                    Reporting Period: {formatReportDate(fromDate)} to {formatReportDate(toDate)}
                </Text>

                {/* Ledger Info */}
                <View style={styles.ledgerInfo}>
                    <Text>
                        Opening Balance: {formatAmount(ledgerDetails.openingBalance)} {ledgerDetails.obType}
                    </Text>
                </View>

                {/* Table */}
                <View style={styles.table} fixed>
                    
                    {/* Table Header */}
                    <View style={styles.tableRow} fixed> 
                        <View style={{...getColStyle(DATE_WIDTH), ...styles.tableCellHeader}}><Text>Date</Text></View> 
                        <View style={{...getColStyle(VOUCHER_WIDTH), ...styles.tableCellHeader}}><Text>Voucher No</Text></View> 
                        
                        {/* CONDITIONAL PARTICULARS HEADER */}
                        {printParticulars && (
                            <View style={{...getColStyle(PARTICULARS_WIDTH), ...styles.tableCellHeader}}><Text>Particulars</Text></View>
                        )}
                        
                        {/* DYNAMIC NARRATION HEADER */}
                        <View style={{...getColStyle(currentNarrationWidth), ...styles.tableCellHeader}}><Text>Narration & Details</Text></View> 
                        
                        <View style={{...getColStyle(DEBIT_WIDTH, 'right'), ...styles.tableCellHeader}}><Text>Debit (₹)</Text></View> 
                        <View style={{...getColStyle(CREDIT_WIDTH, 'right'), ...styles.tableCellHeader}}><Text>Credit (₹)</Text></View> 
                        <View style={{...getColStyle(BALANCE_WIDTH, 'right'), ...styles.tableCellHeader}}><Text>Balance (₹)</Text></View> 
                    </View>

                    {/* Table Body */}
                    {dataWithBalance.map((entry, index) => (
                        <View style={styles.tableRow} key={entry.journalId + index} wrap={false}> 
                            <View style={getColStyle(DATE_WIDTH)}>
                                <Text style={styles.tableCell}>
                                    {entry.voucherType === 'Opening' ? 'O. Bal' : formatReportDate(entry.date)}
                                </Text>
                            </View> 
                            <View style={getColStyle(VOUCHER_WIDTH)}>
                                <Text style={styles.tableCell}>
                                    {entry.voucherNo} {entry.voucherType !== 'Opening' ? `(${entry.voucherType.substring(0, 1)})` : ''}
                                </Text>
                            </View> 
                            
                            {/* CONDITIONAL PARTICULARS CELL */}
                            {printParticulars && (
                                <View style={getColStyle(PARTICULARS_WIDTH)}>
                                    <Text style={{...styles.tableCell, fontWeight: 'bold'}}>
                                        {entry.voucherType === 'Opening' ? '' : entry.opponentLedgerName || '—'}
                                    </Text>
                                </View> 
                            )}

                            {/* DYNAMIC NARRATION CELL */}
                            <View style={getColStyle(currentNarrationWidth)}>
                                <Text style={styles.tableCell}>
                                    <Text style={{fontWeight: 'bold', fontSize: 9}}>{entry.narration}</Text>
                                    {'\n'}
                                    <Text style={{fontSize: 7, color: '#555'}}>{entry.lineNarration}</Text>
                                </Text>
                            </View> 
                            
                            <View style={getColStyle(DEBIT_WIDTH, 'right')}>
                                <Text style={styles.tableCell}>
                                    {entry.debit > 0 ? formatAmount(entry.debit) : '-'}
                                </Text>
                            </View> 
                            <View style={getColStyle(CREDIT_WIDTH, 'right')}>
                                <Text style={styles.tableCell}>
                                    {entry.credit > 0 ? formatAmount(entry.credit) : '-'}
                                </Text>
                            </View> 
                            <View style={getColStyle(BALANCE_WIDTH, 'right')}>
                                <Text style={styles.tableCell}>
                                    {formatAmount(Math.abs(entry.balance))} {entry.balanceType}
                                </Text>
                            </View> 
                        </View>
                    ))}
                    
                    {/* ⭐ TOTAL ROW FIX */}
                    <View style={[styles.tableRow, styles.footerRow]} fixed>
                        {/* Combined Total Label Column (62% width) */}
                        <View style={[
                            getColStyle(combinedTotalRowWidth, 'left'), // Use helper to get base styles and correct width
                            styles.footerCell, 
                            { borderLeftWidth: 1, borderBottomWidth: 1 } // Add missing borders for consistency
                        ]}> 
                            <Text>GRAND TOTALS</Text>
                        </View>
                        
                        {/* Debit Total (12% width) */}
                        <View style={[getColStyle(DEBIT_WIDTH, 'right'), styles.footerCell]}>
                            <Text>{formatAmount(totalDebit)}</Text>
                        </View>
                        
                        {/* Credit Total (12% width) */}
                        <View style={[getColStyle(CREDIT_WIDTH, 'right'), styles.footerCell]}>
                            <Text>{formatAmount(totalCredit)}</Text>
                        </View>
                        
                        {/* Final Balance (14% width) */}
                        <View style={[getColStyle(BALANCE_WIDTH, 'right'), styles.footerCell, { borderRightWidth: 1 }]}>
                            <Text>
                                {formatAmount(Math.abs(finalBalance))} {finalBalanceType}
                            </Text>
                        </View>
                    </View>
                </View>
                
                {/* Page Numbering */}
                <Text 
                    style={{ position: 'absolute', bottom: 15, right: 30, textAlign: 'right', fontSize: 8 }} 
                    render={({ pageNumber, totalPages }) => (`Page ${pageNumber} of ${totalPages}`)} 
                    fixed 
                />
            </Page>
        </Document>
    );
};

export default LedgerPdfDocument;