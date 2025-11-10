import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { generateQRForPolicy, cleanupQRFile } from './zwennPayService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getBase64Image = (imagePath) => {
  try {
    const fullPath = path.join(__dirname, '../../', imagePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️ Warning: ${imagePath} not found`);
      return null;
    }
    const imageBuffer = fs.readFileSync(fullPath);
    return `data:image/${path.extname(imagePath).slice(1)};base64,${imageBuffer.toString('base64')}`;
  } catch (error) {
    console.error(`❌ Error loading image ${imagePath}:`, error.message);
    return null;
  }
};

const getBase64ImageDirect = (imagePath) => {
  try {
    if (!fs.existsSync(imagePath)) {
      console.log(`⚠️ Warning: ${imagePath} not found`);
      return null;
    }
    const imageBuffer = fs.readFileSync(imagePath);
    return `data:image/${path.extname(imagePath).slice(1)};base64,${imageBuffer.toString('base64')}`;
  } catch (error) {
    console.error(`❌ Error loading image ${imagePath}:`, error.message);
    return null;
  }
};

const generateQRSection = (qrImagePath) => {
  if (!qrImagePath || !fs.existsSync(qrImagePath)) {
    console.log('⚠️ QR image path invalid or file does not exist:', qrImagePath);
    return '';
  }

  try {
    // Use direct path for QR (already absolute)
    const qrBase64 = getBase64ImageDirect(qrImagePath);
    // Use relative path for logos
    const maucasBase64 = getBase64Image('maucas2.jpeg');
    const zwennPayBase64 = getBase64Image('zwennPay.jpg');

    if (!qrBase64) {
      console.log('⚠️ Failed to convert QR image to base64');
      return '';
    }

    console.log('✅ QR section generated successfully');
    return `
    <div class="qr-section">
      ${maucasBase64 ? `<img src="${maucasBase64}" class="maucas-logo" alt="MauCAS Logo">` : ''}
      <img src="${qrBase64}" class="qr-code" alt="QR Code">
      ${zwennPayBase64 ? `<img src="${zwennPayBase64}" class="zwennpay-logo" alt="ZwennPay Logo">` : ''}
    </div>
    `;
  } catch (error) {
    console.error('❌ Error generating QR section:', error.message);
    return '';
  }
};

const generateFormat1HTML = (data, qrImagePath) => {
  const logoBase64 = getBase64Image('NICLOGO.jpg');
  const signatureBase64 = getBase64Image(data.signatureFile || 'signature1.png');
  const qrSection = generateQRSection(qrImagePath);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      margin: 0.5in;
      size: A4;
    }
    body {
      font-family: 'Cambria', serif;
      font-size: 10pt;
      line-height: 1.3;
      color: #000;
      margin: 0;
      padding: 10px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 10px;
    }
    .logo {
      max-width: 140px;
      margin-bottom: 0px;
    }
    .ref {
      font-weight: bold;
      margin-bottom: 8px;
      margin-top: 10px;
    }
    .date {
      margin-bottom: 15px;
    }
    .address {
      font-weight: bold;
      margin-bottom: 20px;
    }
    .salutation {
      margin-bottom: 15px;
    }
    .subject {
      font-weight: bold;
      margin: 20px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    table, th, td {
      border: 1px solid #000;
    }
    th, td {
      padding: 8px;
      text-align: left;
    }
    th {
      font-weight: bold;
    }
    .qr-section {
      margin: 20px 0;
      padding: 10px 0;
    }
    .qr-top-row {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      margin-bottom: 10px;
    }
    .maucas-logo {
      max-width: 120px;
      height: auto;
    }
    .qr-code {
      width: 100px;
      height: 100px;
    }
    .qr-text {
      font-family: 'Cambria-Bold', 'Cambria', serif;
      font-size: 12pt;
      font-weight: bold;
      text-align: center;
      margin: 10px 0;
    }
    .qr-bottom {
      text-align: center;
    }
    .zwennpay-logo {
      max-width: 80px;
      height: auto;
      margin-top: 5px;
    }
    .footer {
      margin-top: 30px;
    }
    .signature {
      margin-top: 20px;
    }
    .signature-image {
      max-width: 150px;
      margin: 10px 0;
    }
    .underline {
      text-decoration: underline;
    }
    .agreement {
      margin-top: 30px;
      border-top: 1px solid #000;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoBase64}" class="logo" alt="NIC Logo">
  </div>

  <div class="ref">Ref: ${data.ref}</div>
  <div class="date">${data.date}</div>

  <div class="address">
    ${data.customerTitle.toUpperCase()} ${data.firstName.toUpperCase()} ${data.surname.toUpperCase()}<br>
    ${data.address1.toUpperCase()}<br>
    ${data.address2.toUpperCase()}<br>
    ${data.address3 ? data.address3.toUpperCase() : ''}
  </div>

  <div class="salutation">Dear ${data.customerTitle} ${data.surname},</div>

  <div class="subject">RE: PROPOSAL FOR LIFE INSURANCE: PN ${data.policyNo}</div>

  <p>${data.introText.replace('{applicationDate}', data.applicationDate).replace('{returnDate}', data.returnDate)}</p>

  <table>
    <tr>
      <th>Policy No</th>
      <td>${data.policyNo}</td>
    </tr>
    <tr>
      <th>Type of Policy</th>
      <td>${data.policyType}</td>
    </tr>
    <tr>
      <th>Sum Assured</th>
      <td>${data.sumAssured}</td>
    </tr>
    <tr>
      <th>Term</th>
      <td>${data.term}</td>
    </tr>
    <tr>
      <th>Date of commencement</th>
      <td>${data.commencementDate}</td>
    </tr>
    <tr>
      <th>Benefits covered</th>
      <td>${data.benefits}</td>
    </tr>
    <tr>
      <th>Monthly Premium</th>
      <td>${data.monthlyPremium}</td>
    </tr>
    <tr>
      <th>Remarks</th>
      <td>${data.remarks}</td>
    </tr>
    <tr>
      <th>Option 1</th>
      <td>${data.option1}</td>
    </tr>
    <tr>
      <th>Option 2</th>
      <td>${data.option2}</td>
    </tr>
  </table>

  ${qrSection}

  <p>${data.closingText.replace('{returnDate}', data.returnDate)}</p>

  <div class="footer">
    <p>${data.assuringText}</p>
    
    <div class="signature">
      <img src="${signatureBase64}" class="signature-image" alt="Signature">
      <div><strong>${data.signerName}</strong></div>
      <div>${data.signerTitle}</div>
      <div><em>${data.signerDetails}</em></div>
    </div>
  </div>

  <div class="agreement">
    <p>${data.agreementText}</p>
    <p>Name: .................................................... Signature: .................................................... Date: ............................</p>
  </div>
</body>
</html>
  `;
};

const generateFormat2HTML = (data, qrImagePath) => {
  const logoBase64 = getBase64Image('NICLOGO.jpg');
  const signatureBase64 = getBase64Image(data.signatureFile || 'signature2.png');
  const qrSection = generateQRSection(qrImagePath);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      margin: 0.5in;
      size: A4;
    }
    body {
      font-family: 'Cambria', serif;
      font-size: 10pt;
      line-height: 1.3;
      color: #000;
      margin: 0;
      padding: 10px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 10px;
    }
    .logo {
      max-width: 140px;
      margin-bottom: 0px;
    }
    .ref {
      font-weight: bold;
      margin-bottom: 8px;
      margin-top: 10px;
    }
    .date {
      margin-bottom: 15px;
    }
    .address {
      font-weight: bold;
      margin-bottom: 20px;
    }
    .salutation {
      margin-bottom: 15px;
    }
    .subject {
      font-weight: bold;
      margin: 20px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    table, th, td {
      border: 1px solid #000;
    }
    th, td {
      padding: 8px;
      text-align: left;
    }
    th {
      font-weight: bold;
    }
    .qr-section {
      margin: 20px 0;
      padding: 10px 0;
    }
    .qr-top-row {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      margin-bottom: 10px;
    }
    .maucas-logo {
      max-width: 120px;
      height: auto;
    }
    .qr-code {
      width: 100px;
      height: 100px;
    }
    .qr-text {
      font-family: 'Cambria-Bold', 'Cambria', serif;
      font-size: 12pt;
      font-weight: bold;
      text-align: center;
      margin: 10px 0;
    }
    .qr-bottom {
      text-align: center;
    }
    .zwennpay-logo {
      max-width: 80px;
      height: auto;
      margin-top: 5px;
    }
    .footer {
      margin-top: 30px;
    }
    .signature {
      margin-top: 20px;
    }
    .signature-image {
      max-width: 150px;
      margin: 10px 0;
    }
    .underline {
      text-decoration: underline;
    }
    .agreement {
      margin-top: 30px;
      border-top: 1px solid #000;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoBase64}" class="logo" alt="NIC Logo">
  </div>

  <div class="ref">Ref: ${data.ref}</div>
  <div class="date">${data.date}</div>

  <div class="address">
    ${data.customerTitle.toUpperCase()} ${data.firstName.toUpperCase()} ${data.surname.toUpperCase()}<br>
    ${data.address1.toUpperCase()}<br>
    ${data.address2.toUpperCase()}<br>
    ${data.address3 ? data.address3.toUpperCase() : ''}
  </div>

  <div class="salutation">Dear ${data.customerTitle} ${data.surname},</div>

  <div class="subject">RE: PROPOSAL FOR LIFE INSURANCE: PN ${data.policyNo}</div>

  <p>${data.introText.replace('{applicationDate}', data.applicationDate || '').replace('{returnDate}', data.returnDate)}</p>

  <table>
    <tr>
      <th>Policy No</th>
      <td>${data.policyNo}</td>
    </tr>
    <tr>
      <th>Type of Policy</th>
      <td>${data.policyType}</td>
    </tr>
    <tr>
      <th>Sum Assured</th>
      <td>${data.sumAssured}</td>
    </tr>
    <tr>
      <th>Term</th>
      <td>${data.term}</td>
    </tr>
    <tr>
      <th>Benefits covered</th>
      <td>${data.benefits}</td>
    </tr>
    <tr>
      <th>Revised Monthly Premium</th>
      <td>${data.revisedPremium}</td>
    </tr>
    <tr>
      <th>Remarks</th>
      <td>${data.remarks}</td>
    </tr>
  </table>

  ${qrSection}

  <p>${data.closingText.replace('{returnDate}', data.returnDate)}</p>

  <div class="footer">
    <p>${data.assuringText}</p>
    
    <p><strong>Yours sincerely</strong></p>
    
    <div class="signature">
      <img src="${signatureBase64}" class="signature-image" alt="Signature">
      <div><strong>${data.signerName}</strong></div>
      <div>${data.signerTitle}</div>
      <div><em>${data.signerDetails}</em></div>
    </div>
  </div>

  <div class="agreement">
    <p>${data.agreementText}</p>
    <p>Name: .................................................... Signature: .................................................... Date: ............................</p>
  </div>
</body>
</html>
  `;
};

export const generatePDF = async (letterType, data) => {
  let qrImagePath = null;
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Step 1: Generate QR code
    console.log('📱 Generating QR code for policy:', data.policyNo);
    qrImagePath = await generateQRForPolicy(data.policyNo, data.firstName, data.surname);
    
    if (qrImagePath) {
      console.log('✅ QR code generated successfully');
    } else {
      console.log('⚠️ QR code generation skipped - continuing without QR');
    }

    // Step 2: Generate HTML with QR section
    const page = await browser.newPage();
    
    const html = letterType === 'format1' 
      ? generateFormat1HTML(data, qrImagePath) 
      : generateFormat2HTML(data, qrImagePath);

    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Step 3: Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    });

    return pdfBuffer;
  } finally {
    // Step 4: Cleanup
    await browser.close();
    
    // Clean up temporary QR image
    if (qrImagePath) {
      cleanupQRFile(qrImagePath);
    }
  }
};
