const mongoose = require('mongoose');
const File = require('./models/File');
const Invoice = require('./models/Invoice');
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:5000/api';

async function testOCRRoute() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartinvo');
    console.log('Connected to MongoDB');

    // Test 1: Create a test file
    console.log('\n=== Test 1: Creating Test File ===');
    const testFile = new File({
      uploadedBy: new mongoose.Types.ObjectId(),
      fileUrl: 'https://test-url.com/test-ocr-route.pdf',
      fileName: 'test-ocr-route.pdf',
      fileType: 'pdf',
      status: 'uploaded',
      confidenceScore: 0.8,
      extractedText: 'Sample invoice text for testing purposes. Invoice #12345. Total: $500.00. Vendor: Test Company.'
    });
    
    await testFile.save();
    console.log('✅ Test file created:', testFile._id);

    // Test 2: Call the OCR processing route
    console.log('\n=== Test 2: Calling OCR Processing Route ===');
    try {
      const response = await axios.post(`${API_BASE_URL}/files/${testFile._id}/ocr`);
      console.log('✅ OCR Route Response:', response.data);
      
      if (response.data.invoice) {
        console.log('✅ Invoice created successfully!');
        console.log('Invoice ID:', response.data.invoice._id);
        console.log('Invoice Number:', response.data.invoice.invoiceNumber);
        console.log('Total Amount:', response.data.invoice.totalAmount);
        console.log('Extracted Text Length:', response.data.invoice.extractedText?.length || 0);
      } else {
        console.log('❌ No invoice in response');
      }
    } catch (apiError) {
      console.error('❌ OCR Route Error:', apiError.response?.data || apiError.message);
    }

    // Test 3: Verify invoice was created in database
    console.log('\n=== Test 3: Verifying Invoice in Database ===');
    const invoices = await Invoice.find({ fileUrl: testFile.fileUrl });
    console.log(`✅ Found ${invoices.length} invoice(s) for file URL:`, testFile.fileUrl);
    
    if (invoices.length > 0) {
      const invoice = invoices[0];
      console.log('Invoice details:', {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        vendor: invoice.vendor?.name,
        extractedTextLength: invoice.extractedText?.length || 0,
        processingMethod: invoice.processingMethod
      });
    }

    // Test 4: Check if file was updated
    console.log('\n=== Test 4: Checking File Update ===');
    const updatedFile = await File.findById(testFile._id);
    if (updatedFile) {
      console.log('File status:', updatedFile.status);
      console.log('File invoiceLinked:', updatedFile.invoiceLinked);
      console.log('File extractedText length:', updatedFile.extractedText?.length || 0);
    }

    // Cleanup
    console.log('\n=== Cleanup ===');
    if (invoices.length > 0) {
      await Invoice.deleteMany({ fileUrl: testFile.fileUrl });
      console.log('✅ Invoices deleted');
    }
    await File.findByIdAndDelete(testFile._id);
    console.log('✅ Test file deleted');

    console.log('\n🎉 OCR Route Test Completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testOCRRoute(); 