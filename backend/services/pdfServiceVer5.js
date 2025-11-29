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
    <div class="qr-section-topright">
      ${maucasBase64 ? `<img src="${maucasBase64}" class="maucas-logo-small" alt="MauCAS Logo">` : ''}
      <img src="${qrBase64}" class="qr-code-small" alt="QR Code">
      ${zwennPayBase64 ? `<img src="${zwennPayBase64}" class="zwennpay-logo-small" alt="ZwennPay Logo">` : ''}
    </div>
    `;
  } catch (error) {
    console.error('❌ Error generating QR section:', error.message);
    return '';
  }
};

const QR_SECTION_CSS = `
    .qr-section-topright {
      position: absolute;
      top: 80px;
      right: 20px;
      text-align: center;
      width: 140px;
      padding: 8px;
      background-color: #fff;
    }
    .maucas-logo-small {
      max-width: 90px;
      height: auto;
      display: block;
      margin: 0 auto 5px auto;
    }
    .qr-code-small {
      width: 90px;
      height: 90px;
      display: block;
      margin: 5px auto;
    }
    .zwennpay-logo-small {
      max-width: 65px;
      height: auto;
      display: block;
      margin: 5px auto 0 auto;
    }
    .qr-instruction-bottom {
      margin: 8px 0 5px 0;
    }
    .qr-instruction-bottom p {
      margin: 0;
      font-size: 10pt;
      line-height: 1.3;
      color: #000;
      font-weight: normal;
      text-align: justify;
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
      position: relative;
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
      max-width: 55%;
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
      margin-top: 12px;
    }
    .signature {
      margin-top: 10px;
    }
    .signature-image {
      max-width: 112px;
      margin: 5px 0;
    }
    .underline {
      text-decoration: underline;
    }
    .agreement {
      margin-top: 12px;
      border-top: 1px solid #000;
      padding-top: 5px;
    }
  </style>
</head>
<body>
  ${qrSection}

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

  <p class="intro-text">Please refer to your application for life assurance. We wish to inform you that your life cover has been accepted as per details set below:</p>

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
      <td>${data.revisedPremium || data.monthlyPremium}</td>
    </tr>
    <tr>
      <th>Extra Premium</th>
      <td>${data.extraPremium}</td>
    </tr>
  </table>

  <p style="margin: 10px 0;">To proceed with the issuance of your policy, we would be grateful if you could confirm your acceptance of the above terms by <strong>signing and returning this letter by ${data.returnDate}</strong>.</p>

  <p style="margin: 10px 0;">Please <strong>settle the extra premium due</strong> instantly via the <strong>MauCAS QR Code (Scan to Pay)</strong> using any supported mobile app (Juice, MauBank WithMe, Blink, MyT Money, etc.). Kindly ensure that your <strong>standing order is amended</strong> to reflect the revised premium.</p>

  <p style="margin: 10px 0;">We thank you for your understanding and cooperation and remain at your service for any further assistance.</p>

  <div class="footer">
    <p style="margin: 5px 0;"><strong>Yours sincerely,</strong></p>
    
    <div class="signature">
      <img src="${signatureBase64}" class="signature-image" alt="Signature">
      <div><strong>${data.signerName}</strong></div>
      <div>${data.signerTitle}</div>
      <div><em>${ccLine}</em></div>
    </div>
  </div>

  <div class="agreement">
    <p style="margin: 5px 0 40px 0;">I agree / do not agree with the terms and conditions as set above. Please proceed with the issue/cancel of my life insurance policy.</p>
    <p style="margin: 5px 0;">Name: ............................................................... Signature: .................................................... Date: ............................</p>
  </div>

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
      position: relative;
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
      max-width: 55%;
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
      margin-top: 12px;
    }
    .signature {
      margin-top: 10px;
    }
    .signature-image {
      max-width: 112px;
      margin: 5px 0;
    }
    .underline {
      text-decoration: underline;
    }
    .agreement {
      margin-top: 12px;
      border-top: 1px solid #000;
      padding-top: 5px;
    }
  </style>
</head>
<body>
  ${qrSection}

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

  <p class="intro-text">Please refer to your application for life assurance. We wish to inform you that your life cover has been accepted as per details set below:</p>

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
      <th>Extra Premium</th>
      <td>${data.extraPremium}</td>
    </tr>
  </table>

  <p style="margin: 10px 0;">To proceed with the issuance of your policy, we would be grateful if you could confirm your acceptance of the above terms by <strong>signing and returning this letter by ${data.returnDate}</strong>.</p>

  <p style="margin: 10px 0;">Please <strong>settle the extra premium due</strong> instantly via the <strong>MauCAS QR Code (Scan to Pay)</strong> using any supported mobile app (Juice, MauBank WithMe, Blink, MyT Money, etc.). Kindly ensure that your <strong>standing order is amended</strong> to reflect the revised premium.</p>

  <p style="margin: 10px 0;">We thank you for your understanding and cooperation and remain at your service for any further assistance.</p>

  <div class="footer">
    <p style="margin: 5px 0;"><strong>Yours sincerely,</strong></p>
    
    <div class="signature">
      <img src="${signatureBase64}" class="signature-image" alt="Signature">
      <div><strong>${data.signerName}</strong></div>
      <div>${data.signerTitle}</div>
      <div><em>${ccLine}</em></div>
    </div>
  </div>

  <div class="agreement">
    <p style="margin: 5px 0 50px 0;">I agree / do not agree with the terms and conditions as set above. Please proceed with the issue/cancel of my life insurance policy.</p>
    <p style="margin: 5px 0;">Name: .................................................... Signature: .................................................... Date: ............................</p>
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
