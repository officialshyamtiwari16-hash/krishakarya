import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Search, 
  Phone, 
  CheckCheck, 
  Plus, 
  ShieldCheck,
  ChevronLeft,
  Image as ImageIcon,
  Smile,
  Mic,
  Trash2,
  PhoneCall,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Copy,
  Check,
  FileText,
  Sparkles,
  Tag
} from 'lucide-react';
import { User, ChatMessage, Conversation } from '../types';

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  initialChatParticipant?: { id: string; name: string; phone?: string; image?: string; role?: string } | null;
}

export const InboxModal: React.FC<InboxModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialChatParticipant = null,
}) => {
  const defaultConversations: Conversation[] = [];
  const defaultMessages: Record<string, ChatMessage[]> = {};

  // State Management with localStorage sync
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('krishikulture_conversations');
    if (!saved) return defaultConversations;
    try {
      const parsed: Conversation[] = JSON.parse(saved);
      return parsed.filter(c => !['conv_1', 'conv_2', 'conv_3'].includes(c.id));
    } catch {
      return defaultConversations;
    }
  });

  const [allMessages, setAllMessages] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem('krishikulture_messages');
    if (!saved) return defaultMessages;
    try {
      const parsed = JSON.parse(saved);
      delete parsed.conv_1;
      delete parsed.conv_2;
      delete parsed.conv_3;
      return parsed;
    } catch {
      return defaultMessages;
    }
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'sahyogi' | 'machinery'>('all');
  
  // Modals & Popovers
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // New Chat form state
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newBookingType, setNewBookingType] = useState('Sahyogi Labor Helper');
  const [newRecipientPhone, setNewRecipientPhone] = useState('');

  // Booking Confirmation Form state inside chat
  const [bookingTitle, setBookingTitle] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingDuration, setBookingDuration] = useState('1 Day (Full)');
  const [bookingRate, setBookingRate] = useState('500');
  const [bookingLocation, setBookingLocation] = useState(currentUser?.village ? `${currentUser.village}, ${currentUser.district}` : 'Farm Field');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('krishikulture_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('krishikulture_messages', JSON.stringify(allMessages));
  }, [allMessages]);

  // Set active conversation automatically if list exists and none selected
  useEffect(() => {
    if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations]);

  // Handle initial participant passed from parent (e.g. "Message Worker" button)
  useEffect(() => {
    if (initialChatParticipant && isOpen) {
      const existing = conversations.find((c) => c.participantId === initialChatParticipant.id);
      if (existing) {
        setActiveConversationId(existing.id);
      } else {
        const newConvId = `conv_${Date.now()}`;
        const phone = initialChatParticipant.phone || '+91 XXXXXXXXXX';
        const newConv: Conversation = {
          id: newConvId,
          participantId: initialChatParticipant.id,
          participantName: initialChatParticipant.name,
          participantRole: initialChatParticipant.role || 'Sahyogi Labor / Machinery Owner',
          participantPhone: phone,
          participantImage: initialChatParticipant.image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          lastMessage: 'Direct booking chat connected',
          lastMessageTime: 'Just now',
          unreadCount: 0,
        };
        setConversations((prev) => [newConv, ...prev]);
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
              text: `🔒 Krishakarya Direct Chat Connected with ${initialChatParticipant.name} (${phone}). Discuss rates, field locations, and booking confirmations below.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isRead: true,
            },
          ],
        }));
        setActiveConversationId(newConvId);
      }
    }
  }, [initialChatParticipant, isOpen]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversationId, allMessages]);

  const currentConv = conversations.find((c) => c.id === activeConversationId);
  const activeMessages = activeConversationId ? allMessages[activeConversationId] || [] : [];

  // Helper to append a message
  const appendMessage = (newMsg: ChatMessage, convId: string) => {
    setAllMessages((prev) => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMsg],
    }));

    const previewText = newMsg.msgType === 'booking_card'
      ? `📋 Booking: ${newMsg.bookingDetails?.title || 'Confirmation Request'}`
      : newMsg.msgType === 'location'
      ? '📍 Field Location Shared'
      : newMsg.msgType === 'voice_note'
      ? '🎙️ Voice Note'
      : newMsg.msgType === 'image'
      ? '📷 Photo'
      : newMsg.text;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              lastMessage: previewText,
              lastMessageTime: newMsg.timestamp,
              unreadCount: 0,
            }
          : c
      )
    );
  };

  // Send Text Message logic
  const handleSendMessage = (textToSend?: string) => {
    const finalMsg = (textToSend || inputText).trim();
    if (!finalMsg || !activeConversationId || !currentConv) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId: activeConversationId,
      senderId: currentUser?.id || 'usr_current',
      senderName: currentUser?.name || 'Farmer',
      receiverId: currentConv.participantId,
      receiverName: currentConv.participantName,
      text: finalMsg,
      timestamp: timeStr,
      isRead: true,
      msgType: 'text',
    };

    appendMessage(newMsg, activeConversationId);
    setInputText('');
    setShowQuickReplies(false);

    // Contextual Auto Reply from Sahyogi/Owner
    triggerAutoReply(activeConversationId, currentConv, finalMsg);
  };

  // Send Booking Card logic
  const handleSendBookingCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversationId || !currentConv) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const bookingMsg: ChatMessage = {
      id: `msg_book_${Date.now()}`,
      conversationId: activeConversationId,
      senderId: currentUser?.id || 'usr_current',
      senderName: currentUser?.name || 'Farmer',
      receiverId: currentConv.participantId,
      receiverName: currentConv.participantName,
      text: `Official Booking Confirmation Request for ${bookingTitle || currentConv.participantRole}`,
      timestamp: timeStr,
      isRead: true,
      msgType: 'booking_card',
      bookingDetails: {
        title: bookingTitle || currentConv.participantRole || 'Agricultural Work',
        category: currentConv.participantRole || 'Sahyogi Labor',
        startDate: bookingDate,
        duration: bookingDuration,
        location: bookingLocation,
        totalAmount: Number(bookingRate) || 500,
        status: 'Pending',
      }
    };

    appendMessage(bookingMsg, activeConversationId);
    setShowBookingModal(false);

    // Auto-reply accepting booking after 2 seconds
    setTimeout(() => {
      const confirmTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const confirmMsg: ChatMessage = {
        id: `msg_confirm_${Date.now()}`,
        conversationId: activeConversationId,
        senderId: currentConv.participantId,
        senderName: currentConv.participantName,
        receiverId: currentUser?.id || 'usr_current',
        receiverName: currentUser?.name || 'Farmer',
        text: `राम राम! मुझे आपकी ₹${bookingRate} की बुकिंग मंजूर है। मैं ${bookingDate} को ${bookingLocation} पहुँच जाऊँगा।`,
        timestamp: confirmTime,
        isRead: true,
        msgType: 'text',
      };
      appendMessage(confirmMsg, activeConversationId);

      // Update the status of that booking card to 'Confirmed'
      setAllMessages((prev) => {
        const msgs = prev[activeConversationId] || [];
        return {
          ...prev,
          [activeConversationId]: msgs.map((m) =>
            m.id === bookingMsg.id && m.bookingDetails
              ? { ...m, bookingDetails: { ...m.bookingDetails, status: 'Confirmed' } }
              : m
          ),
        };
      });
    }, 2500);
  };

  // Toggle Booking Card Status directly from chat
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

  // Send Location Card
  const handleSendLocation = () => {
    if (!activeConversationId || !currentConv) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const locStr = currentUser?.village 
      ? `${currentUser.village}, ${currentUser.district}, ${currentUser.state}` 
      : 'Village Farm Field, Main Highway Plot #12';

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
        village: currentUser?.village || 'Krishi Field',
        district: currentUser?.district || 'District Region',
        addressStr: locStr,
      }
    };

    appendMessage(locMsg, activeConversationId);
  };

  // Send Voice Note simulator
  const handleSendVoiceNote = () => {
    if (!activeConversationId || !currentConv) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const voiceMsg: ChatMessage = {
      id: `msg_voice_${Date.now()}`,
      conversationId: activeConversationId,
      senderId: currentUser?.id || 'usr_current',
      senderName: currentUser?.name || 'Farmer',
      receiverId: currentConv.participantId,
      receiverName: currentConv.participantName,
      text: '🎙️ Voice Message (0:12)',
      timestamp: timeStr,
      isRead: true,
      msgType: 'voice_note',
      voiceDuration: '0:12',
    };

    appendMessage(voiceMsg, activeConversationId);
  };

  // Send Photo Attachment
  const handleSendPhoto = () => {
    if (!activeConversationId || !currentConv) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const samplePhotos = [
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1595838788320-a6a3b2b36e8b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=600&auto=format&fit=crop&q=80'
    ];
    const chosen = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];

    const photoMsg: ChatMessage = {
      id: `msg_img_${Date.now()}`,
      conversationId: activeConversationId,
      senderId: currentUser?.id || 'usr_current',
      senderName: currentUser?.name || 'Farmer',
      receiverId: currentConv.participantId,
      receiverName: currentConv.participantName,
      text: '📷 Attached Field/Equipment Photo',
      timestamp: timeStr,
      isRead: true,
      msgType: 'image',
      imageUrl: chosen,
    };

    appendMessage(photoMsg, activeConversationId);
  };

  // Contextual Auto Reply Simulation
  const triggerAutoReply = (convId: string, conv: Conversation, text: string) => {
    setTimeout(() => {
      const isMachinery = conv.participantRole?.toLowerCase().includes('machin') || conv.participantRole?.toLowerCase().includes('tractor');
      
      let replyOptions = [
        "राम राम भाई जी! आपकी Sahyogi लेबर बुकिंग का संदेश मिल गया। मैं कल सुबह समय पर आ जाऊँगा।",
        "हाँ जी, रेट मंजूर है। काम की लोकेशन और तारीख बता दीजिए।",
        "जी ठीक है, हमारे पास 5 मजदूरों की टीम तैयार है।",
        "नमस्कार! धन्यवाद, खेत पर मिलते हैं।"
      ];

      if (isMachinery) {
        replyOptions = [
          "राम राम जी! हमारी मशीनरी/ट्रैक्टर बिल्कुल बढ़िया कंडीशन में उपलब्ध है।",
          "प्रति घंटा ₹500 का किराया रहेगा जिसमें ऑपरेटर शामिल है।",
          "कृपया खेत की लोकेशन भेजें ताकि हम ट्रेलर ला सकें।",
          "आपकी बुकिंग पक्की हो गई है! धन्यवाद।"
        ];
      }

      if (text.includes('रेट') || text.includes('किराया')) {
        replyOptions = ["हमारा रेट वाजिब है। आप इनबॉक्स में ऑफिशियल बुकिंग कार्ड भेजें, हम कन्फर्म कर देंगे।"];
      }

      const randomReply = replyOptions[Math.floor(Math.random() * replyOptions.length)];
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const replyMsg: ChatMessage = {
        id: `msg_reply_${Date.now()}`,
        conversationId: convId,
        senderId: conv.participantId,
        senderName: conv.participantName,
        receiverId: currentUser?.id || 'usr_current',
        receiverName: currentUser?.name || 'Farmer',
        text: randomReply,
        timestamp: replyTime,
        isRead: true,
        msgType: 'text',
      };

      appendMessage(replyMsg, convId);
    }, 2000);
  };

  // Start new chat
  const handleStartNewChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipientName.trim()) return;

    const newConvId = `conv_${Date.now()}`;
    const phone = newRecipientPhone.trim() || '+91 98123 45678';
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

    setConversations((prev) => [newConv, ...prev]);
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
          text: `🔒 Direct booking chat connected with ${newRecipientName} (${newBookingType}). Phone: ${phone}.`,
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
    setNewBookingType('Sahyogi Labor Helper');
  };

  const handleDeleteConversation = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this chat conversation?")) {
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      setAllMessages((prev) => {
        const copy = { ...prev };
        delete copy[convId];
        return copy;
      });
      if (activeConversationId === convId) {
        setActiveConversationId(null);
      }
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterCategory === 'sahyogi') {
      return matchesSearch && c.participantRole?.toLowerCase().includes('sahyogi') || c.participantRole?.toLowerCase().includes('labor');
    }
    if (filterCategory === 'machinery') {
      return matchesSearch && (c.participantRole?.toLowerCase().includes('machin') || c.participantRole?.toLowerCase().includes('tractor') || c.participantRole?.toLowerCase().includes('owner'));
    }
    return matchesSearch;
  });

  const quickReplies = [
    { label: "🌾 Availability", text: "राम राम जी! क्या कल 2 मजदूर उपलब्ध हैं?" },
    { label: "💰 Rates", text: "प्रति एकड़ / प्रति दिन का क्या रेट लगेगा?" },
    { label: "📅 Schedule", text: "कल सुबह 6:00 बजे खेत पर काम शुरू करना है।" },
    { label: "📍 Field Location", text: "हमारे खेत की लोकेशन मुख्य रोड के पास है।" },
    { label: "📋 Official Booking", text: "कृष्णिलिंक ऐप पर बुकिंग फाइनल कर लेते हैं।" }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-5xl bg-[#111b21] sm:rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col h-[95vh] sm:h-[88vh]">
        
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-emerald-950 via-green-900 to-emerald-900 text-white px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between gap-3 flex-shrink-0 border-b border-emerald-700/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300 font-black shadow-inner border border-white/10">
              <MessageSquare className="w-5 h-5 text-amber-300 fill-amber-300/20" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2 tracking-wide text-white">
                <span className="text-emerald-400">Krishakarya</span> Messenger
              </h3>
              <p className="text-[11px] text-emerald-100/90 font-medium hidden sm:block">
                Direct Chat with Farmers, Sahyogi Workers & Machinery Owners
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 border border-white/10 cursor-pointer active:scale-95"
              title="Close Messenger"
            >
              <X className="w-4 h-4 text-emerald-300" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* WhatsApp/Telegram Layout: Left Sidebar + Right Chat Canvas */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 bg-[#0b141a]">
          
          {/* Left Column: Conversation Sidebar */}
          <div className={`md:col-span-5 lg:col-span-4 bg-[#111b21] border-r border-[#222d34] flex flex-col ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
            
            {/* Search Bar */}
            <div className="p-3 border-b border-[#222d34] bg-[#111b21] space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-[#8696a0] absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Sahyogi or Machinery..."
                  className="w-full pl-10 pr-3 py-2 bg-[#202c33] text-slate-100 placeholder-[#8696a0] rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                />
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-colors ${
                    filterCategory === 'all'
                      ? 'bg-[#00a884] text-slate-950'
                      : 'bg-[#202c33] text-[#8696a0] hover:text-white'
                  }`}
                >
                  All ({conversations.length})
                </button>
                <button
                  onClick={() => setFilterCategory('sahyogi')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-colors ${
                    filterCategory === 'sahyogi'
                      ? 'bg-[#00a884] text-slate-950'
                      : 'bg-[#202c33] text-[#8696a0] hover:text-white'
                  }`}
                >
                  🌾 Sahyogi Labor
                </button>
                <button
                  onClick={() => setFilterCategory('machinery')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-colors ${
                    filterCategory === 'machinery'
                      ? 'bg-[#00a884] text-slate-950'
                      : 'bg-[#202c33] text-[#8696a0] hover:text-white'
                  }`}
                >
                  🚜 Machinery
                </button>
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#222d34]">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-[#8696a0] text-xs space-y-4 my-auto">
                  <div className="w-16 h-16 rounded-2xl bg-[#202c33] flex items-center justify-center mx-auto text-[#00a884] border border-[#222d34]">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-200 text-sm">No Conversations Found</p>
                    <p className="text-[11px] text-[#8696a0] mt-1 max-w-xs mx-auto">
                      Tap "New Chat" or message any Sahyogi worker or Machinery owner to begin chatting.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="px-4 py-2 bg-[#00a884] text-slate-950 font-black text-xs rounded-xl shadow-md hover:bg-[#008f6f] hover:text-white transition-all inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Start New Chat
                  </button>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setActiveConversationId(conv.id);
                        setConversations((prev) =>
                          prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
                        );
                      }}
                      className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer group relative ${
                        isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={conv.participantImage}
                          alt={conv.participantName}
                          className="w-12 h-12 rounded-full object-cover border border-[#222d34]"
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-[#111b21] rounded-full"></span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5 pr-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-100 truncate">
                            {conv.participantName}
                          </h4>
                          <span className="text-[10px] text-[#8696a0] font-medium">
                            {conv.lastMessageTime}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#00a884] font-medium truncate">
                          {conv.participantRole}
                        </p>
                        <p className="text-[11px] text-[#8696a0] truncate leading-snug">
                          {conv.lastMessage}
                        </p>
                      </div>

                      {/* Delete button on hover */}
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="absolute right-2 top-3.5 p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Chat Screen */}
          <div className={`md:col-span-7 lg:col-span-8 flex flex-col bg-[#0b141a] relative ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
            {currentConv ? (
              <>
                {/* Active Header */}
                <div className="p-3 bg-[#202c33] border-b border-[#222d34] flex items-center justify-between gap-3 shadow-sm z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => setActiveConversationId(null)}
                      className="md:hidden p-1 text-[#8696a0] hover:text-white"
                      title="Back to Chats"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    <div className="relative flex-shrink-0">
                      <img
                        src={currentConv.participantImage}
                        alt={currentConv.participantName}
                        className="w-10 h-10 rounded-full object-cover border border-[#222d34]"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25D366] border-2 border-[#202c33] rounded-full"></span>
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-100 truncate flex items-center gap-1.5">
                        {currentConv.participantName}
                        <ShieldCheck className="w-3.5 h-3.5 text-[#00a884] flex-shrink-0" />
                      </h4>
                      <p className="text-[10px] text-[#25D366] font-medium truncate flex items-center gap-1">
                        Online • {currentConv.participantRole}
                      </p>
                    </div>
                  </div>

                  {/* Call & Official Booking Header Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {currentConv.participantPhone && (
                      <a
                        href={`tel:${currentConv.participantPhone}`}
                        className="p-2 bg-[#2a3942] hover:bg-[#00a884] hover:text-slate-950 text-[#00a884] rounded-xl transition-all flex items-center gap-1 text-xs font-bold"
                        title={`Call ${currentConv.participantPhone}`}
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span className="hidden lg:inline">{currentConv.participantPhone}</span>
                      </a>
                    )}

                    <button
                      onClick={() => {
                        setBookingTitle(`${currentConv.participantRole || 'Work Booking'}`);
                        setShowBookingModal(true);
                      }}
                      className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-extrabold text-xs rounded-xl border border-amber-500/30 transition-all flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Send Booking Card</span>
                    </button>
                  </div>
                </div>

                {/* Messages Canvas */}
                <div 
                  className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#0b141a] relative"
                  style={{
                    backgroundImage: `radial-gradient(#111b21 1px, transparent 1px), radial-gradient(#111b21 1px, #0b141a 1px)`,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 10px 10px'
                  }}
                >
                  {/* Encryption Notice */}
                  <div className="text-center my-2">
                    <span className="inline-flex items-center gap-1 bg-[#182229] text-[#e9edef]/80 text-[10px] font-medium px-3.5 py-1.5 rounded-xl border border-[#222d34] shadow-xs">
                      🔒 Krishakarya Direct Encrypted Chat • Verified Agricultural Booking
                    </span>
                  </div>

                  {activeMessages.map((msg) => {
                    const isMe = msg.senderId === (currentUser?.id || 'usr_current');
                    const isSys = msg.senderId === 'system';

                    if (isSys) {
                      return (
                        <div key={msg.id} className="text-center my-3">
                          <span className="inline-block bg-[#182229] text-[#e9edef] text-[10px] font-bold px-3.5 py-1.5 rounded-xl border border-[#222d34]">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    // Render Booking Confirmation Card
                    if (msg.msgType === 'booking_card' && msg.bookingDetails) {
                      const b = msg.bookingDetails;
                      const isConfirmed = b.status === 'Confirmed';
                      const isCancelled = b.status === 'Cancelled';

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-sm sm:max-w-md ${
                            isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                          }`}
                        >
                          <div className="w-full bg-[#111b21] border border-amber-500/40 rounded-2xl p-4 shadow-lg space-y-3 relative overflow-hidden">
                            <div className="flex items-center justify-between border-b border-[#222d34] pb-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" /> Official Booking Quote
                              </span>
                              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                                isConfirmed 
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : isCancelled
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {b.status.toUpperCase()}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-extrabold text-white text-sm">{b.title}</h4>
                              <p className="text-xs text-amber-200/80 font-medium">₹{b.totalAmount} Total Expected Rate</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#182229] p-2.5 rounded-xl border border-[#222d34]">
                              <div>
                                <span className="text-[#8696a0] block text-[10px]">Start Date:</span>
                                <span className="font-bold text-slate-200">{b.startDate}</span>
                              </div>
                              <div>
                                <span className="text-[#8696a0] block text-[10px]">Duration:</span>
                                <span className="font-bold text-slate-200">{b.duration}</span>
                              </div>
                              <div className="col-span-2 pt-1 border-t border-[#222d34]">
                                <span className="text-[#8696a0] block text-[10px]">Field Location:</span>
                                <span className="font-bold text-emerald-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 flex-shrink-0" /> {b.location}
                                </span>
                              </div>
                            </div>

                            {/* Actions on card */}
                            {!isConfirmed && !isCancelled && (
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => handleUpdateBookingStatus(msg.id, 'Confirmed')}
                                  className="flex-1 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Booking
                                </button>
                                <button
                                  onClick={() => handleUpdateBookingStatus(msg.id, 'Cancelled')}
                                  className="px-3 py-1.5 bg-[#202c33] hover:bg-rose-900/50 text-rose-400 font-bold text-xs rounded-xl transition-all"
                                >
                                  Decline
                                </button>
                              </div>
                            )}

                            {isConfirmed && (
                              <div className="bg-emerald-950/60 text-emerald-300 text-xs font-bold p-2 rounded-xl text-center flex items-center justify-center gap-1.5 border border-emerald-500/30">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Booking Confirmed & Locked!
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-1 text-[9px] text-[#8696a0]">
                              <span>{msg.timestamp}</span>
                              {isMe && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Render Location Card
                    if (msg.msgType === 'location' && msg.locationData) {
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${
                            isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                          }`}
                        >
                          <div className="bg-[#111b21] border border-[#222d34] rounded-2xl p-3.5 shadow-md space-y-2">
                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                              <MapPin className="w-4 h-4 fill-emerald-400/20" /> Farm Field GPS Location
                            </div>
                            <p className="text-xs text-slate-200 font-medium">{msg.locationData.addressStr}</p>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(msg.locationData.addressStr)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#202c33] hover:bg-[#00a884] hover:text-slate-950 text-emerald-300 text-xs font-bold rounded-xl transition-all"
                            >
                              Open in Google Maps 🗺️
                            </a>
                            <div className="flex items-center justify-end gap-1 text-[9px] text-[#8696a0]">
                              <span>{msg.timestamp}</span>
                              {isMe && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Render Voice Note
                    if (msg.msgType === 'voice_note') {
                      const isPlaying = playingVoiceId === msg.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[80%] sm:max-w-[65%] ${
                            isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                          }`}
                        >
                          <div
                            className={`p-3 rounded-2xl text-xs shadow-xs flex items-center gap-3 ${
                              isMe ? 'bg-[#005c4b] text-white' : 'bg-[#202c33] text-white'
                            }`}
                          >
                            <button
                              onClick={() => setPlayingVoiceId(isPlaying ? null : msg.id)}
                              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white flex-shrink-0"
                            >
                              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                            </button>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-1 h-4">
                                {[40, 70, 30, 90, 60, 80, 50, 100, 40, 60, 30, 80, 50, 70].map((h, i) => (
                                  <span
                                    key={i}
                                    style={{ height: isPlaying ? `${Math.min(100, h + (i % 3) * 10)}%` : `${h}%` }}
                                    className={`w-1 rounded-full transition-all duration-150 ${isPlaying ? 'bg-emerald-300' : 'bg-white/60'}`}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] text-white/80 font-mono">
                                {isPlaying ? 'Playing...' : msg.voiceDuration || '0:12'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Render Photo Attachment
                    if (msg.msgType === 'image' && msg.imageUrl) {
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[80%] sm:max-w-[65%] ${
                            isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                          }`}
                        >
                          <div className="bg-[#202c33] p-1.5 rounded-2xl border border-[#222d34] shadow-md space-y-1">
                            <img
                              src={msg.imageUrl}
                              alt="Attached photo"
                              className="w-full h-48 object-cover rounded-xl"
                            />
                            <div className="px-2 pb-1 flex items-center justify-between text-[10px] text-[#8696a0]">
                              <span>{msg.text}</span>
                              <span>{msg.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Default Text Message
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${
                          isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                      >
                        <div
                          className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs relative ${
                            isMe
                              ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none border border-[#007a63]/40'
                              : 'bg-[#202c33] text-[#e9edef] rounded-tl-none border border-[#222d34]'
                          }`}
                        >
                          <p className="whitespace-pre-wrap font-medium">{msg.text}</p>

                          <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-[#8696a0] font-medium">
                            <span>{msg.timestamp}</span>
                            {isMe && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] inline-block ml-0.5" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Reply Bar */}
                {showQuickReplies && (
                  <div className="px-3 py-2 bg-[#182229] border-t border-[#222d34] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <span className="text-[#8696a0] font-bold text-[10px] uppercase flex-shrink-0">Quick Reply:</span>
                    {quickReplies.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q.text)}
                        className="px-3 py-1 bg-[#202c33] hover:bg-[#00a884] hover:text-slate-950 text-slate-200 font-medium rounded-xl text-xs whitespace-nowrap transition-colors flex-shrink-0 border border-[#222d34] shadow-xs"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Bottom Input Bar */}
                <div className="p-3 bg-[#202c33] border-t border-[#222d34] flex items-center gap-2">
                  <button
                    onClick={() => setShowQuickReplies(!showQuickReplies)}
                    className="p-2 text-[#8696a0] hover:text-[#00a884] rounded-full transition-colors"
                    title="Quick Agricultural Messages"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleSendLocation}
                    className="p-2 text-[#8696a0] hover:text-[#00a884] rounded-full transition-colors"
                    title="Share Farm Location"
                  >
                    <MapPin className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleSendPhoto}
                    className="p-2 text-[#8696a0] hover:text-[#00a884] rounded-full transition-colors"
                    title="Attach Photo"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleSendVoiceNote}
                    className="p-2 text-[#8696a0] hover:text-[#00a884] rounded-full transition-colors"
                    title="Send Voice Note"
                  >
                    <Mic className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message or discuss booking details..."
                    className="flex-1 px-4 py-2.5 bg-[#2a3942] text-slate-100 placeholder-[#8696a0] rounded-full text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                  />

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim()}
                    className="p-2.5 bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-slate-950 font-black rounded-full shadow-md transition-all flex-shrink-0 flex items-center justify-center"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4 fill-slate-950" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-[#0b141a]">
                <div className="w-20 h-20 rounded-2xl bg-[#111b21] border border-[#222d34] text-[#00a884] flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="font-black text-slate-100 text-base"><span className="text-[#00a884] text-emerald-400">Krishakarya</span> Live Chat</h4>
                  <p className="text-xs text-[#8696a0] max-w-sm mt-1">
                    Select a conversation on the left or tap <strong className="text-[#00a884]">"New Chat"</strong> to talk with Sahyogi labor workers and machinery owners.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="px-5 py-2.5 bg-[#00a884] text-slate-950 font-black text-xs rounded-xl shadow-lg hover:bg-[#008f6f] hover:text-white transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Start New Chat
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Start New Chat */}
        {showNewChatModal && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#111b21] rounded-3xl p-5 shadow-2xl border border-[#222d34] space-y-4">
              <div className="flex items-center justify-between border-b border-[#222d34] pb-3">
                <h4 className="font-extrabold text-slate-100 text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#00a884]" /> Start Booking Conversation
                </h4>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="p-1 text-[#8696a0] hover:text-white rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleStartNewChat} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Recipient Name (Worker / Machinery Owner)</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter recipient name or machine title"
                    value={newRecipientName}
                    onChange={(e) => setNewRecipientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#202c33] border border-[#222d34] text-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Mobile Phone Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+91 XXXXXXXXXX"
                    value={newRecipientPhone}
                    onChange={(e) => setNewRecipientPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#202c33] border border-[#222d34] text-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Category / Work Type</label>
                  <select
                    value={newBookingType}
                    onChange={(e) => setNewBookingType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#202c33] border border-[#222d34] text-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                  >
                    <option value="Sahyogi Labor Helper">🌾 Sahyogi Labor Helper</option>
                    <option value="Rent Machinery Owner">🚜 Rent Machinery Owner</option>
                    <option value="Harvesting & Tillage">🌾 Harvesting & Tillage</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewChatModal(false)}
                    className="px-4 py-2 bg-[#202c33] text-slate-300 font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#00a884] text-slate-950 font-black text-xs rounded-xl shadow-md"
                  >
                    Connect Chat
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Send Booking Card */}
        {showBookingModal && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#111b21] rounded-3xl p-5 shadow-2xl border border-[#222d34] space-y-4">
              <div className="flex items-center justify-between border-b border-[#222d34] pb-3">
                <h4 className="font-extrabold text-slate-100 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" /> Send Booking Confirmation Quote
                </h4>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="p-1 text-[#8696a0] hover:text-white rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendBookingCard} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Booking Title / Work Required</label>
                  <input
                    type="text"
                    required
                    value={bookingTitle}
                    onChange={(e) => setBookingTitle(e.target.value)}
                    placeholder="e.g. 2 Sahyogi Workers for Wheat Harvesting"
                    className="w-full px-3 py-2 bg-[#202c33] border border-[#222d34] text-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Start Date</label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#202c33] border border-[#222d34] text-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Duration</label>
                    <select
                      value={bookingDuration}
                      onChange={(e) => setBookingDuration(e.target.value)}
                      className="w-full px-3 py-2 bg-[#202c33] border border-[#222d34] text-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                    >
                      <option value="1 Day (Full)">1 Day (Full)</option>
                      <option value="2 Days">2 Days</option>
                      <option value="3 Days">3 Days</option>
                      <option value="4 Hours">4 Hours</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Total Agreed Rate (₹)</label>
                    <input
                      type="number"
                      required
                      value={bookingRate}
                      onChange={(e) => setBookingRate(e.target.value)}
                      placeholder="500"
                      className="w-full px-3 py-2 bg-[#202c33] border border-[#222d34] text-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Field Location</label>
                    <input
                      type="text"
                      required
                      value={bookingLocation}
                      onChange={(e) => setBookingLocation(e.target.value)}
                      placeholder="Village Farm Field Plot #12"
                      className="w-full px-3 py-2 bg-[#202c33] border border-[#222d34] text-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="px-4 py-2 bg-[#202c33] text-slate-300 font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md"
                  >
                    Post Booking Card
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
