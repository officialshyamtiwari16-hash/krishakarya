import React from 'react';
import { 
  Users, 
  Tractor, 
  FileText, 
  Award,
  PlusCircle,
  Home
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { KrishakaryaLogo } from './KrishakaryaLogo';

interface FooterProps {
  onNavigate: (tab: 'home' | 'sahyogi' | 'machinery' | 'profile' | 'terms') => void;
  onOpenTerms?: () => void;
  onOpenAddListing: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenTerms, onOpenAddListing }) => {
  const { t } = useLanguage();

  const handleTermsClick = () => {
    if (onOpenTerms) onOpenTerms();
    else onNavigate('terms');
  };

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 border-t border-slate-800 pt-10 pb-20 md:pb-8 mt-16 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Brand & About */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <KrishakaryaLogo size={36} />
              <span className="font-['Outfit',sans-serif] font-black text-2xl tracking-tight leading-none text-emerald-400">
                Krishakarya
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('heroSubtitle')}
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm border-l-2 border-emerald-500 pl-2.5">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-2"
                >
                  <Home className="w-3.5 h-3.5 text-emerald-500" />
                  {t('navHome')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('sahyogi')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-2"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  {t('navSahyogi')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('machinery')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-2"
                >
                  <Tractor className="w-3.5 h-3.5 text-emerald-500" />
                  {t('navMachinery')}
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenAddListing}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-2"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
                  {t('addListing')}
                </button>
              </li>
              <li>
                <button
                  onClick={handleTermsClick}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-2 font-bold text-amber-300"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  Terms & Conditions
                </button>
              </li>
            </ul>
          </div>

          {/* About Platform & Contact Section */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                <Award className="w-4 h-4" /> Official Support
              </div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                Krishakarya Services
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Direct community platform connecting village farmers with Sahyogi labor and local machinery owners.
              </p>
              <div className="mt-3 pt-3 border-t border-slate-800">
                <p className="text-[11px] text-slate-400 font-medium">Primary Contact & Help:</p>
                <a 
                  href="mailto:krishakarya@gmail.com" 
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 mt-0.5"
                >
                  krishakarya@gmail.com
                </a>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-emerald-400 font-medium">
              <span>Krishakarya Support</span>
              <span className="bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                Official Help
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Terms Button */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="space-y-1 text-center sm:text-left">
            <p>© {new Date().getFullYear()} Krishakarya. All rights reserved.</p>
            <p className="text-slate-400 font-semibold text-[11px]">
              Founder: <span className="text-emerald-400 font-bold">Shyam Mani Tiwari</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleTermsClick}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              Terms & Conditions
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

