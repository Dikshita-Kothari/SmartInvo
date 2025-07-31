import React, { useState } from 'react';
import {
  Box,
  CssBaseline,
  Drawer,
  Toolbar,
  AppBar,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Upload as UploadIcon,
  Receipt as InvoiceIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['user', 'manager', 'admin'] },
  { text: 'Upload Files', icon: <UploadIcon />, path: '/upload', roles: ['user', 'manager', 'admin'] },
  { text: 'Invoices', icon: <InvoiceIcon />, path: '/invoices', roles: ['user', 'manager', 'admin'] },
  { text: 'User Management', icon: <PeopleIcon />, path: '/admin/users', roles: ['admin'] },
  { text: 'System Settings', icon: <SettingsIcon />, path: '/admin/settings', roles: ['admin'] }
];

export default function MainLayout({ children, user, onLogout }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    onLogout();
  };

  const handleNavigation = (path) => {
    try {
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      window.location.href = path;
    }
  };

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || 'user')
  );

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'manager': return 'warning';
      case 'user': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ display: 'flex' }} className="main-layout">
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar position="fixed" sx={{ zIndex: 1201 }} className="app-bar">
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            SmartInvo
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={user?.role || 'user'} 
              size="small" 
              color={getRoleColor(user?.role)}
              className="status-chip"
              sx={{ 
                fontWeight: 600,
                '& .MuiChip-label': { px: 2 }
              }}
            />
            
            <IconButton 
              color="inherit" 
              onClick={handleMenuOpen}
              sx={{ 
                '&:hover': { transform: 'scale(1.1)' }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                <PersonIcon sx={{ fontSize: '1.2rem', fontWeight: 'bold' }} />
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, #2d3748 0%, #1a202c 100%)',
            color: '#e2e8f0',
            borderRight: 'none',
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflowX: 'hidden',
            overflowY: 'auto'
          },
        }}
        className="sidebar"
      >
        <Toolbar />
        <Box sx={{ 
          overflow: 'hidden',
          mt: 2,
          px: 1,
          height: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <List sx={{ 
            width: '100%',
            overflow: 'hidden',
            flex: 1
          }}>
            {filteredMenuItems.map((item, index) => (
              <ListItem 
                button 
                key={`${item.text}-${index}`}
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  margin: '8px 8px',
                  borderRadius: '12px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  width: 'calc(100% - 16px)',
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                    borderLeft: '4px solid #667eea',
                    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
                  },
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateX(4px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  color: '#a0aec0',
                  transition: 'color 0.3s ease',
                  minWidth: 40
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      transition: 'color 0.3s ease',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
          padding: '32px',
          overflowY: 'auto',
          position: 'relative'
        }}
        className="main-content"
      >
        <Toolbar />
        <Box className="fade-in">
          {children}
        </Box>
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          className: 'dialog-paper',
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <MenuItem sx={{ py: 2 }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {user?.name || user?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: '#e53e3e' }}>
          <ListItemIcon sx={{ color: '#e53e3e' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
} 