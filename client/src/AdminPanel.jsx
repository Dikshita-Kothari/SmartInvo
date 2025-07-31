import React, { useState } from 'react';
import { Box, CssBaseline, Drawer, Toolbar, AppBar, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import TableChartIcon from '@mui/icons-material/TableChart';
import FileUpload from './FileUpload';
import InvoiceTable from './InvoiceTable';

const drawerWidth = 220;

function mockProcessInvoices(files) {
  // Simulate invoice processing: assign name, date, status
  return files.map((file) => ({
    name: file.name,
    date: new Date().toLocaleDateString(),
    status: 'Processed',
  }));
}

export default function AdminPanel() {
  const [invoices, setInvoices] = useState([]);

  const handleFilesSelected = (files) => {
    const processed = mockProcessInvoices(files);
    setInvoices(processed);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: 1201 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Admin Panel
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem button selected>
              <ListItemIcon>
                <UploadFileIcon />
              </ListItemIcon>
              <ListItemText primary="File Upload" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <TableChartIcon />
              </ListItemIcon>
              <ListItemText primary="Invoices" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}>
        <Toolbar />
        <Typography variant="h5" gutterBottom>
          File Upload (Drag & Drop)
        </Typography>
        <div style={{ marginBottom: 32 }}>
          <FileUpload onFilesSelected={handleFilesSelected} />
        </div>
        <Typography variant="h5" gutterBottom>
          Invoices
        </Typography>
        <InvoiceTable invoices={invoices} />
      </Box>
    </Box>
  );
} 