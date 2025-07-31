import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  Upload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  FileCopy as FileIcon,
  Speed as SpeedIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import api from '../../services/api';

export default function Dashboard({ userRole }) {
  const [dashboardData, setDashboardData] = useState({
    invoices: [],
    analytics: null,
    files: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [newDataAvailable, setNewDataAvailable] = useState(false);
  const [previousDataCount, setPreviousDataCount] = useState(0);

  // Fetch dashboard data from database
  const fetchDashboardData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setRefreshing(true);
      setError(null);

      console.log('Fetching dashboard data...');

      // Fetch all data in parallel
      const [invoicesData, filesData, analyticsData] = await Promise.all([
        api.getInvoicesWithOCR(),
        api.getFilesWithOCR(),
        api.getAnalytics()
      ]);

      console.log('API responses:', { 
        invoices: invoicesData?.length || 0, 
        files: filesData?.length || 0, 
        analytics: analyticsData 
      });

      const newInvoicesCount = (invoicesData || []).length;
      
      // Check if new data is available
      setPreviousDataCount(prevCount => {
        if (prevCount > 0 && newInvoicesCount > prevCount) {
          setNewDataAvailable(true);
          // Auto-hide notification after 5 seconds
          setTimeout(() => setNewDataAvailable(false), 5000);
        }
        return newInvoicesCount;
      });
      
      setDashboardData({
        invoices: invoicesData || [],
        files: filesData || [],
        analytics: analyticsData
      });

      setLastUpdate(new Date());
      setIsOnline(true);
      console.log('Dashboard data updated successfully');
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(err.message);
      setIsOnline(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline) {
        fetchDashboardData(false); // Don't show loading indicator for auto-refresh
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isOnline, fetchDashboardData]);

  // Simulate real-time updates every 10 seconds for demo purposes
  useEffect(() => {
    const realTimeInterval = setInterval(() => {
      if (isOnline && dashboardData.invoices.length > 0) {
        // Simulate new data arrival
        const shouldUpdate = Math.random() > 0.7; // 30% chance of update
        if (shouldUpdate) {
          fetchDashboardData(false);
        }
      }
    }, 10000); // 10 seconds

    return () => clearInterval(realTimeInterval);
  }, [isOnline, dashboardData.invoices.length, fetchDashboardData]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    fetchDashboardData();
  };

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear any remaining timeouts when component unmounts
      setNewDataAvailable(false);
    };
  }, []);

  // Calculate comprehensive statistics from live data with error handling
  const totalInvoices = dashboardData.invoices?.length || 0;
  const totalFiles = dashboardData.files?.length || 0;
  
  // Today's activity
  const today = new Date().toDateString();
  const processedToday = (dashboardData.invoices || []).filter(invoice => {
    try {
      const invoiceDate = new Date(invoice?.createdAt || invoice?.uploadedAt || invoice?.invoiceDate || Date.now()).toDateString();
      return invoiceDate === today;
    } catch (err) {
      console.warn('Error processing invoice date:', err);
      return false;
    }
  }).length;
  
  const filesUploadedToday = (dashboardData.files || []).filter(file => {
    try {
      const fileDate = new Date(file?.uploadedAt || file?.createdAt || Date.now()).toDateString();
      return fileDate === today;
    } catch (err) {
      console.warn('Error processing file date:', err);
      return false;
    }
  }).length;
  
  // Status statistics
  const pendingReview = (dashboardData.invoices || []).filter(invoice => 
    invoice?.status === 'Pending Review' || invoice?.status === 'pending' || invoice?.status === 'Processing'
  ).length;
  
  const errorInvoices = (dashboardData.invoices || []).filter(invoice => 
    invoice?.status === 'Error' || invoice?.status === 'error' || invoice?.status === 'Failed'
  ).length;
  
  const processedInvoices = (dashboardData.invoices || []).filter(invoice => 
    invoice?.status === 'Processed' || invoice?.status === 'processed' || invoice?.status === 'Completed'
  ).length;
  
  // Processing rate and confidence
  const averageConfidence = (dashboardData.invoices || []).length > 0 
    ? Math.round((dashboardData.invoices || []).reduce((sum, inv) => sum + (inv?.confidenceScore || inv?.confidence || 0), 0) / (dashboardData.invoices || []).length)
    : 0;
  
  const processingRate = totalFiles > 0 ? Math.round((processedInvoices / totalFiles) * 100) : 0;

  // Financial statistics with error handling
  const totalAmount = (dashboardData.invoices || []).reduce((sum, inv) => {
    try {
      return sum + (parseFloat(inv?.totalAmount) || 0);
    } catch (err) {
      console.warn('Error parsing total amount:', err);
      return sum;
    }
  }, 0);
  
  const averageAmount = totalInvoices > 0 ? totalAmount / totalInvoices : 0;
  
  const amounts = (dashboardData.invoices || []).map(inv => {
    try {
      return parseFloat(inv?.totalAmount) || 0;
    } catch (err) {
      console.warn('Error parsing invoice amount:', err);
      return 0;
    }
  });
  
  const highestAmount = amounts.length > 0 ? Math.max(...amounts) : 0;
  const lowestAmount = amounts.length > 0 ? Math.min(...amounts) : 0;

  // File type statistics
  const fileTypeStats = getFileTypeStats(dashboardData.files);
  
  // Vendor statistics
  const vendorStats = getVendorStats(dashboardData.invoices);
  
  // Processing time statistics
  const processingStats = getProcessingStats(dashboardData.files);
  
  // Error rate calculation
  const errorRate = totalFiles > 0 ? Math.round((errorInvoices / totalFiles) * 100) : 0;
  
  // Sales vs Purchase Invoice Classification with error handling
  const salesInvoices = (dashboardData.invoices || []).filter(invoice => {
    try {
      const uploadedBy = invoice?.uploadedBy || invoice?.uploadedByEmail || '';
      const vendorName = invoice?.vendorName || invoice?.vendor?.name || '';
      const buyerName = invoice?.buyerName || invoice?.buyer?.name || '';
      
      // If uploadedBy matches vendorName, it's a sales invoice (we're the supplier)
      return uploadedBy.toLowerCase().includes(vendorName.toLowerCase()) || 
             vendorName.toLowerCase().includes(uploadedBy.toLowerCase());
    } catch (err) {
      console.warn('Error classifying sales invoice:', err);
      return false;
    }
  }).length;
  
  const purchaseInvoices = (dashboardData.invoices || []).filter(invoice => {
    try {
      const uploadedBy = invoice?.uploadedBy || invoice?.uploadedByEmail || '';
      const vendorName = invoice?.vendorName || invoice?.vendor?.name || '';
      const buyerName = invoice?.buyerName || invoice?.buyer?.name || '';
      
      // If uploadedBy matches buyerName, it's a purchase invoice (we're the buyer)
      return uploadedBy.toLowerCase().includes(buyerName.toLowerCase()) || 
             buyerName.toLowerCase().includes(uploadedBy.toLowerCase());
    } catch (err) {
      console.warn('Error classifying purchase invoice:', err);
      return false;
    }
  }).length;

  // Generate monthly data from live data
  const monthlyData = generateMonthlyData(dashboardData.invoices);
  
  // Generate status distribution from live data
  const statusDistribution = generateStatusDistribution(dashboardData.invoices);

  // Recent activity from live data with real-time indicators and error handling
  const recentActivity = (dashboardData.invoices || [])
    .slice(0, 5)
    .map((invoice, index) => {
      try {
        const isRecent = new Date(invoice?.createdAt || invoice?.uploadedAt || Date.now()) > new Date(Date.now() - 5 * 60 * 1000); // Last 5 minutes
        return {
          action: 'Invoice processed',
          file: invoice?.fileName || invoice?.file?.name || 'Unknown file',
          time: getTimeAgo(invoice?.createdAt || invoice?.uploadedAt || Date.now()),
          status: 'success',
          icon: <CheckIcon sx={{ fontSize: 16 }} />,
          amount: invoice?.totalAmount || 0,
          isRecent,
          confidence: invoice?.confidenceScore || invoice?.confidence || 0
        };
      } catch (err) {
        console.warn('Error processing recent activity item:', err);
        return {
          action: 'Invoice processed',
          file: 'Unknown file',
          time: 'Unknown',
          status: 'success',
          icon: <CheckIcon sx={{ fontSize: 16 }} />,
          amount: 0,
          isRecent: false,
          confidence: 0
        };
      }
    });

  // Debug logging
  console.log('Dashboard render:', { 
    loading, 
    error, 
    invoicesCount: dashboardData.invoices.length,
    filesCount: dashboardData.files.length,
    isOnline 
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '400px', p: 3 }}>
        <Alert severity="error" sx={{ mb: 2, maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom>
            Dashboard Error
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={handleManualRefresh}
            startIcon={<RefreshIcon />}
          >
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      {/* Header with Live Status */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography 
            variant="h3" 
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Dashboard Analytics
          </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Real-time Connection Status */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
                  label={isOnline ? 'Live' : 'Offline'}
                  color={isOnline ? 'success' : 'error'}
                  size="small"
                  variant="outlined"
                />
                {isOnline && (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#48bb78',
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': { opacity: 1 },
                        '50%': { opacity: 0.5 },
                        '100%': { opacity: 1 }
                      }
                    }}
                  />
                )}
              </Box>
              {/* Last Update Time */}
              {lastUpdate && (
                <Typography variant="caption" color="text.secondary">
                  Last update: {lastUpdate.toLocaleTimeString()}
                </Typography>
              )}
              {/* Manual Refresh Button */}
              <IconButton 
                onClick={handleManualRefresh}
                disabled={refreshing}
                sx={{ 
                  color: '#667eea',
                  '&:hover': { transform: 'rotate(180deg)', transition: 'transform 0.3s ease' }
                }}
              >
                {refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </Box>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
          {totalInvoices > 0 
            ? `Live overview of ${totalInvoices} processed invoices from database`
            : 'Upload your first invoice to see detailed analytics'
          }
        </Typography>
      </Box>

      {/* New Data Notification */}
      {newDataAvailable && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => setNewDataAvailable(false)}>
              Dismiss
            </Button>
          }
        >
          🎉 New invoice data available! Dashboard has been updated automatically.
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleManualRefresh}>
              Retry
            </Button>
          }
        >
          Failed to fetch dashboard data: {error}
        </Alert>
      )}
      
      {/* Primary Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card slide-up" sx={{ animationDelay: '0.1s' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      mr: 2
                    }}
                  >
                    <UploadIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Total Invoices
                  </Typography>
                </Box>
                <IconButton size="small" sx={{ color: '#718096' }}>
                  <MoreIcon />
                </IconButton>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
                {totalInvoices.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                {totalInvoices > 0 ? (
                  <>
                    <TrendingIcon sx={{ fontSize: 16, mr: 0.5, color: '#48bb78' }} />
                    +{processedToday} today
                  </>
                ) : (
                  'No invoices yet'
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card slide-up" sx={{ animationDelay: '0.2s' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                      mr: 2
                    }}
                  >
                    <MoneyIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Total Value
                  </Typography>
                </Box>
                <IconButton size="small" sx={{ color: '#718096' }}>
                  <MoreIcon />
                </IconButton>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#48bb78', mb: 1 }}>
                ${totalAmount.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ${averageAmount.toFixed(2)} avg per invoice
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card slide-up" sx={{ animationDelay: '0.3s' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
                      mr: 2
                    }}
                  >
                    <AssessmentIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Processing Rate
                  </Typography>
                </Box>
                <IconButton size="small" sx={{ color: '#718096' }}>
                  <MoreIcon />
                </IconButton>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#ed8936', mb: 1 }}>
                {processingRate}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={processingRate} 
                className="progress-bar"
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card slide-up" sx={{ animationDelay: '0.4s' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
                      mr: 2
                    }}
                  >
                    <SpeedIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Today's Activity
                  </Typography>
                </Box>
                <IconButton size="small" sx={{ color: '#718096' }}>
                  <MoreIcon />
                </IconButton>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#4299e1', mb: 1 }}>
                {processedToday + filesUploadedToday}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {processedToday} processed, {filesUploadedToday} uploaded
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Secondary Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card slide-up" sx={{ animationDelay: '0.5s' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BusinessIcon sx={{ color: '#667eea', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Top Vendor
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#2d3748', mb: 1 }}>
                {vendorStats.topVendor || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {vendorStats.topVendorCount || 0} invoices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card slide-up" sx={{ animationDelay: '0.6s' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FileIcon sx={{ color: '#48bb78', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  File Types
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#2d3748', mb: 1 }}>
                {fileTypeStats.totalTypes}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {fileTypeStats.mostCommon} most common
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card slide-up" sx={{ animationDelay: '0.7s' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScheduleIcon sx={{ color: '#ed8936', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Avg Processing
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#2d3748', mb: 1 }}>
                {averageConfidence}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                avg confidence
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card slide-up" sx={{ animationDelay: '0.8s' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ErrorIcon sx={{ color: '#f56565', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Error Rate
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#2d3748', mb: 1 }}>
                {errorRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {errorInvoices} errors
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Invoice Type Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={6}>
          <Card className="dashboard-card slide-up" sx={{ animationDelay: '0.9s' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ReceiptIcon sx={{ color: '#48bb78', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Sales Invoices
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#48bb78', mb: 1 }}>
                {salesInvoices}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Company is the supplier
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={6}>
          <Card className="dashboard-card slide-up" sx={{ animationDelay: '1.0s' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShoppingCartIcon sx={{ color: '#667eea', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Purchase Invoices
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
                {purchaseInvoices}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Company is the buyer
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper className="chart-container slide-up" sx={{ animationDelay: '1.1s' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Monthly Processing Volume
              </Typography>
              <Tooltip title="Refresh data">
                <IconButton size="small" sx={{ color: '#718096' }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#718096"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#718096"
                  fontSize={12}
                />
                <RechartsTooltip 
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="processed" 
                  fill="#667eea"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="errors" 
                  fill="#f56565"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper className="chart-container slide-up" sx={{ animationDelay: '1.2s' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Processing Status
              </Typography>
              <Tooltip title="Refresh data">
                <IconButton size="small" sx={{ color: '#718096' }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Detailed Analytics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper className="chart-container slide-up" sx={{ animationDelay: '1.3s' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              File Type Distribution
            </Typography>
            <List>
              {fileTypeStats.distribution.map((type, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <FileIcon sx={{ color: '#667eea' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={type.name}
                    secondary={`${type.count} files (${type.percentage}%)`}
                  />
                  <Chip 
                    label={`${type.percentage}%`}
                    size="small"
                    color="primary"
                    className="status-chip"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper className="chart-container slide-up" sx={{ animationDelay: '1.4s' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Top Vendors
            </Typography>
            <List>
              {vendorStats.topVendors.slice(0, 5).map((vendor, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <BusinessIcon sx={{ color: '#48bb78' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={vendor.name}
                    secondary={`${vendor.count} invoices • $${vendor.totalAmount.toLocaleString()}`}
                  />
                  <Chip 
                    label={vendor.count}
                    size="small"
                    color="success"
                    className="status-chip"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Paper className="chart-container slide-up" sx={{ animationDelay: '1.5s' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Recent Activity
            </Typography>
            {recentActivity.some(activity => activity.isRecent) && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#48bb78',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 1 }
                  }
                }}
              />
            )}
          </Box>
          <Tooltip title="View all activities">
            <IconButton size="small" sx={{ color: '#718096' }}>
              <MoreIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 2,
                  borderRadius: '12px',
                  background: activity.isRecent 
                    ? 'linear-gradient(135deg, rgba(72, 187, 120, 0.1) 0%, rgba(255, 255, 255, 0.8) 100%)'
                    : 'rgba(255, 255, 255, 0.5)',
                  border: activity.isRecent 
                    ? '2px solid rgba(72, 187, 120, 0.3)'
                    : '1px solid #e2e8f0',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.8)',
                    transform: 'translateX(4px)'
                  },
                  ...(activity.isRecent && {
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      background: '#48bb78',
                      borderRadius: '2px 0 0 2px'
                    }
                  })
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: '8px',
                      background: activity.status === 'success' ? '#48bb78' :
                                activity.status === 'error' ? '#f56565' :
                                activity.status === 'warning' ? '#ed8936' : '#4299e1',
                      mr: 2
                    }}
                  >
                    {activity.icon}
                  </Box>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {activity.action}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {activity.file}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#48bb78' }}>
                    ${activity.amount.toFixed(2)}
                  </Typography>
                  <Chip 
                    label={`${activity.confidence}%`}
                    size="small" 
                    color={activity.confidence > 80 ? 'success' : activity.confidence > 60 ? 'warning' : 'error'}
                    className="status-chip"
                    title="Confidence Score"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {activity.time}
                  </Typography>
                  {activity.isRecent && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#48bb78',
                        animation: 'pulse 1s infinite'
                      }}
                    />
                  )}
                </Box>
              </Box>
            ))
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <UploadIcon sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                No Recent Activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload your first invoice to see activity here
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

// Helper functions
function generateMonthlyData(invoices) {
  try {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    // Group invoices by month
    const monthlyStats = {};
    (invoices || []).forEach(invoice => {
      try {
        const date = new Date(invoice?.createdAt || invoice?.uploadedAt || invoice?.invoiceDate || Date.now());
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        const key = `${month} ${year}`;
        
        if (!monthlyStats[key]) {
          monthlyStats[key] = { processed: 0, errors: 0 };
        }
        
        if (invoice?.status === 'Error' || invoice?.status === 'error' || invoice?.status === 'Failed') {
          monthlyStats[key].errors++;
        } else {
          monthlyStats[key].processed++;
        }
      } catch (err) {
        console.warn('Error processing invoice for monthly data:', err);
      }
    });
    
    // Generate last 6 months data
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const key = `${month} ${year}`;
      
      result.push({
        month: month,
        processed: monthlyStats[key]?.processed || 0,
        errors: monthlyStats[key]?.errors || 0
      });
    }
    
    return result;
  } catch (err) {
    console.error('Error generating monthly data:', err);
    return [];
  }
}

function generateStatusDistribution(invoices) {
  try {
    const total = (invoices || []).length;
    if (total === 0) {
      return [
        { name: 'Processed', value: 0, color: '#48bb78' },
        { name: 'Pending', value: 0, color: '#ed8936' },
        { name: 'Error', value: 0, color: '#f56565' }
      ];
    }
    
    const processed = (invoices || []).filter(inv => 
      inv?.status === 'Processed' || inv?.status === 'processed' || inv?.status === 'Completed'
    ).length;
    const pending = (invoices || []).filter(inv => 
      inv?.status === 'Pending Review' || inv?.status === 'pending' || inv?.status === 'Processing'
    ).length;
    const errors = (invoices || []).filter(inv => 
      inv?.status === 'Error' || inv?.status === 'error' || inv?.status === 'Failed'
    ).length;
    
    return [
      { name: 'Processed', value: Math.round((processed / total) * 100), color: '#48bb78' },
      { name: 'Pending', value: Math.round((pending / total) * 100), color: '#ed8936' },
      { name: 'Error', value: Math.round((errors / total) * 100), color: '#f56565' }
    ];
  } catch (err) {
    console.error('Error generating status distribution:', err);
    return [
      { name: 'Processed', value: 0, color: '#48bb78' },
      { name: 'Pending', value: 0, color: '#ed8936' },
      { name: 'Error', value: 0, color: '#f56565' }
    ];
  }
}

function getFileTypeStats(files) {
  const fileTypes = {};
  files.forEach(file => {
    const type = file.fileType || file.mimeType?.split('/')[1]?.toUpperCase() || 'Unknown';
    fileTypes[type] = (fileTypes[type] || 0) + 1;
  });
  
  const total = files.length;
  const distribution = Object.entries(fileTypes).map(([type, count]) => ({
    name: type,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0
  })).sort((a, b) => b.count - a.count);
  
  return {
    totalTypes: Object.keys(fileTypes).length,
    mostCommon: distribution[0]?.name || 'N/A',
    distribution
  };
}

function getVendorStats(invoices) {
  const vendors = {};
  invoices.forEach(invoice => {
    const vendor = invoice.vendorName || invoice.vendor?.name || 'Unknown Vendor';
    if (!vendors[vendor]) {
      vendors[vendor] = { count: 0, totalAmount: 0 };
    }
    vendors[vendor].count++;
    vendors[vendor].totalAmount += parseFloat(invoice.totalAmount) || 0;
  });
  
  const topVendors = Object.entries(vendors).map(([name, data]) => ({
    name,
    count: data.count,
    totalAmount: data.totalAmount
  })).sort((a, b) => b.count - a.count);
  
  return {
    topVendor: topVendors[0]?.name || 'N/A',
    topVendorCount: topVendors[0]?.count || 0,
    topVendors
  };
}

function getProcessingStats(files) {
  // Calculate processing time based on file type and status
  const avgTime = files.length > 0 
    ? Math.round(files.reduce((sum, file) => {
        const baseTime = file.fileType === 'PDF' || file.mimeType?.includes('pdf') ? 3 : 5; // PDF faster than images
        const statusFactor = file.status === 'processed' ? 0.5 : file.status === 'error' ? 2 : 1; // Error takes longer
        return sum + (baseTime * statusFactor);
      }, 0) / files.length)
    : 0;
  
  return { avgTime };
}

function getTimeAgo(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  } catch (err) {
    console.warn('Error calculating time ago:', err);
    return 'Unknown';
  }
} 