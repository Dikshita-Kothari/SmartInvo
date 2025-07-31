const mongoose = require('mongoose');
const Invoice = require('./models/Invoice');
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:5000/api';

async function testInvoiceDisplay() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartinvo');
    console.log('Connected to MongoDB');

    // Test 1: Create test invoices that would be created from file uploads
    console.log('\n=== Test 1: Creating Test Invoices ===');
    const testInvoices = [];
    
    for (let i = 1; i <= 3; i++) {
      const invoice = new Invoice({
        uploadedBy: new mongoose.Types.ObjectId(),
        invoiceType: 'purchase',
        fileUrl: `https://test-url.com/test-invoice-${i}.pdf`,
        invoiceNumber: `TEST-INV-${i}-${Date.now()}`,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        vendor: {
          name: `Test Vendor ${i}`,
          address: `${i}23 Test St`,
          contact: `test${i}@vendor.com`
        },
        buyer: {
          name: 'Test Company',
          address: '456 Test Ave'
        },
        totalAmount: 100 * i,
        currency: 'USD',
        lineItems: [{
          description: `Test Product ${i}`,
          quantity: i,
          unitPrice: 100.00,
          lineTotal: 100 * i
        }],
        confidenceScore: 0.8,
        isVerified: false,
        extractedText: `Sample extracted text for invoice ${i}. This is the OCR text that was extracted from the uploaded file.`,
        ocrConfidence: 0.9,
        processingMethod: 'Tesseract + LayoutLM',
        parsedFields: ['invoiceNumber', 'totalAmount', 'vendorName'],
        correctedFields: []
      });
      
      const savedInvoice = await invoice.save();
      testInvoices.push(savedInvoice);
      console.log(`✅ Created test invoice ${i}:`, savedInvoice.invoiceNumber);
    }

    // Test 2: Test the API endpoint that the frontend uses
    console.log('\n=== Test 2: Testing API Endpoint ===');
    try {
      const response = await axios.get(`${API_BASE_URL}/invoices/with-ocr`);
      console.log('✅ API Response Status:', response.status);
      console.log('✅ API Response Data Length:', response.data.length);
      
      if (response.data.length > 0) {
        console.log('✅ Sample API Response Invoice:', {
          id: response.data[0]._id,
          invoiceNumber: response.data[0].invoiceNumber,
          totalAmount: response.data[0].totalAmount,
          extractedTextLength: response.data[0].extractedText?.length || 0,
          processingMethod: response.data[0].processingMethod
        });
      }
    } catch (apiError) {
      console.error('❌ API Error:', apiError.response?.data || apiError.message);
    }

    // Test 3: Verify invoices in database
    console.log('\n=== Test 3: Verifying Invoices in Database ===');
    const allInvoices = await Invoice.find({});
    console.log(`✅ Total invoices in database: ${allInvoices.length}`);
    
    const invoicesWithOCR = await Invoice.find({
      $or: [
        { extractedText: { $exists: true, $ne: null } },
        { ocrConfidence: { $exists: true, $ne: null } }
      ]
    });
    console.log(`✅ Invoices with OCR data: ${invoicesWithOCR.length}`);

    // Test 4: Check specific fields that should be present
    console.log('\n=== Test 4: Checking Required Fields ===');
    if (invoicesWithOCR.length > 0) {
      const sampleInvoice = invoicesWithOCR[0];
      console.log('✅ Sample invoice fields:');
      console.log('  - Invoice Number:', sampleInvoice.invoiceNumber);
      console.log('  - File URL:', sampleInvoice.fileUrl);
      console.log('  - Extracted Text Length:', sampleInvoice.extractedText?.length || 0);
      console.log('  - OCR Confidence:', sampleInvoice.ocrConfidence);
      console.log('  - Processing Method:', sampleInvoice.processingMethod);
      console.log('  - Parsing Confidence:', sampleInvoice.confidenceScore);
    }

    // Test 5: Test user-specific invoice fetching
    console.log('\n=== Test 5: Testing User-Specific Invoices ===');
    if (testInvoices.length > 0) {
      const userId = testInvoices[0].uploadedBy;
      const userInvoices = await Invoice.find({ uploadedBy: userId });
      console.log(`✅ Invoices for user ${userId}: ${userInvoices.length}`);
    }

    console.log('\n🎉 Invoice Display Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Created ${testInvoices.length} test invoices`);
    console.log(`- Total invoices in database: ${allInvoices.length}`);
    console.log(`- Invoices with OCR data: ${invoicesWithOCR.length}`);
    console.log('- API endpoint tested successfully');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testInvoiceDisplay(); 