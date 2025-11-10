# NICL Letter Generator

A web application for generating life insurance proposal letters for National Insurance Company (NICL).

## Features

- **Secure Authentication**
  - Email/Password login
  - OTP-based login via Brevo API
  - JWT token-based session management

- **Two Letter Formats**
  - Format 1: Life Insurance with Options (detailed with multiple options)
  - Format 2: Decreasing Term Assurance (simplified format)

- **PDF Generation**
  - Professional letter formatting
  - Company logo and signature integration
  - Downloadable PDF output

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **PDF Generation**: Puppeteer
- **Email Service**: Brevo API
- **Authentication**: JWT

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

## Configuration

The backend `.env` file is already configured with:
- Brevo API key
- JWT secret
- Port settings

If you need to modify settings, edit `backend/.env`

## Running the Application

### 1. Start Backend Server

```bash
cd backend
npm run dev
```

Backend will run on http://localhost:5000

### 2. Start Frontend Development Server

```bash
cd frontend
npm run dev
```

Frontend will run on http://localhost:5173

## Authorized Users

Only the following email addresses can access the system:

- vikas.khanna@zwennpay.com
- ameetoo@nicl.mu
- bsobran@nicl.mu

**Password**: NICL@2025

## Usage

1. **Login**
   - Choose between Password or OTP login
   - Enter your authorized email
   - For password login: enter NICL@2025
   - For OTP login: request OTP and check your email

2. **Select Letter Format**
   - Choose Format 1 (with options) or Format 2 (simplified)

3. **Fill Form**
   - Enter customer details
   - Enter policy information
   - Review signature details

4. **Generate PDF**
   - Click "Generate PDF" button
   - PDF will be automatically downloaded

## Project Structure

```
.
├── backend/
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   └── pdf.js           # PDF generation routes
│   ├── services/
│   │   ├── brevoService.js  # Email/OTP service
│   │   └── pdfService.js    # PDF generation service
│   ├── .env                 # Environment variables
│   ├── server.js            # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── LetterForm.jsx
│   │   ├── services/
│   │   │   └── api.js       # API client
│   │   ├── App.jsx
│   │   └── App.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── fonts/                   # Cambria and Tinos fonts
├── NICLOGO.jpg             # Company logo
├── signature1.png          # Signature for Format 1
├── signature2.png          # Signature for Format 2
└── README.md
```

## Building for Production

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## Security Notes

- JWT tokens expire after 24 hours
- OTPs expire after 10 minutes
- Brevo API key is stored in .env (not committed to git)
- Only authorized email addresses can access the system

## Support

For issues or questions, contact the development team.
