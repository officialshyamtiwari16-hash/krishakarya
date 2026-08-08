import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, Share2, Plus, Sparkles, X, ChevronRight, Apple } from 'lucide-react';
import { KrishakaryaLogo } from './KrishakaryaLogo';
import { triggerChromeInstall } from '../lib/chromeShortcutConnector';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
}) => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState<'mobile' | 'ios' | 'desktop'>('mobile');

  useEffect(() => {
    // Detect if already running in standalone mode (PWA installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Auto-detect device
    const userAgent = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setActiveDeviceTab('ios');
    } else if (/Mobi|Android/i.test(userAgent)) {
      setActiveDeviceTab('mobile');
    } else {
      setActiveDeviceTab('desktop');
    }
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setIsPrompting(true);
    try {
      const res = await triggerChromeInstall();
      if (res === 'accepted') {
        setIsInstalled(true);
      } else if (res === 'unavailable' && deferredPrompt) {
        deferredPrompt.prompt();
      }
    } catch (err) {
      console.error('PWA install error:', err);
    } finally {
      setIsPrompting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md shrink-0">
              <KrishakaryaLogo size={42} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Outfit',sans-serif] font-black text-2xl tracking-tight text-white">
                  Krishakarya App
                </span>
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Shortcut
                </span>
              </div>
              <p className="text-emerald-100 text-xs mt-0.5 font-medium">
                Install or create desktop / phone screen shortcut with official logo
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Quick Direct Action Prompt Button (If Deferred Prompt Available) */}
          {deferredPrompt ? (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white shadow-md">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  1-Click Direct Download & Shortcut
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                  Click below to add Krishakarya directly to your home screen or desktop application list.
                </p>
              </div>

              <button
                onClick={handleInstallClick}
                disabled={isPrompting}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isPrompting ? 'Opening Prompt...' : 'Install & Create Shortcut Now'}</span>
              </button>
            </div>
          ) : null}

          {/* Device Tabs for Step-by-Step Instructions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                How to Add Shortcut on Any Device
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => setActiveDeviceTab('mobile')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeDeviceTab === 'mobile'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>

              <button
                onClick={() => setActiveDeviceTab('ios')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeDeviceTab === 'ios'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>iPhone/iPad</span>
              </button>

              <button
                onClick={() => setActiveDeviceTab('desktop')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeDeviceTab === 'desktop'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
            </div>

            {/* Instruction Steps according to device */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              {activeDeviceTab === 'mobile' && (
                <ol className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center shrink-0 text-[10px]">1</span>
                    <span>Open Krishakarya in <strong>Chrome</strong> or <strong>Edge</strong> browser on your Android mobile.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center shrink-0 text-[10px]">2</span>
                    <span>Tap the <strong>⋮ Menu (three dots)</strong> in top right corner.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center shrink-0 text-[10px]">3</span>
                    <span>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center shrink-0 text-[10px]">4</span>
                    <span>Confirm to see the <strong>Krishakarya Logo Shortcut</strong> directly on your phone home screen!</span>
                  </li>
                </ol>
              )}

              {activeDeviceTab === 'ios' && (
                <ol className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center shrink-0 text-[10px]">1</span>
                    <span>Open Krishakarya in <strong>Safari</strong> browser on your iPhone or iPad.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center shrink-0 text-[10px]">2</span>
                    <span className="flex items-center gap-1">
                      Tap the <strong>Share <Share2 className="w-3 h-3 inline text-emerald-700" /></strong> button at the bottom navigation bar.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center shrink-0 text-[10px]">3</span>
                    <span className="flex items-center gap-1">
                      Scroll down and tap <strong>"Add to Home Screen" <Plus className="w-3 h-3 inline text-emerald-700" /></strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center shrink-0 text-[10px]">4</span>
                    <span>Tap <strong>Add</strong> in top right. The official logo shortcut icon is now on your iOS home screen!</span>
                  </li>
                </ol>
              )}

              {activeDeviceTab === 'desktop' && (
                <ol className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center shrink-0 text-[10px]">1</span>
                    <span>On Chrome / Edge desktop browser, look at the right end of the top <strong>URL bar</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center shrink-0 text-[10px]">2</span>
                    <span>Click the <strong>Install / Desktop Shortcut icon</strong> (or <strong>⋮ Menu &gt; Save &amp; share &gt; Create Shortcut / Install</strong>).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center shrink-0 text-[10px]">3</span>
                    <span>Check <strong>"Open as window"</strong> and click <strong>Install / Create</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center shrink-0 text-[10px]">4</span>
                    <span>The Krishakarya app icon will now appear on your computer Desktop and Taskbar!</span>
                  </li>
                </ol>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
