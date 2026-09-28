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

// Sahyogi helpers, Machinery, and Marketplace listings start empty for real user-driven listings (No mock/prototype data)
export const initialSahyogis: Sahyogi[] = [];

export const initialMachinery: Machinery[] = [];

export const initialMarketplaceListings: MarketplaceListing[] = [];
