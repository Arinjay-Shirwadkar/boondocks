import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
  {
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Property title is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['PG', 'Sharing Flat'],
      default: 'PG',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
      },
      address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
      },
    },
    rentPerHead: {
      type: Number,
      required: [true, 'Rent per person is required'],
      min: 0,
    },
    totalBeds: {
      type: Number,
      required: [true, 'Total beds is required'],
      min: 1,
    },
    availableBeds: {
      type: Number,
      required: [true, 'Available beds is required'],
      min: 0,
    },
    rules: {
      foodAllowed: {
        type: String,
        enum: ['veg', 'non-veg', 'any'],
        default: 'any',
      },
      viceTolerance: {
        type: String,
        enum: ['none', 'alcohol', 'smoking', 'all', 'all-legal'],
        default: 'none',
      },
      petsAllowed: {
        type: Boolean,
        default: false,
      },
      guestPolicy: {
        type: String,
        enum: ['none', 'occasional', 'anytime'],
        default: 'occasional',
      },
      sleepPolicy: {
        type: String,
        enum: ['early', 'flexible', 'night-owl'],
        default: 'flexible',
      },
    },
    amenities: {
      type: [String],
      default: ['Wi-Fi', 'RO Water', 'Cleaning Service'],
    },
    images: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

propertySchema.index({ 'location.coordinates': '2dsphere' });

const Property = mongoose.model('Property', propertySchema);
export default Property;
