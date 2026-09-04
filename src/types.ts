export type RoleType = 'farmer' | 'sahyogi' | 'owner';

export interface User {
  id: string;
  name: string;
  username: string; // Unique Identity Handle e.g. @ramesh_patel
  phone: string;
  email: string;
  village: string;
  post: string;
  district: string;
  pincode: string;
  state: string;
  profileImage: string;
  farmSizeAcres: number;
  primaryCrops: string[];
  isVerified: boolean;
  joinedDate: string;
  isSahyogi: boolean;
  isMachineryOwner: boolean;
  bio?: string;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'sms' | 'email' | 'app';
  backupCodes?: string[];
}

export interface Review {
  id: string;
  authorName: string;
  authorImage?: string;
  rating: number;
  date: string;
  comment: string;
  type: 'sahyogi' | 'machinery';
}

export interface Sahyogi {
  id: string;
  userId: string;
  name: string;
  photo: string;
  phone: string;
  village: string;
  post?: string;
  district: string;
  pincode?: string;
  state: string;
  dailyRate: number;
  hourlyRate: number;
  skills: string[];
  experienceYears: number;
  rating: number;
  reviewCount: number;
  availabilityStatus: 'available' | 'busy';
  bio: string;
  teamSize?: number;
  reviews: Review[];
}

export type MachineryCategory = 
  | 'Tractor'
  | 'Combine Harvester'
  | 'Rotavator'
  | 'Seed Drill'
  | 'Sprayer & Drone'
  | 'Thresher'
  | 'Water Pump & Solar'
  | 'Cultivator'
  | 'Agricultural Tools';

export interface MachinerySpec {
  key: string;
  value: string;
}

export interface Machinery {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  title: string;
  category: MachineryCategory;
  brandModel: string;
  horsepower: number;
  ratePerDay: number;
  ratePerHour: number;
  securityDeposit: number;
  village: string;
  post?: string;
  district: string;
  pincode?: string;
  state: string;
  availabilityStatus: 'available' | 'rented';
  image: string;
  description: string;
  specs: MachinerySpec[];
  rating: number;
  reviewCount: number;
  reviews: Review[];
  includesOperator: boolean;
}

export type BookingStatus = 'Pending' | 'Confirmed' | 'Declined' | 'Completed' | 'Cancelled';

export interface Booking {
  id: string;
  type: 'sahyogi' | 'machinery';
  itemId: string;
  itemName: string;
  itemImage: string;
  renterId: string;
  renterName: string;
  renterPhone: string;
  ownerId?: string;
  ownerName?: string;
  ownerPhone?: string;
  startDate: string;
  endDate: string;
  unit: 'days' | 'hours' | 'acres';
  quantity: number;
  dailyRate: number;
  totalAmount: number;
  totalCost?: number;
  status: BookingStatus;
  declineReason?: string;
  createdAt: string;
  notes?: string;
  location: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  msgType?: 'text' | 'booking_card' | 'location' | 'voice_note' | 'image';
  bookingDetails?: {
    bookingId?: string;
    title: string;
    category: string;
    startDate: string;
    duration: string;
    location: string;
    totalAmount: number;
    status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  };
  imageUrl?: string;
  voiceDuration?: string;
  locationData?: {
    village: string;
    district: string;
    addressStr: string;
  };
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole?: string;
  participantImage?: string;
  participantPhone?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  lastTimestamp?: number;
}

export type LedgerCategory =
  | 'sahyogi_labor'
  | 'machinery_rental'
  | 'crop_sale'
  | 'seed_fertilizer'
  | 'diesel_irrigation'
  | 'government_subsidy'
  | 'other_expense'
  | 'other_income';

export interface LedgerEntry {
  id: string;
  userId: string;
  date: string;
  title: string;
  type: 'income' | 'expense';
  category: LedgerCategory;
  amount: number;
  cropName?: string;
  notes?: string;
  bookingId?: string;
  paymentMode?: 'cash' | 'online' | 'bank_transfer' | 'credit_udhar';
  partyName?: string;
  createdAt: string;
}

export interface CropHealthTreatment {
  title: string;
  composition?: string;
  dosage: string;
  applicationMethod?: string;
  timing?: string;
  safetyPrecautions?: string;
}

export interface CropHealthDiagnosis {
  id: string;
  timestamp: string;
  cropName: string;
  growthStage?: string;
  diseaseName: string;
  hindiName?: string;
  scientificName?: string;
  severity: 'healthy' | 'mild' | 'moderate' | 'severe';
  confidenceScore: number;
  summary: string;
  visualSymptoms: string[];
  probableCauses: string[];
  organicTreatments: CropHealthTreatment[];
  chemicalTreatments: CropHealthTreatment[];
  preventiveMeasures: string[];
  harvestSafetyIntervalDays?: number;
  imageUrl?: string;
  rawAnalysis?: string;
}

export interface AppSettings {
  // 1. Language & Regional
  language: string;
  landUnit: 'acre' | 'bigha_up' | 'bigha_bihar' | 'bigha_bengal' | 'guntha' | 'hectare' | 'biswa' | 'kanal';
  currencyFormat: 'inr_lakhs' | 'standard';

  // 2. Notifications & Audio
  pushNotifications: boolean;
  soundEffects: boolean;
  bookingAlerts: boolean;
  weatherAlerts: boolean;
  aiAdvisoryAlerts: boolean;

  // 3. Weather & Location
  tempUnit: 'celsius' | 'fahrenheit';
  windSpeedUnit: 'kmh' | 'ms' | 'mph';
  weatherRefreshInterval: '15m' | '30m' | '1h' | 'manual';
  locationMode: 'auto_gps' | 'saved_profile';

  // 4. Krishak A.I & Voice Assistant
  autoSpeakAiResponse: boolean;
  speechRate: number; // 0.8, 1.0, 1.2
  cropDiagnosticDetail: 'standard' | 'high';

  // 5. Display & Accessibility
  fontSize: 'normal' | 'large' | 'extralarge';
  highContrast: boolean;
  reducedMotion: boolean;

  // 6. Data & Rural Connectivity
  dataSaverMode: boolean;
}


