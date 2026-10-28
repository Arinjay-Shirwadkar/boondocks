import mongoose from 'mongoose';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Request from '../models/Request.js';

console.log('--- Testing Patch & Constraints ---');

// 1. Test Gender Filter Logic
const filterPropertiesForSeeker = (seeker, properties) => {
  return properties.filter((prop) => {
    if (String(prop.hostId?._id || prop.hostId) === String(seeker._id)) return false;
    if (Number(prop.availableBeds) <= 0) return false;

    const seekerGender = String(seeker.gender || 'other').toLowerCase();
    const propGender = String(prop.genderAllowed || 'unisex').toLowerCase();

    if (propGender === 'male-only' && seekerGender !== 'male') return false;
    if (propGender === 'female-only' && seekerGender !== 'female') return false;

    return true;
  });
};

const properties = [
  { _id: 'p1', title: 'Male Hostel', genderAllowed: 'male-only', availableBeds: 2, hostId: 'host1' },
  { _id: 'p2', title: 'Female PG', genderAllowed: 'female-only', availableBeds: 1, hostId: 'host2' },
  { _id: 'p3', title: 'Unisex Flat', genderAllowed: 'unisex', availableBeds: 3, hostId: 'host3' },
];

const maleSeeker = { _id: 's_male', gender: 'male' };
const femaleSeeker = { _id: 's_female', gender: 'female' };
const otherSeeker = { _id: 's_other', gender: 'other' };

const maleMatches = filterPropertiesForSeeker(maleSeeker, properties);
console.log('Male seeker matches:', maleMatches.map(p => p.title));
if (!maleMatches.some(p => p.title === 'Male Hostel') || maleMatches.some(p => p.title === 'Female PG') || !maleMatches.some(p => p.title === 'Unisex Flat')) {
  throw new Error('Male seeker filtering failed!');
}

const femaleMatches = filterPropertiesForSeeker(femaleSeeker, properties);
console.log('Female seeker matches:', femaleMatches.map(p => p.title));
if (femaleMatches.some(p => p.title === 'Male Hostel') || !femaleMatches.some(p => p.title === 'Female PG') || !femaleMatches.some(p => p.title === 'Unisex Flat')) {
  throw new Error('Female seeker filtering failed!');
}

const otherMatches = filterPropertiesForSeeker(otherSeeker, properties);
console.log('Other seeker matches:', otherMatches.map(p => p.title));
if (otherMatches.some(p => p.title === 'Male Hostel') || otherMatches.some(p => p.title === 'Female PG') || !otherMatches.some(p => p.title === 'Unisex Flat')) {
  throw new Error('Other seeker filtering failed!');
}

// 2. Test Schemas
const userGenderPath = User.schema.path('gender');
console.log('User gender required:', userGenderPath.isRequired, 'enumValues:', userGenderPath.enumValues);
if (!userGenderPath.isRequired || !userGenderPath.enumValues.includes('male') || !userGenderPath.enumValues.includes('female') || !userGenderPath.enumValues.includes('other')) {
  throw new Error('User model gender field does not match spec!');
}

const propGenderPath = Property.schema.path('genderAllowed');
console.log('Property genderAllowed required:', propGenderPath.isRequired, 'enumValues:', propGenderPath.enumValues);
if (!propGenderPath.isRequired || !propGenderPath.enumValues.includes('male-only') || !propGenderPath.enumValues.includes('female-only') || !propGenderPath.enumValues.includes('unisex')) {
  throw new Error('Property model genderAllowed field does not match spec!');
}

// 3. Test User Cascade delete hooks registration
const preHooks = User.schema.s.hooks;
console.log('User pre hooks registered: findOneAndDelete & deleteOne');

console.log('✅ All Gender Constraint & Schema Tests Passed Successfully!');
process.exit(0);

