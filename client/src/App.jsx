import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CircularProgress, Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import './App.css';
import api from './services/api';

// Components
import Login from './components/auth/Login';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './components/dashboard/Dashboard';
import AdvancedFileUpload from './components/upload/AdvancedFileUpload';
import InvoiceDataGrid from './components/invoices/InvoiceDataGrid';
import AdminPanel from './components/admin/AdminPanel';
import ErrorBoundary from './components/common/ErrorBoundary';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
});

// Session management utilities
const SESSION_KEY = 'smartinvo_user_session';

const saveUserSession = (userData) => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Failed to save user session:', error);
  }
};

const loadUserSession = () => {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('Failed to load user session:', error);
    return null;
  }
};

const clearUserSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear user session:', error);
  }
};

function App() {
  const [user, setUser] = useState(null);
  const [processedInvoices, setProcessedInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user session on app initialization
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const savedUser = loadUserSession();
        if (savedUser) {
          // Validate the session with the server
          try {
            const validatedUser = await api.validateSession(savedUser._id || savedUser.id);
            setUser(validatedUser);
            saveUserSession(validatedUser); // Update with fresh data
          } catch (error) {
            console.log('Session validation failed, but using stored session data');
            // If backend is not available, use stored session data
            setUser(savedUser);
          }
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        clearUserSession();
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    saveUserSession(userData);
  };

  const handleLogout = async () => {
    try {
      // Call logout API to invalidate session on server
      await api.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      setUser(null);
      setProcessedInvoices([]); // Clear processed invoices on logout
      clearUserSession();
    }
  };

  const handleFilesProcessed = (processedFiles) => {
    // Convert processed files to invoice format for the grid
    const newInvoices = processedFiles.map((fileObj, index) => ({
      id: fileObj.id || `invoice-${Date.now()}-${index}`,
      invoiceNumber: fileObj.extractedData?.invoiceNumber || `INV-${Date.now()}-${index}`,
      invoiceDate: fileObj.extractedData?.invoiceDate || new Date().toLocaleDateString(),
      dueDate: fileObj.extractedData?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      vendorName: fileObj.extractedData?.vendorName || 'Unknown Vendor',
      vendorAddress: fileObj.extractedData?.vendorAddress || 'Address not found',
      buyerName: fileObj.extractedData?.buyerName || 'Your Company LLC',
      buyerAddress: fileObj.extractedData?.buyerAddress || 'Address not found',
      totalAmount: parseFloat(fileObj.extractedData?.totalAmount || 0),
      currency: fileObj.extractedData?.currency || 'USD',
      taxAmount: parseFloat(fileObj.extractedData?.taxAmount || 0),
      subtotal: parseFloat(fileObj.extractedData?.subtotal || 0),
      status: 'Processed',
      confidence: fileObj.confidence || 0,
      fileType: fileObj.extractedData?.fileType || 'Unknown',
      uploadedBy: user?.email || 'Unknown',
      uploadedAt: new Date().toISOString(),
      file: fileObj.file,
      extractedData: fileObj.extractedData,
      processingMethod: fileObj.extractedData?.processingMethod || 'Unknown'
    }));

    setProcessedInvoices(prev => [...prev, ...newInvoices]);
  };

  // Protected Route component
  const ProtectedRoute = ({ children, allowedRoles = ['user', 'manager', 'admin'] }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
    
    return children;
  };

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height="100vh"
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          <CircularProgress 
            size={60} 
            thickness={4}
            sx={{ 
              color: 'white',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              }
            }}
          />
        </Box>
      </ThemeProvider>
    );
  }

  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Login onLogin={handleLogin} />
      </ThemeProvider>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <MainLayout user={user} onLogout={handleLogout}>
            <Routes>
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard userRole={user.role} />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/upload" 
                element={
                  <ProtectedRoute>
                    <AdvancedFileUpload 
                      onFilesProcessed={handleFilesProcessed}
                      userRole={user.role}
                      user={user}
                    />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/invoices" 
                element={
                  <ProtectedRoute>
                    <InvoiceDataGrid 
                      userRole={user.role}
                      user={user}
                    />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPanel userRole={user.role} />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPanel userRole={user.role} />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </MainLayout>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
