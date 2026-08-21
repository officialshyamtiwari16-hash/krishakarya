import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Search, 
  Send, 
  HelpCircle, 
  Camera, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Calculator, 
  Sprout, 
  Droplet, 
  Zap, 
  ShieldCheck, 
  RefreshCw, 
  X, 
  Loader2, 
  FileText, 
  Layers, 
  Sun, 
  Clock, 
  Sliders, 
  ArrowRight,
  TrendingUp,
  Award,
  Bot
} from 'lucide-react';
import { User } from '../types';
import { askModernFarmingQA, calculateCropInputs, getAiQuota, AiQuotaResponse } from '../lib/aiService';

interface ModernFarmingQAProps {
  currentUser: User | null;
  onOpenInboxWithAi?: (presetPrompt?: string) => void;
}

interface QAItem {
  id: string;
  category: string;
  questionHi: string;
  questionEn: string;
  shortSummary: string;
  fullAnswer: string;
  tags: string[];
}

const PRESET_FAQS: QAItem[] = [
  {
    id: 'faq_1',
    category: 'tech',
    questionHi: 'ड्रोन से कीटनाशक और नैनो यूरिया छिड़काव के क्या फायदे हैं और लागत कितनी आती है?',
    questionEn: 'What are the benefits and costs of agricultural drone spraying for pesticides and nano urea?',
    shortSummary: '90% पानी की बचत, 25-30% दवा की बचत, और मात्र 7-10 मिनट प्रति एकड़ में एकसमान छिड़काव।',
    fullAnswer: `### कृषि ड्रोन छिड़काव (Agricultural Drone Spraying) के मुख्य लाभ:
1. **समय व श्रम की भारी बचत**: पारंपरिक पीठ वाले स्प्रेयर से जहाँ 1 एकड़ में 3-4 घंटे लगते हैं, वहीं ड्रोन मात्र **7 से 10 मिनट प्रति एकड़** में पूरा खेत स्प्रे कर देता है।
2. **पानी और दवा की बचत**: ड्रोन अल्ट्रा-लो वॉल्यूम (ULV) तकनीक से केवल **10-12 लीटर पानी प्रति एकड़** का इस्तेमाल करता है (पारंपरिक में 150-200 लीटर)।
3. **स्वास्थ्य सुरक्षा**: किसान सीधे जहरीले रसायनों के संपर्क में आने से बचते हैं।
4. **अनुमानित लागत**: भारत में ड्रोन छिड़काव का किराया सामान्यतः **₹300 से ₹450 प्रति एकड़** आता है।
5. **सब्सिडी**: SMAM स्कीम और किसान ड्रोन योजना के तहत FPO/कस्टम हायरिंग सेंटर्स को 40% से 50% तक सरकारी अनुदान मिलता है।`,
    tags: ['Drone', 'Smart Tech', 'Nano Urea', 'Subsidy'],
  },
  {
    id: 'faq_2',
    category: 'irrigation',
    questionHi: 'ड्रिप (टपक) और स्प्रिंकलर सिंचाई से पैदावार और पानी में कितना सुधार होता है?',
    questionEn: 'How much does drip and sprinkler irrigation improve crop yield and water efficiency?',
    shortSummary: '50-70% पानी की बचत, 30-40% अधिक उत्पादन, और फर्टिगेशन (खाद घोलकर देना) की सुविधा।',
    fullAnswer: `### ड्रिप सिंचाई (Micro-Irrigation) का सम्पूर्ण विवरण:
1. **जल उपयोग दक्षता (Water Efficiency)**: ड्रिप सिंचाई सीधे पौधे की जड़ों तक बूँद-बूँद पानी पहुंचाती है, जिससे वाष्पीकरण रुकता है और **60% तक पानी की बचत** होती है।
2. **फर्टिगेशन (Fertigation)**: घुलनशील खाद (19:19:19, 0:52:34) सीधे पानी के साथ दी जा सकती है, जिससे 30% खाद की बचत होती है।
3. **उपयुक्त फसलें**: गन्ना, सब्जियां (टमाटर, मिर्च, शिमला मिर्च), केला, पपीता, कपास, और बागवानी।
4. **सरकारी अनुदान (PMKSY Scheme)**: 'पर ड्रॉप मोर क्रॉप' योजना के तहत लघु व सीमांत किसानों को **55% तक और अन्य को 45% तक सब्सिडी** मिलती है।`,
    tags: ['Drip', 'Irrigation', 'Water Saving', 'PMKSY'],
  },
  {
    id: 'faq_3',
    category: 'soil',
    questionHi: 'नैनो यूरिया और नैनो डीएपी का उपयोग कब और कैसे करना चाहिए?',
    questionEn: 'When and how to use Nano Urea and Nano DAP for maximum fertilizer efficiency?',
    shortSummary: 'पारंपरिक 45kg बोरी की जगह 1 बोतल (500ml), बेहतर अवशोषण और मिट्टी का संरक्षण।',
    fullAnswer: `### नैनो यूरिया और नैनो डीएपी प्रयोग विधि (Application Protocol):
1. **नैनो डीएपी (Nano DAP)**: 
   - **बीज शोधन (Seed Treatment)**: 5 मिली प्रति किलो बीज। 
   - **पत्तियों पर छिड़काव (Foliar Spray)**: 4 मिली प्रति लीटर पानी, बुवाई के 30-35 दिन बाद।
2. **नैनो यूरिया (Nano Urea)**: 
   - **पहला स्प्रे**: कल्ले फूटते समय (बुवाई के 30-35 दिन बाद), 4 मिली प्रति लीटर पानी (एक 15L टंकी में 60 मिली)।
   - **दूसरा स्प्रे**: फूल आने से 1 सप्ताह पहले।
3. **सावधानी**: सुबह ओस सूखने के बाद या शाम 4 बजे के बाद छिड़काव करें। यदि छिड़काव के 24 घंटे के भीतर बारिश हो जाए, तो दोबारा स्प्रे करें।`,
    tags: ['Nano Urea', 'Fertilizer', 'IFFCO', 'Soil Health'],
  },
  {
    id: 'faq_4',
    category: 'pest',
    questionHi: 'जैविक व प्राकृतिक तरीकों से कीट और रोग नियंत्रण (IPM) कैसे करें?',
    questionEn: 'How to manage crop pests and diseases organically using Integrated Pest Management (IPM)?',
    shortSummary: 'नीम तेल (Neem Oil 10,000 PPM), फेरोमोन ट्रैप, ट्राइकोडर्मा और बायो-कंट्रोल एजेंट।',
    fullAnswer: `### समन्वित कीट प्रबंधन (Integrated Pest Management - IPM):
1. **नीम का अर्क / नीम तेल (Neem Oil 10,000 PPM)**: 3-5 मिली प्रति लीटर पानी। रस चूसक कीटों (माहू, सफेद मक्खी, थ्रिप्स) पर बेहद असरदार।
2. **पीले और नीले चिपचिपे ट्रैप (Yellow/Blue Sticky Traps)**: 1 एकड़ में 6-8 ट्रैप लगाने से रसचूसक कीट खुद चिपक कर नष्ट होते हैं।
3. **फेरोमोन ट्रैप (Pheromone Traps)**: तना छेदक (Stem Borer) और फॉल आर्मीवर्म के नर पतंगों को फंसाने के लिए 5 ट्रैप प्रति एकड़।
4. **ट्राइकोडर्मा विरिडी (Trichoderma viride)**: जड़ गलन, उकठा (Wilt) और फंगस से बचाव के लिए 2.5 किग्रा गोबर की खाद में मिलाकर खेत में डालें।`,
    tags: ['Organic', 'Pest Control', 'Neem Oil', 'Trichoderma'],
  },
  {
    id: 'faq_5',
    category: 'schemes',
    questionHi: 'पीएम-कुसुम योजना के तहत सोलर पंप पर सब्सिडी कैसे प्राप्त करें?',
    questionEn: 'How to get up to 60-90% subsidy on Solar Agriculture Pumps under PM-KUSUM Scheme?',
    shortSummary: '3 HP से 7.5 HP सोलर पंप पर केंद्र व राज्य सरकार द्वारा 60% तक का भारी अनुदान।',
    fullAnswer: `### पीएम-कुसुम सोलर पंप योजना (PM-KUSUM Yojana):
1. **घटक-बी (Component B)**: डीजल पंप की जगह 3 HP, 5 HP, और 7.5 HP के स्टैंडअलोन सोलर एग्रीकल्चर पंप की स्थापना।
2. **सब्सिडी वितरण**: 
   - 30% केंद्रीय वित्तीय सहायता (MNRE)।
   - 30% राज्य सरकार का अनुदान।
   - 40% किसान का अंशदान (जिसमें से 30% तक बैंक लोन उपलब्ध)।
3. **आवश्यक दस्तावेज**: आधार कार्ड, खतौनी (भूमि का पर्चा), बैंक पासबुक, पासपोर्ट फोटो, और बिजली कनेक्शन न होने का शपथ पत्र।
4. **आवेदन पोर्टल**: राज्य कृषि विभाग के ऑनलाइन पारदर्शी किसान सेवा पोर्टल से ऑनलाइन टोकन प्राप्त करें।`,
    tags: ['Solar Pump', 'PM-KUSUM', 'Subsidy', 'Green Energy'],
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Topics (सभी विषय)', icon: '🌾' },
  { id: 'tech', label: 'Smart Tech & Drones (ड्रोन व तकनीक)', icon: '🛸' },
  { id: 'soil', label: 'Fertilizers & Soil (खाद व मृदा)', icon: '🧪' },
  { id: 'irrigation', label: 'Drip & Irrigation (सिंचाई)', icon: '💧' },
  { id: 'pest', label: 'Pest & Disease (कीट व रोग)', icon: '🪲' },
  { id: 'schemes', label: 'Govt Schemes (सरकारी योजनाएं)', icon: '🏛️' },
];

export const ModernFarmingQA: React.FC<ModernFarmingQAProps> = ({ currentUser, onOpenInboxWithAi }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq_1');
  
  // Custom AI Question Bar state
  const [customQuestion, setCustomQuestion] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('General Agriculture');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiAnswerCategory, setAiAnswerCategory] = useState<string>('');
  
  // Quota tracker
  const [quota, setQuota] = useState<AiQuotaResponse>({ remaining: 50, limit: 50, used: 0 });
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // Fertilizer & Seed Calculator Tool state
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcCrop, setCalcCrop] = useState('Wheat (गेहूँ)');
  const [calcAcres, setCalcAcres] = useState<number>(currentUser?.farmSizeAcres || 3);
  const [calcSoil, setCalcSoil] = useState('Alluvial / Loamy (दोमट मिट्टी)');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcResult, setCalcResult] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const answerSectionRef = useRef<HTMLDivElement>(null);

  // Fetch initial daily quota
  useEffect(() => {
    getAiQuota(currentUser?.id || currentUser?.username).then(setQuota);
  }, [currentUser]);

  // Handle Photo selection/capture
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearPhoto = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit AI Question
  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() && !imagePreview) return;

    setIsAskingAi(true);
    setRateLimitError(null);
    setAiAnswer(null);

    const locationStr = currentUser?.district 
      ? `${currentUser.village ? currentUser.village + ', ' : ''}${currentUser.district}, ${currentUser.state || 'Uttar Pradesh'}`
      : 'North India Agro-climatic Zone';

    const result = await askModernFarmingQA({
      question: customQuestion,
      category: activeCategory,
      crop: selectedCrop,
      location: locationStr,
      imageBase64: imagePreview || undefined,
      imageMimeType: imageMimeType,
      currentUser,
    });

    setIsAskingAi(false);

    if (result.error && result.remaining === 0) {
      setRateLimitError(result.error);
    } else {
      setAiAnswer(result.answer);
      setAiAnswerCategory(selectedCrop);
      setQuota({ remaining: result.remaining, limit: result.limit, used: result.limit - result.remaining });
      setTimeout(() => {
        answerSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Run Calculator
  const handleRunCalculator = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);
    setCalcResult(null);

    const res = await calculateCropInputs({
      crop: calcCrop,
      acreage: Number(calcAcres) || 1,
      soilType: calcSoil,
      currentUser,
    });

    setIsCalculating(false);
    if (res.calculation) {
      setCalcResult(res.calculation);
      setQuota({ remaining: res.remaining, limit: res.limit, used: res.limit - res.remaining });
    }
  };

  // Filter FAQs
  const filteredFaqs = PRESET_FAQS.filter((faq) => {
    const matchesCat = activeCategory === 'all' || faq.category === activeCategory;
    const matchesQuery = 
      faq.questionHi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.questionEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-10 shadow-xl border border-emerald-700/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-black text-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Krishak A.I • Powered by Gemini 3.7</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-['Outfit',sans-serif] tracking-tight leading-tight">
              Modern Farming Q&A & AI Advisory
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 font-medium leading-relaxed">
              Ask any question on modern agricultural technologies, drone spraying, smart irrigation, crop pathology, nano fertilizers, and government subsidies.
            </p>
          </div>

          {/* Daily Quota Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center shrink-0 min-w-[200px]">
            <div className="flex items-center gap-1.5 text-xs text-emerald-200 font-bold mb-1">
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Daily AI Query Limit</span>
            </div>
            <div className="text-3xl font-black text-white font-mono my-0.5">
              {quota.remaining} <span className="text-xs font-normal text-emerald-200 font-sans">/ {quota.limit}</span>
            </div>
            <p className="text-[11px] text-emerald-200/80">Queries remaining today</p>
            <div className="w-full bg-black/20 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-amber-400 h-full transition-all duration-500"
                style={{ width: `${Math.max(5, (quota.remaining / quota.limit) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive AI Question Bar with Photo Diagnostic Upload */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Ask Krishak A.I Any Farming Question
              </h2>
              <p className="text-xs text-slate-500">
                Type your question or attach a crop disease/pest photo for instant AI diagnosis
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCalculator(!showCalculator)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-extrabold transition-all cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-emerald-700" />
            <span>{showCalculator ? 'Hide Calculator' : 'Smart Fertilizer Calculator'}</span>
          </button>
        </div>

        {/* Rate Limit Alert */}
        {rateLimitError && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl p-4 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Daily Request Limit Reached</p>
              <p className="text-[11px] text-amber-800">{rateLimitError}</p>
            </div>
          </div>
        )}

        {/* Question Form */}
        <form onSubmit={handleAskAi} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Crop (फसल)</label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="General Agriculture">🌾 All / General Agriculture</option>
                <option value="Wheat (गेहूँ)">🌾 Wheat (गेहूँ)</option>
                <option value="Paddy / Rice (धान)">🍚 Paddy / Rice (धान)</option>
                <option value="Mustard (सरसों)">🌼 Mustard (सरसों)</option>
                <option value="Sugarcane (गन्ना)">🎋 Sugarcane (गन्ना)</option>
                <option value="Cotton (कपास)">🌱 Cotton (कपास)</option>
                <option value="Potato (आलू)">🥔 Potato (आलू)</option>
                <option value="Tomato (टमाटर)">🍅 Tomato (टमाटर)</option>
                <option value="Gram / Pulses (चना/दाल)">🌿 Pulses (दलहन)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Your Question or Symptom</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. गेहूँ में पीला रतुआ (Yellow Rust) के लक्षण हैं, क्या स्प्रे करें? or Drone subsidy details"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  className="w-full pl-3.5 pr-24 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />

                {/* Hidden File Input for Camera/File upload */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="crop-photo-upload"
                />

                <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
                  <label
                    htmlFor="crop-photo-upload"
                    title="Upload or Take Crop Photo"
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 cursor-pointer transition-all"
                  >
                    <Camera className="w-4 h-4 text-emerald-700" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Preview Pill */}
          {imagePreview && (
            <div className="flex items-center gap-3 p-2 bg-emerald-50 border border-emerald-200 rounded-2xl w-fit">
              <img
                src={imagePreview}
                alt="Selected Crop"
                className="w-12 h-12 object-cover rounded-xl border border-emerald-300"
              />
              <div className="text-xs">
                <p className="font-bold text-emerald-900">Crop Photo Attached</p>
                <p className="text-[10px] text-emerald-700">AI will perform visual disease diagnosis</p>
              </div>
              <button
                type="button"
                onClick={handleClearPhoto}
                className="p-1 text-slate-400 hover:text-red-500 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
              <span className="font-bold text-slate-700">Popular Quick Prompts:</span>
              {[
                'गेहूँ में खरपतवार नियंत्रण',
                'ड्रोन स्प्रेयर सब्सिडी',
                'नैनो डीएपी खुराक',
                'ड्रिप सिंचाई लागत',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setCustomQuestion(chip)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 rounded-full border border-slate-200 transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isAskingAi || (!customQuestion.trim() && !imagePreview)}
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {isAskingAi ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing with AI...</span>
                </>
              ) : (
                <>
                  <span>Ask Krishak A.I</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* AI Answer Section Display */}
        {aiAnswer && (
          <div 
            ref={answerSectionRef}
            className="mt-6 p-6 rounded-2xl bg-emerald-50/70 border-2 border-emerald-400/80 shadow-sm space-y-3 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                  AI
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-emerald-950">
                    Krishak A.I Verified Recommendation
                  </h3>
                  <p className="text-[10px] text-emerald-700">Category: {aiAnswerCategory || 'Modern Agriculture'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onOpenInboxWithAi && (
                  <button
                    onClick={() => onOpenInboxWithAi(customQuestion)}
                    className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Continue in Inbox Chat</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line space-y-2">
              {aiAnswer}
            </div>
          </div>
        )}

        {/* Fertilizer & Seed Calculator Modal / Panel */}
        {showCalculator && (
          <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-emerald-300 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Smart Fertilizer, Seed & Dosage Calculator
                </h3>
              </div>
              <button 
                onClick={() => setShowCalculator(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleRunCalculator} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Crop</label>
                <select
                  value={calcCrop}
                  onChange={(e) => setCalcCrop(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                >
                  <option value="Wheat (गेहूँ)">Wheat (गेहूँ)</option>
                  <option value="Paddy / Basmati (धान)">Paddy / Basmati (धान)</option>
                  <option value="Mustard (सरसों)">Mustard (सरसों)</option>
                  <option value="Sugarcane (गन्ना)">Sugarcane (गन्ना)</option>
                  <option value="Potato (आलू)">Potato (आलू)</option>
                  <option value="Tomato (टमाटर)">Tomato (टमाटर)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Farm Area (Acres)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={calcAcres}
                  onChange={(e) => setCalcAcres(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Soil Type</label>
                <select
                  value={calcSoil}
                  onChange={(e) => setCalcSoil(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                >
                  <option value="Alluvial / Loamy (दोमट मिट्टी)">Alluvial / Loamy (दोमट)</option>
                  <option value="Clay / Heavy (चिकनी मिट्टी)">Clay / Heavy (चिकनी)</option>
                  <option value="Sandy Loam (बलुई दोमट)">Sandy Loam (बलुई दोमट)</option>
                  <option value="Black Soil (काली मिट्टी)">Black Soil (काली मिट्टी)</option>
                </select>
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isCalculating}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                  <span>Calculate Fertilizer & Seed Quantity</span>
                </button>
              </div>
            </form>

            {calcResult && (
              <div className="p-4 rounded-xl bg-white border border-emerald-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed shadow-xs">
                {calcResult}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Pills & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search modern farming topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Curated FAQs Accordions */}
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded 
                    ? 'bg-white border-emerald-400 shadow-md ring-1 ring-emerald-400/20' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                  className="w-full p-4 sm:p-5 flex items-start justify-between gap-4 text-left cursor-pointer"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {faq.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      {faq.questionHi}
                    </h3>
                    <p className="text-xs text-slate-500">{faq.questionEn}</p>
                  </div>

                  <div className="p-1 rounded-full bg-slate-100 text-slate-600 shrink-0 mt-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-3 bg-slate-50/50">
                    <div>{faq.fullAnswer}</div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Agronomist & ICAR Standard Verified
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomQuestion(`मुझे ${faq.questionHi} के बारे में और अधिक विस्तार से जानकारी चाहिए।`);
                          window.scrollTo({ top: 150, behavior: 'smooth' });
                        }}
                        className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ask AI for Deeper Custom Advice</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
