import React from 'react';
import { CheckCircle2, FileText, Lock, Award } from 'lucide-react';

export const TermsModal: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-full text-xs font-bold">
          <FileText className="w-3.5 h-3.5 text-emerald-700" /> Terms & Operating Guidelines
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Terms & Conditions
        </h1>
        <p className="text-xs text-slate-500">
          <span className="text-emerald-700 font-bold">Krishakarya</span> Platform Operating Terms
        </p>
      </div>

      {/* Terms Sections */}
      <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1. Platform Purpose & Scope
          </h3>
          <p>
            <span className="text-emerald-700 font-bold">Krishakarya</span> is a platform where farmers can hire Sahyogi laborers for agricultural work such as harvesting, and rent agricultural machinery and reliable tools.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 2. Hiring Laborers & Machinery Rentals
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Farmers and Sahyogi workers coordinate directly regarding daily or hourly rates.</li>
            <li>Machinery equipment listed for rent should be delivered in good working operational condition.</li>
            <li>Users can view rating profiles for each Sahyogi helper and machinery listing.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" /> 3. Account Sign In & Mobile Verification
          </h3>
          <p>
            Users can register or sign in via mobile number with OTP verification or Gmail verification. Rate limiting is enforced to protect user accounts and prevent spam.
          </p>
        </div>

        {/* Platform Information & Official Support */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" /> 4. Community Standards & Help Support
          </h3>
          <p className="text-slate-600">
            <span className="text-emerald-700 font-bold">Krishakarya</span> is built to serve agricultural communities by fostering trust, transparent ratings, and direct connections for labor and equipment rentals.
          </p>
          <div className="pt-2 border-t border-slate-200/80 space-y-1">
            <p className="text-slate-700 font-semibold">Founder: <span className="text-slate-900 font-bold">Shyam Mani Tiwari</span></p>
            <p className="text-slate-600 font-semibold">Primary Support & Helpdesk Email:</p>
            <a 
              href="mailto:krishakarya@gmail.com" 
              className="text-emerald-700 font-bold hover:underline"
            >
              krishakarya@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
