const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  fileUrl: { type: String, required: true },
  fileName: { type: String },
  fileType: { 
    type: String, 
    enum: ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'zip'], 
    required: true 
  },
  invoiceLinked: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },

  status: { 
    type: String, 
    enum: ['uploaded', 'parsing', 'parsed', 'error'], 
    default: 'uploaded' 
  },
  errorLog: { type: String, default: null }, // Optional error reason
  pageCount: { type: Number }, // For multi-page PDFs

  // OCR Results
  extractedText: { type: String, default: '' },
  confidenceScore: { type: Number, default: 0.0 },

  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', fileSchema); 