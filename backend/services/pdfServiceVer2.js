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
    const qrBase64 = getBase64ImageDirect(qrImagePath);
    const maucasBase64 = getBase64Image('maucas2.jpeg');
    const zwennPayBase64 = getBase64Image('zwennPay.jpg');

    if (!qrBase64) {
      console.log('⚠️ Failed to convert QR image to base64');
      return '';
    }

    console.log('✅ QR section generated successfully');
    return `
    <div class="page-break"></div>
    <div class="qr-instruction">
      <p>For your convenience, you may <strong>settle payments instantly via the MauCAS QR Code (Scan to Pay)</strong> below using any mobile banking app such as Juice, MauBank WithMe, Blink, MyT Money, or other supported applications.</p>
    </div>
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

const QR_SECTION_CSS = `
    .page-break {
      page-break-before: always;
    }
    .qr-instruction {
      margin: 20px 0 15px 0;
    }
    .qr-instruction p {
      margin: 0;
      font-size: 10pt;
      line-height: 1.3;
      color: #000;
      font-weight: bold;
      text-align: justify;
    }
    .qr-section {
      text-align: center;
      margin: 20px 0;
      padding: 10px 0;
    }
    .maucas-logo {
      max-width: 120px;
      height: auto;
      display: block;
      margin: 0 auto 10px auto;
    }
    .qr-code {
      width: 105px;
      height: 105px;
      display: block;
      margin: 10px auto;
    }
    .zwennpay-logo {
      max-width: 80px;
      height: auto;
      display: block;
      margin: 10px auto 0 auto;
    }
`;

const generateFormat1HTML = (data, qrImagePath) => {
  const logoBase64 = getBase64Image('NICLOGO.jpg');
  const signatureBase64 = getBase64Image(data.signatureFile || 'signature1.png');
  const qrSection = generateQRSection(qrImagePath);
  const ccLine = data.advisorName && data.advisorName.trim()
    ? `C.C Your Insurance Advisor, ${data.advisorName}, NIC Team`
    : 'C.C Your Insurance Advisor, NIC Team';

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
      margin-bottom: 5px;
      margin-top: 8px;
    }
    .date {
      margin-bottom: 10px;
    }
    .address {
      font-weight: bold;
      margin-bottom: 12px;
      line-height: 1.2;
    }
    .salutation {
      margin-bottom: 5px;
    }
    .subject {
      font-weight: bold;
      margin: 5px 0 10px 0;
    }
    .intro-text {
      margin: 10px 0;
      line-height: 1.3;
    }
    .policy-grid {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    .policy-grid th {
      border: 1px solid #000;
      padding: 5px 6px;
      text-align: center;
      font-weight: bold;
      background-color: #f5f5f5;
      font-size: 9pt;
    }
    .policy-grid td {
      border: 1px solid #000;
      padding: 5px 6px;
      text-align: center;
      font-size: 10pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    table, th, td {
      border: 1px solid #000;
    }
    th, td {
      padding: 5px 8px;
      text-align: left;
    }
    th {
      font-weight: bold;
      width: 28%;
    }
    ${QR_SECTION_CSS}
    .footer {
      margin-top: 20px;
    }
    .signature {
      margin-top: 15px;
    }
    .signature-image {
      max-width: 140px;
      margin: 8px 0;
    }
    .underline {
      text-decoration: underline;
    }
    .agreement {
      margin-top: 20px;
      border-top: 1px solid #000;
      padding-top: 8px;
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

  <p class="intro-text">${data.introText.replace('{applicationDate}', data.applicationDate).replace('{returnDate}', data.returnDate)}</p>

  <table class="policy-grid">
    <tr>
      <th>Policy No</th>
      <th>Type of Policy</th>
      <th>Sum Assured</th>
      <th>Term</th>
      <th>Date of<br>commencement</th>
    </tr>
    <tr>
      <td>${data.policyNo}</td>
      <td>${data.policyType}</td>
      <td>${data.sumAssured}</td>
      <td>${data.term}</td>
      <td>${data.commencementDate}</td>
    </tr>
  </table>

  <table>
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

  <p class="intro-text">${data.closingText.replace('{returnDate}', data.returnDate)}</p>

  <div class="footer">
    <p style="margin: 8px 0;">${data.assuringText}</p>
    
    <div class="signature">
      <img src="${signatureBase64}" class="signature-image" alt="Signature">
      <div><strong>${data.signerName}</strong></div>
      <div>${data.signerTitle}</div>
      <div><em>${ccLine}</em></div>
    </div>
  </div>

  <div class="agreement">
    <p style="margin: 5px 0 10px 0;">${data.agreementText}</p>
    <p style="margin: 5px 0;">Name: .................................................... Signature: .................................................... Date: ............................</p>
  </div>

  ${qrSection}

</body>
</html>
  `;
};

