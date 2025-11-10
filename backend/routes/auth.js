import express from 'express';
import jwt from 'jsonwebtoken';
import { sendOTP } from '../services/brevoService.js';

const router = express.Router();

const AUTHORIZED_USERS = [
  'vikas.khanna@zwennpay.com',
  'ameetoo@nicl.mu',
  'bsobran@nicl.mu'
];

const PASSWORD = 'NICL@2025';

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

// Login with password
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!AUTHORIZED_USERS.includes(email)) {
    return res.status(401).json({ error: 'Unauthorized user' });
  }

  if (password !== PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, email });
});

// Request OTP
router.post('/request-otp', async (req, res) => {
  const { email } = req.body;

  if (!AUTHORIZED_USERS.includes(email)) {
    return res.status(401).json({ error: 'Unauthorized user' });
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000 }); // 10 minutes

    await sendOTP(email, otp);
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!AUTHORIZED_USERS.includes(email)) {
    return res.status(401).json({ error: 'Unauthorized user' });
  }

  const storedData = otpStore.get(email);
  
  if (!storedData) {
    return res.status(401).json({ error: 'OTP not found or expired' });
  }

  if (Date.now() > storedData.expires) {
    otpStore.delete(email);
    return res.status(401).json({ error: 'OTP expired' });
  }

  if (storedData.otp !== otp) {
    return res.status(401).json({ error: 'Invalid OTP' });
  }

  otpStore.delete(email);
  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, email });
});

export default router;
