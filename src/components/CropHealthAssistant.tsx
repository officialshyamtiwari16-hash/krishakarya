import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Leaf, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Plus, 
  X, 
  Search, 
  Activity, 
  FileText, 
  Droplet, 
  Clock, 
  Layers, 
  ArrowRight, 
  Share2, 
  Printer, 
  History, 
  HelpCircle, 
  Users, 
  Tractor, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  Zap, 
  CameraOff, 
  Sliders 
} from 'lucide-react';
import { User, CropHealthDiagnosis, LedgerEntry } from '../types';
import { diagnoseCropHealth, getAiQuota, AiQuotaResponse } from '../lib/aiService';
import { useLanguage } from '../context/LanguageContext';
import { compressImageFile } from '../lib/imageUtils';

interface CropHealthAssistantProps {
  currentUser: User | null;
  onNavigate?: (tab: 'home' | 'sahyogi' | 'machinery' | 'profile' | 'terms' | 'modern-farming' | 'crop-health') => void;
  onOpenInboxWithPrompt?: (prompt: string) => void;
  onAddToLedger?: (entry: Omit<LedgerEntry, 'id' | 'createdAt'>) => void;
}


// Crop & Stage definitions
const CROP_OPTIONS = [
  'Wheat (गेहूं)',
  'Paddy / Rice (धान)',
  'Mustard (सरसों)',
  'Sugarcane (गन्ना)',
  'Tomato (टमाटर)',
  'Potato (आलू)',
  'Cotton (कपास)',
  'Chili (मिर्च)',
  'Maize (मक्का)',
  'Onion (प्याज)',
  'Soybean (सोयाबीन)',
  'Chickpea / Gram (चना)',
  'Vegetables (सब्जियां)',
  'Fruits / Horticulture (बागवानी)',
  'Other Crop (अन्य फसल)'
];

const STAGE_OPTIONS = [
  'Seedling / नर्सरी अंकुरण',
  'Vegetative / कल्ले व वानस्पतिक वृद्धि',
  'Flowering / फूल आने की अवस्था',
  'Fruit / Pod Formation / दाना भराव अवस्था',
  'Pre-Harvest / परिपक्वता अवस्था'
];

