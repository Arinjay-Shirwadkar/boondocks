import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ['seeker', 'host', 'both'],
      default: 'seeker',
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    area: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [72.8777, 19.0760],
      },
      address: {
        type: String,
        default: '',
      },
    },
    radiusKm: {
      type: Number,
      default: 5,
    },
    preferences: {
      food: {
        type: String,
        enum: ['veg', 'non-veg', 'any'],
        default: 'any',
      },
      vices: {
        type: String,
        enum: ['none', 'alcohol', 'smoking', 'all-legal'],
        default: 'none',
      },
      alcohol: {
        type: Boolean,
        default: false,
      },
      smoking: {
        type: Boolean,
        default: false,
      },
      pets: {
        type: Boolean,
        default: false,
      },
      guests: {
        type: String,
        enum: ['none', 'occasional', 'frequent'],
        default: 'occasional',
      },
      sleepTime: {
        type: String,
        enum: ['early-bird', 'night-owl'],
        default: 'early-bird',
      },
      minPrice: {
        type: Number,
        default: 3000,
        min: 0,
      },
      maxPrice: {
        type: Number,
        default: 30000,
        min: 0,
      },
    },
    priorityWeights: {
      food: { type: Number, min: 1, max: 5, default: 3 },
      vices: { type: Number, min: 1, max: 5, default: 3 },
      price: { type: Number, min: 1, max: 5, default: 3 },
      pets: { type: Number, min: 1, max: 5, default: 3 },
      guests: { type: Number, min: 1, max: 5, default: 3 },
      sleepTime: { type: Number, min: 1, max: 5, default: 3 },
    },
  },
  {
    timestamps: true,
  }
);

// Index for geospatial queries
userSchema.index({ 'location.coordinates': '2dsphere' });

const User = mongoose.model('User', userSchema);
export default User;
