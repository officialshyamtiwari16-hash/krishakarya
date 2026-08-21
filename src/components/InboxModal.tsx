import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Search, 
  CheckCheck, 
  ShieldCheck, 
  ChevronLeft, 
  Smile, 
  Mic, 
  Trash2, 
  PhoneCall, 
  MapPin, 
  CheckCircle2, 
  Play, 
  Pause, 
  FileText, 
  Sparkles, 
  Bot, 
  Zap, 
  Camera, 
  Plus,
  RotateCcw,
  ExternalLink,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Paperclip,
  Maximize2,
  Minimize2,
  History,
  Eye,
  Download,
  Trash,
  Info,
  Calendar,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { User, ChatMessage, Conversation } from '../types';
import { askKrishakAiChat, getAiQuota } from '../lib/aiService';
import { getDeviceLocation } from '../lib/locationService';

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  initialChatParticipant?: { id: string; name: string; phone?: string; image?: string; role?: string } | null;
  presetPrompt?: string | null;
}

const KRISHAK_AI_CONV: Conversation = {
  id: 'conv_krishak_ai',
  participantId: 'krishak_ai_bot',
  participantName: 'Krishak A.I',
  participantRole: 'Agronomist & Farming Assistant',
  participantPhone: 'AI Assistant',
  participantImage: 'https://images.unsplash.com/photo-1595838788320-a6a3b2b36e8b?w=150&auto=format&fit=crop&q=80',
  lastMessage: 'फसल रोग, खाद, सिंचाई व मौसम की सलाह...',
  lastMessageTime: 'Live',
  unreadCount: 0,
};

const getWelcomeMessage = (userName?: string): ChatMessage => ({
  id: 'msg_ai_welcome',
  conversationId: 'conv_krishak_ai',
  senderId: 'krishak_ai_bot',
  senderName: 'Krishak A.I',
  receiverId: 'usr_current',
  receiverName: userName || 'Farmer',
  text: `🌾 **नमस्ते ${userName ? userName + ' जी' : ''}!**\n\nमैं आपका **कृषक ए.आई (Krishak A.I)** सहायक हूँ।\n• 🌿 **फसल रोग व उपचार**\n• 💧 **खाद व पोषण प्रबंधन**\n• 🚜 **मशीनरी व मजदूरी दरें**\n• 🏛️ **सरकारी कृषि योजनाएं**\n\nनीचे दिए गए सुझाव चुनें या अपना सवाल लिखकर/बोलकर पूछें।`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  isRead: true,
  msgType: 'text',
});

