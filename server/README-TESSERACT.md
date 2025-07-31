# Tesseract OCR Integration

## Overview
This application now uses **Tesseract OCR** instead of Google Vision API for text extraction from images and PDFs.

## Benefits of Tesseract OCR

### ✅ **Free and Open Source**
- No API keys required
- No usage limits
- No external service dependencies

### ✅ **Local Processing**
- All OCR processing happens on your server
- No data sent to external services
- Faster processing for small files

### ✅ **Multiple Language Support**
- English (default)
- Can be extended to other languages
- Better accuracy for specific use cases

### ✅ **PDF Support**
- Direct text extraction from PDFs using pdf-parse
- Fallback to OCR if PDF text extraction fails
- Handles both text-based and image-based PDFs

## Installation

The required packages are already installed:

```bash
npm install tesseract.js pdf-parse
```

## Usage

### Image OCR
```javascript
const { extractTextFromImage } = require('./utils/tesseractOCR');

const result = await extractTextFromImage(imageBuffer);
console.log(result.text); // Extracted text
console.log(result.confidence); // Confidence score (0-1)
```

### PDF Text Extraction
```javascript
const { extractTextFromPdf } = require('./utils/tesseractOCR');

const result = await extractTextFromPdf(pdfBuffer);
console.log(result.text); // Extracted text
console.log(result.pages); // Number of pages
```

## File Processing Flow

1. **File Upload** → Cloudinary storage
2. **Text Extraction** → Tesseract OCR (images) or pdf-parse (PDFs)
3. **Data Processing** → LayoutLM or fallback parsing
4. **Invoice Creation** → Database storage with line items

## Configuration

### Environment Variables
No special environment variables required for Tesseract OCR!

### Performance Tuning
- Tesseract works best with high-quality images
- For better accuracy, ensure images are:
  - High resolution (300+ DPI)
  - Good contrast
  - Clear text
  - Minimal noise

## Troubleshooting

### Common Issues

1. **Slow Processing**
   - Tesseract can be slower than cloud APIs
   - Consider image optimization for large files

2. **Low Accuracy**
   - Improve image quality
   - Ensure good lighting and contrast
   - Use higher resolution images

3. **Memory Usage**
   - Large images may use significant memory
   - Consider resizing very large images before processing

### Testing
Run the test script to verify Tesseract is working:
```bash
node test-tesseract.js
```

## Migration from Google Vision

The migration is complete! The application now:
- ✅ Uses Tesseract for all OCR processing
- ✅ No longer requires Google Cloud credentials
- ✅ Processes files locally without external API calls
- ✅ Maintains the same API interface for frontend compatibility

## Next Steps

1. **Test with real invoice images**
2. **Monitor processing performance**
3. **Adjust image quality settings if needed**
4. **Consider adding language support for international invoices** 