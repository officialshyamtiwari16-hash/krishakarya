import React, { useState } from 'react';
import { CheckCircle2, FileText, Lock, Award, Shield, AlertTriangle, Scale, HeartHandshake } from 'lucide-react';

export const TermsModal: React.FC = () => {
  const [activeLegalTab, setActiveLegalTab] = useState<'terms' | 'privacy' | 'safety' | 'machinery'>('terms');

  return (
    <div className="max-w-4xl mx-auto space-y-6 bg-white p-5 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 space-y-2">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-950 border border-emerald-300 px-3 py-1 rounded-full text-xs font-black">
          <FileText className="w-3.5 h-3.5 text-emerald-800" /> Platform Trust & Legal Center
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Terms of Service & Privacy Policy
        </h1>
        <p className="text-xs text-slate-600">
          <strong className="text-emerald-800 font-bold">Krishakarya (कृषककार्य)</strong> Trust, Security, Data Privacy & Fair Agricultural Guidelines
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
        <button
          onClick={() => setActiveLegalTab('terms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] cursor-pointer ${
            activeLegalTab === 'terms'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Terms of Service</span>
        </button>

        <button
          onClick={() => setActiveLegalTab('privacy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] cursor-pointer ${
            activeLegalTab === 'privacy'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Privacy Policy</span>
        </button>

        <button
          onClick={() => setActiveLegalTab('safety')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] cursor-pointer ${
            activeLegalTab === 'safety'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Fair Wages & Safety</span>
        </button>

        <button
          onClick={() => setActiveLegalTab('machinery')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] cursor-pointer ${
            activeLegalTab === 'machinery'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Machinery Guidelines</span>
        </button>
      </div>

      {/* Tab 1: Terms of Service */}
      {activeLegalTab === 'terms' && (
        <div className="space-y-5 text-xs text-slate-700 leading-relaxed">
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> 1. Platform Purpose & Scope
            </h3>
            <p>
              <strong className="text-emerald-800 font-bold">Krishakarya</strong> is an agricultural marketplace connecting farmers with local Sahyogi laborers (agricultural helpers, transplanting teams, spray operators) and agricultural machinery owners (tractors, combine harvesters, rotavators, drone sprayers).
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> 2. Hiring Laborers & Machinery Rentals
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Farmers and Sahyogi workers agree directly on daily/hourly compensation, job timing, and farm location.</li>
              <li>Machinery owners warrant that listed equipment is in safe, fully operational condition with functional safety guards.</li>
              <li>Krishakarya provides the platform, digital booking records, and financial ledger (Kisan Khatabook) to streamline agricultural coordination.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-700" /> 3. Mobile Number Verification & Anti-Spam
            </h3>
            <p>
              Users register with verified mobile numbers and OTP verification. Automated rate limiting is active on all public listing submissions, booking forms, and rating reviews to prevent automated spam and protect community trust.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Privacy Policy */}
      {activeLegalTab === 'privacy' && (
        <div className="space-y-5 text-xs text-slate-700 leading-relaxed">
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-700" /> 1. Information Collection & Usage
            </h3>
            <p>
              We collect farmer name, village, district, state, phone number, and listing details solely to facilitate direct agricultural labor hiring and machinery rentals. We do not sell or monetize personal farmer data to third-party advertisers.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-700" /> 2. Data Protection & Offline Security
            </h3>
            <p>
              Your digital farm financial entries (Kisan Khatabook) are encrypted and backed up locally on your device with optional Cloud Firestore synchronization. Only authenticated users can access their private bookings and financial records.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" /> 3. Location & Weather Services
            </h3>
            <p>
              When location permissions are granted, latitude and longitude coordinates are queried exclusively to fetch hyper-local Open-Meteo agricultural weather and spray forecasts for your village.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Fair Wages & Safety */}
      {activeLegalTab === 'safety' && (
        <div className="space-y-5 text-xs text-slate-700 leading-relaxed">
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-700" /> 1. Fair Compensation & Timely Wage Settlement
            </h3>
            <p>
              Krishakarya promotes dignity of agricultural labor. Hirers are encouraged to disburse wages promptly upon task completion according to agreed daily or hourly rates.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-700" /> 2. Chemical Spraying & Field Safety
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Pesticide and fertilizer spraying workers must be provided standard protective gear (gloves, masks, eye protection).</li>
              <li>Machinery should not be operated in hazardous terrain or severe weather without appropriate safety measures.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 4: Machinery Damage & Rental Insurance */}
      {activeLegalTab === 'machinery' && (
        <div className="space-y-5 text-xs text-slate-700 leading-relaxed">
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-700" /> 1. Equipment Handover & Inspection
            </h3>
            <p>
              Both hirer and machinery owner should inspect equipment fuel levels, tire pressure, oil levels, and mechanical condition prior to commencing field work.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-700" /> 2. Security Deposits & Fuel Terms
            </h3>
            <p>
              Security deposits specified in machinery listings are settled directly between owner and renter upon completion of the work and safe return of the machine.
            </p>
          </div>
        </div>
      )}

      {/* Founder & Official Support Card */}
      <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-5 space-y-2">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-700" /> Community Standards & Help Support
        </h3>
        <p className="text-slate-600">
          <strong className="text-emerald-800 font-bold">Krishakarya</strong> is built to serve agricultural communities by fostering trust, transparent ratings, and direct connections for labor and equipment rentals.
        </p>
        <div className="pt-2 border-t border-emerald-200/60 space-y-1">
          <p className="text-slate-700 font-semibold">Founder: <span className="text-slate-900 font-bold">Shyam Mani Tiwari</span></p>
          <p className="text-slate-600 font-semibold">Primary Support & Helpdesk Email:</p>
          <a 
            href="mailto:krishakarya@gmail.com" 
            className="text-emerald-800 font-extrabold hover:underline"
          >
            krishakarya@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
};
