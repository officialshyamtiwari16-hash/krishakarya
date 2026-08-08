import { User, Sahyogi, Machinery } from '../types';

export const DEFAULT_USER_IMAGE = '';
export const DEFAULT_MACHINERY_IMAGE = '';

export const initialUser: User = {
  id: 'usr_default',
  name: 'User',
  username: '@farmer_user',
  phone: 'Phone Number',
  email: '',
  village: 'Address',
  post: 'Post Office',
  district: 'District',
  pincode: 'Pincode',
  state: 'State',
  profileImage: '',
  farmSizeAcres: 0,
  primaryCrops: [],
  isVerified: true,
  joinedDate: new Date().toISOString().split('T')[0],
  isSahyogi: false,
  isMachineryOwner: false,
  bio: 'User Bio',
};

export const initialSahyogis: Sahyogi[] = [
  {
    id: 'sah_demo_1',
    userId: 'usr_demo_1',
    name: 'User (Sahyogi)',
    photo: '',
    phone: 'Phone Number',
    village: 'Address',
    post: 'Post Office',
    district: 'District',
    pincode: 'Pincode',
    state: 'State',
    dailyRate: 500,
    hourlyRate: 75,
    skills: ['Harvesting', 'Sowing', 'Irrigation'],
    experienceYears: 5,
    rating: 4.8,
    reviewCount: 5,
    availabilityStatus: 'available',
    bio: 'Sahyogi agricultural helper profile.',
    teamSize: 2,
    reviews: [],
  },
];

export const initialMachinery: Machinery[] = [
  {
    id: 'mac_demo_1',
    ownerId: 'usr_demo_2',
    ownerName: 'User (Owner)',
    ownerPhone: 'Phone Number',
    title: 'Tractor (Machinery)',
    category: 'Tractor',
    brandModel: 'Tractor Model',
    horsepower: 45,
    ratePerDay: 2000,
    ratePerHour: 300,
    securityDeposit: 1000,
    village: 'Address',
    post: 'Post Office',
    district: 'District',
    pincode: 'Pincode',
    state: 'State',
    availabilityStatus: 'available',
    image: '',
    description: 'Agricultural machinery available for rent.',
    includesOperator: true,
    specs: [
      { key: 'Horsepower', value: '45 HP' },
      { key: 'Driver Provided', value: 'Yes' },
    ],
    rating: 4.9,
    reviewCount: 6,
    reviews: [],
  },
];



