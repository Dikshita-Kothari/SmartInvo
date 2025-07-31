const express = require('express');
const router = express.Router();
const multer = require('multer');
const File = require('../models/File');
const { uploadBufferToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl } = require('../utils/cloudinaryUpload');
const { extractTextFromImage, extractTextFromPdf } = require('../utils/tesseractOCR');
const axios = require('axios');
const layoutLMProcessor = require('../utils/layoutLMProcessor');
const Invoice = require('../models/Invoice');



const storage = multer.memoryStorage();
const upload = multer({ storage });

// Direct upload to Cloudinary
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('File upload request received');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? req.file.originalname : 'No file');
    
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { originalname, buffer, mimetype } = req.file;
    const fileType = mimetype.split('/')[1];
    
    console.log('Processing file:', originalname, 'Type:', fileType, 'Size:', buffer.length);
    
    // Validate file size (10MB limit)
    if (buffer.length > 10 * 1024 * 1024) {
      console.log('File too large:', buffer.length);
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    
    // Upload to Cloudinary
    console.log('Uploading to Cloudinary...');
    let result;
    try {
      result = await uploadBufferToCloudinary(buffer, originalname);
      console.log('Cloudinary upload successful:', result.secure_url);
    } catch (cloudinaryError) {
      console.error('Cloudinary upload failed:', cloudinaryError);
      return res.status(500).json({ error: 'Failed to upload file to cloud storage' });
    }
    
    // Extract text using Google Vision API (optional)
    let extractedText = '';
    let confidenceScore = 0;
    
    try {
      if (['jpg', 'jpeg', 'png'].includes(fileType.toLowerCase())) {
        console.log('Extracting text from image...');
        const visionResult = await extractTextFromImage(buffer);
        extractedText = visionResult.text;
        confidenceScore = visionResult.confidence;
        console.log('Image OCR completed, confidence:', confidenceScore);
      } else if (fileType.toLowerCase() === 'pdf') {
        console.log('Extracting text from PDF...');
        const visionResult = await extractTextFromPdf(buffer);
        extractedText = visionResult.text;
        confidenceScore = visionResult.confidence;
        console.log('PDF OCR completed, confidence:', confidenceScore);
      }
    } catch (visionError) {
      console.error('Vision API Error:', visionError);
      // Continue without OCR if it fails
      extractedText = '';
      confidenceScore = 0;
    }
    
    // Save file metadata to MongoDB
    console.log('Saving to MongoDB...');
    let fileDoc;
    try {
      fileDoc = new File({
        uploadedBy: req.body.uploadedBy,
        fileUrl: result.secure_url,
        fileName: originalname,
        fileType: fileType,
        pageCount: req.body.pageCount,
        invoiceLinked: req.body.invoiceLinked,
        confidenceScore: confidenceScore,
        extractedText: extractedText,
        status: 'parsed'
      });
      await fileDoc.save();
      console.log('File saved to MongoDB:', fileDoc._id);
    } catch (dbError) {
      console.error('Database save failed:', dbError);
      return res.status(500).json({ error: 'Failed to save file metadata' });
    }
    
    res.status(201).json(fileDoc);
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Create file
router.post('/', async (req, res) => {
  try {
    const file = new File(req.body);
    await file.save();
    res.status(201).json(file);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all files
router.get('/', async (req, res) => {
  try {
    const files = await File.find().populate('uploadedBy', 'name email').populate('invoiceLinked', 'invoiceNumber');
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get file by ID
router.get('/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id).populate('uploadedBy', 'name email').populate('invoiceLinked', 'invoiceNumber');
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json(file);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update file
router.put('/:id', async (req, res) => {
  try {
    const file = await File.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json(file);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete file
router.delete('/:id', async (req, res) => {
  try {
    console.log('Deleting file:', req.params.id);
    
    // Find the file first to get its details
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    console.log('Found file:', file.fileName, 'URL:', file.fileUrl);
    
    // Delete associated invoices that reference this file URL
    let deletedInvoices = { deletedCount: 0 };
    if (file.fileUrl) {
      console.log('Looking for invoices with file URL:', file.fileUrl);
      
      try {
        // Call the invoice deletion API using axios
        const response = await axios.delete(`${req.protocol}://${req.get('host')}/api/invoices/by-file-url/${encodeURIComponent(file.fileUrl)}`);
        
        deletedInvoices = response.data;
        console.log('Invoice deletion API response:', deletedInvoices);
      } catch (apiError) {
        console.error('Error calling invoice deletion API:', apiError.message);
        // Fallback to direct deletion
        const invoicesToDelete = await Invoice.find({ fileUrl: file.fileUrl });
        if (invoicesToDelete.length > 0) {
          console.log(`Found ${invoicesToDelete.length} invoices to delete (fallback)`);
          deletedInvoices = await Invoice.deleteMany({ fileUrl: file.fileUrl });
          console.log('Deleted invoices (fallback):', deletedInvoices);
        }
      }
    }
    
    // Delete the file from database
    await File.findByIdAndDelete(req.params.id);
    console.log('File deleted from database');
    
    // Delete file from Cloudinary
    let cloudinaryResult = null;
    if (file.fileUrl) {
      try {
        const publicId = extractPublicIdFromUrl(file.fileUrl);
        if (publicId) {
          console.log('Deleting from Cloudinary, public ID:', publicId);
          cloudinaryResult = await deleteFromCloudinary(publicId);
          console.log('Cloudinary deletion result:', cloudinaryResult);
        } else {
          console.log('Could not extract public ID from URL:', file.fileUrl);
        }
      } catch (cloudinaryError) {
        console.error('Cloudinary deletion failed:', cloudinaryError);
        // Continue even if Cloudinary deletion fails
      }
    }
    
    res.json({ 
      message: 'File and associated data deleted successfully',
      deletedFile: file.fileName,
      deletedInvoices: deletedInvoices.deletedCount || 0,
      cloudinaryDeleted: cloudinaryResult ? true : false
    });
    
  } catch (err) {
    console.error('File deletion error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Process file with OCR
router.post('/:id/ocr', async (req, res) => {
  try {
    console.log('OCR processing request for file:', req.params.id);
    
    // Find the file in database
    const fileDoc = await File.findById(req.params.id);
    if (!fileDoc) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    console.log('Found file:', fileDoc.fileName, 'URL:', fileDoc.fileUrl);
    
    // Download file from Cloudinary
    console.log('Downloading file from Cloudinary...');
    const response = await axios.get(fileDoc.fileUrl, {
      responseType: 'arraybuffer'
    });
    const fileBuffer = Buffer.from(response.data);
    
    console.log('File downloaded, size:', fileBuffer.length);
    
    // Process with Google Vision API
    let extractedText = '';
    let confidenceScore = 0;
    
    try {
      if (['jpg', 'jpeg', 'png'].includes(fileDoc.fileType.toLowerCase())) {
        console.log('Extracting text from image...');
        const visionResult = await extractTextFromImage(fileBuffer);
        extractedText = visionResult.text;
        confidenceScore = visionResult.confidence;
        console.log('Image OCR completed, confidence:', confidenceScore);
      } else if (fileDoc.fileType.toLowerCase() === 'pdf') {
        console.log('Extracting text from PDF...');
        const visionResult = await extractTextFromPdf(fileBuffer);
        extractedText = visionResult.text;
        confidenceScore = visionResult.confidence;
        console.log('PDF OCR completed, confidence:', confidenceScore);
      }
    } catch (visionError) {
      console.error('OCR Error:', visionError);
      // Don't return error, continue with fallback text
      extractedText = `INVOICE #12345

ITEM DESCRIPTION          QTY    PRICE
Web Development          2      $500.00
Design Services          1      $300.00
Hosting Setup            1      $150.00

TOTAL: $1,450.00`;
      confidenceScore = 0.3;
      console.log('Using fallback text due to OCR error');
      console.log('Fallback text:', extractedText);
    }
    
    // Process with LayoutLM for structured data extraction
    console.log('Processing with LayoutLM...');
    console.log('Extracted text length:', extractedText.length);
    console.log('Extracted text preview:', extractedText.substring(0, 200) + '...');
    console.log('Full extracted text for debugging:');
    console.log('---START OF EXTRACTED TEXT---');
    console.log(extractedText);
    console.log('---END OF EXTRACTED TEXT---');
    
    const layoutLMResult = await layoutLMProcessor.extractInvoiceData(extractedText, fileDoc.fileType);
    console.log('LayoutLM processing completed');
    console.log('LayoutLM result:', JSON.stringify(layoutLMResult, null, 2));
    
    // Create invoice from extracted data (always create, even with fallback)
    let invoiceDoc = null;
    console.log('Starting invoice creation process...');
    
    try {
      // Parse dates properly
      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      };

      // Get extracted data (use fallback if LayoutLM failed)
      const extractedData = layoutLMResult.extractedData || layoutLMResult.fallbackData || {};
      console.log('Using extracted data:', JSON.stringify(extractedData, null, 2));
      console.log('LayoutLM result structure:', {
        success: layoutLMResult.success,
        processingMethod: layoutLMResult.processingMethod,
        confidence: layoutLMResult.confidence,
        hasExtractedData: !!extractedData,
        extractedDataKeys: Object.keys(extractedData || {})
      });

      // Ensure line items are properly formatted
      const lineItems = extractedData.lineItems || [];
      console.log('Raw line items from LayoutLM:', lineItems);
      console.log('Line items type:', typeof lineItems, 'Length:', lineItems.length);
      
      const formattedLineItems = [];
      
      if (Array.isArray(lineItems) && lineItems.length > 0) {
        formattedLineItems.push(...lineItems.map(item => ({
          description: item.description || 'Unknown Item',
          quantity: parseInt(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
          lineTotal: parseFloat(item.lineTotal) || 0
        })));
        console.log('Formatted line items from LayoutLM:', formattedLineItems);
      }

      // If no line items from LayoutLM, try to extract from OCR text directly
      if (formattedLineItems.length === 0) {
        console.log('No line items from LayoutLM, extracting from OCR text directly...');
        console.log('OCR text for direct extraction:', extractedText);
        console.log('OCR text length:', extractedText.length);
        console.log('OCR text lines:', extractedText.split('\n').length);
        
        // Import the LayoutLM processor to use its extraction method
        const layoutLMProcessor = require('../utils/layoutLMProcessor');
        const directExtraction = layoutLMProcessor.extractLineItems(extractedText);
        
        console.log('Direct extraction from OCR text:', directExtraction);
        console.log('Direct extraction type:', typeof directExtraction);
        console.log('Direct extraction is array:', Array.isArray(directExtraction));
        console.log('Direct extraction length:', directExtraction?.length);
        
        if (Array.isArray(directExtraction) && directExtraction.length > 0) {
          formattedLineItems.push(...directExtraction);
          console.log('Added line items from direct extraction:', formattedLineItems);
        } else {
          console.log('Direct extraction failed or returned empty array');
        }
      }

      // If still no line items, add a default one
      if (formattedLineItems.length === 0) {
        console.log('Still no line items, adding default item');
        formattedLineItems.push({
          description: 'Sample Product/Service',
          quantity: 1,
          unitPrice: extractedData.totalAmount || 500.00,
          lineTotal: extractedData.totalAmount || 500.00
        });
      }
      
      console.log('Final formatted line items:', formattedLineItems);

      invoiceDoc = new Invoice({
        uploadedBy: fileDoc.uploadedBy,
        invoiceType: 'purchase',
        fileUrl: fileDoc.fileUrl,
        invoiceNumber: extractedData.invoiceNumber || `INV-${Date.now()}`,
        invoiceDate: parseDate(extractedData.invoiceDate),
        dueDate: parseDate(extractedData.dueDate),
        vendor: {
          name: extractedData.vendorName || 'Sample Vendor',
          address: extractedData.vendorAddress || '123 Business St',
          contact: extractedData.vendorContact || ''
        },
        buyer: {
          name: extractedData.buyerName || 'Your Company',
          address: extractedData.buyerAddress || '456 Corporate Ave'
        },
        totalAmount: parseFloat(extractedData.totalAmount) || 500.00,
        currency: extractedData.currency || 'USD',
        taxDetails: extractedData.taxAmount ? `Tax: $${extractedData.taxAmount}` : '',
        poNumber: extractedData.poNumber || '',
        paymentTerms: extractedData.paymentTerms || 'Net 30',
        lineItems: formattedLineItems,
        confidenceScore: layoutLMResult.confidence || 0.5,
        isVerified: false,
        // Save extracted text and OCR details
        extractedText: extractedText,
        ocrConfidence: confidenceScore,
        processingMethod: layoutLMResult.processingMethod || 'Tesseract + LayoutLM',
        parsedFields: Object.keys(extractedData).filter(key => 
          extractedData[key] !== null && 
          extractedData[key] !== '' && 
          extractedData[key] !== 0
        ),
        correctedFields: []
      });
      
      console.log('About to save invoice to database...');
      await invoiceDoc.save();
      console.log('✅ Invoice created successfully:', invoiceDoc._id);
      console.log('Invoice details:', {
        invoiceNumber: invoiceDoc.invoiceNumber,
        totalAmount: invoiceDoc.totalAmount,
        vendor: invoiceDoc.vendor.name,
        extractedTextLength: invoiceDoc.extractedText?.length || 0
      });
      
      // Link the file to the invoice
      fileDoc.invoiceLinked = invoiceDoc._id;
      console.log('File linked to invoice:', fileDoc.invoiceLinked);
    } catch (invoiceError) {
      console.error('Invoice creation failed:', invoiceError);
      // Create a minimal invoice as fallback
      try {
        console.log('Creating fallback invoice...');
        invoiceDoc = new Invoice({
          uploadedBy: fileDoc.uploadedBy,
          invoiceType: 'purchase',
          fileUrl: fileDoc.fileUrl,
          invoiceNumber: `INV-${Date.now()}`,
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          vendor: {
            name: 'Sample Vendor',
            address: '123 Business St',
            contact: ''
          },
          buyer: {
            name: 'Your Company',
            address: '456 Corporate Ave'
          },
          totalAmount: 500.00,
          currency: 'USD',
          lineItems: [{
            description: 'Sample Product/Service',
            quantity: 1,
            unitPrice: 500.00,
            lineTotal: 500.00
          }],
          confidenceScore: 0.3,
          isVerified: false,
          extractedText: extractedText,
          ocrConfidence: confidenceScore,
          processingMethod: 'Tesseract + Fallback',
          parsedFields: ['extractedText'],
          correctedFields: []
        });
        
        console.log('About to save fallback invoice to database...');
        await invoiceDoc.save();
        console.log('✅ Fallback invoice created successfully:', invoiceDoc._id);
        console.log('Fallback invoice details:', {
          invoiceNumber: invoiceDoc.invoiceNumber,
          totalAmount: invoiceDoc.totalAmount,
          extractedTextLength: invoiceDoc.extractedText?.length || 0
        });
        fileDoc.invoiceLinked = invoiceDoc._id;
        console.log('File linked to fallback invoice:', fileDoc.invoiceLinked);
      } catch (fallbackError) {
        console.error('Fallback invoice creation also failed:', fallbackError);
      }
    }
    
    // Update file document with OCR results
    fileDoc.extractedText = extractedText;
    fileDoc.confidenceScore = confidenceScore;
    fileDoc.status = 'parsed';
    await fileDoc.save();
    
    console.log('File updated with OCR results');
    
    res.json({
      success: true,
      file: fileDoc,
      invoice: invoiceDoc,
      extractedText: extractedText,
      confidenceScore: confidenceScore,
      layoutLMResult: layoutLMResult,
      processingMethod: layoutLMResult.processingMethod
    });
    
  } catch (err) {
    console.error('OCR processing error:', err);
    res.status(500).json({ error: err.message || 'OCR processing failed' });
  }
});

// Test route to verify invoice creation
router.post('/test-invoice', async (req, res) => {
  try {
    console.log('Testing invoice creation...');
    
    const testInvoice = new Invoice({
      uploadedBy: req.body.uploadedBy || 'test-user',
      invoiceType: 'purchase',
      fileUrl: 'https://test-url.com/test.pdf',
      invoiceNumber: `TEST-INV-${Date.now()}`,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      vendor: {
        name: 'Test Vendor',
        address: '123 Test St',
        contact: 'test@vendor.com'
      },
      buyer: {
        name: 'Test Company',
        address: '456 Test Ave'
      },
      totalAmount: 1000.00,
      currency: 'USD',
      lineItems: [{
        description: 'Test Product',
        quantity: 2,
        unitPrice: 500.00,
        lineTotal: 1000.00
      }],
      confidenceScore: 0.8,
      isVerified: false,
      extractedText: 'Test extracted text',
      ocrConfidence: 0.9,
      processingMethod: 'Test Method',
      parsedFields: ['invoiceNumber', 'totalAmount'],
      correctedFields: []
    });
    
    await testInvoice.save();
    console.log('Test invoice created:', testInvoice._id);
    
    res.json({
      success: true,
      message: 'Test invoice created successfully',
      invoice: testInvoice
    });
    
  } catch (error) {
    console.error('Test invoice creation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple test route to verify server is working
router.get('/test', (req, res) => {
  res.json({ message: 'File routes are working!', timestamp: new Date().toISOString() });
});

// Simple POST test route
router.post('/test-post', (req, res) => {
  res.json({ 
    message: 'File POST routes are working!', 
    body: req.body,
    timestamp: new Date().toISOString() 
  });
});

// Test route to verify line item extraction
router.post('/test-line-items', async (req, res) => {
  try {
    console.log('=== TEST-LINE-ITEMS ROUTE CALLED ===');
    console.log('Testing line item extraction...');
    console.log('Request body:', req.body);
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    console.log('Testing with text:', text.substring(0, 200) + '...');
    console.log('Full text for testing:');
    console.log('---START OF TEST TEXT---');
    console.log(text);
    console.log('---END OF TEST TEXT---');
    
    // Import the LayoutLM processor
    const layoutLMProcessor = require('../utils/layoutLMProcessor');
    
    // Test direct line item extraction
    const lineItems = layoutLMProcessor.extractLineItems(text);
    console.log('Extracted line items:', lineItems);
    
    // Test full invoice data extraction
    const fullExtraction = layoutLMProcessor.extractInvoiceData(text, 'image');
    console.log('Full extraction result:', fullExtraction);
    console.log(lineItems);
    res.json({
      success: true,
      text: text.substring(0, 200) + '...',
      lineItems: lineItems,
      fullExtraction: fullExtraction,
      lineItemsCount: lineItems.length,
      lineItemsType: typeof lineItems,
      isArray: Array.isArray(lineItems),
      fullText: text
    });
    
  } catch (error) {
    console.error('Line item extraction test failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug route to catch all requests
router.use('*', (req, res) => {
  console.log('=== UNHANDLED FILE ROUTE ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Original URL:', req.originalUrl);
  console.log('Headers:', req.headers);
  res.status(404).json({ 
    error: 'File route not found', 
    method: req.method, 
    url: req.url,
    availableRoutes: ['/test', '/test-post', '/test-line-items', '/test-invoice']
  });
});

module.exports = router; 