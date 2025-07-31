const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');

// Create invoice
router.post('/', async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();
    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all invoices with user details
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all invoices');
    
    const invoices = await Invoice.find()
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
    
    console.log('Found invoices:', invoices.length);
    res.json(invoices);
  } catch (err) {
    console.error('Error fetching all invoices:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get invoices with extracted text and OCR details
router.get('/with-ocr', async (req, res) => {
  try {
    console.log('Fetching invoices with OCR details');
    
    const invoices = await Invoice.find({
      $or: [
        { extractedText: { $exists: true, $ne: null } },
        { ocrConfidence: { $exists: true, $ne: null } }
      ]
    })
      .populate('uploadedBy', 'name email')
      .select('invoiceNumber invoiceDate dueDate totalAmount currency vendor buyer lineItems taxDetails poNumber paymentTerms extractedText ocrConfidence processingMethod confidenceScore isVerified createdAt')
      .sort({ createdAt: -1 });
    
    console.log('Found invoices with OCR:', invoices.length);
    console.log('Sample invoice line items:', invoices[0]?.lineItems);
    console.log('Sample invoice structure:', {
      id: invoices[0]?._id,
      invoiceNumber: invoices[0]?.invoiceNumber,
      hasLineItems: !!invoices[0]?.lineItems,
      lineItemsLength: invoices[0]?.lineItems?.length,
      lineItemsType: typeof invoices[0]?.lineItems
    });
    
    console.log('Found invoices with OCR:', invoices.length);
    res.json(invoices);
  } catch (err) {
    console.error('Error fetching invoices with OCR:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get invoices by user
router.get('/user/:userId', async (req, res) => {
  try {
    console.log('Fetching invoices for user:', req.params.userId);
    
    if (!req.params.userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const invoices = await Invoice.find({ uploadedBy: req.params.userId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
    
    console.log('Found invoices:', invoices.length);
    res.json(invoices);
  } catch (err) {
    console.error('Error fetching user invoices:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('uploadedBy', 'name email');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update invoice
router.put('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete invoices by file URL
router.delete('/by-file-url/:fileUrl', async (req, res) => {
  try {
    console.log('Deleting invoices for file URL:', req.params.fileUrl);
    
    // Decode the file URL (it might be URL encoded)
    const fileUrl = decodeURIComponent(req.params.fileUrl);
    console.log('Decoded file URL:', fileUrl);
    
    // Find invoices that match this file URL
    const invoicesToDelete = await Invoice.find({ fileUrl: fileUrl });
    console.log(`Found ${invoicesToDelete.length} invoice(s) to delete for file URL:`, fileUrl);
    
    if (invoicesToDelete.length === 0) {
      return res.json({ 
        message: 'No invoices found for this file URL',
        deletedCount: 0,
        fileUrl: fileUrl
      });
    }
    
    // Delete all invoices with this file URL
    const deleteResult = await Invoice.deleteMany({ fileUrl: fileUrl });
    console.log('Delete result:', deleteResult);
    
    res.json({ 
      message: `Successfully deleted ${deleteResult.deletedCount} invoice(s)`,
      deletedCount: deleteResult.deletedCount,
      fileUrl: fileUrl,
      deletedInvoices: invoicesToDelete.map(inv => ({
        id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        totalAmount: inv.totalAmount
      }))
    });
    
  } catch (err) {
    console.error('Error deleting invoices by file URL:', err);
    res.status(500).json({ error: err.message });
  }
});

// Test route to check line items in database
router.get('/test/line-items', async (req, res) => {
  try {
    console.log('Testing line items retrieval...');
    
    // Get all invoices and check their line items
    const invoices = await Invoice.find({}).select('invoiceNumber lineItems');
    
    console.log('Found invoices:', invoices.length);
    
    const results = invoices.map(invoice => ({
      id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      lineItems: invoice.lineItems,
      lineItemsType: typeof invoice.lineItems,
      lineItemsLength: invoice.lineItems?.length,
      isArray: Array.isArray(invoice.lineItems),
      hasLineItems: !!invoice.lineItems
    }));
    
    console.log('Line items test results:', results);
    
    res.json({
      success: true,
      totalInvoices: invoices.length,
      results: results
    });
    
  } catch (error) {
    console.error('Line items test failed:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 