export const InboxModal: React.FC<InboxModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialChatParticipant = null,
  presetPrompt = null,
}) => {
  // Persistence state management
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('krishakarya_conversations') || localStorage.getItem('krishikulture_conversations');
    let list: Conversation[] = [KRISHAK_AI_CONV];
    if (saved) {
      try {
        const parsed: Conversation[] = JSON.parse(saved);
        const nonAi = parsed.filter(c => 
          c && 
          c.id !== 'conv_krishak_ai' && 
          !['conv_1', 'conv_2', 'conv_3', 'conv_demo_1', 'conv_demo_2'].includes(c.id)
        );
        list = [KRISHAK_AI_CONV, ...nonAi];
      } catch {
        list = [KRISHAK_AI_CONV];
      }
    }
    return list;
  });

  const [allMessages, setAllMessages] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem('krishakarya_messages') || localStorage.getItem('krishikulture_messages');
    const welcome = getWelcomeMessage(currentUser?.name);
    let map: Record<string, ChatMessage[]> = {
      conv_krishak_ai: [welcome]
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        delete parsed['conv_1'];
        delete parsed['conv_2'];
        delete parsed['conv_3'];
        delete parsed['conv_demo_1'];
        delete parsed['conv_demo_2'];
        
        // Clean out any old welcome messages that had "राम राम"
        if (parsed.conv_krishak_ai) {
          parsed.conv_krishak_ai = parsed.conv_krishak_ai.map((m: ChatMessage) => {
            if (m.id === 'msg_ai_welcome' || m.text.includes('राम राम')) {
              return {
                ...m,
                text: m.text.replace(/राम राम\s*(किसान भाई|.+?जी)?!*/g, `नमस्ते ${currentUser?.name ? currentUser.name + ' जी' : ''}!`).replace(/राम राम/g, 'नमस्ते')
              };
            }
            return m;
          });
        }

        if (!parsed.conv_krishak_ai || parsed.conv_krishak_ai.length === 0) {
          parsed.conv_krishak_ai = [welcome];
        }
        map = parsed;
      } catch {
        map = { conv_krishak_ai: [welcome] };
      }
    }
    return map;
  });

  const [activeConversationId, setActiveConversationId] = useState<string>('conv_krishak_ai');
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'ai' | 'sahyogi' | 'machinery'>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // AI specific state
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiQuota, setAiQuota] = useState({ remaining: 50, limit: 50, used: 0 });

  // History Management & Transcript Viewer State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'ai' | 'sahyogi' | 'machinery' | 'quotes'>('all');
  const [viewingTranscriptConvId, setViewingTranscriptConvId] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const [confirmDeleteConvId, setConfirmDeleteConvId] = useState<string | null>(null);
  const [transcriptCopied, setTranscriptCopied] = useState(false);

  // Modals, Popovers & Media Preview
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  
  // Voice recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // New Chat form state
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newBookingType, setNewBookingType] = useState('Sahyogi Labor');
  const [newRecipientPhone, setNewRecipientPhone] = useState('');

  // Booking Confirmation Form state
  const [bookingTitle, setBookingTitle] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingDuration, setBookingDuration] = useState('1 Day');
  const [bookingRate, setBookingRate] = useState('500');
  const [bookingLocation, setBookingLocation] = useState(
    currentUser?.village ? `${currentUser.village}, ${currentUser.district || ''}` : 'Farm Field'
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [inputText]);

  // Fetch AI Quota on open
  useEffect(() => {
    if (isOpen) {
      getAiQuota(currentUser?.id || currentUser?.username).then(setAiQuota);
    }
  }, [isOpen, currentUser]);

  // Voice recording timer
  useEffect(() => {
    if (isRecordingVoice) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecordingVoice]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('krishakarya_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('krishakarya_messages', JSON.stringify(allMessages));
  }, [allMessages]);

  // Handle Preset Prompt from external buttons
  useEffect(() => {
    if (isOpen && presetPrompt) {
      setActiveConversationId('conv_krishak_ai');
      setInputText(presetPrompt);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 150);
    }
  }, [isOpen, presetPrompt]);

  // Handle initial participant passed from parent
  useEffect(() => {
    if (initialChatParticipant && isOpen) {
      const existing = conversations.find((c) => c.participantId === initialChatParticipant.id);
      if (existing) {
        setActiveConversationId(existing.id);
      } else {
        const newConvId = `conv_${Date.now()}`;
        const phone = initialChatParticipant.phone || '';
        const newConv: Conversation = {
          id: newConvId,
          participantId: initialChatParticipant.id,
          participantName: initialChatParticipant.name,
          participantRole: initialChatParticipant.role || 'Sahyogi Labor',
          participantPhone: phone,
          participantImage: initialChatParticipant.image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          lastMessage: 'Conversation opened',
          lastMessageTime: 'Just now',
          unreadCount: 0,
        };
        setConversations((prev) => [KRISHAK_AI_CONV, newConv, ...prev.filter(c => c.id !== 'conv_krishak_ai')]);
        setAllMessages((prev) => ({
          ...prev,
          [newConvId]: [
            {
              id: `msg_${Date.now()}`,
              conversationId: newConvId,
              senderId: 'system',
              senderName: 'System',
              receiverId: currentUser?.id || 'usr_current',
              receiverName: currentUser?.name || 'Farmer',
              text: `Connected with ${initialChatParticipant.name} (${initialChatParticipant.role || 'Service Provider'}). Discuss requirements and booking quotes below.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isRead: true,
            },
          ],
        }));
        setActiveConversationId(newConvId);
      }
    }
  }, [initialChatParticipant, isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversationId, allMessages, isAiTyping]);

  const currentConv = conversations.find((c) => c.id === activeConversationId) || KRISHAK_AI_CONV;
  const activeMessages = activeConversationId ? allMessages[activeConversationId] || [] : [];
  const isAiActive = activeConversationId === 'conv_krishak_ai';

  // Helper to append a message
  const appendMessage = (newMsg: ChatMessage, convId: string) => {
    setAllMessages((prev) => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMsg],
    }));

    const previewText = newMsg.msgType === 'booking_card'
      ? `📋 Quote: ${newMsg.bookingDetails?.title || 'Booking'}`
      : newMsg.msgType === 'location'
      ? '📍 Field Location'
      : newMsg.msgType === 'voice_note'
      ? '🎙️ Voice Note'
      : newMsg.msgType === 'image'
      ? '📷 Photo Attached'
      : newMsg.text;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              lastMessage: previewText.length > 45 ? previewText.substring(0, 45) + '...' : previewText,
              lastMessageTime: newMsg.timestamp,
              unreadCount: 0,
            }
          : c
      )
    );
  };

  // Text-To-Speech
  const handleToggleSpeak = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingMsgId(msgId);

    const cleanText = text.replace(/\*\*/g, '').replace(/[•\-#]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    const isHindiText = /[\u0900-\u097F]/.test(cleanText);
    utterance.lang = isHindiText ? 'hi-IN' : 'en-IN';

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Delete an individual message from conversation
  const handleDeleteMessage = (msgId: string, convId: string) => {
    setAllMessages((prev) => {
      const msgs = (prev[convId] || []).filter((m) => m.id !== msgId);
      
      // Update last message in conversation list
      if (msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        const previewText = last.msgType === 'booking_card'
          ? `📋 Quote: ${last.bookingDetails?.title || 'Booking'}`
          : last.msgType === 'location'
          ? '📍 Field Location'
          : last.msgType === 'voice_note'
          ? '🎙️ Voice Note'
          : last.msgType === 'image'
          ? '📷 Photo Attached'
          : last.text;

        setConversations((cPrev) =>
          cPrev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  lastMessage: previewText.length > 45 ? previewText.substring(0, 45) + '...' : previewText,
                  lastMessageTime: last.timestamp,
                }
              : c
          )
        );
      } else {
        setConversations((cPrev) =>
          cPrev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  lastMessage: 'No messages yet',
                  lastMessageTime: '',
                }
              : c
          )
        );
      }

      return {
        ...prev,
        [convId]: msgs,
      };
    });
  };

  const handleClearChatHistory = (targetConvId?: string) => {
    const convIdToClear = targetConvId || activeConversationId;
    if (!convIdToClear) return;

    if (convIdToClear === 'conv_krishak_ai' || convIdToClear === 'ai_krishak_advisor') {
      const welcome = getWelcomeMessage(currentUser?.name);
      setAllMessages((prev) => ({ ...prev, conv_krishak_ai: [welcome] }));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === 'conv_krishak_ai'
            ? { ...c, lastMessage: 'फसल रोग, खाद, सिंचाई व मौसम की सलाह...', lastMessageTime: 'Live' }
            : c
        )
      );
    } else {
      setAllMessages((prev) => ({ ...prev, [convIdToClear]: [] }));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convIdToClear
            ? { ...c, lastMessage: 'Chat cleared', lastMessageTime: 'Just now' }
            : c
        )
      );
    }
    setShowClearChatConfirm(false);
  };

  // Clear ALL conversations and reset all chat history
  const handleClearAllHistory = () => {
    const welcome = getWelcomeMessage(currentUser?.name);
    setConversations([KRISHAK_AI_CONV]);
    setAllMessages({ conv_krishak_ai: [welcome] });
    setActiveConversationId('conv_krishak_ai');
    setShowClearAllConfirm(false);
    setShowHistoryModal(false);
    localStorage.removeItem('krishakarya_conversations');
    localStorage.removeItem('krishakarya_messages');
  };

  // Generate & export transcript text
  const getConversationTranscript = (convId: string): string => {
    const conv = conversations.find((c) => c.id === convId) || KRISHAK_AI_CONV;
    const msgs = allMessages[convId] || [];
    
    let text = `========================================\n`;
    text += `🌾 KRISHAKARYA - CHAT TRANSCRIPT & LOGS\n`;
    text += `Participant: ${conv.participantName} (${conv.participantRole || 'General'})\n`;
    text += `Phone: ${conv.participantPhone || 'N/A'}\n`;
    text += `Date Exported: ${new Date().toLocaleString()}\n`;
    text += `Total Messages: ${msgs.length}\n`;
    text += `========================================\n\n`;

    if (msgs.length === 0) {
      text += `[No messages in this chat session]\n`;
      return text;
    }

    msgs.forEach((m) => {
      text += `[${m.timestamp}] ${m.senderName}: `;
      if (m.msgType === 'booking_card' && m.bookingDetails) {
        text += `[BOOKING QUOTE] ${m.bookingDetails.title} | Amount: ₹${m.bookingDetails.totalAmount} | Date: ${m.bookingDetails.startDate} | Status: ${m.bookingDetails.status}\n`;
      } else if (m.msgType === 'location' && m.locationData) {
        text += `[LOCATION SHARED] ${m.locationData.addressStr}\n`;
      } else if (m.msgType === 'voice_note') {
        text += `[VOICE NOTE] Audio Duration: ${m.voiceDuration || 'Recorded'}\n`;
      } else if (m.msgType === 'image') {
        text += `[PHOTO ATTACHED] ${m.text || 'Crop Image'} (${m.imageUrl || 'attachment'})\n`;
      } else {
        text += `${m.text}\n`;
      }
      text += `\n`;
    });

    return text;
  };

  const handleCopyTranscript = (convId: string) => {
    const transcript = getConversationTranscript(convId);
    navigator.clipboard.writeText(transcript);
    setTranscriptCopied(true);
    setTimeout(() => setTranscriptCopied(false), 2000);
  };

  const handleDownloadTranscript = (convId: string) => {
    const conv = conversations.find((c) => c.id === convId) || KRISHAK_AI_CONV;
    const transcript = getConversationTranscript(convId);
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `krishakarya_chat_${conv.participantName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Sending text message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || !activeConversationId) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId: activeConversationId,
      senderId: currentUser?.id || 'usr_current',
      senderName: currentUser?.name || 'Farmer',
      receiverId: currentConv.participantId,
      receiverName: currentConv.participantName,
      text: textToSend,
      timestamp: timeStr,
      isRead: true,
      msgType: 'text',
    };

    appendMessage(userMsg, activeConversationId);
    if (!customText) setInputText('');

    // Handle AI Responses
    if (isAiActive) {
      setIsAiTyping(true);
      try {
        const historyForAi = activeMessages
          .filter(m => m.msgType === 'text')
          .slice(-10)
          .map(m => ({
            role: m.senderId === 'krishak_ai_bot' ? ('assistant' as const) : ('user' as const),
            content: m.text,
          }));

        const result = await askKrishakAiChat(textToSend, historyForAi, currentUser);
        setIsAiTyping(false);

        const aiMsg: ChatMessage = {
          id: `msg_ai_${Date.now()}`,
          conversationId: 'conv_krishak_ai',
          senderId: 'krishak_ai_bot',
          senderName: 'Krishak A.I',
          receiverId: currentUser?.id || 'usr_current',
          receiverName: currentUser?.name || 'Farmer',
          text: result.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: true,
          msgType: 'text',
        };

        appendMessage(aiMsg, 'conv_krishak_ai');
        getAiQuota(currentUser?.id || currentUser?.username).then(setAiQuota);
      } catch {
        setIsAiTyping(false);
        const fallbackMsg: ChatMessage = {
          id: `msg_ai_err_${Date.now()}`,
          conversationId: 'conv_krishak_ai',
          senderId: 'krishak_ai_bot',
          senderName: 'Krishak A.I',
          receiverId: currentUser?.id || 'usr_current',
          receiverName: currentUser?.name || 'Farmer',
          text: 'कृषि नेटवर्क में अस्थाई समस्या है। कृपया कुछ देर बाद पुनः प्रयास करें।',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: true,
          msgType: 'text',
        };
        appendMessage(fallbackMsg, 'conv_krishak_ai');
      }
    } else {
      // Simulate practical response for direct chats
      triggerDirectReply(activeConversationId, currentConv);
    }
  };

  // Send Booking Quote Card
  const handleSendBookingCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversationId) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const bookingMsg: ChatMessage = {
      id: `msg_bkg_${Date.now()}`,
      conversationId: activeConversationId,
      senderId: currentUser?.id || 'usr_current',
      senderName: currentUser?.name || 'Farmer',
      receiverId: currentConv.participantId,
      receiverName: currentConv.participantName,
      text: `📋 Booking Quote Request: ₹${bookingRate}`,
      timestamp: timeStr,
      isRead: true,
      msgType: 'booking_card',
      bookingDetails: {
        title: bookingTitle || `${currentConv.participantRole || 'Agricultural Work'}`,
        category: currentConv.participantRole || 'Agriculture Service',
        startDate: bookingDate,
        duration: bookingDuration,
        totalAmount: Number(bookingRate) || 500,
        status: 'Pending',
        location: bookingLocation || 'Farm Field',
      },
    };

    appendMessage(bookingMsg, activeConversationId);
    setShowBookingModal(false);
  };

  const handleUpdateBookingStatus = (msgId: string, newStatus: 'Confirmed' | 'Cancelled') => {
    if (!activeConversationId) return;

    setAllMessages((prev) => {
      const msgs = prev[activeConversationId] || [];
      return {
        ...prev,
        [activeConversationId]: msgs.map((m) =>
          m.id === msgId && m.bookingDetails
            ? { ...m, bookingDetails: { ...m.bookingDetails, status: newStatus } }
            : m
        ),
      };
    });
  };

  // GPS Location Sharing
  const handleSendLocation = async () => {
    if (!activeConversationId) return;
    setIsLocating(true);
    setShowAttachMenu(false);

    const loc = await getDeviceLocation();
    setIsLocating(false);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const locStr = loc.address || `${loc.village}, ${loc.district}, ${loc.state}`;

    const locMsg: ChatMessage = {
      id: `msg_loc_${Date.now()}`,
      conversationId: activeConversationId,
      senderId: currentUser?.id || 'usr_current',
      senderName: currentUser?.name || 'Farmer',
      receiverId: currentConv.participantId,
      receiverName: currentConv.participantName,
      text: `📍 Farm Field Location: ${locStr}`,
      timestamp: timeStr,
      isRead: true,
      msgType: 'location',
      locationData: {
        village: loc.village || 'Farm Field',
        district: loc.district || 'Location',
        addressStr: locStr,
      }
    };

    appendMessage(locMsg, activeConversationId);

    if (isAiActive) {
      setIsAiTyping(true);
      setTimeout(async () => {
        const aiPrompt = `Farmer shared field location: ${locStr}. Give concise local weather advice and recommended farming task for today.`;
        const res = await askKrishakAiChat(aiPrompt, [], currentUser);
        setIsAiTyping(false);
        const aiReply: ChatMessage = {
          id: `msg_ai_loc_${Date.now()}`,
          conversationId: 'conv_krishak_ai',
          senderId: 'krishak_ai_bot',
          senderName: 'Krishak A.I',
          receiverId: currentUser?.id || 'usr_current',
          receiverName: currentUser?.name || 'Farmer',
          text: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: true,
          msgType: 'text',
        };
        appendMessage(aiReply, 'conv_krishak_ai');
      }, 700);
    }
  };

  // Photo Attachment
  const handlePhotoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversationId) return;
    setShowAttachMenu(false);

    const reader = new FileReader();
    reader.onload = () => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const photoMsg: ChatMessage = {
        id: `msg_img_${Date.now()}`,
        conversationId: activeConversationId,
        senderId: currentUser?.id || 'usr_current',
        senderName: currentUser?.name || 'Farmer',
        receiverId: currentConv.participantId,
        receiverName: currentConv.participantName,
        text: file.name || 'Crop / Field Photo',
        timestamp: timeStr,
        isRead: true,
        msgType: 'image',
        imageUrl: reader.result as string,
      };

      appendMessage(photoMsg, activeConversationId);

      if (isAiActive) {
        setIsAiTyping(true);
        setTimeout(async () => {
          const aiPrompt = `Diagnose crop health and pest/fungal symptoms from this uploaded farm photo and suggest treatment dosage.`;
          const res = await askKrishakAiChat(aiPrompt, [], currentUser);
          setIsAiTyping(false);
          const aiReply: ChatMessage = {
            id: `msg_ai_photo_${Date.now()}`,
            conversationId: 'conv_krishak_ai',
            senderId: 'krishak_ai_bot',
            senderName: 'Krishak A.I',
            receiverId: currentUser?.id || 'usr_current',
            receiverName: currentUser?.name || 'Farmer',
            text: res.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: true,
            msgType: 'text',
          };
          appendMessage(aiReply, 'conv_krishak_ai');
        }, 900);
      }
    };
    reader.readAsDataURL(file);
  };

  // Voice Note
  const handleFinishVoiceRecording = () => {
    if (!activeConversationId) return;
    setIsRecordingVoice(false);

    const durationSec = Math.max(2, recordingSeconds);
    const min = Math.floor(durationSec / 60);
    const sec = durationSec % 60;
    const durationStr = `${min}:${sec < 10 ? '0' : ''}${sec}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const voiceMsg: ChatMessage = {
      id: `msg_voice_${Date.now()}`,
      conversationId: activeConversationId,
      senderId: currentUser?.id || 'usr_current',
      senderName: currentUser?.name || 'Farmer',
      receiverId: currentConv.participantId,
      receiverName: currentConv.participantName,
      text: `🎙️ Voice Note (${durationStr})`,
      timestamp: timeStr,
      isRead: true,
      msgType: 'voice_note',
      voiceDuration: durationStr,
    };

    appendMessage(voiceMsg, activeConversationId);

    if (isAiActive) {
      setIsAiTyping(true);
      setTimeout(async () => {
        const aiPrompt = `किसान का ऑडियो प्रश्न प्राप्त हुआ है। प्रमुख फसलों के खाद, कीट प्रबंधन और वर्तमान मौसम की व्यावहारिक सलाह संक्षेप में दें।`;
        const res = await askKrishakAiChat(aiPrompt, [], currentUser);
        setIsAiTyping(false);
        const aiReply: ChatMessage = {
          id: `msg_ai_voice_ans_${Date.now()}`,
          conversationId: 'conv_krishak_ai',
          senderId: 'krishak_ai_bot',
          senderName: 'Krishak A.I',
          receiverId: currentUser?.id || 'usr_current',
          receiverName: currentUser?.name || 'Farmer',
          text: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: true,
          msgType: 'text',
        };
        appendMessage(aiReply, 'conv_krishak_ai');
      }, 1000);
    }
  };

  // Direct chat response simulation
  const triggerDirectReply = (convId: string, conv: Conversation) => {
    setTimeout(() => {
      const isMachinery = conv.participantRole?.toLowerCase().includes('machin') || conv.participantRole?.toLowerCase().includes('tractor');
      
      const replyOptions = isMachinery ? [
        "नमस्ते! मशीनरी उपलब्ध है। समय और खेत की लोकेशन पक्की कर लें।",
        "रेट वाजिब रहेगा। आप बुकिंग कोट भेज सकते हैं।",
      ] : [
        "नमस्ते! संदेश मिल गया है। समय पर कार्य हेतु उपलब्ध हैं।",
        "जी ठीक है, खेत का पता व कार्य विवरण साझा कर दें।",
      ];

      const reply = replyOptions[Math.floor(Math.random() * replyOptions.length)];
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const replyMsg: ChatMessage = {
        id: `msg_reply_${Date.now()}`,
        conversationId: convId,
        senderId: conv.participantId,
        senderName: conv.participantName,
        receiverId: currentUser?.id || 'usr_current',
        receiverName: currentUser?.name || 'Farmer',
        text: reply,
        timestamp: replyTime,
        isRead: true,
        msgType: 'text',
      };

      appendMessage(replyMsg, convId);
    }, 1800);
  };

  const handleStartNewChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipientName.trim()) return;

    const newConvId = `conv_${Date.now()}`;
    const phone = newRecipientPhone.trim();
    const newConv: Conversation = {
      id: newConvId,
      participantId: `usr_${Date.now()}`,
      participantName: newRecipientName,
      participantRole: newBookingType,
      participantPhone: phone,
      participantImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      lastMessage: 'Chat initialized',
      lastMessageTime: 'Just now',
      unreadCount: 0,
    };

    setConversations((prev) => [KRISHAK_AI_CONV, newConv, ...prev.filter(c => c.id !== 'conv_krishak_ai')]);
    setAllMessages((prev) => ({
      ...prev,
      [newConvId]: [
        {
          id: `msg_${Date.now()}`,
          conversationId: newConvId,
          senderId: 'system',
          senderName: 'System',
          receiverId: currentUser?.id || 'usr_current',
          receiverName: currentUser?.name || 'Farmer',
          text: `Chat started with ${newRecipientName} (${newBookingType}).`,
          timestamp: 'Just now',
          isRead: true,
          msgType: 'text',
        },
      ],
    }));

    setActiveConversationId(newConvId);
    setShowNewChatModal(false);
    setNewRecipientName('');
    setNewRecipientPhone('');
    setNewBookingType('Sahyogi Labor');
  };

  const handleDeleteConversation = (convId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (convId === 'conv_krishak_ai') {
      handleClearChatHistory('conv_krishak_ai');
      return;
    }
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    setAllMessages((prev) => {
      const copy = { ...prev };
      delete copy[convId];
      return copy;
    });
    if (activeConversationId === convId) {
      setActiveConversationId('conv_krishak_ai');
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterCategory === 'ai') return c.id === 'conv_krishak_ai';
    if (filterCategory === 'sahyogi') {
      return matchesSearch && (c.participantRole?.toLowerCase().includes('sahyogi') || c.participantRole?.toLowerCase().includes('labor'));
    }
    if (filterCategory === 'machinery') {
      return matchesSearch && (c.participantRole?.toLowerCase().includes('machin') || c.participantRole?.toLowerCase().includes('tractor'));
    }
    return matchesSearch;
  });

  const aiQuickPrompts = [
    { icon: '🌾', label: 'Urea Dose', prompt: 'गेहूँ में यूरिया व नैनो डीएपी की सही खुराक बताएं।' },
    { icon: '🐛', label: 'Pest Remedy', prompt: 'धान व सब्जियों में कीट नियंत्रण का तुरंत उपाय बताएं।' },
    { icon: '🚜', label: 'Tractor Rates', prompt: 'ट्रैक्टर जुताई व थ्रेशर का प्रचलित किराया क्या है?' },
    { icon: '🏛️', label: 'Govt Schemes', prompt: 'पीएम किसान और फसल बीमा के मुख्य नियम बताएं।' },
    { icon: '💧', label: 'Drip Subsidy', prompt: 'ड्रिप व स्प्रिंकलर सिंचाई पर सब्सिडी कैसे पाएं?' }
  ];

  const quickReplies = [
    { label: "🌾 Availability", text: "नमस्ते! क्या कल कार्य हेतु उपलब्धता है?" },
    { label: "💰 Daily Rate", text: "प्रति एकड़ / प्रति दिन का क्या किराया लगेगा?" },
    { label: "⏰ Morning Shift", text: "कल सुबह 6:00 बजे खेत पर काम शुरू करना है।" },
    { label: "📍 Share Location", text: "खेत की लोकेशन भेज दी गई है।" }
  ];

  // Markdown renderer
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1 text-xs sm:text-[13px] leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-0.5" />;
          
          if (line.startsWith('### ')) {
            return (
              <h5 key={idx} className="font-bold text-amber-300 text-[11px] sm:text-xs mt-1 pt-0.5 border-t border-emerald-500/20">
                {renderBoldInline(line.replace('### ', ''))}
              </h5>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h4 key={idx} className="font-bold text-white text-xs sm:text-sm mt-1.5 pb-0.5 border-b border-emerald-500/30">
                {renderBoldInline(line.replace('## ', ''))}
              </h4>
            );
          }

          if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
            const cleanContent = line.replace(/^[•\-\*]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-0.5">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span className="text-slate-100">{renderBoldInline(cleanContent)}</span>
              </div>
            );
          }

          const numMatch = line.match(/^(\d+)\.\s*(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-0.5">
                <span className="text-amber-400 font-bold text-[9px] px-1 py-0.2 bg-amber-400/10 rounded border border-amber-400/20 shrink-0">
                  {numMatch[1]}
                </span>
                <span className="text-slate-100">{renderBoldInline(numMatch[2])}</span>
              </div>
            );
          }

          return <div key={idx} className="text-slate-100">{renderBoldInline(line)}</div>;
        })}
      </div>
    );
  };

  const renderBoldInline = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-white bg-white/5 px-1 py-0.2 rounded">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-1.5 sm:p-3 md:p-4'} bg-black/80 backdrop-blur-xs overflow-hidden`}>
      
      {/* Compact Container Frame */}
      <div className={`w-full h-full ${isFullscreen ? 'max-w-none rounded-none' : 'sm:max-w-4xl lg:max-w-5xl sm:h-[86vh] sm:max-h-[760px] sm:rounded-2xl'} bg-[#0c1317] text-slate-100 flex flex-col overflow-hidden sm:border border-[#222d34] shadow-2xl animate-fadeIn`}>
        
        {/* Compact Header */}
        <header className="h-11 sm:h-12 bg-[#111b21] border-b border-[#222d34] px-2.5 sm:px-3.5 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 sm:px-2 sm:py-1 bg-[#202c33] hover:bg-[#2a3942] text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1 border border-[#2e3b43] cursor-pointer"
              title="Close Inbox"
            >
              <ChevronLeft className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-xs">
                <MessageSquare className="w-3.5 h-3.5 text-slate-950" />
              </div>
              <div>
                <h1 className="font-bold text-xs sm:text-sm tracking-tight text-white flex items-center gap-1">
                  <span className="text-emerald-400">Krishakarya</span> Inbox
                </h1>
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {isAiActive && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-400/10 border border-amber-400/30 text-amber-300 rounded-lg text-[10px] sm:text-[11px] font-semibold">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>{aiQuota.remaining} left</span>
              </div>
            )}

            {/* Chat History & Views Button */}
            <button
              onClick={() => {
                setViewingTranscriptConvId(null);
                setShowHistoryModal(true);
              }}
              className="px-2 sm:px-2.5 py-1 bg-[#202c33] hover:bg-[#2a3942] text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1 border border-[#2e3b43] cursor-pointer"
              title="View Chat History & Records"
            >
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">History</span>
            </button>

            <button
              onClick={() => setShowNewChatModal(true)}
              className="px-2.5 py-1 bg-[#00a884] hover:bg-[#008f6f] text-slate-950 font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
              title="Start New Chat"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">New</span>
            </button>

            {/* Toggle Fullscreen / Compact Window */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:flex p-1 text-[#8696a0] hover:text-white hover:bg-[#202c33] rounded-lg transition-all cursor-pointer"
              title={isFullscreen ? "Compact view" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1 text-[#8696a0] hover:text-white hover:bg-[#202c33] rounded-lg transition-all cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Split Layout: Compact Sidebar + Active Chat */}
        <div className="flex-1 min-h-0 flex bg-[#0c1317] overflow-hidden">
          
          {/* Left Column: Compact Conversations Sidebar */}
          <aside 
            className={`w-full md:w-64 lg:w-72 bg-[#111b21] border-r border-[#222d34] flex flex-col flex-shrink-0 transition-all duration-200 ${
              activeConversationId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search & Categories */}
            <div className="p-2 border-b border-[#222d34] space-y-1.5 bg-[#111b21]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8696a0] absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full pl-7 pr-2.5 py-1 bg-[#202c33] text-slate-100 placeholder-[#8696a0] rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884] border border-transparent"
                />
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    filterCategory === 'all'
                      ? 'bg-[#00a884] text-slate-950 font-bold'
                      : 'bg-[#202c33] text-[#8696a0] hover:text-white'
                  }`}
                >
                  All ({conversations.length})
                </button>
                <button
                  onClick={() => setFilterCategory('ai')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                    filterCategory === 'ai'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'bg-[#202c33] text-amber-300 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-2.5 h-2.5" /> AI
                </button>
                <button
                  onClick={() => setFilterCategory('sahyogi')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    filterCategory === 'sahyogi'
                      ? 'bg-[#00a884] text-slate-950 font-bold'
                      : 'bg-[#202c33] text-[#8696a0] hover:text-white'
                  }`}
                >
                  Sahyogi
                </button>
                <button
                  onClick={() => setFilterCategory('machinery')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    filterCategory === 'machinery'
                      ? 'bg-[#00a884] text-slate-950 font-bold'
                      : 'bg-[#202c33] text-[#8696a0] hover:text-white'
                  }`}
                >
                  Machinery
                </button>
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#222d34]/40">
              {filteredConversations.length === 0 ? (
                <div className="p-5 text-center text-[#8696a0] space-y-1">
                  <MessageSquare className="w-5 h-5 mx-auto text-slate-600" />
                  <p className="text-xs font-semibold">No chats found</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  const isAiItem = conv.id === 'conv_krishak_ai';

                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setActiveConversationId(conv.id);
                        setConversations((prev) =>
                          prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
                        );
                      }}
                      className={`w-full p-2 text-left flex items-center gap-2 transition-all cursor-pointer group relative border-l-2.5 ${
                        isActive 
                          ? isAiItem 
                            ? 'bg-[#183326] border-emerald-400' 
                            : 'bg-[#2a3942] border-[#00a884]' 
                          : isAiItem 
                          ? 'bg-[#13241c]/40 hover:bg-[#183326]/70 border-transparent' 
                          : 'hover:bg-[#202c33] border-transparent'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        {isAiItem ? (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 flex items-center justify-center shadow-xs">
                            <Bot className="w-4 h-4 text-slate-950" />
                          </div>
                        ) : (
                          <img
                            src={conv.participantImage}
                            alt={conv.participantName}
                            className="w-8 h-8 rounded-full object-cover border border-[#222d34]"
                          />
                        )}
                        <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#25D366] border border-[#111b21] rounded-full" />
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-100 truncate flex items-center gap-1">
                            {conv.participantName}
                            {isAiItem && (
                              <span className="px-1 py-0.2 bg-amber-400/20 text-amber-300 text-[8px] font-black rounded">
                                AI
                              </span>
                            )}
                          </h4>
                          <span className="text-[9px] text-[#8696a0]">
                            {conv.lastMessageTime}
                          </span>
                        </div>
                        <p className="text-[9px] text-[#00a884] font-medium truncate">
                          {conv.participantRole}
                        </p>
                        <p className="text-[10px] text-[#8696a0] truncate">
                          {conv.lastMessage}
                        </p>
                      </div>

                      {/* Delete conversation */}
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="absolute right-1.5 p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded hover:bg-white/5"
                        title={isAiItem ? "Clear AI Chat" : "Delete Chat"}
                      >
                        {isAiItem ? <RotateCcw className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* Right Column: Compact Chat Area */}
          <main className={`flex-1 flex flex-col bg-[#0b141a] relative ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
            
            {/* Active Header */}
            <div className={`px-3 py-2 sm:px-4 border-b border-[#222d34] flex items-center justify-between gap-2 shadow-xs z-10 ${
              isAiActive ? 'bg-[#14261e]' : 'bg-[#202c33]'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => setActiveConversationId('')}
                  className="md:hidden p-1 text-[#8696a0] hover:text-white rounded-lg cursor-pointer"
                  title="Back"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="relative flex-shrink-0">
                  {isAiActive ? (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 flex items-center justify-center shadow-xs">
                      <Bot className="w-4 h-4 text-slate-950" />
                    </div>
                  ) : (
                    <img
                      src={currentConv.participantImage}
                      alt={currentConv.participantName}
                      className="w-8 h-8 rounded-full object-cover border border-[#222d34]"
                    />
                  )}
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#25D366] border border-[#202c33] rounded-full" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-xs sm:text-sm font-bold text-slate-100 truncate flex items-center gap-1">
                    {currentConv.participantName}
                    {isAiActive ? (
                      <Sparkles className="w-3 h-3 text-amber-300" />
                    ) : (
                      <ShieldCheck className="w-3 h-3 text-[#00a884]" />
                    )}
                  </h2>
                  <p className="text-[10px] text-[#25D366] font-medium truncate">
                    {isAiActive ? 'Krishak A.I • Gemini 2.5' : currentConv.participantRole}
                  </p>
                </div>
              </div>

              {/* Chat Top Actions */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                {/* Transcript / History Viewer for Active Chat */}
                <button
                  onClick={() => {
                    setViewingTranscriptConvId(activeConversationId);
                    setShowHistoryModal(true);
                  }}
                  className="px-2 py-1 bg-[#202c33] hover:bg-[#2a3942] text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-[#2e3b43] transition-all cursor-pointer"
                  title="View Transcript & Log"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Transcript</span>
                </button>

                {isAiActive ? (
                  <>
                    <button
                      onClick={() => setShowClearChatConfirm(true)}
                      className="px-2 py-1 bg-[#1a3327] hover:bg-emerald-800 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-emerald-700/40 transition-all cursor-pointer"
                      title="Reset AI Session"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                    <button
                      onClick={() => setShowClearChatConfirm(true)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                      title="Clear AI Chat History"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    {currentConv.participantPhone && (
                      <a
                        href={`tel:${currentConv.participantPhone}`}
                        className="p-1.5 sm:px-2.5 sm:py-1 bg-[#2a3942] hover:bg-[#00a884] hover:text-slate-950 text-[#00a884] rounded-lg transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        title={`Call ${currentConv.participantPhone}`}
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">{currentConv.participantPhone}</span>
                      </a>
                    )}

                    <button
                      onClick={() => {
                        setBookingTitle(`${currentConv.participantRole || 'Work Booking'}`);
                        setShowBookingModal(true);
                      }}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-lg border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3 h-3" />
                      <span className="hidden sm:inline">Booking Quote</span>
                    </button>

                    <button
                      onClick={() => setShowClearChatConfirm(true)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                      title="Clear Chat Messages"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Messages Scroll Canvas */}
            <div 
              className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#0b141a] relative"
              style={{
                backgroundImage: `radial-gradient(#14221c 1px, transparent 1px), radial-gradient(#14221c 1px, #0b141a 1px)`,
                backgroundSize: '24px 24px',
                backgroundPosition: '0 0, 12px 12px'
              }}
            >
              {activeMessages.map((msg) => {
                const isMe = msg.senderId === (currentUser?.id || 'usr_current');
                const isAiSender = msg.senderId === 'krishak_ai_bot';
                const isSys = msg.senderId === 'system';

                if (isSys) {
                  return (
                    <div key={msg.id} className="text-center my-2 group flex items-center justify-center gap-2">
                      <span className="inline-block bg-[#182229] text-[#e9edef] text-[10px] font-medium px-3 py-1 rounded-lg border border-[#222d34]">
                        {msg.text}
                      </span>
                      <button
                        onClick={() => handleDeleteMessage(msg.id, activeConversationId)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#8696a0] hover:text-rose-400 rounded transition-all cursor-pointer"
                        title="Delete note"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                }

                // Booking Card
                if (msg.msgType === 'booking_card' && msg.bookingDetails) {
                  const b = msg.bookingDetails;
                  const isConfirmed = b.status === 'Confirmed';
                  const isCancelled = b.status === 'Cancelled';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col group max-w-xs sm:max-w-sm ${
                        isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      <div className="w-full bg-[#111b21] border border-amber-500/40 rounded-xl p-3 shadow-lg space-y-2 relative overflow-hidden">
                        <div className="flex items-center justify-between border-b border-[#222d34] pb-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Booking Quote
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.2 rounded-full ${
                            isConfirmed 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isCancelled
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {b.status}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-white text-xs sm:text-sm">{b.title}</h4>
                          <p className="text-xs text-amber-200 font-bold">₹{b.totalAmount} Total Rate</p>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-[#182229] p-2 rounded-lg border border-[#222d34]">
                          <div>
                            <span className="text-[#8696a0] block text-[9px]">Date:</span>
                            <span className="font-semibold text-slate-200">{b.startDate}</span>
                          </div>
                          <div>
                            <span className="text-[#8696a0] block text-[9px]">Duration:</span>
                            <span className="font-semibold text-slate-200">{b.duration}</span>
                          </div>
                          <div className="col-span-2 pt-0.5 border-t border-[#222d34]">
                            <span className="text-[#8696a0] block text-[9px]">Location:</span>
                            <span className="font-semibold text-emerald-400 flex items-center gap-1 truncate">
                              <MapPin className="w-2.5 h-2.5 flex-shrink-0" /> {b.location}
                            </span>
                          </div>
                        </div>

                        {!isConfirmed && !isCancelled && (
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <button
                              onClick={() => handleUpdateBookingStatus(msg.id, 'Confirmed')}
                              className="flex-1 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-slate-950 font-bold text-xs rounded-lg shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Confirm
                            </button>
                            <button
                              onClick={() => handleUpdateBookingStatus(msg.id, 'Cancelled')}
                              className="px-2.5 py-1.5 bg-[#202c33] hover:bg-rose-900/40 text-rose-400 font-semibold text-xs rounded-lg transition-all cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        )}

                        {isConfirmed && (
                          <div className="bg-emerald-950/60 text-emerald-300 text-[11px] font-bold p-1.5 rounded-lg text-center flex items-center justify-center gap-1 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Booking Confirmed
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-1 text-[9px] text-[#8696a0] pt-1 border-t border-white/5">
                          <button
                            onClick={() => handleDeleteMessage(msg.id, activeConversationId)}
                            className="hover:text-rose-400 transition-colors p-0.5 rounded cursor-pointer opacity-70 hover:opacity-100"
                            title="Delete quote"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="flex items-center gap-1">
                            <span>{msg.timestamp}</span>
                            {isMe && <CheckCheck className="w-3 h-3 text-[#53bdeb]" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Location Card
                if (msg.msgType === 'location' && msg.locationData) {
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col group max-w-[85%] sm:max-w-[70%] ${
                        isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      <div className="bg-[#111b21] border border-emerald-500/30 rounded-xl p-3 shadow-md space-y-1.5">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                          <MapPin className="w-3.5 h-3.5" /> Farm GPS Location
                        </div>
                        <p className="text-xs text-slate-200 font-medium">{msg.locationData.addressStr}</p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(msg.locationData.addressStr)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#202c33] hover:bg-[#00a884] hover:text-slate-950 text-emerald-300 text-xs font-semibold rounded-lg transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open in Maps</span>
                        </a>
                        <div className="flex items-center justify-between gap-1 text-[9px] text-[#8696a0] pt-1">
                          <button
                            onClick={() => handleDeleteMessage(msg.id, activeConversationId)}
                            className="hover:text-rose-400 transition-colors p-0.5 rounded cursor-pointer opacity-70 hover:opacity-100"
                            title="Delete location"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="flex items-center gap-1">
                            <span>{msg.timestamp}</span>
                            {isMe && <CheckCheck className="w-3 h-3 text-[#53bdeb]" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Voice Note Card
                if (msg.msgType === 'voice_note') {
                  const isPlaying = playingVoiceId === msg.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col group max-w-[80%] sm:max-w-[60%] ${
                        isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-xl text-xs shadow-xs flex flex-col gap-2 ${
                          isMe ? 'bg-[#005c4b] text-white' : 'bg-[#202c33] text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => setPlayingVoiceId(isPlaying ? null : msg.id)}
                            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white flex-shrink-0 cursor-pointer"
                          >
                            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
                          </button>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-0.5 h-4">
                              {[40, 70, 30, 90, 60, 80, 50, 100, 40, 60, 30, 80, 50].map((h, i) => (
                                <span
                                  key={i}
                                  style={{ height: isPlaying ? `${Math.min(100, h + (i % 3) * 12)}%` : `${h}%` }}
                                  className={`w-1 rounded-full ${isPlaying ? 'bg-emerald-300 animate-pulse' : 'bg-white/60'}`}
                                />
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-white/80">
                              <span>{isPlaying ? 'Playing...' : msg.voiceDuration || '0:10'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-white/80 pt-1 border-t border-white/10">
                          <button
                            onClick={() => handleDeleteMessage(msg.id, activeConversationId)}
                            className="hover:text-rose-300 transition-colors p-0.5 rounded cursor-pointer opacity-75 hover:opacity-100"
                            title="Delete audio note"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="flex items-center gap-1">
                            <span>{msg.timestamp}</span>
                            {isMe && <CheckCheck className="w-3 h-3 text-[#53bdeb]" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Photo Card
                if (msg.msgType === 'image' && msg.imageUrl) {
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col group max-w-[80%] sm:max-w-[60%] ${
                        isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      <div className="bg-[#202c33] p-1.5 rounded-xl border border-[#222d34] shadow-md space-y-1">
                        <img
                          src={msg.imageUrl}
                          alt="Crop attachment"
                          onClick={() => setSelectedPhotoPreview(msg.imageUrl || null)}
                          className="w-full max-h-56 object-cover rounded-lg cursor-pointer hover:opacity-95"
                        />
                        <div className="px-1 flex items-center justify-between text-[10px] text-[#8696a0]">
                          <span className="font-medium truncate">{msg.text}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDeleteMessage(msg.id, activeConversationId)}
                              className="hover:text-rose-400 transition-colors p-0.5 rounded cursor-pointer"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <span>{msg.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Standard Text Message
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col group max-w-[90%] sm:max-w-[80%] ${
                      isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div
                      className={`px-3 py-2 rounded-xl text-xs sm:text-[13.5px] leading-relaxed relative ${
                        isMe
                          ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-xs'
                          : isAiSender
                          ? 'bg-[#183428] text-emerald-50 rounded-tl-xs border border-emerald-500/20'
                          : 'bg-[#202c33] text-[#e9edef] rounded-tl-xs'
                      }`}
                    >
                      {isAiSender && (
                        <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-amber-300 mb-1.5 border-b border-emerald-500/20 pb-1">
                          <div className="flex items-center gap-1">
                            <Bot className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Krishak A.I Agronomist</span>
                          </div>
                          <span className="text-[9px] text-emerald-400/80 font-normal">Gemini</span>
                        </div>
                      )}

                      <div className="whitespace-pre-wrap select-text">
                        {isAiSender ? renderFormattedText(msg.text) : msg.text}
                      </div>

                      {/* Quick message tools & time */}
                      <div className="flex items-center justify-between gap-2 mt-1.5 pt-1 border-t border-white/5 text-[9px] text-[#8696a0]">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.text)}
                            className="hover:text-emerald-300 transition-colors flex items-center gap-0.5 cursor-pointer"
                            title="Copy text"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>

                          {isAiSender && (
                            <button
                              onClick={() => handleToggleSpeak(msg.id, msg.text)}
                              className="hover:text-amber-300 transition-colors flex items-center gap-0.5 cursor-pointer"
                              title="Listen"
                            >
                              {speakingMsgId === msg.id ? (
                                <VolumeX className="w-3 h-3 text-amber-400 animate-pulse" />
                              ) : (
                                <Volume2 className="w-3 h-3" />
                              )}
                            </button>
                          )}

                          {/* Single message delete */}
                          <button
                            onClick={() => handleDeleteMessage(msg.id, activeConversationId)}
                            className="hover:text-rose-400 transition-colors flex items-center gap-0.5 cursor-pointer opacity-70 hover:opacity-100"
                            title="Delete this message"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-0.5">
                          <span>{msg.timestamp}</span>
                          {isMe && <CheckCheck className="w-3 h-3 text-[#53bdeb]" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isAiTyping && (
                <div className="flex items-center gap-2 p-2.5 bg-[#183428] border border-emerald-500/30 rounded-xl w-fit text-emerald-300 text-xs shadow-xs animate-pulse">
                  <Bot className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                  <span className="font-medium text-[11px]">कृषक ए.आई उत्तर तैयार कर रहा है...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* AI Quick Prompts Pills Strip */}
            {isAiActive && (
              <div className="px-2.5 py-1.5 bg-[#14261e] border-t border-emerald-800/30 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
                <span className="text-amber-300 font-bold text-[9px] uppercase flex-shrink-0 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> FAQs:
                </span>
                {aiQuickPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="px-2.5 py-1 bg-[#1a3327] hover:bg-emerald-600 hover:text-slate-950 text-emerald-200 font-medium rounded-lg text-[11px] whitespace-nowrap transition-all flex-shrink-0 border border-emerald-600/20 cursor-pointer flex items-center gap-1"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Replies for Standard Chats */}
            {!isAiActive && showQuickReplies && (
              <div className="px-2.5 py-1.5 bg-[#182229] border-t border-[#222d34] flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
                <span className="text-[#8696a0] font-bold text-[9px] uppercase flex-shrink-0">Quick:</span>
                {quickReplies.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q.text)}
                    className="px-2.5 py-1 bg-[#202c33] hover:bg-[#00a884] hover:text-slate-950 text-slate-200 font-medium rounded-lg text-[11px] whitespace-nowrap transition-all flex-shrink-0 border border-[#222d34] cursor-pointer"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}

            {/* Voice Note Recording Status */}
            {isRecordingVoice && (
              <div className="px-3 py-2 bg-rose-950/80 border-t border-rose-500/40 flex items-center justify-between gap-2 text-rose-200 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span>Recording: 0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsRecordingVoice(false)}
                    className="px-2.5 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded text-[11px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFinishVoiceRecording}
                    className="px-2.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold text-[11px]"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* Compact Message Composer Bar */}
            <div className="p-2 sm:p-2.5 bg-[#202c33] border-t border-[#222d34] flex items-end gap-1.5 flex-shrink-0 relative">
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePhotoInput}
                className="hidden"
                id="compact-chat-photo-input"
              />

              {/* Attachments Menu Popover */}
              {showAttachMenu && (
                <div className="absolute bottom-14 left-2 bg-[#182229] border border-[#2e3b43] rounded-xl p-1.5 shadow-xl space-y-1 z-30 min-w-[180px] animate-fadeIn">
                  <button
                    onClick={handleSendLocation}
                    disabled={isLocating}
                    className="w-full px-2.5 py-1.5 text-left hover:bg-white/10 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isLocating ? 'Locating...' : 'Share Location'}</span>
                  </button>
                  
                  <label
                    htmlFor="compact-chat-photo-input"
                    className="w-full px-2.5 py-1.5 text-left hover:bg-white/10 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-2 cursor-pointer block"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Attach Photo</span>
                  </label>

                  {!isAiActive && (
                    <button
                      onClick={() => {
                        setShowAttachMenu(false);
                        setShowBookingModal(true);
                      }}
                      className="w-full px-2.5 py-1.5 text-left hover:bg-white/10 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Booking Quote</span>
                    </button>
                  )}
                </div>
              )}

              {/* Attach Button */}
              <button
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  showAttachMenu ? 'bg-emerald-500 text-slate-950' : 'text-[#8696a0] hover:text-white hover:bg-white/5'
                }`}
                title="Attach"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {!isAiActive && (
                <button
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className={`p-2 rounded-lg transition-colors cursor-pointer hidden sm:flex ${
                    showQuickReplies ? 'text-[#00a884] bg-white/10' : 'text-[#8696a0] hover:text-[#00a884]'
                  }`}
                  title="Quick Responses"
                >
                  <Smile className="w-4 h-4" />
                </button>
              )}

              {/* Voice Button */}
              <button
                onClick={() => {
                  if (isRecordingVoice) {
                    handleFinishVoiceRecording();
                  } else {
                    setIsRecordingVoice(true);
                  }
                }}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  isRecordingVoice 
                    ? 'bg-rose-600 text-white animate-pulse' 
                    : 'text-[#8696a0] hover:text-[#00a884] hover:bg-white/5'
                }`}
                title="Record Voice"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Textarea */}
              <div className="flex-1 relative flex items-center">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={isAiActive ? "कृषक ए.आई से पूछें (Enter to send)..." : "Type a message..."}
                  className="w-full px-3 py-2 bg-[#2a3942] text-slate-100 placeholder-[#8696a0] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884] resize-none max-h-24 overflow-y-auto"
                />
              </div>

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="p-2 sm:p-2.5 bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-30 text-slate-950 font-bold rounded-xl shadow-xs transition-all flex-shrink-0 flex items-center justify-center cursor-pointer active:scale-95"
                title="Send"
              >
                <Send className="w-3.5 h-3.5 fill-slate-950" />
              </button>
            </div>
          </main>
        </div>

      </div>

      {/* Sub-Modal: Start New Chat */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-[#111b21] rounded-2xl p-4 shadow-2xl border border-[#222d34] space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222d34] pb-2">
              <h4 className="font-bold text-slate-100 text-xs sm:text-sm flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#00a884]" /> Start New Conversation
              </h4>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1 text-[#8696a0] hover:text-white rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleStartNewChat} className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Name (Worker / Machinery Owner)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#202c33] border border-[#222d34] text-slate-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Mobile Phone (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 XXXXXXXXXX"
                  value={newRecipientPhone}
                  onChange={(e) => setNewRecipientPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#202c33] border border-[#222d34] text-slate-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Service Category</label>
                <select
                  value={newBookingType}
                  onChange={(e) => setNewBookingType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#202c33] border border-[#222d34] text-slate-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                >
                  <option value="Sahyogi Labor">🌾 Sahyogi Labor</option>
                  <option value="Machinery Owner">🚜 Machinery Owner</option>
                  <option value="Harvesting Worker">🌾 Harvesting Worker</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="px-3 py-1.5 bg-[#202c33] text-slate-300 font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#00a884] text-slate-950 font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                >
                  Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Modal: Send Booking Quote */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-[#111b21] rounded-2xl p-4 shadow-2xl border border-[#222d34] space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222d34] pb-2">
              <h4 className="font-bold text-slate-100 text-xs sm:text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-400" /> Send Booking Quote
              </h4>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-1 text-[#8696a0] hover:text-white rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSendBookingCard} className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Work Title</label>
                <input
                  type="text"
                  required
                  value={bookingTitle}
                  onChange={(e) => setBookingTitle(e.target.value)}
                  placeholder="e.g. Field Tillage / Harvesting"
                  className="w-full px-3 py-1.5 bg-[#202c33] border border-[#222d34] text-slate-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Start Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#202c33] border border-[#222d34] text-slate-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Duration</label>
                  <select
                    value={bookingDuration}
                    onChange={(e) => setBookingDuration(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#202c33] border border-[#222d34] text-slate-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                  >
                    <option value="1 Day">1 Day</option>
                    <option value="2 Days">2 Days</option>
                    <option value="3 Days">3 Days</option>
                    <option value="4 Hours">4 Hours</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Rate (₹)</label>
                  <input
                    type="number"
                    required
                    value={bookingRate}
                    onChange={(e) => setBookingRate(e.target.value)}
                    placeholder="500"
                    className="w-full px-3 py-1.5 bg-[#202c33] border border-[#222d34] text-slate-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Location</label>
                  <input
                    type="text"
                    required
                    value={bookingLocation}
                    onChange={(e) => setBookingLocation(e.target.value)}
                    placeholder="Farm Field Location"
                    className="w-full px-3 py-1.5 bg-[#202c33] border border-[#222d34] text-slate-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-3 py-1.5 bg-[#202c33] text-slate-300 font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                >
                  Send Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Modal: Chat History, Transcript Viewer & Records */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-2xl bg-[#111b21] rounded-2xl shadow-2xl border border-[#222d34] flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#222d34] bg-[#202c33]/70">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  {viewingTranscriptConvId ? 'Conversation Transcript & Log' : 'Chat History & Records'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {viewingTranscriptConvId ? (
                  <button
                    onClick={() => setViewingTranscriptConvId(null)}
                    className="px-2.5 py-1 bg-[#2a3942] hover:bg-[#32444f] text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    All Chats
                  </button>
                ) : (
                  <button
                    onClick={() => setShowClearAllConfirm(true)}
                    className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold rounded-lg flex items-center gap-1 border border-rose-500/30 cursor-pointer transition-colors"
                    title="Clear all messages across all chats"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Clear All</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setViewingTranscriptConvId(null);
                  }}
                  className="p-1 text-[#8696a0] hover:text-white rounded-lg cursor-pointer hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {viewingTranscriptConvId ? (
                // Single Conversation Transcript Reader
                (() => {
                  const targetConv = conversations.find(c => c.id === viewingTranscriptConvId) || conversations[0];
                  const transcript = getConversationTranscript(viewingTranscriptConvId);
                  const msgCount = (allMessages[viewingTranscriptConvId] || []).length;

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-[#202c33] p-3 rounded-xl border border-[#2e3b43]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-700/40 text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                            {targetConv.participantName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-100 truncate">
                              {targetConv.participantName}
                            </h4>
                            <p className="text-[11px] text-emerald-400">
                              {msgCount} messages recorded • {targetConv.participantRole}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleCopyTranscript(viewingTranscriptConvId)}
                            className="px-2.5 py-1.5 bg-[#2a3942] hover:bg-[#00a884] hover:text-slate-950 text-slate-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            title="Copy transcript to clipboard"
                          >
                            {transcriptCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDownloadTranscript(viewingTranscriptConvId)}
                            className="px-2.5 py-1.5 bg-[#2a3942] hover:bg-[#00a884] hover:text-slate-950 text-slate-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            title="Download transcript file"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Export</span>
                          </button>

                          <button
                            onClick={() => {
                              handleClearChatHistory(viewingTranscriptConvId);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                            title="Clear conversation history"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Formatted Transcript Box */}
                      <div className="bg-[#0b141a] p-3.5 rounded-xl border border-[#222d34] text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto select-text shadow-inner">
                        {transcript}
                      </div>
                    </div>
                  );
                })()
              ) : (
                // All Conversations History List
                <div className="space-y-2">
                  <p className="text-xs text-[#8696a0]">
                    Select any conversation to inspect the transcript, export chat logs, or clear recorded messages.
                  </p>

                  <div className="space-y-2 pt-1">
                    {conversations.map((conv) => {
                      const msgList = allMessages[conv.id] || [];
                      const isAi = conv.id === 'ai_krishak_advisor';

                      return (
                        <div
                          key={conv.id}
                          className="bg-[#202c33] hover:bg-[#25323a] border border-[#2e3b43] p-3 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                              isAi 
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                                : 'bg-[#128c7e] text-white'
                            }`}>
                              {isAi ? <Bot className="w-4 h-4" /> : conv.participantName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-xs sm:text-sm text-slate-100 truncate">
                                  {conv.participantName}
                                </h4>
                                <span className="text-[10px] px-1.5 py-0.2 bg-[#111b21] text-emerald-400 rounded font-medium border border-[#2e3b43]">
                                  {msgList.length} msgs
                                </span>
                              </div>
                              <p className="text-[11px] text-[#8696a0] truncate mt-0.5">
                                Last: {conv.lastMessage || 'No messages'} • <span className="text-slate-400">{conv.lastTimestamp}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                            <button
                              onClick={() => setViewingTranscriptConvId(conv.id)}
                              className="px-2.5 py-1.5 bg-[#2a3942] hover:bg-[#00a884] hover:text-slate-950 text-emerald-300 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              title="View chat history transcript"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Log</span>
                            </button>

                            <button
                              onClick={() => handleDownloadTranscript(conv.id)}
                              className="p-1.5 bg-[#2a3942] hover:bg-[#00a884] hover:text-slate-950 text-slate-300 rounded-lg transition-all cursor-pointer"
                              title="Download chat text file"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                handleClearChatHistory(conv.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                              title="Clear messages in this chat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 border-t border-[#222d34] bg-[#202c33]/50 flex items-center justify-between text-xs text-[#8696a0]">
              <span>Krishakarya Secure Local Log Engine</span>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setViewingTranscriptConvId(null);
                }}
                className="px-3 py-1 bg-[#2a3942] hover:bg-[#32444f] text-slate-200 font-semibold rounded-lg cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear Current Chat */}
      {showClearChatConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-[#111b21] rounded-2xl p-4 shadow-2xl border border-[#222d34] space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <Trash2 className="w-5 h-5" />
              <h4 className="font-bold text-sm text-slate-100">Clear Conversation Messages?</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to clear all message logs with{' '}
              <span className="font-bold text-emerald-400">{currentConv.participantName}</span>? The chat session will be emptied.
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowClearChatConfirm(false)}
                className="px-3 py-1.5 bg-[#202c33] hover:bg-[#2a3942] text-slate-300 font-semibold text-xs rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleClearChatHistory(activeConversationId);
                  setShowClearChatConfirm(false);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
              >
                Clear Messages
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear All History */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-[#111b21] rounded-2xl p-4 shadow-2xl border border-[#222d34] space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <Trash2 className="w-5 h-5" />
              <h4 className="font-bold text-sm text-slate-100">Clear All Chat History?</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will permanently remove all message transcripts across all conversations in your inbox. This cannot be undone.
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowClearAllConfirm(false)}
                className="px-3 py-1.5 bg-[#202c33] hover:bg-[#2a3942] text-slate-300 font-semibold text-xs rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleClearAllHistory();
                  setShowClearAllConfirm(false);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
              >
                Clear All History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Entire Conversation */}
      {confirmDeleteConvId && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-[#111b21] rounded-2xl p-4 shadow-2xl border border-[#222d34] space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <Trash2 className="w-5 h-5" />
              <h4 className="font-bold text-sm text-slate-100">Delete Conversation?</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This conversation and all its message records will be permanently removed from your list.
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteConvId(null)}
                className="px-3 py-1.5 bg-[#202c33] hover:bg-[#2a3942] text-slate-300 font-semibold text-xs rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmDeleteConvId) {
                    handleDeleteConversation(confirmDeleteConvId);
                    setConfirmDeleteConvId(null);
                  }
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
              >
                Delete Conversation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedPhotoPreview && (
        <div 
          onClick={() => setSelectedPhotoPreview(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <img
            src={selectedPhotoPreview}
            alt="Preview"
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
          <button
            onClick={() => setSelectedPhotoPreview(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

    </div>
  );
};
