import axios from 'axios';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ZWENNPAY_API_URL = 'https://api.zwennpay.com:9425/api/v1.0/Common/GetMerchantQR';
const MERCHANT_ID = 151;

/**
 * Format customer label: First initial + Surname (max 24 chars)
 * Example: "John Smith" -> "J Smith"
 */
const formatCustomerLabel = (firstName, surname) => {
  if (!firstName || !surname) return '';
  
  const firstInitial = firstName.charAt(0).toUpperCase();
  const label = `${firstInitial} ${surname}`;
  
  // Truncate to 24 characters if needed
  return label.substring(0, 24);
};

/**
 * Format policy number: Replace "/" with "."
 * Example: "00423/003456" -> "00423.003456"
 */
const formatPolicyNumber = (policyNo) => {
  if (!policyNo) return '';
  return String(policyNo).replace(/\//g, '.');
};

/**
 * Call ZwennPay API to get QR code data
 */
export const getQRCodeData = async (policyNo, firstName, surname) => {
  try {
    const formattedPolicyNo = formatPolicyNumber(policyNo);
    const customerLabel = formatCustomerLabel(firstName, surname);

    console.log(`🔄 Generating QR for Policy: ${formattedPolicyNo}, Customer: ${customerLabel}`);

    const payload = {
      MerchantId: MERCHANT_ID,
      SetTransactionAmount: false,
      TransactionAmount: 0,
      SetConvenienceIndicatorTip: false,
      ConvenienceIndicatorTip: 0,
      SetConvenienceFeeFixed: false,
      ConvenienceFeeFixed: 0,
      SetConvenienceFeePercentage: false,
      ConvenienceFeePercentage: 0,
      SetAdditionalBillNumber: true,
      AdditionalRequiredBillNumber: false,
      AdditionalBillNumber: formattedPolicyNo,
      SetAdditionalMobileNo: false,
      AdditionalRequiredMobileNo: false,
      AdditionalMobileNo: '',
      SetAdditionalStoreLabel: false,
      AdditionalRequiredStoreLabel: false,
      AdditionalStoreLabel: '',
      SetAdditionalLoyaltyNumber: false,
      AdditionalRequiredLoyaltyNumber: false,
      AdditionalLoyaltyNumber: '',
      SetAdditionalReferenceLabel: false,
      AdditionalRequiredReferenceLabel: false,
      AdditionalReferenceLabel: '',
      SetAdditionalCustomerLabel: true,
      AdditionalRequiredCustomerLabel: false,
      AdditionalCustomerLabel: customerLabel,
      SetAdditionalTerminalLabel: false,
      AdditionalRequiredTerminalLabel: false,
      AdditionalTerminalLabel: '',
      SetAdditionalPurposeTransaction: true,
      AdditionalRequiredPurposeTransaction: false,
      AdditionalPurposeTransaction: 'Life Insurance'
    };

    const response = await axios.post(ZWENNPAY_API_URL, payload, {
      headers: {
        'accept': 'text/plain',
        'Content-Type': 'application/json'
      },
      timeout: 20000 // 20 seconds
    });

    if (response.status === 200 && response.data) {
      const qrData = String(response.data).trim();
      
      // Validate QR data
      if (qrData && qrData.toLowerCase() !== 'null' && qrData.toLowerCase() !== 'none') {
        console.log('✅ QR code data received successfully');
        return qrData;
      } else {
        console.log('⚠️ Invalid QR data received from API');
        return null;
      }
    } else {
      console.log(`⚠️ API returned status ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error calling ZwennPay API:', error.message);
    return null;
  }
};

/**
 * Generate QR code image from data string
 */
export const generateQRCodeImage = async (qrData, policyNo) => {
  try {
    if (!qrData) {
      console.log('⚠️ No QR data provided, skipping QR generation');
      return null;
    }

    // Create safe filename from policy number
    const safePolicyNo = String(policyNo).replace(/[^a-zA-Z0-9]/g, '_');
    const qrFilename = path.join(__dirname, `../../qr_${safePolicyNo}_${Date.now()}.png`);

    // Generate QR code image
    await QRCode.toFile(qrFilename, qrData, {
      errorCorrectionLevel: 'L',  // Low error correction (7% recovery)
      scale: 8,                    // 8 pixels per module
      margin: 2,                   // 2 modules quiet zone
      color: {
        dark: '#000000',           // Black
        light: '#FFFFFF'           // White background
      }
    });

    console.log(`✅ QR code image generated: ${path.basename(qrFilename)}`);
    return qrFilename;
  } catch (error) {
    console.error('❌ Error generating QR code image:', error.message);
    return null;
  }
};

/**
 * Clean up temporary QR code file
 */
export const cleanupQRFile = (qrFilename) => {
  try {
    if (qrFilename && fs.existsSync(qrFilename)) {
      fs.unlinkSync(qrFilename);
      console.log(`🗑️ Cleaned up QR file: ${path.basename(qrFilename)}`);
    }
  } catch (error) {
    console.error('⚠️ Error cleaning up QR file:', error.message);
  }
};

/**
 * Complete QR generation workflow
 */
export const generateQRForPolicy = async (policyNo, firstName, surname) => {
  try {
    // Step 1: Get QR data from API
    const qrData = await getQRCodeData(policyNo, firstName, surname);
    
    if (!qrData) {
      console.log('⚠️ QR generation skipped - no valid data from API');
      return null;
    }

    // Step 2: Generate QR code image
    const qrFilename = await generateQRCodeImage(qrData, policyNo);
    
    return qrFilename;
  } catch (error) {
    console.error('❌ Error in QR generation workflow:', error.message);
    return null;
  }
};
