// Mock API service for invoice processing system

const API_BASE_URL = 'http://localhost:8080/api'; // Update to your backend URL

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data
let mockInvoices = [
  {
    id: 1,
    invoiceNumber: 'INV-2024-001',
    invoiceDate: '2024-01-15',
    dueDate: '2024-02-15',
    vendorName: 'Tech Solutions Inc.',
    vendorAddress: '123 Tech St, Silicon Valley, CA 94025',
    buyerName: 'Your Company LLC',
    buyerAddress: '456 Business Ave, New York, NY 10001',
    totalAmount: 1250.00,
    currency: 'USD',
    taxAmount: 125.00,
    status: 'Processed',
    confidence: 94,
    fileType: 'PDF',
    uploadedBy: 'john.doe@company.com',
    uploadedAt: '2024-01-15T10:30:00Z'
  }
];

let mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'user',
    status: 'active',
    lastLogin: '2024-01-15T10:30:00Z',
    uploads: 45
  }
];

export const api = {
  // Authentication
  async login(credentials) {
    const res = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include', // for cookies if needed
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }
    // Optionally, store JWT/token securely (e.g., httpOnly cookie or memory)
    return await res.json();
  },

  async register(userData) {
    const res = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Registration failed');
    }
    return await res.json();
  },

  // Session validation
  async validateSession(userId) {
    try {
      const res = await fetch(`${API_BASE_URL}/users/validate-session?userId=${userId}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Session invalid');
      }
      return await res.json();
    } catch (error) {
      throw new Error('Session validation failed');
    }
  },

  async logout() {
    try {
      const res = await fetch(`${API_BASE_URL}/users/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      return res.ok;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  },

  // Invoice operations
  async getInvoices(filters = {}) {
    const res = await fetch(`${API_BASE_URL}/invoices`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch invoices');
    }
    return await res.json();
  },

  async getUserInvoices(userId) {
    const res = await fetch(`${API_BASE_URL}/invoices/user/${userId}`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch user invoices');
    }
    return await res.json();
  },

  async getInvoicesWithOCR() {
    try {
      const res = await fetch(`${API_BASE_URL}/invoices/with-ocr`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch invoices with OCR');
      }
      return await res.json();
    } catch (error) {
      console.log('Using mock data for invoices (server not available)');
      await delay(500);
      return mockInvoices;
    }
  },

  async createInvoice(invoiceData) {
    const res = await fetch(`${API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create invoice');
    }
    return await res.json();
  },

  async uploadInvoice(file) {
    await delay(2000);
    
    const newInvoice = {
      id: mockInvoices.length + 1,
      invoiceNumber: `INV-${Date.now()}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      vendorName: 'Extracted Vendor',
      vendorAddress: 'Extracted Address',
      buyerName: 'Your Company LLC',
      buyerAddress: '456 Business Ave, New York, NY 10001',
      totalAmount: Math.random() * 1000 + 100,
      currency: 'USD',
      taxAmount: Math.random() * 100 + 10,
      status: 'Processed',
      confidence: Math.floor(Math.random() * 30) + 70,
      fileType: file.type.split('/')[1].toUpperCase(),
      uploadedBy: 'current-user@company.com',
      uploadedAt: new Date().toISOString()
    };

    mockInvoices.push(newInvoice);
    return newInvoice;
  },

  async updateInvoice(id, updates) {
    try {
      const res = await fetch(`${API_BASE_URL}/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update invoice');
      }
      return await res.json();
    } catch (error) {
      console.error('Update invoice error:', error);
      // Fallback to mock for now
      await delay(500);
      const index = mockInvoices.findIndex(inv => inv.id === id);
      if (index !== -1) {
        mockInvoices[index] = { ...mockInvoices[index], ...updates };
        return mockInvoices[index];
      }
      throw new Error('Invoice not found');
    }
  },

  async deleteInvoice(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/invoices/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete invoice');
      }
      return await res.json();
    } catch (error) {
      console.error('Delete invoice error:', error);
      // Fallback to mock for now
      await delay(500);
      const index = mockInvoices.findIndex(inv => inv.id === id);
      if (index !== -1) {
        mockInvoices.splice(index, 1);
        return { success: true };
      }
      throw new Error('Invoice not found');
    }
  },

  // User management (admin only)
  async getUsers() {
    await delay(500);
    return mockUsers;
  },

  async createUser(userData) {
    await delay(500);
    const newUser = {
      id: mockUsers.length + 1,
      ...userData,
      status: 'active',
      lastLogin: new Date().toISOString(),
      uploads: 0
    };
    mockUsers.push(newUser);
    return newUser;
  },

  async updateUser(id, updates) {
    await delay(500);
    const index = mockUsers.findIndex(user => user.id === id);
    if (index !== -1) {
      mockUsers[index] = { ...mockUsers[index], ...updates };
      return mockUsers[index];
    }
    throw new Error('User not found');
  },

  async deleteUser(id) {
    await delay(500);
    const index = mockUsers.findIndex(user => user.id === id);
    if (index !== -1) {
      mockUsers.splice(index, 1);
      return { success: true };
    }
    throw new Error('User not found');
  },

  // Analytics
  async getAnalytics() {
    await delay(500);
    return {
      totalInvoices: mockInvoices.length,
      processedToday: Math.floor(Math.random() * 20) + 5,
      pendingReview: Math.floor(Math.random() * 10) + 1,
      accuracyRate: 94.2,
      monthlyData: [
        { month: 'Jan', processed: 120, errors: 5 },
        { month: 'Feb', processed: 150, errors: 3 },
        { month: 'Mar', processed: 180, errors: 7 },
        { month: 'Apr', processed: 200, errors: 4 },
        { month: 'May', processed: 250, errors: 6 },
        { month: 'Jun', processed: 300, errors: 8 }
      ],
      statusDistribution: [
        { name: 'Processed', value: 85, color: '#4caf50' },
        { name: 'Pending', value: 10, color: '#ff9800' },
        { name: 'Error', value: 5, color: '#f44336' }
      ]
    };
  },

  // System settings
  async getSystemSettings() {
    await delay(300);
    return {
      maxFileSize: 10,
      defaultUserRole: 'user',
      apiRateLimit: 1000,
      emailNotifications: true,
      autoProcessing: true,
      requireManualReview: false
    };
  },

  async updateSystemSettings(settings) {
    await delay(500);
    console.log('System settings updated:', settings);
    return { success: true };
  },

  async uploadFile(file, uploadedBy, invoiceLinked, pageCount) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (uploadedBy) formData.append('uploadedBy', uploadedBy);
      if (invoiceLinked) formData.append('invoiceLinked', invoiceLinked);
      if (pageCount) formData.append('pageCount', pageCount);
      
      console.log('Uploading file:', file.name, 'to:', `${API_BASE_URL}/files/upload`);
      
      const res = await fetch(`${API_BASE_URL}/files/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      console.log('Upload response status:', res.status);
      
      if (!res.ok) {
        const error = await res.json();
        console.error('Upload error response:', error);
        throw new Error(error.error || 'File upload failed');
      }
      
      const result = await res.json();
      console.log('Upload successful:', result);
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  async processFileOCR(fileId) {
    try {
      console.log('Processing OCR for file:', fileId);
      const res = await fetch(`${API_BASE_URL}/files/${fileId}/ocr`, {
        method: 'POST',
        credentials: 'include',
      });
      
      console.log('OCR response status:', res.status);
      
      if (!res.ok) {
        const error = await res.json();
        console.error('OCR error response:', error);
        throw new Error(error.error || 'OCR processing failed');
      }
      
      const result = await res.json();
      console.log('OCR processing successful:', result);
      return result;
    } catch (error) {
      console.error('OCR processing error:', error);
      throw error;
    }
  },

  async getFilesWithOCR() {
    try {
      const res = await fetch(`${API_BASE_URL}/files`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch files');
      }
      return await res.json();
    } catch (error) {
      console.log('Using mock data for files (server not available)');
      await delay(500);
      // Return mock files based on invoices
      return mockInvoices.map(invoice => ({
        id: invoice.id,
        fileName: `invoice-${invoice.invoiceNumber}.pdf`,
        fileType: invoice.fileType || 'PDF',
        uploadedAt: invoice.uploadedAt,
        status: invoice.status,
        uploadedBy: invoice.uploadedBy
      }));
    }
  },

  async deleteFile(fileId) {
    const res = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete file');
    }
    return await res.json();
  },

  async deleteInvoicesByFileUrl(fileUrl) {
    const res = await fetch(`${API_BASE_URL}/invoices/by-file-url/${encodeURIComponent(fileUrl)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete invoices by file URL');
    }
    return await res.json();
  }
};

export default api; 