import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  Description as PdfIcon,
  Image as ImageIcon,
  Visibility as ViewIcon,
  PlayArrow as ProcessIcon,
  Receipt as InvoiceIcon
} from '@mui/icons-material';
import api from '../../services/api';

const acceptedFileTypes = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg']
};

const maxFileSize = 10 * 1024 * 1024; // 10MB

export default function AdvancedFileUpload({ onFilesProcessed, userRole, user }) {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch existing files from database
  useEffect(() => {
    fetchFiles();
  }, [user]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const filesData = await api.getFilesWithOCR();
      setFiles(filesData);
    } catch (err) {
      setErrors([{ error: err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const newErrors = rejectedFiles.map(file => ({
        file: file.file.name,
        error: file.errors[0]?.message || 'Invalid file'
      }));
      setErrors(prev => [...prev, ...newErrors]);
    }

    // Upload accepted files
    for (const file of acceptedFiles) {
      try {
        setProcessing(true);
        const uploadedFile = await api.uploadFile(file, user?.id || user?._id);
        console.log('File uploaded:', uploadedFile);
        
        // Refresh the files list
        await fetchFiles();
        
        if (onFilesProcessed) {
          onFilesProcessed([uploadedFile]);
        }
      } catch (err) {
        setErrors(prev => [...prev, { file: file.name, error: err.message }]);
      } finally {
        setProcessing(false);
      }
    }
  }, [user, onFilesProcessed]);

  const processFileWithOCR = async (fileId) => {
    try {
      setProcessing(true);
      console.log('Processing file with OCR:', fileId);
      
      const result = await api.processFileOCR(fileId);
      console.log('OCR processing result:', result);
      
      // Check if invoice was created
      if (result.invoice) {
        console.log('Invoice created successfully:', result.invoice);
        setSuccessMessage(`OCR processing completed! Invoice #${result.invoice.invoiceNumber} created with ${result.invoice.extractedText?.length || 0} characters of extracted text.`);
      } else {
        console.log('No invoice created in response');
        setSuccessMessage('OCR processing completed, but no invoice was created.');
      }
      
      // Refresh the files list to show updated data
      await fetchFiles();
      
      // Clear errors
      setErrors([]);
      
      // Clear success message after 8 seconds
      setTimeout(() => setSuccessMessage(''), 8000);
      
    } catch (err) {
      console.error('OCR processing error:', err);
      setErrors([{ error: `OCR processing failed: ${err.message}` }]);
    } finally {
      setProcessing(false);
    }
  };

  const createInvoiceFromExtractedText = async (fileObj) => {
    try {
      setProcessing(true);
      console.log('Creating invoice from extracted text for file:', fileObj._id);
      
      if (!fileObj.extractedText) {
        throw new Error('No extracted text available. Please process the file with OCR first.');
      }

      // Process the extracted text to extract structured data
      console.log('Processing extracted text for structured data...');
      console.log('Extracted text preview:', fileObj.extractedText.substring(0, 200) + '...');
      
      // Basic text processing to extract key information
      const extractedText = fileObj.extractedText;
      
      // Extract invoice number
      const invoiceNumberMatch = extractedText.match(/invoice\s*#?\s*:?\s*([A-Z0-9\-]+)/i) || 
                                extractedText.match(/inv\s*#?\s*:?\s*([A-Z0-9\-]+)/i) ||
                                extractedText.match(/#\s*([A-Z0-9\-]+)/i);
      const invoiceNumber = invoiceNumberMatch ? invoiceNumberMatch[1] : `INV-${Date.now()}`;
      
      // Extract total amount
      const totalAmountMatch = extractedText.match(/total\s*:?\s*\$?([0-9,]+\.?[0-9]*)/i) ||
                              extractedText.match(/amount\s*:?\s*\$?([0-9,]+\.?[0-9]*)/i) ||
                              extractedText.match(/sum\s*:?\s*\$?([0-9,]+\.?[0-9]*)/i);
      const totalAmount = totalAmountMatch ? parseFloat(totalAmountMatch[1].replace(/,/g, '')) : 500.00;
      
      // Extract vendor name
      const vendorMatch = extractedText.match(/from\s*:?\s*([A-Za-z\s&.,]+)/i) ||
                         extractedText.match(/vendor\s*:?\s*([A-Za-z\s&.,]+)/i) ||
                         extractedText.match(/company\s*:?\s*([A-Za-z\s&.,]+)/i);
      const vendorName = vendorMatch ? vendorMatch[1].trim() : 'Extracted Vendor';
      
      // Extract vendor address
      const addressMatch = extractedText.match(/address\s*:?\s*([A-Za-z0-9\s,.-]+)/i) ||
                          extractedText.match(/street\s*:?\s*([A-Za-z0-9\s,.-]+)/i);
      const vendorAddress = addressMatch ? addressMatch[1].trim() : 'Extracted Address';
      
      // Extract currency
      const currencyMatch = extractedText.match(/\$([0-9,]+\.?[0-9]*)/) ||
                           extractedText.match(/USD/) ||
                           extractedText.match(/EUR/) ||
                           extractedText.match(/GBP/);
      const currency = currencyMatch ? (currencyMatch[0] === '$' ? 'USD' : currencyMatch[0]) : 'USD';
      
      // Extract line items using enhanced parsing
      const lineItems = extractLineItemsFromText(extractedText, totalAmount);
      
      console.log('Extracted structured data:', {
        invoiceNumber,
        totalAmount,
        vendorName,
        vendorAddress,
        currency,
        lineItemsCount: lineItems.length
      });

      // Prepare invoice data from extracted text
      const invoiceData = {
        uploadedBy: user?.id || user?._id,
        invoiceType: 'purchase',
        fileUrl: fileObj.fileUrl,
        invoiceNumber: invoiceNumber,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        vendor: {
          name: vendorName,
          address: vendorAddress
        },
        buyer: {
          name: 'Your Company',
          address: 'Your Address'
        },
        totalAmount: totalAmount,
        currency: currency,
        extractedText: fileObj.extractedText,
        ocrConfidence: fileObj.confidenceScore || 0.5,
        processingMethod: 'Tesseract OCR + Text Processing',
        lineItems: lineItems,
        confidenceScore: fileObj.confidenceScore || 0.5,
        isVerified: false,
        parsedFields: ['extractedText', 'invoiceNumber', 'totalAmount', 'vendorName', 'lineItems'],
        correctedFields: []
      };

      const createdInvoice = await api.createInvoice(invoiceData);
      console.log('Invoice created:', createdInvoice);
      
      // Refresh the files list
      await fetchFiles();
      
      // Show success message
      setErrors([]);
      setSuccessMessage(`Invoice created successfully! Invoice #: ${createdInvoice.invoiceNumber}`);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (err) {
      console.error('Invoice creation error:', err);
      setErrors([{ error: `Invoice creation failed: ${err.message}` }]);
    } finally {
      setProcessing(false);
    }
  };



  const getFileIcon = (fileType) => {
    if (fileType === 'pdf') return <PdfIcon />;
    return <ImageIcon />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'parsed': return 'success';
      case 'error': return 'error';
      case 'uploaded': return 'warning';
      default: return 'info';
    }
  };

  const removeFile = async (fileId) => {
    try {
      const result = await api.deleteFile(fileId);
      console.log('File deletion result:', result);
      
      // Show success message with details
      let message = `File "${result.deletedFile}" deleted successfully`;
      if (result.deletedInvoices > 0) {
        message += `. Also deleted ${result.deletedInvoices} associated invoice(s)`;
      }
      if (result.cloudinaryDeleted) {
        message += '. File also removed from cloud storage';
      }
      
      setSuccessMessage(message);
      setErrors([]);
      
      // Refresh the files list
      await fetchFiles();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (err) {
      setErrors([{ error: `Failed to delete file: ${err.message}` }]);
    }
  };

  const viewFileDetails = (fileObj) => {
    setSelectedFile(fileObj);
    setViewDialogOpen(true);
  };

  const clearErrors = () => {
    setErrors([]);
  };



  // Helper function to extract line items from text
  const extractLineItemsFromText = (text, totalAmount) => {
    console.log('Extracting line items from text in frontend...');
    console.log('Input text preview:', text.substring(0, 300) + '...');
    console.log('Total amount:', totalAmount);
    
    const lines = text.split('\n');
    const items = [];
    
    // Multiple patterns for line item extraction
    const patterns = [
      /^([A-Za-z\s&\-\.]+?)\s+(\d+)\s+\$?([0-9,]+\.?[0-9]*)/i,  // Description Quantity Price
      /^([A-Za-z\s&\-\.]+?)\s*-\s*(\d+)\s*x\s+\$?([0-9,]+\.?[0-9]*)/i,  // Description - Quantity x Price
      /^([A-Za-z\s&\-\.]+?)\s+@\s+\$?([0-9,]+\.?[0-9]*)/i,  // Description @ Price
      /^([A-Za-z\s&\-\.]+?)\s*\((\d+)\)\s+\$?([0-9,]+\.?[0-9]*)/i,  // Description (Quantity) Price
      /^([A-Za-z\s&\-\.]+?)\s*-\s+\$?([0-9,]+\.?[0-9]*)/i,  // Description - Price
      /^([A-Za-z\s&\-\.]+?)\s{2,}(\d+)\s+\$?([0-9,]+\.?[0-9]*)/i,  // Description with multiple spaces Quantity Price
      /^([A-Za-z\s&\-\.]+?)\s+(\d+)\s+\$([0-9,]+\.?[0-9]*)/i   // Description Quantity $Price
    ];
    
    console.log('Processing', lines.length, 'lines of text');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      if (trimmedLine.length < 3) continue;
      
      console.log(`Line ${i + 1}: "${trimmedLine}"`);
      
      // Skip header/total lines
      if (trimmedLine.toLowerCase().includes('total') || 
          trimmedLine.toLowerCase().includes('subtotal') ||
          trimmedLine.toLowerCase().includes('tax') ||
          trimmedLine.toLowerCase().includes('amount') ||
          trimmedLine.toLowerCase().includes('invoice') ||
          trimmedLine.toLowerCase().includes('date') ||
          trimmedLine.toLowerCase().includes('due')) {
        console.log(`Skipping line ${i + 1} (header/total)`);
        continue;
      }
      
      let match = null;
      let patternIndex = -1;
      
      // Try each pattern
      for (let j = 0; j < patterns.length; j++) {
        match = trimmedLine.match(patterns[j]);
        if (match) {
          patternIndex = j;
          console.log(`Line ${i + 1} matched pattern ${j + 1}:`, match);
          break;
        }
      }
      
      if (match) {
        let description, quantity, unitPrice;
        
        switch (patternIndex) {
          case 0: // Description Quantity Price
            description = match[1].trim();
            quantity = parseInt(match[2]);
            unitPrice = parseFloat(match[3].replace(/,/g, ''));
            break;
          case 1: // Description - Quantity x Price
            description = match[1].trim();
            quantity = parseInt(match[2]);
            unitPrice = parseFloat(match[3].replace(/,/g, ''));
            break;
          case 2: // Description @ Price
            description = match[1].trim();
            quantity = 1;
            unitPrice = parseFloat(match[2].replace(/,/g, ''));
            break;
          case 3: // Description (Quantity) Price
            description = match[1].trim();
            quantity = parseInt(match[2]);
            unitPrice = parseFloat(match[3].replace(/,/g, ''));
            break;
          case 4: // Description - Price
            description = match[1].trim();
            quantity = 1;
            unitPrice = parseFloat(match[2].replace(/,/g, ''));
            break;
          case 5: // Description with multiple spaces Quantity Price
            description = match[1].trim();
            quantity = parseInt(match[2]);
            unitPrice = parseFloat(match[3].replace(/,/g, ''));
            break;
          case 6: // Description Quantity $Price
            description = match[1].trim();
            quantity = parseInt(match[2]);
            unitPrice = parseFloat(match[3].replace(/,/g, ''));
            break;
          default:
            continue;
        }
        
        console.log(`Extracted from line ${i + 1}:`, { description, quantity, unitPrice });
        
        // Validate extracted data
        if (description && description.length > 0 && 
            !isNaN(quantity) && quantity > 0 && 
            !isNaN(unitPrice) && unitPrice > 0) {
          
          const lineTotal = quantity * unitPrice;
          
          items.push({
            description: description,
            quantity: quantity,
            unitPrice: unitPrice,
            lineTotal: lineTotal
          });
          
          console.log('Frontend extracted line item:', {
            description,
            quantity,
            unitPrice,
            lineTotal
          });
        } else {
          console.log(`Line ${i + 1} failed validation:`, { description, quantity, unitPrice });
        }
      } else {
        console.log(`Line ${i + 1} didn't match any pattern`);
      }
    }
    
    // If no line items found, try to extract from amount patterns
    if (items.length === 0) {
      console.log('No line items found with patterns, trying amount extraction...');
      
      // Look for any amount patterns in the text
      const amountPatterns = [
        /\$?([0-9,]+\.?[0-9]*)/g,
        /([0-9,]+\.?[0-9]*)\s*USD/g,
        /([0-9,]+\.?[0-9]*)\s*EUR/g
      ];
      
      const amounts = [];
      for (const pattern of amountPatterns) {
        const matches = text.match(pattern);
        if (matches) {
          amounts.push(...matches.map(m => parseFloat(m.replace(/[$,]/g, ''))));
        }
      }
      
      // Remove duplicates and sort
      const uniqueAmounts = [...new Set(amounts)].filter(amount => amount > 0).sort((a, b) => b - a);
      console.log('Found amounts in text:', uniqueAmounts);
      
      if (uniqueAmounts.length > 0) {
        // Use the largest amount as the main item
        const mainAmount = uniqueAmounts[0];
        items.push({
          description: 'Extracted Product/Service',
          quantity: 1,
          unitPrice: mainAmount,
          lineTotal: mainAmount
        });
        
        // Add other amounts as separate items if they're significantly different
        for (let i = 1; i < uniqueAmounts.length; i++) {
          const amount = uniqueAmounts[i];
          if (amount < mainAmount * 0.8) { // Only add if significantly smaller
            items.push({
              description: 'Additional Item',
              quantity: 1,
              unitPrice: amount,
              lineTotal: amount
            });
          }
        }
      }
    }
    
    // If still no line items found, create one from total amount
    if (items.length === 0) {
      console.log('No line items found, creating from total amount');
      items.push({
        description: 'Extracted Product/Service',
        quantity: 1,
        unitPrice: totalAmount,
        lineTotal: totalAmount
      });
    }
    
    console.log('Frontend final line items:', items);
    return items;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize: maxFileSize,
    multiple: true
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading files...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      width: '100%',
      maxWidth: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Upload Area */}
      <Paper
        {...getRootProps()}
        className={`upload-area ${isDragActive ? 'drag-active' : ''}`}
        sx={{
          border: '3px dashed #667eea',
          borderRadius: '20px',
          padding: '10px',
          textAlign: 'center',
          cursor: 'pointer',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 50%, rgba(102, 126, 234, 0.04) 100%)',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          animation: 'pulse 4s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': {
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 50%, rgba(102, 126, 234, 0.04) 100%)'
            },
            '50%': {
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 50%, rgba(102, 126, 234, 0.08) 100%)'
            }
          },
          width: '100%',
          maxWidth: '600px',
          minHeight: { xs: '200px', sm: '250px', md: '300px' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.1)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            borderColor: '#764ba2',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 50%, rgba(102, 126, 234, 0.08) 100%)',
            transform: 'scale(1.03)',
            boxShadow: '0 12px 40px rgba(102, 126, 234, 0.25), 0 0 0 1px rgba(102, 126, 234, 0.1)',
            borderWidth: '4px'
          },
          '&.drag-active': {
            borderColor: '#4caf50',
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(102, 126, 234, 0.15) 50%, rgba(76, 175, 80, 0.08) 100%)',
            transform: 'scale(1.05)',
            boxShadow: '0 16px 50px rgba(76, 175, 80, 0.3), 0 0 0 2px rgba(76, 175, 80, 0.2)',
            borderWidth: '4px'
          }
        }}
      >
        <input {...getInputProps()} />
        <Box sx={{
          position: 'relative',
          mb: 2,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '50px',
            height: '80px',
            background: 'radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            zIndex: 0
          }
        }}>
          <UploadIcon sx={{ 
            fontSize: { xs: 40, sm: 48, md: 56 }, 
            color: '#667eea', 
            position: 'relative',
            zIndex: 1,
            filter: 'drop-shadow(0 4px 8px rgba(102, 126, 234, 0.3))',
            transition: 'all 0.3s ease'
          }} />
        </Box>
        <Typography variant="h5" gutterBottom sx={{ 
          fontWeight: 700, 
          color: '#2d3748',
          fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          mb: 2
        }}>
          {isDragActive ? '🎯 Drop files here!' : '📁 Drag & drop invoice files here'}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ 
          mb: 2,
          fontWeight: 500,
          color: '#4a5568',
          fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }
        }}>
          or click to select files
        </Typography>
        <Box sx={{
          background: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '12px',
          padding: '8px 16px',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <Typography variant="body2" sx={{ 
            color: '#4a5568',
            fontWeight: 500,
            fontSize: '0.8rem'
          }}>
            📄 Supported: PDF, PNG, JPG (Max 10MB each) - Using Tesseract OCR
          </Typography>
        </Box>
      </Paper>



      {/* Success Message */}
      {successMessage && (
        <Alert 
          severity="success" 
          sx={{ 
            mt: 3, 
            width: '100%', 
            maxWidth: '600px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
            border: '1px solid rgba(76, 175, 80, 0.2)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 16px rgba(76, 175, 80, 0.1)'
          }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => setSuccessMessage('')}
              sx={{ 
                borderRadius: '8px',
                fontWeight: 600
              }}
            >
              Clear
            </Button>
          }
        >
          {successMessage}
        </Alert>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert 
          severity="error" 
          sx={{ 
            mt: 3, 
            width: '100%', 
            maxWidth: '600px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(244, 67, 54, 0.05) 100%)',
            border: '1px solid rgba(244, 67, 54, 0.2)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 16px rgba(244, 67, 54, 0.1)'
          }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={clearErrors}
              sx={{ 
                borderRadius: '8px',
                fontWeight: 600
              }}
            >
              Clear
            </Button>
          }
        >
          {errors.map((error, index) => (
            <Typography key={index} component="div">
              {error.file ? `${error.file}: ${error.error}` : error.error}
            </Typography>
          ))}
        </Alert>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Paper sx={{ 
          mt: 3, 
          p: 3, 
          maxHeight: '300px', 
          overflow: 'auto',
          width: '100%',
          maxWidth: '800px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(102, 126, 234, 0.1)',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)'
        }} className="dashboard-card">
          <Typography variant="h6" gutterBottom sx={{ 
            fontWeight: 700,
            color: '#2d3748',
            fontSize: '1.2rem',
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            📋 Uploaded Files ({files.length})
          </Typography>
          <List>
            {files.map((fileObj) => (
              <ListItem key={fileObj._id} sx={{ 
                mb: 2, 
                borderRadius: '16px', 
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%)',
                border: '1px solid rgba(102, 126, 234, 0.1)',
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.15)',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)'
                }
              }}>
                <ListItemIcon>
                  {getFileIcon(fileObj.fileType)}
                </ListItemIcon>
                <ListItemText
                  primary={fileObj.fileName}
                  secondary={
                    <React.Fragment>
                      <Typography variant="body2" color="text.secondary" component="span">
                        Status: {fileObj.status}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {fileObj.confidenceScore > 0 && (
                          <Chip 
                            label={`Confidence: ${Math.round(fileObj.confidenceScore * 100)}%`}
                            size="small"
                            color={fileObj.confidenceScore > 0.8 ? 'success' : 'warning'}
                            sx={{ mr: 1 }}
                          />
                        )}
                        {fileObj.invoiceLinked && (
                          <Chip 
                            label="Invoice Created"
                            size="small"
                            color="success"
                            sx={{ mr: 1 }}
                          />
                        )}
                      </Box>
                    </React.Fragment>
                  }
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {fileObj.status === 'uploaded' && (
                    <IconButton 
                      onClick={() => processFileWithOCR(fileObj._id)}
                      size="small"
                      sx={{ color: '#667eea' }}
                      disabled={processing}
                      title="Process with OCR"
                    >
                      <ProcessIcon />
                    </IconButton>
                  )}
                  
                  {fileObj.extractedText && !fileObj.invoiceLinked && (
                    <IconButton 
                      onClick={() => createInvoiceFromExtractedText(fileObj)}
                      size="small"
                      sx={{ color: '#4caf50' }}
                      disabled={processing}
                      title="Create Invoice from Extracted Text"
                    >
                      <InvoiceIcon />
                    </IconButton>
                  )}

                  <IconButton 
                    onClick={() => viewFileDetails(fileObj)}
                    size="small"
                    sx={{ color: '#667eea' }}
                    title="View File Details"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => removeFile(fileObj._id)}
                    color="error"
                    size="small"
                    title="Delete File"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* File Details Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            File Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedFile?.fileName}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedFile && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="File Name"
                  value={selectedFile.fileName || 'N/A'}
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  fullWidth
                  label="File Type"
                  value={selectedFile.fileType || 'N/A'}
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  fullWidth
                  label="Status"
                  value={selectedFile.status || 'N/A'}
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  fullWidth
                  label="Confidence Score"
                  value={selectedFile.confidenceScore ? `${Math.round(selectedFile.confidenceScore * 100)}%` : 'N/A'}
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Upload Date"
                  value={selectedFile.uploadedAt ? new Date(selectedFile.uploadedAt).toLocaleDateString() : 'N/A'}
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  fullWidth
                  label="File URL"
                  value={selectedFile.fileUrl || 'N/A'}
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
                {selectedFile.extractedText && (
                  <TextField
                    fullWidth
                    label="Extracted Text"
                    value={selectedFile.extractedText}
                    margin="normal"
                    multiline
                    rows={4}
                    InputProps={{ readOnly: true }}
                  />
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedFile?.extractedText && !selectedFile?.invoiceLinked && (
            <Button 
              onClick={() => {
                createInvoiceFromExtractedText(selectedFile);
                setViewDialogOpen(false);
              }}
              variant="contained"
              color="primary"
              startIcon={<InvoiceIcon />}
              disabled={processing}
            >
              Create Invoice from Extracted Text
            </Button>
          )}
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 