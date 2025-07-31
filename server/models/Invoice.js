const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  description: { type: String },
  quantity: { type: Number },
  unitPrice: { type: Number },
  lineTotal: { type: Number }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invoiceType: { type: String, enum: ['sales', 'purchase'], required: true },
  
  fileUrl: { type: String, required: true },  // Cloudinary link
  invoiceNumber: { type: String },
  invoiceDate: { type: Date },
  dueDate: { type: Date },
  
  vendor: {
    name: String,
    address: String,
    contact: String
  },
  buyer: {
    name: String,
    address: String
  },

  totalAmount: Number,
  currency: String,
  taxDetails: String,
  poNumber: String,
  paymentTerms: String,

  lineItems: [lineItemSchema],

  confidenceScore: { type: Number, default: 0.0 },
  isVerified: { type: Boolean, default: false },

  // OCR and text extraction fields
  extractedText: { type: String },  // Raw text extracted from OCR
  ocrConfidence: { type: Number },  // OCR confidence score
  processingMethod: { type: String }, // Method used (Tesseract, LayoutLM, etc.)

  parsedFields: [String],     // Tracks which fields were parsed
  correctedFields: [String],  // Tracks manually edited fields

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', invoiceSchema); 