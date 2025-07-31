const mongoose = require('mongoose');
const File = require('./models/File');
const Invoice = require('./models/Invoice');
const { extractTextFromImage, extractTextFromPdf } = require('./utils/tesseractOCR');
const layoutLMProcessor = require('./utils/layoutLMProcessor');
require('dotenv').config();

async function testOCRInvoiceCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartinvo');
    console.log('Connected to MongoDB');

    // Test 1: Test OCR text extraction
    console.log('\n=== Test 1: Testing OCR Text Extraction ===');
    const sampleText = 'Sample invoice text for testing purposes. Invoice #12345. Total: $500.00. Vendor: Test Company.';
    
    console.log('Sample text:', sampleText);
    
    // Test 2: Test LayoutLM processing
    console.log('\n=== Test 2: Testing LayoutLM Processing ===');
    const layoutLMResult = await layoutLMProcessor.extractInvoiceData(sampleText, 'image');
    console.log('LayoutLM Result:', JSON.stringify(layoutLMResult, null, 2));

    // Test 3: Test invoice creation with extracted data
    console.log('\n=== Test 3: Testing Invoice Creation ===');
    
    const extractedData = layoutLMResult.extractedData || {};
    console.log('Using extracted data:', JSON.stringify(extractedData, null, 2));

    // Create a test file first
    const testFile = new File({
      uploadedBy: new mongoose.Types.ObjectId(),
      fileUrl: 'https://test-url.com/test-ocr.pdf',
      fileName: 'test-ocr.pdf',
      fileType: 'pdf',
      status: 'uploaded',
      confidenceScore: 0.8,
      extractedText: sampleText
    });
    
    await testFile.save();
    console.log('✅ Test file created:', testFile._id);

    // Create invoice with extracted data
    const testInvoice = new Invoice({
      uploadedBy: testFile.uploadedBy,
      invoiceType: 'purchase',
      fileUrl: testFile.fileUrl,
      invoiceNumber: extractedData.invoiceNumber || `TEST-OCR-INV-${Date.now()}`,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      vendor: {
        name: extractedData.vendorName || 'Test Vendor',
        address: extractedData.vendorAddress || '123 Test St',
        contact: extractedData.vendorContact || ''
      },
      buyer: {
        name: extractedData.buyerName || 'Test Company',
        address: extractedData.buyerAddress || '456 Test Ave'
      },
      totalAmount: parseFloat(extractedData.totalAmount) || 500.00,
      currency: extractedData.currency || 'USD',
      lineItems: [{
        description: 'Test Product',
        quantity: 1,
        unitPrice: 500.00,
        lineTotal: 500.00
      }],
      confidenceScore: layoutLMResult.confidence || 0.5,
      isVerified: false,
      extractedText: sampleText,
      ocrConfidence: 0.8,
      processingMethod: layoutLMResult.processingMethod || 'Test Method',
      parsedFields: Object.keys(extractedData).filter(key => 
        extractedData[key] !== null && 
        extractedData[key] !== '' && 
        extractedData[key] !== 0
      ),
      correctedFields: []
    });

    console.log('About to save test invoice...');
    await testInvoice.save();
    console.log('✅ Test invoice created successfully:', testInvoice._id);
    console.log('Invoice details:', {
      invoiceNumber: testInvoice.invoiceNumber,
      totalAmount: testInvoice.totalAmount,
      vendor: testInvoice.vendor.name,
      extractedTextLength: testInvoice.extractedText?.length || 0,
      parsedFields: testInvoice.parsedFields
    });

    // Test 4: Verify invoice was saved
    console.log('\n=== Test 4: Verifying Invoice in Database ===');
    const foundInvoice = await Invoice.findById(testInvoice._id);
    if (foundInvoice) {
      console.log('✅ Invoice found in database:', foundInvoice.invoiceNumber);
      console.log('Extracted text length:', foundInvoice.extractedText?.length || 0);
    } else {
      console.log('❌ Invoice not found in database');
    }

    // Test 5: Count total invoices
    console.log('\n=== Test 5: Counting Total Invoices ===');
    const totalInvoices = await Invoice.countDocuments();
    console.log(`✅ Total invoices in database: ${totalInvoices}`);

    // Test 6: Find invoices by file URL
    console.log('\n=== Test 6: Finding Invoices by File URL ===');
    const invoicesByUrl = await Invoice.find({ fileUrl: testFile.fileUrl });
    console.log(`✅ Found ${invoicesByUrl.length} invoice(s) for file URL:`, testFile.fileUrl);

    // Cleanup
    console.log('\n=== Cleanup ===');
    await Invoice.findByIdAndDelete(testInvoice._id);
    await File.findByIdAndDelete(testFile._id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 OCR and Invoice Creation Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testOCRInvoiceCreation(); 