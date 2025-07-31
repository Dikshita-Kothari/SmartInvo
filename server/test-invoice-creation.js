const mongoose = require('mongoose');
const Invoice = require('./models/Invoice');
require('dotenv').config();

async function testInvoiceCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartinvo');
    console.log('Connected to MongoDB');

    // Test 1: Create a simple invoice
    console.log('\n=== Test 1: Creating simple invoice ===');
    const simpleInvoice = new Invoice({
      uploadedBy: new mongoose.Types.ObjectId(), // Create a dummy ObjectId
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
      extractedText: 'Test extracted text from OCR',
      ocrConfidence: 0.9,
      processingMethod: 'Tesseract + LayoutLM',
      parsedFields: ['invoiceNumber', 'totalAmount', 'vendorName'],
      correctedFields: []
    });

    const savedInvoice = await simpleInvoice.save();
    console.log('✅ Simple invoice created successfully:', savedInvoice._id);

    // Test 2: Query the invoice
    console.log('\n=== Test 2: Querying invoice ===');
    const foundInvoice = await Invoice.findById(savedInvoice._id);
    console.log('✅ Invoice found:', foundInvoice.invoiceNumber);

    // Test 3: Create invoice with minimal data
    console.log('\n=== Test 3: Creating minimal invoice ===');
    const minimalInvoice = new Invoice({
      uploadedBy: new mongoose.Types.ObjectId(),
      invoiceType: 'purchase',
      fileUrl: 'https://test-url.com/minimal.pdf',
      invoiceNumber: `MIN-INV-${Date.now()}`,
      totalAmount: 500.00,
      currency: 'USD',
      lineItems: [{
        description: 'Minimal Product',
        quantity: 1,
        unitPrice: 500.00,
        lineTotal: 500.00
      }],
      extractedText: 'Minimal extracted text',
      processingMethod: 'Fallback'
    });

    const savedMinimal = await minimalInvoice.save();
    console.log('✅ Minimal invoice created successfully:', savedMinimal._id);

    // Test 4: Count all invoices
    console.log('\n=== Test 4: Counting invoices ===');
    const count = await Invoice.countDocuments();
    console.log(`✅ Total invoices in database: ${count}`);

    // Test 5: Find invoices by file URL
    console.log('\n=== Test 5: Finding invoices by file URL ===');
    const invoicesByUrl = await Invoice.find({ fileUrl: 'https://test-url.com/test.pdf' });
    console.log(`✅ Found ${invoicesByUrl.length} invoice(s) with test URL`);

    console.log('\n🎉 All tests passed! Invoice creation is working properly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testInvoiceCreation(); 