import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'boondocks_super_secret_jwt_key_2026';
  return jwt.sign({ id }, secret, { expiresIn: '30d' });
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'seeker',
      phone,
      area,
      location,
      radiusKm,
      preferences,
      priorityWeights,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const cleanedPhone = phone ? String(phone).trim() : undefined;
    if (cleanedPhone) {
      const existingPhone = await User.findOne({ phone: cleanedPhone });
      if (existingPhone) {
        return res.status(400).json({ message: 'An account with this phone number already exists.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      phone: cleanedPhone || undefined,
      area: area || location?.address || '',
      location: location || { address: area || '' },
      radiusKm: radiusKm || 5,
      preferences: preferences || undefined,
      priorityWeights: priorityWeights || undefined,
    });

    const token = generateToken(user._id);

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: error.message || 'Server error during signup.' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user via Email OR Phone & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password, loginIdentifier } = req.body;
    const identifier = (loginIdentifier || email || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email or phone number and password are required.' });
    }

    // Allow logging in by entering EITHER phone number OR email
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier },
      ],
    });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email/phone or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email/phone or password.' });
    }

    const token = generateToken(user._id);

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error during login.' });
  }
});

// @route   GET /api/auth/me
// @desc    Get logged in user data
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

export default router;

