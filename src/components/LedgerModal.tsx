import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { KisanKhatabook } from './KisanKhatabook';
import { User, LedgerEntry, Booking } from '../types';

interface LedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  ledgerEntries?: LedgerEntry[];
  myBookings?: Booking[];
  onAddLedgerEntry?: (entry: LedgerEntry) => void;
  onDeleteLedgerEntry?: (id: string) => void;
  onSyncBookingsToLedger?: () => void;
}

export const LedgerModal: React.FC<LedgerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  ledgerEntries = [],
  myBookings = [],
  onAddLedgerEntry = () => {},
  onDeleteLedgerEntry = () => {},
  onSyncBookingsToLedger = () => {},
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] my-auto transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-20 px-5 py-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-amber-950 text-white flex items-center justify-between border-b border-emerald-700/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-800/80 rounded-2xl text-amber-300 border border-emerald-600/40 shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                  Kisan Bahi Khata
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 bg-amber-400 text-slate-950 rounded-full uppercase tracking-wider">
                  Quick Ledger
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 leading-tight mt-0.5">
                Digital farm income & expense ledger for <span className="text-emerald-300 font-bold">Krishakarya</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-800 text-emerald-100 hover:text-white transition-colors border border-emerald-700/50"
            title="Close Ledger"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
          <KisanKhatabook
            currentUser={currentUser}
            ledgerEntries={ledgerEntries}
            myBookings={myBookings}
            onAddLedgerEntry={onAddLedgerEntry}
            onDeleteLedgerEntry={onDeleteLedgerEntry}
            onSyncBookingsToLedger={onSyncBookingsToLedger}
          />
        </div>
      </div>
    </div>
  );
};
