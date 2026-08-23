import React, { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface SEOHeadProps {
  activeTab: 'home' | 'sahyogi' | 'machinery' | 'profile' | 'terms' | 'modern-farming' | 'crop-health';
}

const TAB_METADATA: Record<
  string,
  {
    title: string;
    description: string;
    keywords: string;
  }
> = {
  home: {
    title: 'Krishakarya | Smart Agricultural Sahyogi Labor & Machinery Rental Platform',
    description:
      'Empowering Indian farmers with instant access to verified Sahyogi farm labor, tractor rentals, modern harvesters, digital Kisan Khatabook, and AI agronomy advice.',
    keywords: 'krishakarya, farm labor, sahyogi, tractor rental, harvester rental, kisan khatabook, farming weather, agricultural equipment india',
  },
  'crop-health': {
    title: 'AI Crop Health Assistant & Plant Disease Diagnosis | Krishakarya',
    description:
      'Take or upload crop photos for instant Gemini AI plant disease diagnosis, leaf blast detection, yellow rust solutions, and organic/chemical spray dosages.',
    keywords: 'crop health assistant, plant disease identifier, crop photo diagnosis, gemini ai farming, leaf rust treatment, organic pesticide dosage',
  },
  sahyogi: {
    title: 'Hire Sahyogi Farm Laborers & Agricultural Helpers | Krishakarya',
    description:
      'Browse verified agricultural workers, paddy transplanting teams, harvesting laborers, and tractor drivers with transparent daily and hourly wage rates.',
    keywords: 'hire farm labor, agricultural workers india, sahyogi helpers, paddy harvesting labor, crop spraying labor, seasonal farm workers',
  },
  machinery: {
    title: 'Rent Tractors, Harvesters & Agricultural Machinery | Krishakarya',
    description:
      'Rent modern farming machinery near your village: Mahindra & Swaraj tractors, combine harvesters, rotavators, seed drills, and drone sprayers.',
    keywords: 'tractor rent near me, combine harvester rental, rotavator hire, farm machinery rental india, agriculture drone spray rent',
  },
  profile: {
    title: 'Farmer Dashboard, Schedule & Kisan Khatabook | Krishakarya',
    description:
      'Manage your agricultural bookings, incoming rental requests, verified profile details, and digital farm financial ledger.',
    keywords: 'farmer dashboard, kisan khatabook, farm bookkeeping, booking schedule, agri ledger',
  },
  'modern-farming': {
    title: 'Krishak A.I Agronomy Advisory & Modern Farming Diagnostic | Krishakarya',
    description:
      'Get expert AI answers for crop diseases, seed rate calculators, fertilizer dosage (Urea, DAP, NPK), and government subsidies.',
    keywords: 'krishak ai, crop disease diagnosis, seed calculator, fertilizer dosage, farming questions, pm kisan',
  },
  terms: {
    title: 'Operating Terms, Privacy Policy & Farmer Safety Guidelines | Krishakarya',
    description:
      'Read Krishakarya community standards, fair wage policies, machinery rental agreements, and data privacy safeguards.',
    keywords: 'krishakarya terms, privacy policy, farmer safety guidelines, rental agreement',
  },
};

export const SEOHead: React.FC<SEOHeadProps> = ({ activeTab }) => {
  const { currentLanguage } = useLanguage();

  useEffect(() => {
    const meta = TAB_METADATA[activeTab] || TAB_METADATA.home;
    document.title = meta.title;

    // Update Meta Description
    let descTag = document.querySelector('meta[name="description"]');
    if (!descTag) {
      descTag = document.createElement('meta');
      descTag.setAttribute('name', 'description');
      document.head.appendChild(descTag);
    }
    descTag.setAttribute('content', meta.description);

    // Update OpenGraph Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', meta.title);

    // Update OpenGraph Description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', meta.description);

    // Update Language attribute on HTML root
    document.documentElement.lang = currentLanguage || 'en';
  }, [activeTab, currentLanguage]);

  return null;
};
