const axios = require('axios');

class LayoutLMProcessor {
  constructor() {
    this.apiUrl = process.env.LAYOUTLM_API_URL || 'http://localhost:8000/predict';
  }

  async extractInvoiceData(ocrText, fileType = 'image') {
    try {
      console.log('Processing with LayoutLM...');
      console.log('OCR Text length:', ocrText.length);
      console.log('OCR Text preview:', ocrText.substring(0, 200) + '...');
      
      // If no OCR text, use fallback immediately
      if (!ocrText || ocrText.trim().length === 0) {
        console.log('No OCR text available, using fallback parsing');
        return {
          success: false,
          extractedData: this.fallbackParsing('Sample invoice text for testing'),
          confidence: 0.3,
          processingMethod: 'Fallback Parsing (No OCR)',
          error: 'No OCR text available'
        };
      }

      // Try LayoutLM API if available
      if (process.env.LAYOUTLM_API_URL && process.env.LAYOUTLM_API_URL !== 'http://localhost:8000/predict') {
        try {
          // Prepare data for LayoutLM
          const requestData = {
            text: ocrText,
            file_type: fileType,
            confidence_threshold: 0.7
          };

          // Call LayoutLM API
          const response = await axios.post(this.apiUrl, requestData, {
            headers: {
              'Content-Type': 'application/json',
              'timeout': 30000 // 30 seconds timeout
            }
          });

          console.log('LayoutLM response received');
          
          // Extract structured data from LayoutLM response
          const extractedData = this.parseLayoutLMResponse(response.data);
          
          return {
            success: true,
            extractedData: extractedData,
            confidence: response.data.confidence || 0.8,
            processingMethod: 'LayoutLM'
          };
        } catch (layoutLMError) {
          console.error('LayoutLM API error:', layoutLMError.message);
          // Continue to fallback parsing
        }
      } else {
        console.log('LayoutLM API not configured, using fallback parsing');
      }
      
      // Fallback to basic parsing
      return {
        success: false,
        extractedData: this.fallbackParsing(ocrText),
        confidence: 0.5,
        processingMethod: 'Fallback Parsing',
        error: 'LayoutLM not available'
      };

    } catch (error) {
      console.error('LayoutLM processing error:', error.message);
      
      // Fallback to basic parsing if LayoutLM fails
      return {
        success: false,
        extractedData: this.fallbackParsing(ocrText || 'Sample invoice text for testing'),
        confidence: 0.3,
        processingMethod: 'Fallback Parsing (Error)',
        error: error.message
      };
    }
  }

  parseLayoutLMResponse(layoutLMData) {
    try {
      // Extract fields from LayoutLM response
      const extracted = {
        invoiceNumber: layoutLMData.invoice_number || '',
        invoiceDate: layoutLMData.invoice_date || '',
        dueDate: layoutLMData.due_date || '',
        vendorName: layoutLMData.vendor_name || '',
        vendorAddress: layoutLMData.vendor_address || '',
        vendorContact: layoutLMData.vendor_contact || '',
        buyerName: layoutLMData.buyer_name || '',
        buyerAddress: layoutLMData.buyer_address || '',
        totalAmount: parseFloat(layoutLMData.total_amount) || 0,
        subtotal: parseFloat(layoutLMData.subtotal) || 0,
        taxAmount: parseFloat(layoutLMData.tax_amount) || 0,
        currency: layoutLMData.currency || 'USD',
        paymentTerms: layoutLMData.payment_terms || '',
        poNumber: layoutLMData.po_number || '',
        lineItems: layoutLMData.line_items || [],
        notes: layoutLMData.notes || '',
        confidence: layoutLMData.confidence || 0.8
      };

      // Clean up empty strings
      Object.keys(extracted).forEach(key => {
        if (typeof extracted[key] === 'string' && extracted[key].trim() === '') {
          extracted[key] = null;
        }
      });

      return extracted;
    } catch (error) {
      console.error('Error parsing LayoutLM response:', error);
      return this.fallbackParsing('');
    }
  }

  fallbackParsing(ocrText) {
    console.log('Using fallback parsing for text:', ocrText.substring(0, 100) + '...');
    
    // Basic regex-based parsing as fallback
    const extracted = {
      invoiceNumber: this.extractInvoiceNumber(ocrText),
      invoiceDate: this.extractDate(ocrText),
      dueDate: this.extractDueDate(ocrText),
      vendorName: this.extractVendorName(ocrText),
      vendorAddress: this.extractAddress(ocrText),
      totalAmount: this.extractAmount(ocrText),
      currency: this.extractCurrency(ocrText),
      lineItems: this.extractLineItems(ocrText),
      confidence: 0.3
    };

    console.log('Fallback parsing results:', extracted);
    console.log('Line items from fallback parsing:', extracted.lineItems);
    console.log('Line items type:', typeof extracted.lineItems, 'Length:', extracted.lineItems?.length);
    return extracted;
  }

