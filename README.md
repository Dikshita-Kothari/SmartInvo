# 🧾 SmartInvo – AI-Powered Invoice Management System

SmartInvo is a modern full-stack web application that streamlines invoice management using AI. With OCR-powered invoice parsing, automatic data extraction, and a user-friendly interface, SmartInvo simplifies and enhances the invoicing process for businesses of all sizes.

---

## 🚀 Features

- 🤖 AI-powered Invoice Parsing using Tesseract OCR & LayoutLM
- 📥 Drag & Drop and Bulk Upload support for JPG, PNG, PDF
- 🔎 Intelligent Data Extraction via OCR & NLP
- 🧾 Side-by-side Preview of Original & Parsed Invoice
- 🔐 Secure Login with Bcrypt Encryption
- 🛠️ RESTful API with ERP/Accounting Tool Integration
- 🧑‍💼 Admin Panel for User/Role Management & Extraction Logs

---

## 🧠 Tech Stack

- **Frontend**: React (v18.x)
- **Backend**: Node.js (v18.x), Express.js
- **Database**: MongoDB (v5.x) with MongoDB Atlas
- **AI/ML**: Tesseract OCR, LayoutLM
- **Cloud Provider**: Cloudinary

---

## 🧾 MongoDB Collections

### Users Collection
```json
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "user" | "admin" | "manager",
  createdBy: ObjectId,
  createdAt: Date
}
````

### Invoice Collection

```json
{
  uploadedBy: ObjectId,
  invoiceType: "sales" | "purchase",
  fileUrl: String,
  invoiceNumber: String,
  vendor: { name, address, contact },
  buyer: { name, address },
  lineItems: [{ description, quantity, unitPrice, lineTotal }],
  parsedFields: [String],
  correctedFields: [String],
  confidenceScore: Number,
  isVerified: Boolean,
  createdAt: Date
}
```

### File Collection

```json
{
  uploadedBy: ObjectId,
  fileUrl: String,
  fileType: "pdf" | "jpg" | "docx" | "zip",
  status: "uploaded" | "parsing" | "parsed" | "error",
  errorLog: String,
  pageCount: Number,
  uploadedAt: Date
}
```

---

## 📂 Folder Structure

```
invoice-parser/
├── client/                  # React frontend
│   ├── components/
│   ├── pages/
│   ├── services/            # API calls
│   └── App.jsx
├── server/                  # Node/Express backend
│   ├── routes/
│   ├── controllers/
│   ├── services/            # OCR, LayoutLM utils
│   └── server.js
├── models/                  # Invoice, User schema
└── README.md
```

---

## 🛠️ Setup Instructions

### Backend Setup

```bash
git clone https://github.com/your-username/smartinvo.git
cd smartinvo/server
npm install
```

Create a `.env` file in `server/` and add:

```
MONGO_URI=<your_mongodb_uri>
PORT=5000
```

Start the backend server:

```bash
npm start
```

---

### Frontend Setup

```bash
cd ../client
npm install
```

Create `.env` in `client/` and add:

```
REACT_APP_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm start
```

---

## 🌐 Deployment

* **Domain**: `localhost` (can be hosted via Vercel/Netlify for frontend & Render for backend)
* **Cloud Storage**: Cloudinary
* **Database**: MongoDB Atlas

---

## 👨‍💻 Demo Access

* **Email**: [abc@gmail.in](mailto:abc@gmail.in)
* **Password**: 123456789

---

## 👥 Team Code Vessels

* **Dikshita Kothari** (Team Leader)
* Harmik Rathod
* Harsh Vekariya
* Vidhya Mehta
* Afsana Ghada
* Heet Thumar

---

## 📸 Screenshots / Demo

<!-- Add screenshots or demo video links here if available -->

---

## 📄 Summary

SmartInvo is an intelligent and scalable invoice automation platform built with modern web technologies and AI. This README provides setup guidance and technical insight for contributors, developers, and maintainers.


