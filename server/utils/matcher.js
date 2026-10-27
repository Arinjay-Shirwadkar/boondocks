// Calculates Haversine distance in kilometers between two [longitude, latitude] arrays
export function calculateDistanceKm(coords1, coords2) {
  if (!coords1 || !coords2 || coords1.length < 2 || coords2.length < 2) {
    return null;
  }

  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  if (typeof lon1 !== 'number' || typeof lat1 !== 'number' || typeof lon2 !== 'number' || typeof lat2 !== 'number') {
    return null;
  }

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Computes weighted compatibility match score and breakdown
export function calculateMatchScore(user, property) {
  const userPref = user.preferences || {};
  const userWeights = user.priorityWeights || {};
  const rules = property.rules || {};

  const breakdown = [];

  // 1. Food Match
  const foodWeight = Number(userWeights.food) || 3;
  const uFood = userPref.food || 'any';
  const pFood = rules.foodAllowed || 'any';
  let foodFit = 100;
  let foodStatus = 'compatible';
  let foodDetail = 'Food preferences align';

  if (uFood === 'any' || pFood === 'any') {
    foodFit = 100;
    foodStatus = 'compatible';
    foodDetail = 'Flexible food policy / both match';
  } else if (uFood === 'veg' && pFood === 'veg') {
    foodFit = 100;
    foodStatus = 'compatible';
    foodDetail = 'Both strictly vegetarian';
  } else if (uFood === 'non-veg' && pFood === 'non-veg') {
    foodFit = 100;
    foodStatus = 'compatible';
    foodDetail = 'Non-veg food allowed';
  } else if (uFood === 'veg' && pFood === 'non-veg') {
    foodFit = 50;
    foodStatus = 'conflict';
    foodDetail = 'Non-veg cooked in space, you prefer vegetarian';
  } else if (uFood === 'non-veg' && pFood === 'veg') {
    foodFit = 20;
    foodStatus = 'conflict';
    foodDetail = 'Vegetarian-only kitchen, you eat non-veg';
  }

  breakdown.push({
    category: 'food',
    weight: foodWeight,
    score: foodFit,
    status: foodStatus,
    detail: foodDetail,
  });

  // 2. Vices Match (Alcohol, Smoking, Drugs)
  const vicesWeight = Number(userWeights.vices) || 3;
  const uAlcohol = Boolean(userPref.alcohol);
  const uSmoking = Boolean(userPref.smoking);
  const uDrugs = Boolean(userPref.drugs);
  const pVice = rules.viceTolerance || 'none';

  const allowsAlcohol = pVice === 'alcohol' || pVice === 'all';
  const allowsSmoking = pVice === 'smoking' || pVice === 'all';
  const allowsDrugs = pVice === 'all';

  let alcScore = 100;
  if (uAlcohol && !allowsAlcohol) alcScore = 0;
  else if (!uAlcohol && allowsAlcohol) alcScore = 85;

  let smkScore = 100;
  if (uSmoking && !allowsSmoking) smkScore = 0;
  else if (!uSmoking && allowsSmoking) smkScore = 80;

  let drgScore = 100;
  if (uDrugs && !allowsDrugs) drgScore = 0;
  else if (!uDrugs && allowsDrugs) drgScore = 75;

  const vicesFit = Math.round((alcScore + smkScore + drgScore) / 3);
  let vicesStatus = 'compatible';
  let vicesDetail = 'Vice habits align well';

  if (vicesFit < 60) {
    vicesStatus = 'conflict';
    vicesDetail = `House vice policy (${pVice}) conflicts with your habits`;
  } else if (vicesFit < 85) {
    vicesStatus = 'neutral';
    vicesDetail = `Partial vice alignment with house policy (${pVice})`;
  }

  breakdown.push({
    category: 'vices',
    weight: vicesWeight,
    score: vicesFit,
    status: vicesStatus,
    detail: vicesDetail,
  });

  // 3. Pets Match
  const petsWeight = Number(userWeights.pets) || 3;
  const uPets = Boolean(userPref.pets);
  const pPets = Boolean(rules.petsAllowed);

  let petsFit = 100;
  let petsStatus = 'compatible';
  let petsDetail = 'Pet policy aligns';

  if (uPets && pPets) {
    petsFit = 100;
    petsStatus = 'compatible';
    petsDetail = 'Pet-friendly space for your pets';
  } else if (!uPets && !pPets) {
    petsFit = 100;
    petsStatus = 'compatible';
    petsDetail = 'No pets allowed on premises';
  } else if (!uPets && pPets) {
    petsFit = 80;
    petsStatus = 'neutral';
    petsDetail = 'Pets are allowed on premises';
  } else if (uPets && !pPets) {
    petsFit = 10;
    petsStatus = 'conflict';
    petsDetail = 'Property does not allow pets';
  }

  breakdown.push({
    category: 'pets',
    weight: petsWeight,
    score: petsFit,
    status: petsStatus,
    detail: petsDetail,
  });

  // 4. Guests Match
  const guestsWeight = Number(userWeights.guests) || 3;
  const uGuests = userPref.guests || 'occasional';
  const pGuests = rules.guestPolicy || 'occasional';

  const guestScale = { none: 0, occasional: 1, frequent: 2, anytime: 2 };
  const uGVal = guestScale[uGuests] ?? 1;
  const pGVal = guestScale[pGuests] ?? 1;
  const gDiff = Math.abs(uGVal - pGVal);

  let guestsFit = 100;
  let guestsStatus = 'compatible';
  let guestsDetail = `Guest policy matches (${uGuests})`;

  if (gDiff === 1) {
    guestsFit = 67;
    guestsStatus = 'neutral';
    guestsDetail = `Guest policy is ${pGuests}, preference is ${uGuests}`;
  } else if (gDiff >= 2) {
    guestsFit = 25;
    guestsStatus = 'conflict';
    guestsDetail = `Guest policy (${pGuests}) conflicts with preference (${uGuests})`;
  }

  breakdown.push({
    category: 'guests',
    weight: guestsWeight,
    score: guestsFit,
    status: guestsStatus,
    detail: guestsDetail,
  });

  // 5. Sleep Schedule Match
  const sleepWeight = Number(userWeights.sleepTime) || 3;
  const uSleep = userPref.sleepTime || 'early-bird';
  const pSleep = rules.sleepPolicy || 'flexible';

  let sleepFit = 100;
  let sleepStatus = 'compatible';
  let sleepDetail = 'Sleep routines align';

  if (pSleep === 'flexible') {
    sleepFit = 90;
    sleepStatus = 'compatible';
    sleepDetail = 'Flexible sleep schedule accommodates all routines';
  } else if (
    (uSleep === 'early-bird' && pSleep === 'early') ||
    (uSleep === 'night-owl' && pSleep === 'night-owl')
  ) {
    sleepFit = 100;
    sleepStatus = 'compatible';
    sleepDetail = 'Sleep schedules align perfectly';
  } else {
    sleepFit = 25;
    sleepStatus = 'conflict';
    sleepDetail = `Sleep schedule (${pSleep}) clashes with your routine (${uSleep})`;
  }

  breakdown.push({
    category: 'sleepTime',
    weight: sleepWeight,
    score: sleepFit,
    status: sleepStatus,
    detail: sleepDetail,
  });

  // Weighted score calculation
  const totalWeight = foodWeight + vicesWeight + petsWeight + guestsWeight + sleepWeight;
  const weightedSum =
    foodWeight * foodFit +
    vicesWeight * vicesFit +
    petsWeight * petsFit +
    guestsWeight * guestsFit +
    sleepWeight * sleepFit;

  const matchScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;

  // Calculate distance
  const distanceKm = calculateDistanceKm(
    user.location?.coordinates,
    property.location?.coordinates
  );

  return {
    matchScore: Math.max(0, Math.min(100, matchScore)),
    distanceKm,
    breakdown,
  };
}