  extractInvoiceNumber(text) {
    const patterns = [
      /invoice\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
      /inv\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
      /invoice\s*number\s*:?\s*([A-Z0-9\-]+)/i,
      /#\s*([A-Z0-9\-]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return 'INV-' + Date.now().toString().slice(-6);
  }

  extractDate(text) {
    const patterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return new Date().toISOString().split('T')[0];
  }

  extractDueDate(text) {
    const patterns = [
      /due\s+date\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /payment\s+due\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    // Default to 30 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate.toISOString().split('T')[0];
  }

  extractVendorName(text) {
    const patterns = [
      /from\s*:?\s*([A-Za-z\s&.,]+)/i,
      /vendor\s*:?\s*([A-Za-z\s&.,]+)/i,
      /company\s*:?\s*([A-Za-z\s&.,]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    return 'Sample Vendor Inc.';
  }

  extractAddress(text) {
    const patterns = [
      /address\s*:?\s*([A-Za-z0-9\s,.-]+)/i,
      /street\s*:?\s*([A-Za-z0-9\s,.-]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    return '123 Business St, City, State 12345';
  }

  extractAmount(text) {
    const patterns = [
      /total\s*:?\s*\$?([0-9,]+\.?[0-9]*)/i,
      /amount\s*:?\s*\$?([0-9,]+\.?[0-9]*)/i,
      /sum\s*:?\s*\$?([0-9,]+\.?[0-9]*)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return parseFloat(match[1].replace(/,/g, ''));
    }
    return 500.00; // Default amount for testing
  }

  extractCurrency(text) {
    const patterns = [
      /\$([0-9,]+\.?[0-9]*)/,
      /USD/,
      /EUR/,
      /GBP/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (pattern.source.includes('$')) return 'USD';
        return match[1] || match[0];
      }
    }
    return 'USD';
  }

  extractLineItems(text) {
    console.log('Extracting line items from text...');
    console.log('Text preview:', text.substring(0, 500) + '...');
    console.log('Full text for line item extraction:');
    console.log('---START OF TEXT FOR LINE ITEM EXTRACTION---');
    console.log(text);
    console.log('---END OF TEXT FOR LINE ITEM EXTRACTION---');
    console.log('Text length:', text.length);
    console.log('Text lines count:', text.split('\n').length);
    
    // Enhanced line item extraction with multiple patterns
    const lines = text.split('\n');
    const items = [];
    
    // Pattern 1: Description Quantity Price (with flexible spacing)
    const pattern1 = /^([A-Za-z\s&\-\.]+?)\s+(\d+)\s+\$?([0-9,]+\.?[0-9]*)/i;
    
    // Pattern 2: Description - Quantity x Price
    const pattern2 = /^([A-Za-z\s&\-\.]+?)\s*-\s*(\d+)\s*x\s+\$?([0-9,]+\.?[0-9]*)/i;
    
    // Pattern 3: Description @ Price
    const pattern3 = /^([A-Za-z\s&\-\.]+?)\s+@\s+\$?([0-9,]+\.?[0-9]*)/i;
    
    // Pattern 4: Description (Quantity) Price
    const pattern4 = /^([A-Za-z\s&\-\.]+?)\s*\((\d+)\)\s+\$?([0-9,]+\.?[0-9]*)/i;
    
    // Pattern 5: Description - Price
    const pattern5 = /^([A-Za-z\s&\-\.]+?)\s*-\s+\$?([0-9,]+\.?[0-9]*)/i;
    
    // Pattern 6: Description with multiple spaces Quantity Price
    const pattern6 = /^([A-Za-z\s&\-\.]+?)\s{2,}(\d+)\s+\$?([0-9,]+\.?[0-9]*)/i;
    
    // Pattern 7: Description Quantity $Price
    const pattern7 = /^([A-Za-z\s&\-\.]+?)\s+(\d+)\s+\$([0-9,]+\.?[0-9]*)/i;
    
    const patterns = [pattern1, pattern2, pattern3, pattern4, pattern5, pattern6, pattern7];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      console.log(`Processing line ${i + 1}: "${trimmedLine}"`);
      
      if (trimmedLine.length < 3) {
        console.log(`Skipping line ${i + 1} (too short)`);
        continue; // Skip very short lines
      }
      
      // Skip lines that are likely headers or totals
      if (trimmedLine.toLowerCase().includes('total') || 
          trimmedLine.toLowerCase().includes('subtotal') ||
          trimmedLine.toLowerCase().includes('tax') ||
          trimmedLine.toLowerCase().includes('amount') ||
          trimmedLine.toLowerCase().includes('invoice') ||
          trimmedLine.toLowerCase().includes('date') ||
          trimmedLine.toLowerCase().includes('due')) {
        console.log(`Skipping line ${i + 1} (header/total)`);
        continue;
      }
      
      let match = null;
      let patternIndex = -1;
      
      // Try each pattern
      for (let j = 0; j < patterns.length; j++) {
        match = trimmedLine.match(patterns[j]);
        if (match) {
          patternIndex = j;
          console.log(`Line ${i + 1} matched pattern ${j + 1}:`, match);
          break;
        } else {
          console.log(`Line ${i + 1} didn't match pattern ${j + 1}`);
        }
      }
      
      if (match) {
        let description, quantity, unitPrice;
        
        switch (patternIndex) {
          case 0: // Description Quantity Price
            description = match[1].trim();
            quantity = parseInt(match[2]);
            unitPrice = parseFloat(match[3].replace(/,/g, ''));
            break;
          case 1: // Description - Quantity x Price
            description = match[1].trim();
            quantity = parseInt(match[2]);
            unitPrice = parseFloat(match[3].replace(/,/g, ''));
            break;
          case 2: // Description @ Price
            description = match[1].trim();
            quantity = 1; // Default quantity
            unitPrice = parseFloat(match[2].replace(/,/g, ''));
            break;
          case 3: // Description (Quantity) Price
            description = match[1].trim();
            quantity = parseInt(match[2]);
            unitPrice = parseFloat(match[3].replace(/,/g, ''));
            break;
          case 4: // Description - Price
            description = match[1].trim();
            quantity = 1; // Default quantity
            unitPrice = parseFloat(match[2].replace(/,/g, ''));
            break;
          case 5: // Description with multiple spaces Quantity Price
            description = match[1].trim();
            quantity = parseInt(match[2]);
            unitPrice = parseFloat(match[3].replace(/,/g, ''));
            break;
          case 6: // Description Quantity $Price
            description = match[1].trim();
            quantity = parseInt(match[2]);
            unitPrice = parseFloat(match[3].replace(/,/g, ''));
            break;
          default:
            continue;
        }
        
        // Validate the extracted data
        if (description && description.length > 0 && 
            !isNaN(quantity) && quantity > 0 && 
            !isNaN(unitPrice) && unitPrice > 0) {
          
          const lineTotal = quantity * unitPrice;
          
          items.push({
            description: description,
            quantity: quantity,
            unitPrice: unitPrice,
            lineTotal: lineTotal
          });
          
          console.log('Extracted line item:', {
            description,
            quantity,
            unitPrice,
            lineTotal
          });
        }
      }
    }
    
    // If no line items found, try to extract from amount patterns
    if (items.length === 0) {
      console.log('No line items found with patterns, trying amount extraction...');
      
      // Look for any amount patterns in the text
      const amountPatterns = [
        /\$?([0-9,]+\.?[0-9]*)/g,
        /([0-9,]+\.?[0-9]*)\s*USD/g,
        /([0-9,]+\.?[0-9]*)\s*EUR/g
      ];
      
      const amounts = [];
      for (const pattern of amountPatterns) {
        const matches = text.match(pattern);
        if (matches) {
          amounts.push(...matches.map(m => parseFloat(m.replace(/[$,]/g, ''))));
        }
      }
      
      // Remove duplicates and sort
      const uniqueAmounts = [...new Set(amounts)].filter(amount => amount > 0).sort((a, b) => b - a);
      
      if (uniqueAmounts.length > 0) {
        // Use the largest amount as the main item
        const mainAmount = uniqueAmounts[0];
        items.push({
          description: 'Extracted Product/Service',
          quantity: 1,
          unitPrice: mainAmount,
          lineTotal: mainAmount
        });
        
        // Add other amounts as separate items if they're significantly different
        for (let i = 1; i < uniqueAmounts.length; i++) {
          const amount = uniqueAmounts[i];
          if (amount < mainAmount * 0.8) { // Only add if significantly smaller
            items.push({
              description: 'Additional Item',
              quantity: 1,
              unitPrice: amount,
              lineTotal: amount
            });
          }
        }
      }
    }
    
    // If still no line items found, add a sample one
    if (items.length === 0) {
      console.log('No line items extracted, adding sample item');
      items.push({
        description: 'Sample Product/Service',
        quantity: 1,
        unitPrice: 500.00,
        lineTotal: 500.00
      });
    }
    
    console.log('Final line items:', items);
    return items;
  }
}

module.exports = new LayoutLMProcessor(); 