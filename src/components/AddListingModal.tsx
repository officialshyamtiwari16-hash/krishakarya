import React, { useState } from 'react';
import { Sahyogi, Machinery, MachineryCategory, User } from '../types';
import { Users, Tractor, Upload, X } from 'lucide-react';

interface AddListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onAddSahyogi: (sahyogi: Sahyogi) => void;
  onAddMachinery: (machinery: Machinery) => void;
}

export const AddListingModal: React.FC<AddListingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  onAddSahyogi,
  onAddMachinery,
}) => {
  const [listingType, setListingType] = useState<'sahyogi' | 'machinery'>('sahyogi');

  // Sahyogi fields
  const [sahyogiName, setSahyogiName] = useState(currentUser?.name || '');
  const [sahyogiPhone, setSahyogiPhone] = useState(currentUser?.phone || '');
  const [sahyogiVillage, setSahyogiVillage] = useState(currentUser?.village || '');
  const [sahyogiDistrict, setSahyogiDistrict] = useState(currentUser?.district || '');
  const [sahyogiDailyRate, setSahyogiDailyRate] = useState('');
  const [sahyogiHourlyRate, setSahyogiHourlyRate] = useState('');
  const [sahyogiExpYears, setSahyogiExpYears] = useState('1');
  const [sahyogiBio, setSahyogiBio] = useState('');
  const [sahyogiPhoto, setSahyogiPhoto] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Harvesting', 'Sowing']);

  // Machinery fields
  const [machineTitle, setMachineTitle] = useState('');
  const [machineCategory, setMachineCategory] = useState<MachineryCategory>('Tractor');
  const [brandModel, setBrandModel] = useState('');
  const [horsepower, setHorsepower] = useState('');
  const [ratePerDay, setRatePerDay] = useState('');
  const [ratePerHour, setRatePerHour] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [machineVillage, setMachineVillage] = useState(currentUser?.village || '');
  const [machineDistrict, setMachineDistrict] = useState(currentUser?.district || '');
  const [machineDescription, setMachineDescription] = useState('');
  const [includesOperator, setIncludesOperator] = useState(true);
  const [machineImage, setMachineImage] = useState('');

  const availableSkills = [
    'Harvesting',
    'Sowing',
    'Tractor Driver',
    'Irrigation',
    'Crop Protection',
    'Threshing',
    'Manual Transplanting',
  ];

  if (!isOpen) return null;

  // Handle local image file upload
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'sahyogi' | 'machinery'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'sahyogi') {
          setSahyogiPhoto(reader.result as string);
        } else {
          setMachineImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (listingType === 'sahyogi') {
      const newSahyogi: Sahyogi = {
        id: `sah_${Date.now()}`,
        userId: currentUser.id,
        name: sahyogiName || currentUser.name,
        photo: sahyogiPhoto,
        phone: sahyogiPhone || currentUser.phone,
        village: sahyogiVillage || currentUser.village,
        district: sahyogiDistrict || currentUser.district,
        state: currentUser.state || 'Uttar Pradesh',
        dailyRate: parseFloat(sahyogiDailyRate) || 500,
        hourlyRate: parseFloat(sahyogiHourlyRate) || 80,
        skills: selectedSkills,
        experienceYears: parseInt(sahyogiExpYears) || 3,
        rating: 5.0,
        reviewCount: 1,
        availabilityStatus: 'available',
        bio: sahyogiBio || 'Professional agricultural helper registered on Krishakarya.',
        teamSize: 1,
        reviews: [
          {
            id: `rev_init_${Date.now()}`,
            authorName: 'Krishakarya Network',
            rating: 5,
            date: new Date().toISOString().split('T')[0],
            comment: 'Newly registered Sahyogi profile.',
            type: 'sahyogi',
          },
        ],
      };

      onAddSahyogi(newSahyogi);
    } else {
      const newMachine: Machinery = {
        id: `mac_${Date.now()}`,
        ownerId: currentUser.id,
        ownerName: currentUser.name,
        ownerPhone: currentUser.phone,
        title: machineTitle || 'Agricultural Equipment',
        category: machineCategory,
        brandModel: brandModel || 'Standard 2024 Model',
        horsepower: parseInt(horsepower) || 0,
        ratePerDay: parseFloat(ratePerDay) || 1500,
        ratePerHour: parseFloat(ratePerHour) || 250,
        securityDeposit: parseFloat(securityDeposit) || 500,
        village: machineVillage || currentUser.village,
        district: machineDistrict || currentUser.district,
        state: currentUser.state || 'Uttar Pradesh',
        availabilityStatus: 'available',
        image: machineImage,
        description: machineDescription || 'High quality equipment ready for farm operation.',
        specs: [
          { key: 'Category', value: machineCategory },
          { key: 'Horsepower', value: `${horsepower} HP` },
          { key: 'Driver Included', value: includesOperator ? 'Yes' : 'No' },
        ],
        rating: 5.0,
        reviewCount: 1,
        reviews: [
          {
            id: `rev_m_init_${Date.now()}`,
            authorName: 'Krishakarya Network',
            rating: 5,
            date: new Date().toISOString().split('T')[0],
            comment: 'Verified machinery rental listing.',
            type: 'machinery',
          },
        ],
        includesOperator: includesOperator,
      };

      onAddMachinery(newMachine);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl glass-panel rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-green-800 to-amber-900 p-5 sm:p-6 text-white relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-200 hover:text-white bg-white/10 rounded-full p-1.5"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl sm:text-2xl font-extrabold">List Your Service / Machinery</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Publish your Sahyogi labor profile or list agricultural machinery for rental earnings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Type Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setListingType('sahyogi')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                listingType === 'sahyogi'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-700 hover:text-emerald-800'
              }`}
            >
              <Users className="w-4 h-4" /> Register as Sahyogi Labor
            </button>
            <button
              type="button"
              onClick={() => setListingType('machinery')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                listingType === 'machinery'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-amber-700'
              }`}
            >
              <Tractor className="w-4 h-4" /> Rent Out Machinery / Tool
            </button>
          </div>

          {listingType === 'sahyogi' ? (
            /* Sahyogi Form */
            <div className="space-y-4">
              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload Sahyogi Photo
                </label>
                <div className="flex items-center gap-4">
                  {sahyogiPhoto && sahyogiPhoto.trim().length > 0 ? (
                    <img
                      src={sahyogiPhoto}
                      alt="Sahyogi Preview"
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-600"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl ring-2 ring-emerald-600/40 bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs text-center p-1">
                      No Photo
                    </div>
                  )}
                  <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Select Local Image File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'sahyogi')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="User Name"
                    value={sahyogiName}
                    onChange={(e) => setSahyogiName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="Phone Number"
                    value={sahyogiPhone}
                    onChange={(e) => setSahyogiPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Village / Town</label>
                  <input
                    type="text"
                    placeholder="Address / Village"
                    value={sahyogiVillage}
                    onChange={(e) => setSahyogiVillage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    placeholder="District"
                    value={sahyogiDistrict}
                    onChange={(e) => setSahyogiDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Daily Rate (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="Rate"
                    value={sahyogiDailyRate}
                    onChange={(e) => setSahyogiDailyRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hourly Rate (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="Rate"
                    value={sahyogiHourlyRate}
                    onChange={(e) => setSahyogiHourlyRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Exp. (Years)</label>
                  <input
                    type="number"
                    value={sahyogiExpYears}
                    onChange={(e) => setSahyogiExpYears(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Skills / Work Areas</label>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map((sk) => {
                    const active = selectedSkills.includes(sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => toggleSkill(sk)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          active
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {sk} {active && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Work Bio / Summary</label>
                <textarea
                  rows={2}
                  placeholder="Describe your work experience, crop specialties, punctuality..."
                  value={sahyogiBio}
                  onChange={(e) => setSahyogiBio(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          ) : (
            /* Machinery Form */
            <div className="space-y-4">
              {/* Machine Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload Machinery / Tool Photo
                </label>
                <div className="flex items-center gap-4">
                  {machineImage && machineImage.trim().length > 0 ? (
                    <img
                      src={machineImage}
                      alt="Machine Preview"
                      referrerPolicy="no-referrer"
                      className="w-24 h-16 rounded-xl object-cover ring-2 ring-amber-500"
                    />
                  ) : (
                    <div className="w-24 h-16 rounded-xl ring-2 ring-amber-500/40 bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs text-center p-1">
                      No Photo
                    </div>
                  )}
                  <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-amber-600" /> Choose Photo File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'machinery')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Machine / Tool Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Machinery Name (e.g. Tractor)"
                    value={machineTitle}
                    onChange={(e) => setMachineTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={machineCategory}
                    onChange={(e) => setMachineCategory(e.target.value as MachineryCategory)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="Tractor">Tractor</option>
                    <option value="Combine Harvester">Combine Harvester</option>
                    <option value="Rotavator">Rotavator / Tiller</option>
                    <option value="Seed Drill">Seed Drill</option>
                    <option value="Sprayer & Drone">Sprayer & Kisan Drone</option>
                    <option value="Thresher">Thresher</option>
                    <option value="Water Pump & Solar">Water Pump & Solar</option>
                    <option value="Agricultural Tools">Agricultural Tools</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand & Model</label>
                  <input
                    type="text"
                    placeholder="Brand / Model"
                    value={brandModel}
                    onChange={(e) => setBrandModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Horsepower (HP)</label>
                  <input
                    type="number"
                    placeholder="HP"
                    value={horsepower}
                    onChange={(e) => setHorsepower(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Village Location</label>
                  <input
                    type="text"
                    required
                    placeholder="Village"
                    value={machineVillage}
                    onChange={(e) => setMachineVillage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">District Location</label>
                  <input
                    type="text"
                    required
                    placeholder="District"
                    value={machineDistrict}
                    onChange={(e) => setMachineDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Daily Rent (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="Rate"
                    value={ratePerDay}
                    onChange={(e) => setRatePerDay(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hourly Rent (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="Rate"
                    value={ratePerHour}
                    onChange={(e) => setRatePerHour(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Deposit (₹)</label>
                  <input
                    type="number"
                    placeholder="Rate"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="opCheck"
                  checked={includesOperator}
                  onChange={(e) => setIncludesOperator(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                />
                <label htmlFor="opCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Include Trained Operator/Driver in Rent Price
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Equipment Description</label>
                <textarea
                  rows={2}
                  placeholder="Condition of equipment, implements attached, delivery options..."
                  value={machineDescription}
                  onChange={(e) => setMachineDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-emerald-700 to-green-800 hover:from-emerald-800 hover:to-green-900 text-white font-extrabold rounded-xl text-sm shadow-md transition-all"
          >
            Publish {listingType === 'sahyogi' ? 'Sahyogi Profile' : 'Machinery Rental Listing'}
          </button>
        </form>
      </div>
    </div>
  );
};
