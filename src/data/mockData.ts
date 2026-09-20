import { User, Sahyogi, Machinery, MarketplaceListing } from '../types';

export const DEFAULT_USER_IMAGE = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80';
export const DEFAULT_MACHINERY_IMAGE = '';

export const initialUser: User = {
  id: 'usr_ramesh_kisan',
  name: 'Ramesh Patel',
  username: '@ramesh_kisan',
  phone: '+91 98765 43210',
  email: 'ramesh.patel@krishakarya.in',
  village: 'Shivpur Rural',
  post: 'Shivpur',
  district: 'Varanasi',
  pincode: '221003',
  state: 'Uttar Pradesh',
  profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  farmSizeAcres: 6.5,
  primaryCrops: ['Wheat (गेहूं)', 'Paddy (धान)', 'Mustard (सरसों)'],
  isVerified: true,
  joinedDate: '2024-01-15',
  isSahyogi: false,
  isMachineryOwner: true,
  bio: 'Progressive farmer practicing integrated crop farming, aquaculture pond, and farm machinery management.',
};

export const initialSahyogis: Sahyogi[] = [
  {
    id: 'sah_real_1',
    userId: 'usr_ram_sah',
    name: 'Ramprasad Kushwaha',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    phone: '+91 98380 12345',
    village: 'Chiraigaon',
    post: 'Chiraigaon',
    district: 'Varanasi',
    pincode: '221112',
    state: 'Uttar Pradesh',
    dailyRate: 550,
    hourlyRate: 80,
    skills: ['Harvesting', 'Sowing', 'Irrigation', 'Spraying', 'Tractor Driver'],
    experienceYears: 7,
    rating: 4.9,
    reviewCount: 18,
    availabilityStatus: 'available',
    bio: 'Experienced farm team leader skilled in paddy transplanting, wheat harvesting, and drip irrigation handling.',
    teamSize: 4,
    reviews: [],
  },
  {
    id: 'sah_real_2',
    userId: 'usr_vijay_sah',
    name: 'Vijay Kumar Bind',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    phone: '+91 97920 67890',
    village: 'Rohaniya',
    post: 'Rohaniya',
    district: 'Varanasi',
    pincode: '221108',
    state: 'Uttar Pradesh',
    dailyRate: 500,
    hourlyRate: 75,
    skills: ['Vegetable Picking', 'Crop Protection', 'Manual Transplanting'],
    experienceYears: 5,
    rating: 4.8,
    reviewCount: 12,
    availabilityStatus: 'available',
    bio: 'Dedicated agricultural helper specialized in seasonal vegetable harvesting, grading, and field preparation.',
    teamSize: 3,
    reviews: [],
  }
];

// Machinery and Marketplace listings start empty for user-driven listings (No mock/prototype listings or images)
export const initialMachinery: Machinery[] = [];

export const initialMarketplaceListings: MarketplaceListing[] = [];
