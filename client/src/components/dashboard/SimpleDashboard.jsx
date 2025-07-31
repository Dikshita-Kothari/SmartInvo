import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import api from '../../services/api';

export default function SimpleDashboard({ userRole }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('SimpleDashboard: Fetching data...');
      
      const result = await api.getAnalytics();
      console.log('SimpleDashboard: Data received:', result);
      
      setData(result);
    } catch (err) {
      console.error('SimpleDashboard: Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
            onClick={fetchData}
            startIcon={<RefreshIcon />}
          >
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Simple Dashboard
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Analytics Data
          </Typography>
          <Typography variant="body1">
            Total Invoices: {data?.totalInvoices || 0}
          </Typography>
          <Typography variant="body1">
            Processed Today: {data?.processedToday || 0}
          </Typography>
          <Typography variant="body1">
            Accuracy Rate: {data?.accuracyRate || 0}%
          </Typography>
        </CardContent>
      </Card>

      <Button 
        variant="contained" 
        onClick={fetchData}
        startIcon={<RefreshIcon />}
      >
        Refresh Data
      </Button>
    </Box>
  );
} 