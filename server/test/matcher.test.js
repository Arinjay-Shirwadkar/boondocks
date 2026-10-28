import { calculateMatchScore, calculateDistanceKm } from '../utils/matcher.js';

console.log('--- Testing Updated Matching Engine (No Drugs + Budget Compatibility) ---');

const mockUser = {
  preferences: {
    food: 'veg',
    vices: 'smoking',
    minPrice: 5000,
    maxPrice: 12000,
    pets: true,
    guests: 'occasional',
    sleepTime: 'early-bird',
  },
  priorityWeights: {
    food: 5,
    vices: 4,
    price: 4,
    pets: 3,
    guests: 2,
    sleepTime: 5,
  },
  location: {
    coordinates: [72.8777, 19.0760], // Mumbai coordinates
  },
};

const mockProperties = [
  {
    _id: 'prop1',
    title: 'Pure Veg Early Sleeper Haven',
    rentPerHead: 8500, // Within 5000-12000
    rules: {
      foodAllowed: 'veg',
      viceTolerance: 'smoking',
      petsAllowed: true,
      guestPolicy: 'occasional',
      sleepPolicy: 'early',
    },
    location: {
      coordinates: [72.8800, 19.0800],
    },
  },
  {
    _id: 'prop2',
    title: 'Party Animal Night Owl Flat',
    rentPerHead: 25000, // Significantly above 12000
    rules: {
      foodAllowed: 'non-veg',
      viceTolerance: 'none',
      petsAllowed: false,
      guestPolicy: 'anytime',
      sleepPolicy: 'night-owl',
    },
    location: {
      coordinates: [72.9500, 19.2000],
    },
  },
  {
    _id: 'prop3',
    title: 'Flexible Modern PG',
    rentPerHead: 10000, // Within budget
    rules: {
      foodAllowed: 'any',
      viceTolerance: 'all-legal',
      petsAllowed: true,
      guestPolicy: 'occasional',
      sleepPolicy: 'flexible',
    },
    location: {
      coordinates: [72.8790, 19.0770],
    },
  },
];

const matches = mockProperties.map((prop) => {
  const result = calculateMatchScore(mockUser, prop);
  return {
    property: prop.title,
    matchScore: result.matchScore,
    distanceKm: result.distanceKm,
    breakdown: result.breakdown,
  };
});

// Sort by highest compatibility score first
matches.sort((a, b) => b.matchScore - a.matchScore);

console.log('Results sorted by match percentage:');
matches.forEach((m, idx) => {
  console.log(`#${idx + 1}: ${m.property} -> ${m.matchScore}% compatible (${m.distanceKm} km away)`);
  m.breakdown.forEach((b) => {
    console.log(`   - [${b.category}] status: ${b.status}, score: ${b.score}%, weight: ${b.weight}, detail: ${b.detail}`);
  });
});

// Assertions
if (matches[0].matchScore <= matches[1].matchScore) {
  throw new Error('Ranking assertion failed: First item should have higher or equal score than second.');
}

if (matches[0].matchScore < 90) {
  throw new Error(`Expected prop1 to have >= 90% match, got ${matches[0].matchScore}%`);
}

const priceBreakdown = matches[0].breakdown.find((b) => b.category === 'price');
if (!priceBreakdown || priceBreakdown.score !== 100) {
  throw new Error('Expected price breakdown score of 100 for prop1');
}

if (matches[2].property !== 'Party Animal Night Owl Flat') {
  throw new Error('Expected least compatible property to be ranked last.');
}

console.log('✅ Matching Algorithm Test Passed Successfully!');