export const CropHealthAssistant: React.FC<CropHealthAssistantProps> = ({
  currentUser,
  onNavigate,
  onOpenInboxWithPrompt,
  onAddToLedger,
}) => {
  const { t } = useLanguage();

  // Input & Capture States
  const [selectedCrop, setSelectedCrop] = useState<string>('Wheat (गेहूं)');
  const [growthStage, setGrowthStage] = useState<string>('Vegetative / कल्ले व वानस्पतिक वृद्धि');
  const [symptomsInput, setSymptomsInput] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');

  // Camera Live Mode States
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const resultCardRef = useRef<HTMLDivElement | null>(null);

  // Diagnostic Processing States
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<number>(1);
  const [diagnosisResult, setDiagnosisResult] = useState<CropHealthDiagnosis | null>(null);
  const [quota, setQuota] = useState<AiQuotaResponse>({ remaining: 50, limit: 50, used: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio / Speech Synthesis States
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // History & Ledger Sync States
  const [scanHistory, setScanHistory] = useState<CropHealthDiagnosis[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [ledgerAdded, setLedgerAdded] = useState<boolean>(false);

  // Load Scan History & Quota on mount
  useEffect(() => {
    getAiQuota(currentUser?.id || currentUser?.username).then(setQuota);

    try {
      const saved = localStorage.getItem('krishakarya_crop_health_scans');
      if (saved) {
        setScanHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('History load note:', e);
    }

    // Check for multiple video input devices
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      }).catch(() => {});
    }

    return () => {
      stopCameraStream();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentUser]);

  // Video Callback Ref to bind stream immediately when video node is attached to DOM
  const setVideoNodeRef = (node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && mediaStreamRef.current) {
      if (node.srcObject !== mediaStreamRef.current) {
        node.srcObject = mediaStreamRef.current;
      }
      node.play().catch((e) => {
        console.warn('Live camera play on mount note:', e);
      });
    }
  };

  // Synchronize stream directly to video element whenever isCameraActive updates
  useEffect(() => {
    if (isCameraActive && videoRef.current && mediaStreamRef.current) {
      if (videoRef.current.srcObject !== mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
      }
      videoRef.current.play().catch((err) => {
        console.warn('Live camera auto-play note:', err);
      });
    }
  }, [isCameraActive]);

  // Stop active camera stream cleanly
  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
    setIsCameraStarting(false);
    setIsTorchOn(false);
    setHasTorch(false);
  };

  // Handle Camera Startup with comprehensive constraint fallbacks
  const startCameraStream = async (mode: 'environment' | 'user' = cameraFacingMode) => {
    setCameraError(null);
    setIsCameraStarting(true);
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Live in-browser camera stream is not supported in this browser. Please use "Upload from Gallery" or allow camera permissions in your browser settings.');
      setIsCameraStarting(false);
      setIsCameraActive(false);
      return;
    }

    let stream: MediaStream | null = null;

    // Constraint attempt 1: Ideal facingMode with high definition resolution
    const constraintsAttempts: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: mode,
        },
        audio: false,
      },
      {
        video: {
          facingMode: mode === 'environment' ? 'user' : 'environment',
        },
        audio: false,
      },
      {
        video: true,
        audio: false,
      },
    ];

    for (let i = 0; i < constraintsAttempts.length; i++) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraintsAttempts[i]);
        if (stream) break;
      } catch (err: any) {
        console.warn(`Camera attempt ${i + 1} note:`, err?.message || err);
      }
    }

    if (stream) {
      mediaStreamRef.current = stream;
      setCameraFacingMode(mode);
      setIsCameraActive(true);
      setIsCameraStarting(false);

      // Check for torch capability
      try {
        const track = stream.getVideoTracks()[0];
        if (track && track.getCapabilities) {
          const caps = track.getCapabilities() as any;
          setHasTorch(Boolean(caps?.torch));
        }
      } catch (e) {
        setHasTorch(false);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } else {
      setCameraError('Camera access could not be established or permission was denied. Please check your camera permissions or upload an image from your gallery.');
      setIsCameraActive(false);
      setIsCameraStarting(false);
    }
  };

  // Switch between back / front cameras
  const toggleCameraFacing = () => {
    const nextMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextMode);
    startCameraStream(nextMode);
  };

  // Toggle Flashlight / Torch if supported by hardware
  const toggleTorch = async () => {
    if (!mediaStreamRef.current) return;
    try {
      const track = mediaStreamRef.current.getVideoTracks()[0];
      if (track && (track as any).applyConstraints) {
        const nextTorch = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }],
        });
        setIsTorchOn(nextTorch);
      }
    } catch (e) {
      console.warn('Torch toggle note:', e);
    }
  };

  // Capture High-Definition Snapshot from Live Video
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;

    // Trigger visual shutter flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 220);

    // Haptic vibration feedback if available
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([40, 30, 40]);
      } catch (e) {}
    }

    const video = videoRef.current;
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (cameraFacingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setImagePreview(dataUrl);
      setImageMimeType('image/jpeg');
      stopCameraStream();
    }
  };

  // Handle File Input Selection (from device camera capture or gallery) with offline compression
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMimeType('image/jpeg');
    try {
      const compressed = await compressImageFile(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.85 });
      setImagePreview(compressed);
    } catch (err) {
      console.warn('File compression note:', err);
    }
  };

  // Handle Drag & Drop of Image Files with offline compression
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageMimeType('image/jpeg');
      try {
        const compressed = await compressImageFile(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.85 });
        setImagePreview(compressed);
      } catch (err) {
        console.warn('Drop compression note:', err);
      }
    }
  };

  // Clear Current Photo Selection
  const handleClearPhoto = () => {
    stopCameraStream();
    setImagePreview(null);
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  // Run AI Health Diagnosis
  const handleRunDiagnosis = async () => {
    if (!imagePreview && !symptomsInput.trim()) {
      setErrorMessage('Please capture/upload a crop photo or describe observed symptoms.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(1);
    setErrorMessage(null);
    setDiagnosisResult(null);
    setLedgerAdded(false);

    // Realistic step counter animation for engaging UX
    const timer1 = setTimeout(() => setAnalysisStep(2), 1200);
    const timer2 = setTimeout(() => setAnalysisStep(3), 2600);

    const locationStr = currentUser?.district
      ? `${currentUser.village ? currentUser.village + ', ' : ''}${currentUser.district}, ${currentUser.state || 'Uttar Pradesh'}`
      : 'North Indian Indo-Gangetic Plains';

    try {
      const response = await diagnoseCropHealth({
        imageBase64: imagePreview || undefined,
        imageMimeType,
        cropName: selectedCrop,
        growthStage,
        symptoms: symptomsInput,
        location: locationStr,
        currentUser,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsAnalyzing(false);

      if (response.diagnosis) {
        setDiagnosisResult(response.diagnosis);
        setQuota({ remaining: response.remaining, limit: response.limit, used: response.limit - response.remaining });

        // Save to History
        const updatedHistory = [response.diagnosis, ...scanHistory.filter((s) => s.id !== response.diagnosis?.id)].slice(0, 15);
        setScanHistory(updatedHistory);
        try {
          localStorage.setItem('krishakarya_crop_health_scans', JSON.stringify(updatedHistory));
        } catch (e) {}

        setTimeout(() => {
          resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      } else if (response.error) {
        setErrorMessage(response.error);
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsAnalyzing(false);
      setErrorMessage('Failed to complete AI diagnostic scan. Please check your network and retry.');
    }
  };

  // Audio Readout (Text-to-Speech)
  const toggleSpeech = () => {
    if (!diagnosisResult) return;

    if (isSpeaking) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech audio is not supported in this browser.');
      return;
    }

    const textToRead = `${diagnosisResult.cropName}. ${diagnosisResult.hindiName || diagnosisResult.diseaseName}. स्थिति: ${diagnosisResult.severity}. ${diagnosisResult.summary}. मुख्य उपचार: ${
      diagnosisResult.organicTreatments[0]
        ? diagnosisResult.organicTreatments[0].title + ' ' + diagnosisResult.organicTreatments[0].dosage
        : ''
    }. रासायनिक उपचार: ${
      diagnosisResult.chemicalTreatments[0]
        ? diagnosisResult.chemicalTreatments[0].title + ' ' + diagnosisResult.chemicalTreatments[0].dosage
        : ''
    }`;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.92;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Add Treatment Expense to Ledger Book
  const handleSyncToLedger = () => {
    if (!diagnosisResult || ledgerAdded) return;

    const estimatedAmount = diagnosisResult.severity === 'severe' ? 950 : diagnosisResult.severity === 'moderate' ? 650 : 350;
    const entryData = {
      userId: currentUser?.id || 'anonymous',
      date: new Date().toISOString().split('T')[0],
      title: `Crop Medicine: ${diagnosisResult.diseaseName} (${diagnosisResult.cropName})`,
      type: 'expense' as const,
      category: 'seed_fertilizer' as const,
      amount: estimatedAmount,
      cropName: diagnosisResult.cropName,
      notes: `AI Recommended Treatment: ${diagnosisResult.chemicalTreatments[0]?.title || diagnosisResult.organicTreatments[0]?.title || 'Spray Treatment'}. Dosage: ${diagnosisResult.chemicalTreatments[0]?.dosage || ''}`,
      paymentMode: 'cash' as const,
      partyName: 'Krishi Seva Kendra / Agro Chem',
    };

    if (onAddToLedger) {
      onAddToLedger(entryData);
      setLedgerAdded(true);
    }
  };

  // Navigate to Inbox with Diagnostic Context
  const handleAskInChat = () => {
    if (!diagnosisResult) return;
    const prompt = `नमस्ते कृषक AI! मैंने अपने ${diagnosisResult.cropName} में "${diagnosisResult.diseaseName} (${diagnosisResult.hindiName || ''})" का AI निदान किया है। गंभीरता: ${diagnosisResult.severity}। कृपया मुझे इस रोग के उपचार, सही छिड़काव समय, और स्प्रे में दवा मिलाने के तरीके के बारे में विस्तार से मार्गदर्शन दें।`;
    if (onOpenInboxWithPrompt) {
      onOpenInboxWithPrompt(prompt);
    } else if (onNavigate) {
      onNavigate('home');
    }
  };

  // Severity Helper
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'severe':
        return {
          label: 'Critical / गंभीर संक्रमण',
          color: 'bg-rose-600 text-white border-rose-700',
          dot: 'bg-rose-300 animate-ping',
        };
      case 'moderate':
        return {
          label: 'Moderate / मध्यम संक्रमण',
          color: 'bg-amber-500 text-white border-amber-600',
          dot: 'bg-amber-200 animate-pulse',
        };
      case 'mild':
        return {
          label: 'Mild / प्रारंभिक अवस्था',
          color: 'bg-yellow-500 text-slate-900 border-yellow-600',
          dot: 'bg-yellow-100',
        };
      default:
        return {
          label: 'Healthy / स्वस्थ पौधा',
          color: 'bg-emerald-600 text-white border-emerald-700',
          dot: 'bg-emerald-200',
        };
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-8 animate-fadeIn">
      {/* Hidden Canvas for Live Camera Snapshots */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-10 shadow-2xl border border-emerald-700/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-amber-300 text-xs font-black tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
              Gemini 3.7 AI Crop Pathology • पादप रोग निदान
            </div>
            <h1 className="text-2xl sm:text-4xl font-['Outfit',sans-serif] font-black tracking-tight leading-tight">
              Crop Health Assistant
              <span className="block text-emerald-300 text-lg sm:text-2xl font-bold mt-0.5">
                फसल स्वास्थ्य जांच एवं उपचार सलाहकार
              </span>
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
              Upload or capture a photo of your crop leaf, stem, or fruit. Our AI diagnostic system identifies diseases, nutrient deficiencies, and pests, delivering verified organic and chemical treatment advice with exact dosages.
            </p>
          </div>

          {/* Quota & Action Pills */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 pt-2 md:pt-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-left md:text-right min-w-[140px]">
              <div className="flex items-center md:justify-end gap-1.5 text-emerald-300 text-xs font-bold">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>AI Daily Quota</span>
              </div>
              <p className="text-lg font-black text-white mt-0.5">
                {quota.remaining} / {quota.limit}
                <span className="text-[11px] font-normal text-slate-300 block">Scans Left Today</span>
              </p>
            </div>

            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700/60 hover:bg-emerald-600/80 text-white rounded-xl text-xs font-bold border border-emerald-400/30 transition-all cursor-pointer"
            >
              <History className="w-4 h-4 text-emerald-300" />
              <span>{showHistory ? 'Hide History' : `History (${scanHistory.length})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* History Slide-out / Panel */}
      {showHistory && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-200/80 shadow-lg space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-700" />
              <h3 className="font-extrabold text-slate-900 text-base">Your Recent Crop Health Scans (पिछले निदान)</h3>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {scanHistory.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              No previous scans saved on this device. Run a diagnosis below to build your farm record!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {scanHistory.map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => {
                    setDiagnosisResult(scan);
                    setShowHistory(false);
                    setTimeout(() => {
                      resultCardRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/60 hover:border-emerald-300 transition-all cursor-pointer group space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 truncate group-hover:text-emerald-800">
                      {scan.cropName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(scan.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-emerald-950 truncate">
                    {scan.diseaseName}
                  </p>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 capitalize">{scan.severity}</span>
                    <span className="font-extrabold text-emerald-700">{scan.confidenceScore}% Confidence</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Diagnostic Scanner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Photo Capture / Upload & Crop Form */}
        <div className="lg:col-span-6 space-y-6">
          {/* Step 1: Capture or Select Crop Photo */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Upload or Capture Crop Photo</h3>
                  <p className="text-xs text-slate-500">पौधे के प्रभावित भाग की स्पष्ट फोटो लें</p>
                </div>
              </div>

              {imagePreview && (
                <button
                  type="button"
                  onClick={handleClearPhoto}
                  className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold px-2.5 py-1 bg-rose-50 rounded-xl"
                >
                  <X className="w-3.5 h-3.5" /> Clear Photo
                </button>
              )}
            </div>

            {/* Live Camera View */}
            {isCameraActive ? (
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex flex-col items-center justify-center border-2 border-emerald-500 shadow-xl select-none">
                <video
                  ref={setVideoNodeRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={(e) => {
                    (e.target as HTMLVideoElement).play().catch(() => {});
                  }}
                  className="w-full h-full object-cover"
                />

                {/* Shutter Flash Animation */}
                <div
                  className={`absolute inset-0 bg-white transition-opacity duration-200 pointer-events-none z-30 ${
                    isFlashing ? 'opacity-90' : 'opacity-0'
                  }`}
                />

                {/* Reticle Scanner Line & Focus Grid */}
                <div className="absolute inset-x-8 top-1/2 h-0.5 bg-emerald-400/80 shadow-[0_0_14px_#34d399] animate-pulse pointer-events-none" />
                <div className="absolute inset-6 sm:inset-10 border-2 border-dashed border-white/50 rounded-2xl pointer-events-none flex items-center justify-center">
                  <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                    Align leaf inside frame • पत्ती को फ्रेम में रखें
                  </span>
                </div>

                {/* Top Status & Quick Controls */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20">
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Live Scanner</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasTorch && (
                      <button
                        type="button"
                        onClick={toggleTorch}
                        className={`p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                          isTorchOn ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-black/60 text-white hover:bg-black/80'
                        }`}
                        title={isTorchOn ? 'Flashlight On' : 'Flashlight Off'}
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-all cursor-pointer"
                      title="Switch Front/Rear Camera"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="p-2 bg-black/60 hover:bg-rose-600 text-white rounded-full backdrop-blur-md transition-all cursor-pointer"
                      title="Close Live Camera"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Camera Bottom Controls with Big Shutter */}
                <div className="absolute bottom-3 sm:bottom-4 inset-x-4 flex items-center justify-between z-20">
                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className="p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-all cursor-pointer text-xs font-bold flex items-center gap-1"
                    title="Cancel"
                  >
                    <CameraOff className="w-4 h-4" />
                    <span className="hidden sm:inline">Cancel</span>
                  </button>

                  {/* Primary Shutter Button */}
                  <button
                    type="button"
                    onClick={handleCaptureSnapshot}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-sm rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all cursor-pointer ring-4 ring-white/40"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Take Photo (फोटो खींचें)</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-all cursor-pointer text-xs font-bold flex items-center gap-1"
                    title="Flip Camera"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline">Flip</span>
                  </button>
                </div>
              </div>
            ) : imagePreview ? (
              /* Image Preview Card */
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 aspect-video group">
                <img
                  src={imagePreview}
                  alt="Crop specimen preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-3.5 sm:p-4 text-white">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 bg-emerald-600/90 text-white text-xs font-black px-3 py-1.5 rounded-xl backdrop-blur-sm shadow-md">
                      <CheckCircle2 className="w-4 h-4" /> Photo Attached for AI Scan
                    </span>
                    <button
                      type="button"
                      onClick={handleClearPhoto}
                      className="p-1.5 bg-black/60 hover:bg-rose-600 rounded-xl backdrop-blur-sm transition-colors cursor-pointer"
                      title="Delete Photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200 bg-black/40 backdrop-blur-xs p-2 rounded-xl border border-white/10">
                    <span className="font-bold">{selectedCrop}</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => startCameraStream()}
                        className="text-emerald-300 hover:text-emerald-200 font-bold underline cursor-pointer"
                      >
                        Retake with Live Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="text-slate-300 hover:text-white font-bold underline cursor-pointer"
                      >
                        Replace from Files
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Capture & Upload Selector Options */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={handleDrop}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Option 1: Live Camera Scanner */}
                  <button
                    type="button"
                    onClick={() => startCameraStream()}
                    disabled={isCameraStarting}
                    className="p-5 rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-b from-emerald-50/80 to-emerald-100/40 hover:bg-emerald-100/70 hover:border-emerald-600 transition-all flex flex-col items-center justify-center text-center gap-2.5 cursor-pointer group shadow-2xs disabled:opacity-70"
                  >
                    <div className="w-13 h-13 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      {isCameraStarting ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 group-hover:text-emerald-800">
                        {isCameraStarting ? 'Starting Camera...' : 'Open Live Camera'}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">लाइव कैमरे से फोटो खींचें</p>
                    </div>
                  </button>

                  {/* Option 2: Browse Device Gallery / Files */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="p-5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 hover:bg-slate-100 hover:border-emerald-400 transition-all flex flex-col items-center justify-center text-center gap-2.5 cursor-pointer group shadow-2xs"
                  >
                    <div className="w-13 h-13 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 group-hover:text-slate-800">
                        Upload from Gallery / Files
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">गैलरी या फाइल से चुनें</p>
                    </div>
                  </button>
                </div>

                {/* Hidden Gallery Input (Triggers File Picker) */}
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Camera Notice & Fallback Guide */}
                {cameraError && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <div>
                        <span className="font-extrabold block text-amber-950">Camera Notice</span>
                        <p className="text-amber-800 text-[11px] mt-0.5">{cameraError}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => startCameraStream()}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" /> Retry Live Camera
                        </button>
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-amber-300 text-amber-900 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" /> Upload from Gallery
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Crop Details & Symptoms */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
                2
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Crop Information & Observations</h3>
                <p className="text-xs text-slate-500">फसल का प्रकार एवं दिखाई दे रहे लक्षण</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Crop Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Select Crop (फसल का नाम)
                </label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all cursor-pointer"
                >
                  {CROP_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Growth Stage */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Growth Stage (फसल की अवस्था)
                </label>
                <select
                  value={growthStage}
                  onChange={(e) => setGrowthStage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all cursor-pointer"
                >
                  {STAGE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Observed Symptoms */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Observed Symptoms & Field Notes (लक्षण या समस्या का विवरण)
              </label>
              <textarea
                value={symptomsInput}
                onChange={(e) => setSymptomsInput(e.target.value)}
                placeholder="उदा. पत्तियों पर पीले धब्बे, किनारों का सूखना, तने पर काले निशान, या कीड़े दिखना..."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none"
              />
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Run Analysis Submit Button */}
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={handleRunDiagnosis}
              className={`w-full py-3.5 px-6 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer ${
                isAnalyzing
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.99] shadow-emerald-700/20'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>
                    {analysisStep === 1 && 'Scanning Leaf & Pathogen Patterns...'}
                    {analysisStep === 2 && 'Diagnosing with Gemini 3.7 AI...'}
                    {analysisStep === 3 && 'Formulating Certified Treatment Plan...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Diagnose Crop Health & Get Treatment Plan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Diagnostic Report & Advisory */}
        <div className="lg:col-span-6" ref={resultCardRef}>
          {isAnalyzing ? (
            /* Loading State Skeleton with Step Indicators */
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-sm space-y-6 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Activity className="w-6 h-6 animate-bounce" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-emerald-100 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                </div>
              </div>

              <div className="space-y-3 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>AI Crop Pathology Engine In Progress</span>
                </div>
                <div className="w-full bg-emerald-200/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${analysisStep * 33}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="h-24 bg-slate-100 rounded-2xl" />
                <div className="h-36 bg-slate-100 rounded-2xl" />
              </div>
            </div>
          ) : diagnosisResult ? (
            /* Rich Diagnostic Report Card */
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-emerald-300 shadow-xl space-y-6 animate-fadeIn">
              {/* Header Badge & Audio Speak Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  {(() => {
                    const badge = getSeverityBadge(diagnosisResult.severity);
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${badge.color}`}>
                        <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    );
                  })()}
                  <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {diagnosisResult.confidenceScore}% Confidence
                  </span>
                </div>

                {/* Audio Readout & Action Pill */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSpeech}
                    title={isSpeaking ? 'Stop Reading' : 'Listen Diagnosis (बोलकर सुनें)'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSpeaking
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-700" />}
                    <span>{isSpeaking ? 'Stop Audio' : 'बोलकर सुनें'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    title="Print Diagnostic Report"
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Disease & Crop Identity */}
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase text-emerald-700 tracking-wider">
                  {diagnosisResult.cropName} • {diagnosisResult.growthStage || 'Farm Field Sample'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {diagnosisResult.diseaseName}
                </h2>
                {diagnosisResult.hindiName && (
                  <p className="text-sm font-bold text-emerald-800">
                    हिंदी नाम: {diagnosisResult.hindiName}
                  </p>
                )}
                {diagnosisResult.scientificName && (
                  <p className="text-xs text-slate-400 italic">
                    Scientific: {diagnosisResult.scientificName}
                  </p>
                )}
              </div>

              {/* Diagnostic Summary */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs sm:text-sm text-emerald-950 leading-relaxed font-medium">
                {diagnosisResult.summary}
              </div>

              {/* Visual Symptoms Identified */}
              {diagnosisResult.visualSymptoms && diagnosisResult.visualSymptoms.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    Observed Symptoms (पहचाने गए मुख्य लक्षण)
                  </h4>
                  <div className="grid grid-cols-1 gap-1.5">
                    {diagnosisResult.visualSymptoms.map((sym, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{sym}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Treatment Protocols: Tabs for Organic vs Chemical */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Recommended Treatment Protocol (उपचार योजना)
                </h4>

                {/* 1. Organic & Bio-Solutions */}
                {diagnosisResult.organicTreatments && diagnosisResult.organicTreatments.length > 0 && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-emerald-700" />
                      <h5 className="font-extrabold text-emerald-900 text-xs sm:text-sm">
                        🌿 Organic & Bio-Control (जैविक समाधान)
                      </h5>
                    </div>

                    {diagnosisResult.organicTreatments.map((org, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1 text-xs">
                        <p className="font-extrabold text-slate-900">{org.title}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
                          <span><strong>मात्रा (Dosage):</strong> {org.dosage}</span>
                          {org.applicationMethod && <span><strong>विधि:</strong> {org.applicationMethod}</span>}
                          {org.timing && <span><strong>समय:</strong> {org.timing}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Chemical Fungicide / Insecticide Options */}
                {diagnosisResult.chemicalTreatments && diagnosisResult.chemicalTreatments.length > 0 && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-blue-700" />
                      <h5 className="font-extrabold text-blue-950 text-xs sm:text-sm">
                        🧪 Chemical Spray Solutions (रासायनिक छिड़काव)
                      </h5>
                    </div>

                    {diagnosisResult.chemicalTreatments.map((chem, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-blue-100 space-y-1 text-xs">
                        <p className="font-extrabold text-slate-900">{chem.title}</p>
                        {chem.composition && (
                          <p className="text-[11px] text-blue-700 font-semibold">{chem.composition}</p>
                        )}
                        <div className="space-y-1 text-slate-600 pt-0.5">
                          <p><strong>खुराक व पानी (Dosage):</strong> {chem.dosage}</p>
                          {chem.safetyPrecautions && (
                            <p className="text-amber-700 text-[11px]">
                              ⚠️ <strong>सावधानी:</strong> {chem.safetyPrecautions}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Preventive Measures */}
              {diagnosisResult.preventiveMeasures && diagnosisResult.preventiveMeasures.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h5 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-slate-600" />
                    Preventive Farm Practices (भविष्य में बचाव हेतु उपाय)
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
                    {diagnosisResult.preventiveMeasures.map((prev, idx) => (
                      <li key={idx}>{prev}</li>
                    ))}
                  </ul>
                  {diagnosisResult.harvestSafetyIntervalDays && (
                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      ⏱️ <strong>Pre-Harvest Interval (PHI):</strong> छिड़काव के कम से कम {diagnosisResult.harvestSafetyIntervalDays} दिन बाद तक फसल की कटाई न करें।
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons Hub */}
              <div className="pt-2 space-y-2.5 border-t border-slate-100">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Direct Farm Action Services:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* 1. Ask Krishak AI in Inbox */}
                  <button
                    type="button"
                    onClick={handleAskInChat}
                    className="p-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Ask Krishak AI in Inbox</span>
                  </button>

                  {/* 2. Sync to Farm Expense Ledger */}
                  <button
                    type="button"
                    onClick={handleSyncToLedger}
                    disabled={ledgerAdded}
                    className={`p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                      ledgerAdded
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600 shadow-xs'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>{ledgerAdded ? '✓ Added to Bahi-Khata Ledger' : 'Add Cost to Farm Ledger (खाता)'}</span>
                  </button>

                  {/* 3. Hire Spraying Sahyogi */}
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('sahyogi')}
                      className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200"
                    >
                      <Users className="w-4 h-4 text-emerald-700" />
                      <span>Hire Spraying Sahyogi (श्रमिक)</span>
                    </button>
                  )}

                  {/* 4. Rent Spray Drone / Sprayer */}
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('machinery')}
                      className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200"
                    >
                      <Tractor className="w-4 h-4 text-amber-700" />
                      <span>Rent Sprayer / Spray Drone</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Empty State / Standby Guidance */
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm text-center space-y-5 flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-inner">
                <Leaf className="w-10 h-10" />
              </div>

              <div className="space-y-2 max-w-sm">
                <h3 className="text-lg font-black text-slate-900">
                  Ready for Crop Examination
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Take a live photo using the camera scanner or select from your photo gallery. Our Gemini AI will analyze plant morphology and deliver treatment dosages within seconds.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full max-w-sm pt-2 text-left">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <p className="text-[11px] font-bold text-slate-900">Live Camera</p>
                  <p className="text-[10px] text-slate-400">High-res scanning</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <p className="text-[11px] font-bold text-slate-900">Gemini 3.7</p>
                  <p className="text-[10px] text-slate-400">Pathology AI</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <Volume2 className="w-4 h-4 text-teal-600" />
                  <p className="text-[11px] font-bold text-slate-900">Audio Voice</p>
                  <p className="text-[10px] text-slate-400">Readout in Hindi</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden Canvas for High-Definition Video Capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CropHealthAssistant;

