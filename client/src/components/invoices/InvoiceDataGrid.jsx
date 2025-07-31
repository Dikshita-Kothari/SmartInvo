import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  DataGrid,
  GridToolbar,
  GridActionsCellItem
} from '@mui/x-data-grid';
import {
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import api from '../../services/api';

export default function InvoiceDataGrid({ userRole, user }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching invoices for user:', user?.id || user?._id, 'Role:', userRole);
      
      let invoiceData;
      if (userRole === 'admin') {
        // Admin can see all invoices with OCR data
        console.log('Fetching all invoices with OCR (admin)');
        invoiceData = await api.getInvoicesWithOCR();
      } else {
        // Regular users see only their invoices with OCR data
        const userId = user?.id || user?._id;
        if (!userId) {
          throw new Error('User ID not found');
        }
        console.log('Fetching user invoices with OCR for:', userId);
        // For now, use getInvoicesWithOCR for all users to see invoices created from file uploads
        invoiceData = await api.getInvoicesWithOCR();
      }
      
      console.log('Invoices fetched successfully:', invoiceData.length);
      console.log('Sample invoice data:', invoiceData[0]);
      
      // Ensure we have valid data and add fallbacks for missing fields
      const processedInvoices = (Array.isArray(invoiceData) ? invoiceData : []).map(invoice => {
        console.log('Processing invoice:', invoice);
        console.log('Original line items:', invoice.lineItems);
        console.log('Line items type:', typeof invoice.lineItems);
        console.log('Line items is array:', Array.isArray(invoice.lineItems));
        
        const processedInvoice = {
          ...invoice,
          invoiceNumber: invoice.invoiceNumber || 'N/A',
          invoiceDate: invoice.invoiceDate || null,
          dueDate: invoice.dueDate || null,
          totalAmount: invoice.totalAmount || 0,
          currency: invoice.currency || 'USD',
          confidenceScore: invoice.confidenceScore || 0,
          ocrConfidence: invoice.ocrConfidence || 0,
          isVerified: invoice.isVerified || false,
          processingMethod: invoice.processingMethod || 'Unknown',
          vendor: invoice.vendor || { name: 'N/A', address: 'N/A', contact: 'N/A' },
          buyer: invoice.buyer || { name: 'N/A', address: 'N/A' },
          lineItems: Array.isArray(invoice.lineItems) ? invoice.lineItems : (invoice.lineItems ? [invoice.lineItems] : []),
          taxDetails: invoice.taxDetails || '',
          poNumber: invoice.poNumber || '',
          paymentTerms: invoice.paymentTerms || '',
          extractedText: invoice.extractedText || ''
        };
        
        console.log('Processed line items:', processedInvoice.lineItems);
        console.log('Final line items length:', processedInvoice.lineItems.length);
        
        return processedInvoice;
      });
      
      setInvoices(processedInvoices);
      setSuccessMessage(`Successfully loaded ${processedInvoices.length} invoice(s) from file uploads`);
      setError('');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
      setError(`Failed to fetch invoices: ${err.message}`);
      setSuccessMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id) => {
    try {
      console.log('handleView called with id:', id);
      const invoice = invoices.find(inv => (inv._id === id) || (inv.id === id));
      
      if (!invoice) {
        console.error('Invoice not found for id:', id);
        setError('Invoice not found');
        return;
      }
      
      console.log('Viewing invoice:', invoice);
      setSelectedInvoice(invoice);
      setViewDialogOpen(true);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Error in handleView:', error);
      setError(`Failed to view invoice: ${error.message}`);
    }
  };



  const handleDelete = async (id) => {
    try {
      console.log('handleDelete called with id:', id);
      const invoice = invoices.find(inv => (inv._id === id) || (inv.id === id));
      
      if (!invoice) {
        console.error('Invoice not found for id:', id);
        setError('Invoice not found');
        return;
      }
      
      const confirmed = window.confirm(
        `Are you sure you want to delete invoice "${invoice.invoiceNumber || 'Unknown'}"?\n\nThis action cannot be undone.`
      );
      
      if (!confirmed) {
        console.log('Delete cancelled by user');
        return;
      }
      
      console.log('Deleting invoice:', invoice.invoiceNumber);
      setLoading(true);
      setError(''); // Clear any previous errors
      
      await api.deleteInvoice(id);
      setInvoices(prev => prev.filter(inv => (inv._id !== id) && (inv.id !== id)));
      setSuccessMessage(`Invoice "${invoice.invoiceNumber || 'Unknown'}" deleted successfully`);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error in handleDelete:', err);
      setError(`Failed to delete invoice: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };



  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      
      // Delete each selected invoice
      const deletePromises = selectedRows.map(id => api.deleteInvoice(id));
      await Promise.all(deletePromises);
      
      // Remove deleted invoices from state
      setInvoices(prev => prev.filter(inv => {
        const invId = inv._id || inv.id;
        return !selectedRows.includes(invId);
      }));
      setSelectedRows([]);
      setBulkDeleteDialogOpen(false);
      setSuccessMessage(`Successfully deleted ${selectedRows.length} invoice(s)`);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(`Failed to delete invoices: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'Processed': return 'success';
      case 'Pending Review': return 'warning';
      case 'Error': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const columns = [
    { field: 'invoiceNumber', headerName: 'Invoice #', width: 150 },
    { field: 'invoiceDate', headerName: 'Date', width: 120, 
      valueFormatter: (params) => formatDate(params.value) },
    { field: 'dueDate', headerName: 'Due Date', width: 120,
      valueFormatter: (params) => formatDate(params.value) },
    { 
      field: 'vendor.name', 
      headerName: 'Vendor', 
      width: 200,
      valueGetter: (params) => params.row.vendor?.name || 'N/A'
    },
    { 
      field: 'totalAmount', 
      headerName: 'Total', 
      width: 120,
      valueFormatter: (params) => formatCurrency(params.value, params.row?.currency || 'USD')
    },
    { 
      field: 'ocrConfidence', 
      headerName: 'OCR Confidence', 
      width: 130,
      renderCell: (params) => (
        <Chip 
          label={params.value ? `${Math.round(params.value * 100)}%` : 'N/A'}
          color={params.value && params.value > 0.8 ? 'success' : params.value && params.value > 0.6 ? 'warning' : 'error'}
          size="small"
        />
      )
    },
    { 
      field: 'processingMethod', 
      headerName: 'Processing', 
      width: 150,
      renderCell: (params) => (
        <Tooltip title={params.value || 'N/A'}>
          <Chip 
            label={params.value ? params.value.split(' ')[0] : 'N/A'}
            color="info"
            size="small"
          />
        </Tooltip>
      )
    },
    { 
      field: 'lineItems', 
      headerName: 'Line Items', 
      width: 120,
      valueGetter: (params) => {
        const lineItems = params.row.lineItems;
        return lineItems?.length || 0;
      },
      renderCell: (params) => {
        const lineItems = params.row.lineItems;
        const count = lineItems?.length || 0;
        return (
          <Chip 
            label={`${count} items`}
            color={count > 0 ? 'success' : 'default'}
            size="small"
          />
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const invoiceId = params.row._id || params.row.id;
        const invoiceNumber = params.row.invoiceNumber || 'Unknown';
        
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={`View ${invoiceNumber}`}>
              <IconButton 
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('View button clicked for invoice:', invoiceId, invoiceNumber);
                  handleView(invoiceId);
                }} 
                size="small"
                color="primary"
              >
                <ViewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={`Delete ${invoiceNumber}`}>
              <IconButton 
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Delete button clicked for invoice:', invoiceId, invoiceNumber);
                  handleDelete(invoiceId);
                }} 
                size="small" 
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        );
      }
    }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>
            Invoices from File Uploads ({invoices.length})
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchInvoices}
              disabled={loading}
            >
              Refresh
            </Button>
            {selectedRows.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setBulkDeleteDialogOpen(true)}
                disabled={loading}
              >
                Delete Selected ({selectedRows.length})
              </Button>
            )}

            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => window.location.href = '/upload'}
            >
              Upload New Invoice
            </Button>
          </Box>
        </Box>

        {invoices.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography variant="body1" color="text.secondary">
              No invoices found. Upload files and process them with OCR to see invoices here.
            </Typography>
          </Box>
        ) : (
          <DataGrid
            rows={invoices || []}
            columns={columns}
            getRowId={(row) => row._id || row.id || Math.random().toString()}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            checkboxSelection
            disableRowSelectionOnClick
            autoHeight
            onRowSelectionModelChange={(newSelection) => {
              setSelectedRows(newSelection);
            }}
            rowSelectionModel={selectedRows}
            sx={{
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #e0e0e0',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f5f5f5',
                fontWeight: 600,
              },
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-cell:focus-within': {
                outline: 'none',
              },
            }}
          />
        )}
      </Paper>

      {/* View Invoice Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Invoice Details {selectedInvoice ? `- ${selectedInvoice.invoiceNumber}` : ''}
        </DialogTitle>
        <DialogContent>
          {selectedInvoice ? (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Invoice Number"
                  value={selectedInvoice.invoiceNumber || 'N/A'}
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  fullWidth
                  label="Invoice Date"
                  value={formatDate(selectedInvoice.invoiceDate)}
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  fullWidth
                  label="Due Date"
                  value={formatDate(selectedInvoice.dueDate)}
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  fullWidth
                  label="Total Amount"
                  value={formatCurrency(selectedInvoice.totalAmount, selectedInvoice.currency)}
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  fullWidth
                  label="OCR Confidence"
                  value={selectedInvoice.ocrConfidence ? `${Math.round(selectedInvoice.ocrConfidence * 100)}%` : 'N/A'}
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  fullWidth
                  label="Processing Method"
                  value={selectedInvoice.processingMethod || 'N/A'}
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Vendor Name"
                  value={selectedInvoice.vendor?.name || 'N/A'}
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  fullWidth
                  label="Vendor Address"
                  value={selectedInvoice.vendor?.address || 'N/A'}
                  margin="normal"
                  multiline
                  rows={3}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  fullWidth
                  label="Parsing Confidence"
                  value={`${Math.round((selectedInvoice.confidenceScore || 0) * 100)}%`}
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
                    Line Items ({selectedInvoice.lineItems.length})
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Line Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedInvoice.lineItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.description || 'N/A'}</TableCell>
                            <TableCell align="right">{item.quantity || 0}</TableCell>
                            <TableCell align="right">
                              {formatCurrency(item.unitPrice, selectedInvoice.currency)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(item.lineTotal, selectedInvoice.currency)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
              {(!selectedInvoice.lineItems || selectedInvoice.lineItems.length === 0) && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No line items found for this invoice. Line items may not have been extracted from the OCR data.
                  </Alert>
                </Grid>
              )}
              
              {selectedInvoice.extractedText && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Extracted Text (OCR)"
                    value={selectedInvoice.extractedText}
                    margin="normal"
                    multiline
                    rows={6}
                    InputProps={{ readOnly: true }}
                    sx={{ 
                      '& .MuiInputBase-input': { 
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                </Grid>
              )}
            </Grid>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography variant="body1" color="text.secondary">
                No invoice selected or invoice data not available.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>



      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedRows.length} selected invoice(s)?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone. All selected invoices will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleBulkDelete} 
            variant="contained" 
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Deleting...' : `Delete ${selectedRows.length} Invoice(s)`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 