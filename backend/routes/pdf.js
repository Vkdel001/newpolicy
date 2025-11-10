import express from 'express';
import jwt from 'jsonwebtoken';
import { generatePDF } from '../services/pdfService.js';
import { sendLetterEmail } from '../services/brevoService.js';

const router = express.Router();

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Generate PDF
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { letterType, data } = req.body;

    if (!letterType || !data) {
      return res.status(400).json({ error: 'Letter type and data are required' });
    }

    // Debug: Log received data
    console.log('📥 Backend received data:', {
      advisorName: data.advisorName,
      advisorEmail: data.advisorEmail,
      signerName: data.signerName,
      signerTitle: data.signerTitle
    });

    const pdfBuffer = await generatePDF(letterType, data);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=letter_${data.policyNo}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Send PDF via Email
router.post('/send-email', authenticateToken, async (req, res) => {
  try {
    const { letterType, data } = req.body;

    if (!letterType || !data) {
      return res.status(400).json({ error: 'Letter type and data are required' });
    }

    // Validate required fields
    if (!data.advisorName || !data.advisorEmail) {
      return res.status(400).json({ error: 'Insurance advisor name and email are required' });
    }

    // Generate PDF
    console.log('📄 Generating PDF for email...');
    const pdfBuffer = await generatePDF(letterType, data);

    // Send email with PDF attachment
    console.log('📧 Sending email...');
    await sendLetterEmail(pdfBuffer, data);

    res.json({ 
      success: true, 
      message: 'Email sent successfully',
      recipients: {
        customer: data.customerEmail || null,
        advisor: data.advisorEmail
      }
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

export default router;
