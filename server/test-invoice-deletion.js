const mongoose = require('mongoose');
const Invoice = require('./models/Invoice');
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:5000/api';

async function testInvoiceDeletionByFileUrl() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartinvo');
    console.log('Connected to MongoDB');

    const testFileUrl = 'https://test-url.com/test-invoice-deletion.pdf';

    // Test 1: Create test invoices with the same file URL
    console.log('\n=== Test 1: Creating test invoices ===');
    const testInvoices = [];
    
    for (let i = 1; i <= 3; i++) {
      const invoice = new Invoice({
        uploadedBy: new mongoose.Types.ObjectId(),
        invoiceType: 'purchase',
        fileUrl: testFileUrl,
        invoiceNumber: `TEST-DEL-${i}-${Date.now()}`,
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
        extractedText: `Test extracted text ${i}`,
        ocrConfidence: 0.9,
        processingMethod: 'Test Method',
        parsedFields: ['invoiceNumber', 'totalAmount'],
        correctedFields: []
      });
      
      const savedInvoice = await invoice.save();
      testInvoices.push(savedInvoice);
      console.log(`✅ Created test invoice ${i}:`, savedInvoice.invoiceNumber);
    }

    // Test 2: Verify invoices exist
    console.log('\n=== Test 2: Verifying invoices exist ===');
    const existingInvoices = await Invoice.find({ fileUrl: testFileUrl });
    console.log(`✅ Found ${existingInvoices.length} invoices with file URL:`, testFileUrl);

    // Test 3: Call the deletion API
    console.log('\n=== Test 3: Testing deletion API ===');
    try {
      const response = await axios.delete(`${API_BASE_URL}/invoices/by-file-url/${encodeURIComponent(testFileUrl)}`);
      console.log('✅ API Response:', response.data);
    } catch (apiError) {
      console.error('❌ API Error:', apiError.response?.data || apiError.message);
    }

    // Test 4: Verify invoices are deleted
    console.log('\n=== Test 4: Verifying deletion ===');
    const remainingInvoices = await Invoice.find({ fileUrl: testFileUrl });
    console.log(`✅ Remaining invoices with file URL: ${remainingInvoices.length}`);

    if (remainingInvoices.length === 0) {
      console.log('🎉 All test invoices were successfully deleted!');
    } else {
      console.log('❌ Some invoices were not deleted');
    }

    // Test 5: Test with non-existent file URL
    console.log('\n=== Test 5: Testing with non-existent file URL ===');
    const nonExistentUrl = 'https://test-url.com/non-existent.pdf';
    try {
      const response = await axios.delete(`${API_BASE_URL}/invoices/by-file-url/${encodeURIComponent(nonExistentUrl)}`);
      console.log('✅ API Response for non-existent URL:', response.data);
    } catch (apiError) {
      console.error('❌ API Error for non-existent URL:', apiError.response?.data || apiError.message);
    }

    console.log('\n🎉 Invoice deletion by file URL test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testInvoiceDeletionByFileUrl(); 