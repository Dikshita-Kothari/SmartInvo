import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Avatar,
  Badge
} from '@mui/material';
import {
  People as PeopleIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Shield as ShieldIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

// Mock data for admin panel
const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2024-01-15T10:30:00Z',
    invoicesProcessed: 45,
    joinDate: '2023-06-15'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    role: 'manager',
    status: 'active',
    lastLogin: '2024-01-14T15:20:00Z',
    invoicesProcessed: 32,
    joinDate: '2023-08-20'
  },
  {
    id: 3,
    name: 'Bob Wilson',
    email: 'bob.wilson@company.com',
    role: 'user',
    status: 'inactive',
    lastLogin: '2024-01-10T09:15:00Z',
    invoicesProcessed: 18,
    joinDate: '2023-09-10'
  },
  {
    id: 4,
    name: 'Alice Johnson',
    email: 'alice.johnson@company.com',
    role: 'user',
    status: 'active',
    lastLogin: '2024-01-15T14:45:00Z',
    invoicesProcessed: 28,
    joinDate: '2023-07-05'
  }
];

const mockSystemStats = {
  totalUsers: 156,
  activeUsers: 142,
  totalInvoices: 1247,
  systemUptime: '99.8%',
  storageUsed: '2.4 GB',
  storageTotal: '10 GB',
  avgProcessingTime: '3.2s',
  errorRate: '2.1%',
  monthlyGrowth: '+15%'
};

export default function AdminPanel({ userRole }) {
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState(mockUsers);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [systemSettings, setSystemSettings] = useState({
    autoProcessing: true,
    emailNotifications: true,
    dataRetention: 90,
    maxFileSize: 10,
    ocrEnabled: true,
    backupEnabled: true
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleUserAction = (action, user) => {
    setSelectedUser(user);
    setUserDialogOpen(true);
  };

  const handleUserUpdate = (updatedUser) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setUserDialogOpen(false);
  };

  const handleUserDelete = (userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    setUserDialogOpen(false);
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'error';
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'manager': return 'warning';
      case 'user': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    return status === 'active' ? <ActiveIcon /> : <BlockIcon />;
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Admin Panel
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
          System administration and user management
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }} className="dashboard-card">
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              fontSize: '1rem'
            }
          }}
        >
          <Tab icon={<PeopleIcon />} label="User Management" />
          <Tab icon={<AnalyticsIcon />} label="System Analytics" />
          <Tab icon={<SettingsIcon />} label="Settings" />
          <Tab icon={<SecurityIcon />} label="Security" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <UserManagement 
          users={users}
          onUserAction={handleUserAction}
          onUserUpdate={handleUserUpdate}
          onUserDelete={handleUserDelete}
        />
      )}

      {activeTab === 1 && (
        <SystemAnalytics systemStats={mockSystemStats} />
      )}

      {activeTab === 2 && (
        <SystemSettings 
          settings={systemSettings}
          onSettingsChange={setSystemSettings}
        />
      )}

      {activeTab === 3 && (
        <SecuritySettings />
      )}

      {/* User Dialog */}
      <UserDialog
        open={userDialogOpen}
        user={selectedUser}
        onClose={() => setUserDialogOpen(false)}
        onUpdate={handleUserUpdate}
        onDelete={handleUserDelete}
      />
    </Box>
  );
}

