import axios from 'axios';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER_EMAIL = 'NewPolicy@niclmauritius.site';
const SENDER_NAME = 'NIC Life Insurance';

export const sendOTP = async (email, otp) => {
  try {
    console.log('Brevo API Key exists:', !!process.env.BREVO_API_KEY);
    console.log('API Key length:', process.env.BREVO_API_KEY?.length);
    
    const response = await axios.post(
      BREVO_API_URL,
      {
        sender: {
          name: 'NICL Letter Generator',
          email: 'noreply@niclmauritius.site'
        },
        to: [{ email }],
        subject: 'Your OTP for NICL Letter Generator',
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>NICL Letter Generator - OTP Verification</h2>
              <p>Your One-Time Password (OTP) is:</p>
              <h1 style="color: #0066cc; letter-spacing: 5px;">${otp}</h1>
              <p>This OTP is valid for 10 minutes.</p>
              <p>If you did not request this OTP, please ignore this email.</p>
              <br>
              <p>Best regards,<br>NICL Team</p>
            </body>
          </html>
        `
      },
      {
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Brevo API Error:', error.response?.data || error.message);
    console.error('Full error:', error.response?.status, error.response?.statusText);
    console.error('Request headers:', error.config?.headers);
    throw new Error('Failed to send OTP email');
  }
};


export const sendLetterEmail = async (pdfBuffer, data) => {
  try {
    const { customerTitle, surname, policyNo, firstName, advisorName, advisorEmail, customerEmail } = data;
    
    // Convert PDF buffer to base64
    const pdfBase64 = pdfBuffer.toString('base64');
    
    // Build recipient list
    const recipients = [];
    if (customerEmail) {
      recipients.push({ email: customerEmail, name: `${customerTitle} ${firstName} ${surname}` });
    }
    
    // Build CC list (advisor always in CC)
    const cc = [{ email: advisorEmail, name: advisorName }];
    
    // If no customer email, send to advisor as main recipient
    if (recipients.length === 0) {
      recipients.push({ email: advisorEmail, name: advisorName });
      cc.length = 0; // Clear CC since advisor is now main recipient
    }
    
    const subject = `Life Insurance Policy Proposal - PN ${policyNo} - ${firstName} ${surname}`;
    
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
          <h2 style="color: #2c3e50;">Life Insurance Policy Proposal</h2>
          
          <p>Dear ${customerTitle} ${surname},</p>
          
          <p>Please find attached your life insurance policy proposal letter for <strong>Policy Number ${policyNo}</strong>.</p>
          
          <p>This proposal outlines the terms and conditions of your life insurance coverage. Please review the document carefully and contact us if you have any questions.</p>
          
          <p><strong>Your Insurance Advisor:</strong> ${advisorName}</p>
          
          <p>For any queries, please feel free to reach out to your insurance advisor or our customer service team.</p>
          
          <br>
          <p>Best regards,<br>
          <strong>NIC Life Insurance Team</strong><br>
          National Insurance Company Ltd</p>
          
          <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #7f8c8d;">
            This is an automated email. Please do not reply to this email address.
          </p>
        </body>
      </html>
    `;
    
    const payload = {
      sender: {
        name: SENDER_NAME,
        email: SENDER_EMAIL
      },
      to: recipients,
      subject: subject,
      htmlContent: htmlContent,
      attachment: [
        {
          name: `NICL_Policy_${policyNo.replace(/\//g, '_')}.pdf`,
          content: pdfBase64
        }
      ]
    };
    
    // Add CC if present
    if (cc.length > 0) {
      payload.cc = cc;
    }
    
    console.log(`📧 Sending email to: ${recipients.map(r => r.email).join(', ')}`);
    if (cc.length > 0) {
      console.log(`📧 CC: ${cc.map(c => c.email).join(', ')}`);
    }
    
    const response = await axios.post(
      BREVO_API_URL,
      payload,
      {
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        }
      }
    );
    
    console.log('✅ Email sent successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Brevo Email Error:', error.response?.data || error.message);
    throw new Error('Failed to send email');
  }
};
