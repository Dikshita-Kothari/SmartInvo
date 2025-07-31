# Invoice Processing System

A comprehensive AI-powered invoice processing system with role-based access control, advanced file upload capabilities, and detailed analytics.

## Features

### 🔐 Authentication & User Management
- **Multi-role authentication**: User, Manager, Admin roles
- **Google SSO integration** (mock implementation)
- **Role-based access control** with different permissions per role
- **User management** for admins

### 📁 File Upload & Processing
- **Drag & drop interface** for multiple file uploads
- **Supported formats**: PDF, PNG, JPG
- **File validation** with size and type restrictions
- **Real-time processing feedback** with progress indicators
- **Confidence scoring** for extracted data
- **Bulk upload support**

### 📊 Invoice Data Extraction
- **Core fields extracted**:
  - Invoice Number, Date, Due Date
  - Vendor/Buyer information
  - Total amounts and currency
  - Tax/VAT details
  - Line items with descriptions
- **OCR processing** simulation
- **Multi-template parsing** support
- **Confidence scoring** per field

### 📈 Analytics & Dashboard
- **Comprehensive dashboard** with key metrics
- **Processing statistics** and trends
- **Monthly volume charts**
- **Status distribution** visualization
- **Recent activity tracking**

### 🎛️ Admin Panel
- **User management** with role assignment
- **System analytics** and performance metrics
- **Configuration settings** for processing rules
- **API rate limiting** controls
- **Email notification** settings

### 📋 Invoice Management
- **Advanced data grid** with sorting and filtering
- **Search functionality** across all fields
- **Export capabilities** (CSV, Excel, JSON)
- **Detailed invoice view** with extracted data
- **Status tracking** (Processed, Pending, Error)

## Technology Stack

### Frontend
- **React 18** with functional components and hooks
- **Material-UI 5** for modern, responsive UI
- **React Router** for navigation
- **Recharts** for data visualization
- **React Dropzone** for file uploads
- **Axios** for API communication

### Backend (Mock Implementation)
- **Mock API service** with realistic delays
- **Data persistence** in memory
- **Authentication simulation**
- **File processing simulation**

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd smartinvo
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

4. **Open your browser**
Navigate to `http://localhost:5173`

### Login Credentials

For testing different user roles:

- **Admin**: `admin@company.com` / any password
- **Manager**: `manager@company.com` / any password  
- **User**: any other email / any password

## Usage Guide

### For Users
1. **Login** with your credentials
2. **Upload files** via drag & drop or file picker
3. **Monitor processing** with real-time progress
4. **Review extracted data** in the invoices section
5. **Export data** as needed

### For Admins
1. **Access admin panel** from sidebar
2. **Manage users** and assign roles
3. **Configure system settings**
4. **Monitor analytics** and performance
5. **Set processing rules** and limits

## File Processing Workflow

1. **Upload**: Drag & drop or select files
2. **Validation**: Check file type and size
3. **OCR Processing**: Extract text from images/PDFs
4. **Data Extraction**: Parse invoice fields
5. **Confidence Scoring**: Rate extraction accuracy
6. **Review**: Manual correction if needed
7. **Storage**: Save processed data

## API Endpoints (Mock)

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Invoices
- `GET /api/invoices` - List all invoices
- `POST /api/invoices/upload` - Upload new invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

### Users (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Analytics
- `GET /api/analytics` - Get system analytics
- `GET /api/settings` - Get system settings
- `PUT /api/settings` - Update system settings

## Role Permissions

### User
- ✅ Upload files
- ✅ View own invoices
- ✅ Export own data
- ❌ Manage other users
- ❌ Access admin panel

### Manager
- ✅ All user permissions
- ✅ View all invoices
- ✅ Edit invoice data
- ✅ Export all data
- ❌ Manage users
- ❌ System settings

### Admin
- ✅ All manager permissions
- ✅ User management
- ✅ System configuration
- ✅ Analytics access
- ✅ API rate limiting

## Customization

### Adding New File Types
Update the `acceptedFileTypes` object in `AdvancedFileUpload.jsx`:

```javascript
const acceptedFileTypes = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
};
```

### Modifying Extraction Fields
Update the `generateMockExtractedData` function to include new fields:

```javascript
const generateMockExtractedData = (fileName) => ({
  // ... existing fields
  newField: 'extracted value'
});
```

### Styling Customization
Modify `src/App.css` for custom styling or update the Material-UI theme in `App.jsx`.

## Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables
Create `.env` file for production settings:
```
VITE_API_BASE_URL=https://your-api-domain.com
VITE_APP_NAME=SmartInvo
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