// User Management Component
function UserManagement({ users, onUserAction, onUserUpdate, onUserDelete }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          className="action-button"
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
            }
          }}
        >
          Add User
        </Button>
      </Box>

      <Paper className="dashboard-card">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Login</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Invoices</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: '#667eea' }}>
                        {user.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {user.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role} 
                      color={getRoleColor(user.role)}
                      size="small"
                      className="status-chip"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      icon={getStatusIcon(user.status)}
                      label={user.status} 
                      color={getStatusColor(user.status)}
                      size="small"
                      className="status-chip"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {user.invoicesProcessed}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => onUserAction('view', user)}
                        sx={{ color: '#667eea' }}
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => onUserAction('edit', user)}
                        sx={{ color: '#ed8936' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => onUserAction('delete', user)}
                        sx={{ color: '#f56565' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

// System Analytics Component
function SystemAnalytics({ systemStats }) {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        System Analytics
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ color: '#667eea', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Total Users
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#667eea' }}>
                {systemStats.totalUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {systemStats.activeUsers} active
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon sx={{ color: '#48bb78', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Storage
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#48bb78' }}>
                {systemStats.storageUsed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                of {systemStats.storageTotal} used
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon sx={{ color: '#ed8936', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Avg Processing
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#ed8936' }}>
                {systemStats.avgProcessingTime}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                per invoice
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingIcon sx={{ color: '#4299e1', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Uptime
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#4299e1' }}>
                {systemStats.systemUptime}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                system availability
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper className="chart-container">
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              System Performance
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <TrendingIcon sx={{ color: '#48bb78' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Monthly Growth"
                  secondary={systemStats.monthlyGrowth}
                />
                <Chip label="Good" color="success" size="small" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <WarningIcon sx={{ color: '#ed8936' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Error Rate"
                  secondary={systemStats.errorRate}
                />
                <Chip label="Low" color="warning" size="small" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <StorageIcon sx={{ color: '#4299e1' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Storage Usage"
                  secondary={`${systemStats.storageUsed} / ${systemStats.storageTotal}`}
                />
                <Chip label="24%" color="info" size="small" />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper className="chart-container">
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Recent Activity
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon sx={{ color: '#48bb78' }} />
                </ListItemIcon>
                <ListItemText
                  primary="System backup completed"
                  secondary="2 hours ago"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PeopleIcon sx={{ color: '#667eea' }} />
                </ListItemIcon>
                <ListItemText
                  primary="New user registered"
                  secondary="4 hours ago"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <WarningIcon sx={{ color: '#ed8936' }} />
                </ListItemIcon>
                <ListItemText
                  primary="High processing load detected"
                  secondary="6 hours ago"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// System Settings Component
function SystemSettings({ settings, onSettingsChange }) {
  const handleSettingChange = (setting, value) => {
    onSettingsChange({
      ...settings,
      [setting]: value
    });
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        System Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper className="chart-container">
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Processing Settings
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Auto Processing"
                  secondary="Automatically process uploaded invoices"
                />
                <Switch
                  checked={settings.autoProcessing}
                  onChange={(e) => handleSettingChange('autoProcessing', e.target.checked)}
                  color="primary"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="OCR Processing"
                  secondary="Enable OCR for image files"
                />
                <Switch
                  checked={settings.ocrEnabled}
                  onChange={(e) => handleSettingChange('ocrEnabled', e.target.checked)}
                  color="primary"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Email Notifications"
                  secondary="Send email notifications for processing"
                />
                <Switch
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  color="primary"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Auto Backup"
                  secondary="Automatically backup processed data"
                />
                <Switch
                  checked={settings.backupEnabled}
                  onChange={(e) => handleSettingChange('backupEnabled', e.target.checked)}
                  color="primary"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper className="chart-container">
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Configuration
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Data Retention (days)"
                type="number"
                value={settings.dataRetention}
                onChange={(e) => handleSettingChange('dataRetention', parseInt(e.target.value))}
                className="form-field"
              />
              <TextField
                fullWidth
                label="Max File Size (MB)"
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                className="form-field"
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// Security Settings Component
function SecuritySettings() {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Security Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper className="chart-container">
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Authentication
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <ShieldIcon sx={{ color: '#667eea' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Two-Factor Authentication"
                  secondary="Enable 2FA for all users"
                />
                <Switch color="primary" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon sx={{ color: '#48bb78' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Password Policy"
                  secondary="Strong password requirements"
                />
                <Switch color="primary" defaultChecked />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon sx={{ color: '#ed8936' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Login Notifications"
                  secondary="Notify on suspicious login"
                />
                <Switch color="primary" defaultChecked />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper className="chart-container">
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Access Control
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Current Session:</strong> Admin panel accessed from 192.168.1.100
              </Typography>
            </Alert>
            <List>
              <ListItem>
                <ListItemText
                  primary="Session Timeout"
                  secondary="30 minutes"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Failed Login Attempts"
                  secondary="3 attempts before lockout"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="IP Whitelist"
                  secondary="No restrictions"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// User Dialog Component
function UserDialog({ open, user, onClose, onUpdate, onDelete }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    status: 'active'
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      });
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({ ...user, ...formData });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {user ? 'Edit User' : 'Add User'}
        </Typography>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
            className="form-field"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
            required
            className="form-field"
          />
          <TextField
            fullWidth
            select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            margin="normal"
            required
            className="form-field"
          >
            <option value="user">User</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </TextField>
          <TextField
            fullWidth
            select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            margin="normal"
            required
            className="form-field"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          {user && (
            <Button 
              onClick={() => onDelete(user.id)} 
              color="error"
              className="action-button"
            >
              Delete
            </Button>
          )}
          <Button onClick={onClose} className="action-button">
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            className="action-button"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
              }
            }}
          >
            {user ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 