const generateFormat2HTML = (data, qrImagePath) => {
  const logoBase64 = getBase64Image('NICLOGO.jpg');
  const signatureBase64 = getBase64Image(data.signatureFile || 'signature2.png');
  const qrSection = generateQRSection(qrImagePath);
  const ccLine = data.advisorName && data.advisorName.trim()
    ? `C.C Your Insurance Advisor, ${data.advisorName}, NIC Team`
    : 'C.C Your Insurance Advisor, NIC Team';

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
      margin-bottom: 5px;
      margin-top: 8px;
    }
    .date {
      margin-bottom: 10px;
    }
    .address {
      font-weight: bold;
      margin-bottom: 12px;
      line-height: 1.2;
    }
    .salutation {
      margin-bottom: 5px;
    }
    .subject {
      font-weight: bold;
      margin: 5px 0 10px 0;
    }
    .intro-text {
      margin: 10px 0;
      line-height: 1.3;
    }
    .policy-grid {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    .policy-grid th {
      border: 1px solid #000;
      padding: 5px 6px;
      text-align: center;
      font-weight: bold;
      background-color: #f5f5f5;
      font-size: 9pt;
    }
    .policy-grid td {
      border: 1px solid #000;
      padding: 5px 6px;
      text-align: center;
      font-size: 10pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    table, th, td {
      border: 1px solid #000;
    }
    th, td {
      padding: 5px 8px;
      text-align: left;
    }
    th {
      font-weight: bold;
      width: 28%;
    }
    ${QR_SECTION_CSS}
    .footer {
      margin-top: 20px;
    }
    .signature {
      margin-top: 15px;
    }
    .signature-image {
      max-width: 140px;
      margin: 8px 0;
    }
    .underline {
      text-decoration: underline;
    }
    .agreement {
      margin-top: 20px;
      border-top: 1px solid #000;
      padding-top: 8px;
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

  <p class="intro-text">${data.introText.replace('{applicationDate}', data.applicationDate || '').replace('{returnDate}', data.returnDate)}</p>

  <table class="policy-grid">
    <tr>
      <th>Policy No</th>
      <th>Type of Policy</th>
      <th>Sum Assured</th>
      <th>Term</th>
    </tr>
    <tr>
      <td>${data.policyNo}</td>
      <td>${data.policyType}</td>
      <td>${data.sumAssured}</td>
      <td>${data.term}</td>
    </tr>
  </table>

  <table>
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

  <p class="intro-text">${data.closingText.replace('{returnDate}', data.returnDate)}</p>

  <div class="footer">
    <p style="margin: 8px 0;">${data.assuringText}</p>
    
    <p style="margin: 8px 0;"><strong>Yours sincerely</strong></p>
    
    <div class="signature">
      <img src="${signatureBase64}" class="signature-image" alt="Signature">
      <div><strong>${data.signerName}</strong></div>
      <div>${data.signerTitle}</div>
      <div><em>${ccLine}</em></div>
    </div>
  </div>

  <div class="agreement">
    <p style="margin: 5px 0 10px 0;">${data.agreementText}</p>
    <p style="margin: 5px 0;">Name: .................................................... Signature: .................................................... Date: ............................</p>
  </div>

  ${qrSection}

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
