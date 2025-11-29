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
      text-align: center;
    }
    .intro-text {
      margin: 10px 0;
      line-height: 1.3;
    }
    .policy-summary {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    .policy-summary th {
      border: 1px solid #000;
      padding: 6px 8px;
      text-align: center;
      font-weight: bold;
      background-color: #f5f5f5;
      font-size: 9pt;
    }
    .policy-summary td {
      border: 1px solid #000;
      padding: 6px 8px;
      text-align: center;
      font-size: 10pt;
    }
    .options-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    .options-table th {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
      font-weight: bold;
      background-color: #f5f5f5;
      font-size: 10pt;
    }
    .options-table td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
      font-size: 10pt;
      vertical-align: top;
    }
    ${QR_SECTION_CSS}
    .footer {
      margin-top: 15px;
    }
    .signature {
      margin-top: 10px;
    }
    .signature-image {
      max-width: 112px;
      margin: 5px 0;
    }
    .acknowledgment {
      margin-top: 15px;
    }
    .acknowledgment h4 {
      margin: 5px 0;
      font-size: 11pt;
    }
    .checkbox-line {
      margin: 8px 0;
    }
    .signature-line {
      margin-top: 15px;
      display: flex;
      gap: 30px;
    }
    .signature-field {
      flex: 1;
    }
  </style>
</head>
<body>
  ${qrSection}

  <div class="header">
    <img src="${logoBase64}" class="logo" alt="NIC Logo">
  </div>

  <div class="ref">Ref: ${data.policyNo}</div>
  <div class="date">Date: ${data.date}</div>

  <div class="address">
    ${data.customerTitle} ${data.firstName} ${data.surname}<br>
    ${data.address1}<br>
    ${data.address2}
  </div>

  <div class="salutation">Dear ${data.customerTitle} ${data.surname},</div>

  <div class="subject">Subject: Proposal for Life Insurance - Policy No. ${data.policyNo}</div>

  <p class="intro-text">Following the underwriting assessment of your life insurance application dated ${data.applicationDate || '[application date]'}, we are pleased to inform you that your proposal has been accepted with revised terms, as outlined below:</p>

  <table class="policy-summary">
    <tr>
      <th>Type of Policy</th>
      <th>Term</th>
      <th>Sum Assured</th>
      <th>Monthly Premium</th>
    </tr>
    <tr>
      <td>${data.policyType || '[Plan Name]'}</td>
      <td>${data.term || '[XX years]'}</td>
      <td>${data.sumAssured || 'MUR [Sum Assured]'}</td>
      <td>${data.monthlyPremium || 'MUR [Premium]'}</td>
    </tr>
  </table>

  <p style="margin: 10px 0;">Due to medical considerations, an <strong>additional premium</strong> applies. Please select <strong>one</strong> of the following options:</p>

  <table class="options-table">
    <tr>
      <th style="width: 50%;">OPTION 1 - Maintain Full Sum Assured</th>
      <th style="width: 50%;">OPTION 2 - Maintain Current Premium</th>
    </tr>
    <tr>
      <td>Sum Assured: <strong>${data.sumAssured || 'MUR [amount]'}</strong> <strong>(Unchanged)</strong></td>
      <td>Adjusted Sum Assured: <strong>${data.option2 || 'MUR [new amount]'}</strong> <strong>(Reduced)</strong></td>
    </tr>
    <tr>
      <td>New Monthly Premium: <strong>${data.option1 || 'MUR [new amount]'}</strong> <strong>(Revised)</strong></td>
      <td>Monthly Premium: <strong>${data.monthlyPremium || 'MUR [amount]'}</strong> <strong>(Unchanged)</strong></td>
    </tr>
    <tr>
      <td>Pay the <strong>surplus amount</strong> instantly via <strong>MauCAS QR Code (Scan to Pay)</strong> using any supported mobile app (Juice, MauBank WithMe, Blink, MyT Money, etc.).</td>
      <td rowspan="2" style="text-align: center; vertical-align: middle; font-weight: bold;">No Action</td>
    </tr>
    <tr>
      <td>Provide an Updated standing order to reflect the revised premium of <strong>${data.option1 || 'MUR [amount]'}</strong></td>
    </tr>
  </table>

  <p style="margin: 10px 0;">Please indicate your preferred option, sign, and return this letter by <strong>${data.returnDate || '[insert deadline date]'}</strong>.</p>

  <p style="margin: 10px 0;">If no reply is received, we will proceed with <strong>Option 2</strong>.</p>

  <div class="footer">
    <p style="margin: 5px 0;"><strong>Yours sincerely,</strong></p>
    
    <div class="signature">
      <img src="${signatureBase64}" class="signature-image" alt="Signature">
      <div><strong>${data.signerName}</strong></div>
      <div>${data.signerTitle}</div>
      <div><em>${ccLine}</em></div>
    </div>
  </div>

  <div class="acknowledgment">
    <h4>Client Acknowledgment</h4>
    <div class="checkbox-line">☐ I confirm Option 1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ☐ I confirm Option 2</div>
    
    <div class="signature-line">
      <div class="signature-field">Name: _______________________</div>
      <div class="signature-field">Signature: _______________________</div>
    </div>
    <div style="margin-top: 10px;">Date: _______________________</div>
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
    console.log('📱 Generating QR code for policy:', data.policyNo);
    qrImagePath = await generateQRForPolicy(data.policyNo, data.firstName, data.surname);
    
    if (qrImagePath) {
      console.log('✅ QR code generated successfully');
    } else {
      console.log('⚠️ QR code generation skipped - continuing without QR');
    }

    const page = await browser.newPage();
    const html = generateFormat1HTML(data, qrImagePath);

    await page.setContent(html, { waitUntil: 'networkidle0' });

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
    await browser.close();
    
    if (qrImagePath) {
      cleanupQRFile(qrImagePath);
    }
  }
};
