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
      default: '',
      trim: true,
    },
    area: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      address: { type: String, default: '' },
      coordinates: { type: [Number], default: undefined }, // [longitude, latitude]
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
      alcohol: {
        type: Boolean,
        default: false,
      },
      smoking: {
        type: Boolean,
        default: false,
      },
      drugs: {
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
    },
    priorityWeights: {
      food: { type: Number, min: 1, max: 5, default: 3 },
      vices: { type: Number, min: 1, max: 5, default: 3 },
      pets: { type: Number, min: 1, max: 5, default: 3 },
      guests: { type: Number, min: 1, max: 5, default: 3 },
      sleepTime: { type: Number, min: 1, max: 5, default: 3 },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);
export default User;

