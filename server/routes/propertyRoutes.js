import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Property from '../models/Property.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Configure local multer storage in /server/uploads/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `property-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per image
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

// @route   POST /api/properties/upload
// @desc    Upload local property images via multer
// @access  Private (Host)
router.post('/upload', protect, upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No image files provided.' });
    }
    const urls = req.files.map((f) => `/uploads/${f.filename}`);
    res.json({ urls });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: error.message || 'Image upload failed.' });
  }
});

// @route   POST /api/properties
// @desc    Create a new sharing PG or flat listing
// @access  Private (Host or Seeker/Both)
router.post('/', protect, async (req, res) => {
  try {
    const {
      title,
      type = 'PG',
      genderAllowed = 'unisex',
      location,
      rentPerHead,
      totalBeds,
      availableBeds,
      rules,
      amenities,
      images,
    } = req.body;

    if (!title || !location || !location.address) {
      return res.status(400).json({ message: 'Title and address are required.' });
    }

    const total = Number(totalBeds);
    const available = Number(availableBeds);

    if (isNaN(total) || total < 1) {
      return res.status(400).json({ message: 'Total beds must be at least 1.' });
    }

    if (isNaN(available) || available < 0) {
      return res.status(400).json({ message: 'Available beds cannot be negative.' });
    }

    if (available > total) {
      return res.status(400).json({ message: "Available beds cannot exceed total beds." });
    }

    const rent = Number(rentPerHead);
    if (isNaN(rent) || rent < 0) {
      return res.status(400).json({ message: 'Rent per head must be a non-negative number.' });
    }

    const property = await Property.create({
      hostId: req.user._id,
      title,
      type,
      genderAllowed: ['male-only', 'female-only', 'unisex'].includes(genderAllowed) ? genderAllowed : 'unisex',
      location,
      rentPerHead: rent,
      totalBeds: total,
      availableBeds: available,
      rules: rules || {},
      amenities: amenities || undefined,
      images: images || [],
    });

    res.status(201).json(property);
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ message: error.message || 'Server error creating property.' });
  }
});

// @route   GET /api/properties/mine
// @desc    Get all properties listed by logged-in host
// @access  Private
router.get('/mine', protect, async (req, res) => {
  try {
    const properties = await Property.find({ hostId: req.user._id }).sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error fetching host properties.' });
  }
});

// @route   GET /api/properties
// @desc    Get all active properties
// @access  Public (or Private)
router.get('/', async (req, res) => {
  try {
    const properties = await Property.find().populate('hostId', 'name email phone').sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error fetching properties.' });
  }
});

// @route   GET /api/properties/:id
// @desc    Get single property details
// @access  Public (or Private)
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('hostId', 'name email phone');
    if (!property) {
      return res.status(404).json({ message: 'Property not found.' });
    }
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error fetching property.' });
  }
});

// @route   PUT /api/properties/:id
// @desc    Update listing details (rent, beds, rules, amenities, etc.)
// @access  Private (Property Host)
router.put('/:id', protect, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found.' });
    }

    if (String(property.hostId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to edit this listing.' });
    }

    const {
      title,
      type,
      genderAllowed,
      location,
      rentPerHead,
      totalBeds,
      availableBeds,
      rules,
      amenities,
      images,
    } = req.body;

    if (title !== undefined) property.title = title;
    if (type !== undefined) property.type = type;
    if (genderAllowed !== undefined && ['male-only', 'female-only', 'unisex'].includes(genderAllowed)) {
      property.genderAllowed = genderAllowed;
    }
    if (location !== undefined) {
      property.location = {
        type: 'Point',
        coordinates: location.coordinates || property.location?.coordinates,
        address: location.address || property.location?.address || '',
      };
    }

    if (totalBeds !== undefined) {
      const total = Number(totalBeds);
      if (isNaN(total) || total < 1) {
        return res.status(400).json({ message: 'Total beds must be at least 1.' });
      }
      property.totalBeds = total;
    }

    if (availableBeds !== undefined) {
      const avail = Number(availableBeds);
      if (isNaN(avail) || avail < 0) {
        return res.status(400).json({ message: 'Available beds cannot be negative.' });
      }
      if (avail > property.totalBeds) {
        return res.status(400).json({ message: "Available beds cannot exceed total beds." });
      }
      property.availableBeds = avail;
    }

    if (rentPerHead !== undefined) {
      const rent = Number(rentPerHead);
      if (isNaN(rent) || rent < 0) {
        return res.status(400).json({ message: 'Rent must be a valid positive number.' });
      }
      property.rentPerHead = rent;
    }

    if (rules !== undefined) {
      property.rules = {
        ...property.rules.toObject(),
        ...rules,
      };
    }

    if (amenities !== undefined) {
      property.amenities = Array.isArray(amenities) ? amenities : [];
    }

    if (images !== undefined) {
      property.images = Array.isArray(images) ? images : [];
    }

    await property.save();
    res.json(property);
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ message: error.message || 'Server error updating property.' });
  }
});

export default router;

