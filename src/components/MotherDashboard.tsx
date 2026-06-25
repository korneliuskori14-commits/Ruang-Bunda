/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Calendar, BookOpen, MessageSquare, Send, Activity, Plus, LineChart,
  ShieldAlert, Sparkles, Smile, Weight, Bell, AlertTriangle, ArrowUpRight, LogOut, CheckCircle,
  ChevronDown, ChevronUp, Info, Utensils, ClipboardCheck, Dumbbell, CookingPot
} from 'lucide-react';
import { User, HealthLog, ChatMessage, Appointment, Article } from '../types';
import { getFetalGrowthDescription, calculateHpl, getRelativeDateString } from '../data/initialData';

interface MotherDashboardProps {
  user: User;
  onLogout: () => void;
  logs: HealthLog[];
  onAddLog: (newLog: HealthLog) => void;
  appointments: Appointment[];
  articles: Article[];
  chats: ChatMessage[];
  onSendChat: (msg: ChatMessage) => void;
  screeningHistory: {
    id: string;
    weeks: number;
    complaint: string;
    result: string;
    timestamp: string;
    status: 'RED' | 'GREEN' | 'YELLOW';
    weight?: number;
    systolic?: number;
    diastolic?: number;
    fetalMovement?: number;
  }[];
  onAddScreening: (newScr: any) => void;
  activeSos?: any;
  onTriggerSos?: (motherId: string, motherName: string, village: string, weeks: number) => void;
  onClearSos?: () => void;
}

export default function MotherDashboard({
  user,
  onLogout,
  logs,
  onAddLog,
  appointments,
  articles,
  chats,
  onSendChat,
  screeningHistory,
  onAddScreening,
  activeSos,
  onTriggerSos,
  onClearSos
}: MotherDashboardProps) {
  const profile = user.maternalProfile!;
  const currentWeeks = profile.gestationalWeeks;
  const growthInfo = getFetalGrowthDescription(currentWeeks);

  // States
  const [activeTab, setActiveTab] = useState<'overview' | 'monitoring' | 'education' | 'consultation' | 'ai_screening'>('overview');
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const [overviewSubTab, setOverviewSubTab] = useState<'info' | 'screening' | 'nutrition' | 'recipes' | 'activities'>('info');

  // AI SCREENING STATE
  const [screeningInput, setScreeningInput] = useState('');
  const [isScreening, setIsScreening] = useState(false);
  const [activeScreeningResult, setActiveScreeningResult] = useState<string | null>(null);
  
  // LOG FORM STATE
  const [weight, setWeight] = useState<string>('63');
  const [systolic, setSystolic] = useState<string>('120');
  const [diastolic, setDiastolic] = useState<string>('80');
  const [fetalMov, setFetalMov] = useState<string>('12');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState('');
  const [showLogSuccess, setShowLogSuccess] = useState(false);
  const [isGeneratingAiTriage, setIsGeneratingAiTriage] = useState(false);

  // INTERACTIVE WELLNESS RELAXATION BREATHING STATE
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [breathingSecondsLeft, setBreathingSecondsLeft] = useState(4);
  const [breathCycle, setBreathCycle] = useState(1);

  // INTERACTIVE SOS COUNTDOWN STATE
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(3);

  // SOS Countdown Timer Effect
  React.useEffect(() => {
    let interval: any;
    if (showSosModal) {
      setSosCountdown(3);
      interval = setInterval(() => {
        setSosCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            if (onTriggerSos) {
              onTriggerSos(user.id, user.name, profile.village, currentWeeks);
            }
            setShowSosModal(false);
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showSosModal, onTriggerSos, user.id, user.name, profile.village, currentWeeks]);

  // Breathing Relaxation Timer Effect
  React.useEffect(() => {
    let interval: any;
    if (showBreathingModal && breathingPhase !== 'idle') {
      interval = setInterval(() => {
        setBreathingSecondsLeft((prev) => {
          if (prev <= 1) {
            setBreathingPhase((currentPhase) => {
              if (currentPhase === 'inhale') {
                setBreathingSecondsLeft(4);
                return 'hold';
              } else if (currentPhase === 'hold') {
                setBreathingSecondsLeft(4);
                return 'exhale';
              } else {
                setBreathingSecondsLeft(4);
                setBreathCycle((c) => c + 1);
                return 'inhale';
              }
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showBreathingModal, breathingPhase]);

  // CHAT STATE
  const [chatMessageText, setChatMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Parse chat messages into pretty elements / warning blocks if they match triage rules
  const renderChatMessageContent = (text: string) => {
    const dangerPhrase = "Gejala Bahaya Terdeteksi! Sambil menunggu Bidan Wilayah merespons, lakukan tindakan P3K berikut sekarang...";
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const isDangerLine = line.includes(dangerPhrase);
      const parts = line.split("**");
      const renderedLine = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={pIdx} className={isDangerLine ? "text-rose-600 font-extrabold" : "font-semibold text-gray-900"}>{part}</strong>;
        }
        return part;
      });

      if (isDangerLine) {
        return (
          <div key={idx} className="bg-rose-50 border border-rose-200 text-rose-950 p-4 rounded-xl font-medium text-[11px] my-3 leading-relaxed shadow-sm flex items-start gap-2.5 animate-pulse">
            <span className="shrink-0 text-rose-500 text-sm">⚠️</span>
            <div>{renderedLine}</div>
          </div>
        );
      }

      return (
        <span key={idx} className="block mb-1">
          {renderedLine}
        </span>
      );
    });
  };

  // SINDROM RAW / SYMPTOMS TEMPLATE
  const symptomOptions = [
    "Pusing Hebat", "Pandangan Kabur/Sensitif Cahaya", "Kaki/Tangan Bengkak", 
    "Mual Muntah Berat (Morning Sickness)", "Demam", "Kram Perut Hebat", 
    "Keluar Cairan dari Jalan Lahir", "Bayi Tidak Bergerak"
  ];

  // ANC Appointments for this mother
  const motherApts = appointments.filter(a => a.motherId === user.id);
  // Logs for this mother
  const motherLogs = logs.filter(l => l.motherId === user.id).sort((a,b) => b.date.localeCompare(a.date));
  
  // Calculate days to due date HPL
  const hplDate = new Date(profile.hpl);
  const today = new Date();
  const timeDiff = hplDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

  const handleSymptomToggle = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  // AUTOMATIC TRIASE LOGIC BASED ON ACTIVE DATA
  const getRiskStatusFromMetrics = (sys: number, dia: number, syms: string[]): 'GREEN' | 'YELLOW' | 'RED' => {
    // Red flags (Danger Signs / Preeklampsia symptoms)
    const redSymptoms = ["Pusing Hebat", "Pandangan Kabur/Sensitif Cahaya", "Kaki/Tangan Bengkak", "Kram Perut Hebat", "Keluar Cairan dari Jalan Lahir", "Bayi Tidak Bergerak"];
    const hasRedSymptom = syms.some(s => redSymptoms.includes(s));
    const isHighBP = sys >= 140 || dia >= 90;

    if (hasRedSymptom || isHighBP) {
      return 'RED';
    }

    // Yellow flags (warning / mild stress)
    const yellowSymptoms = ["Mual Muntah Berat (Morning Sickness)", "Demam"];
    const hasYellowSymptom = syms.some(s => yellowSymptoms.includes(s));
    const isMarginalBP = (sys >= 130 && sys < 140) || (dia >= 85 && dia < 90);

    if (hasYellowSymptom || isMarginalBP || profile.comorbidities.length > 0) {
      return 'YELLOW';
    }

    return 'GREEN';
  };

  // Determine current overall mother status from the latest log
  const latestLog = motherLogs[0];
  const currentRiskStatus = latestLog ? latestLog.riskStatus : profile.riskStatus;

  // Handle self health-log submit with fully automated background AI Triage
  const handleAddLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sysNum = Number(systolic) || 120;
    const diaNum = Number(diastolic) || 80;
    const fetalNum = Number(fetalMov) || 12;
    const logRisk = getRiskStatusFromMetrics(sysNum, diaNum, selectedSymptoms);

    const newLog: HealthLog = {
      id: `log-${Date.now()}`,
      motherId: user.id,
      date: getRelativeDateString(0),
      weight: parseFloat(weight) || 63,
      systolic: sysNum,
      diastolic: diaNum,
      fetalMovement: fetalNum,
      symptoms: selectedSymptoms,
      notes: customNote,
      riskStatus: logRisk
    };

    onAddLog(newLog);
    
    // Set loading state for background AI Triage execution
    setIsGeneratingAiTriage(true);
    setShowLogSuccess(true);

    try {
      // 1. Send to background AI Triage
      const response = await fetch("/api/ai-triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: parseFloat(weight) || 63,
          systolic: sysNum,
          diastolic: diaNum,
          fetalMovement: fetalNum,
          symptoms: selectedSymptoms,
          notes: customNote,
          weeks: currentWeeks,
          patientName: user.name,
          comorbidities: profile.comorbidities || []
        })
      });

      const data = await response.json();
      
      const statusMapping: Record<string, 'GREEN' | 'YELLOW' | 'RED'> = {
        "Bahaya": "RED",
        "Sensitif": "YELLOW",
        "Aman": "GREEN"
      };

      const targetStatus = statusMapping[data.kategoriRisk as string] || (logRisk === 'RED' ? 'RED' : logRisk === 'YELLOW' ? 'YELLOW' : 'GREEN');
      const finalRiskLabel = data.kategoriRisk || (targetStatus === 'RED' ? 'Bahaya' : targetStatus === 'YELLOW' ? 'Sensitif' : 'Aman');

      // 2. Automatically generate the Laporan Mingguan (Screening)
      const formattedResult = `### KATEGORI RISIKO: ${finalRiskLabel}
      
**Hasil Analisis AI Triage Terkini:**
${data.analisis || "Kondisi kehamilan Anda telah berhasil dianalisis di latar belakang oleh AI Triage."}

**Rekomendasi Respons & Tindakan Medis:**
${data.rekomendasi || "Jaga istirahat, penuhi nutrisi seimbang, dan lakukan konsultasi rutin."}`;

      const newScreening = {
        id: `scr-${Date.now()}`,
        weeks: currentWeeks,
        complaint: `Pemeriksaan Mandiri: BB ${weight}kg, TD ${sysNum}/${sysNum} mmHg, Gerak Janin ${fetalNum}kali dlm 12 jam. Keluhan: ${selectedSymptoms.join(', ') || 'tidak ada'}. Catatan: ${customNote || 'tidak ada'}`,
        result: formattedResult,
        timestamp: new Date().toLocaleDateString('id-ID') + " " + new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}),
        status: targetStatus
      };

      onAddScreening(newScreening);
      setActiveScreeningResult(formattedResult);

    } catch (err) {
      console.error("Failed executing automated background AI Triage:", err);
      
      const fallbackRisk = logRisk === 'RED' ? 'Bahaya' : logRisk === 'YELLOW' ? 'Sensitif' : 'Aman';
      const fallbackAnalysis = `Terjadi kendala jaringan saat memproses data, namun rekam medis lokal Anda menunjukkan status ${fallbackRisk}.`;
      let fallbackRecs = "";
      
      if (logRisk === 'RED') {
        fallbackRecs = `1. Segera baring miring ke kiri untuk sirkulasi darah optimal.\n2. Hubungi bidan wilayah atau bersiap mendatangi faskes terdekat.\n3. Kurangi pergerakan fisik berlebihan.`;
      } else if (logRisk === 'YELLOW') {
        fallbackRecs = `1. Batasi konsumsi garam dan makanan olahan.\n2. Perbanyak minum air hangat (minimal 2.5 L/hari).\n3. Beristirahat cukup di kamar yang sejuk.`;
      } else {
        fallbackRecs = `1. Cukupi asupan gizi trimester ini.\n2. Teruskan memantau denyut dan gerak janin.\n3. Hadiri jadwal pemeriksaan ANC tepat waktu.`;
      }

      const formattedResultFallback = `### KATEGORI RISIKO: ${fallbackRisk}

**Hasil Analisis AI Triage Terkini:**
${fallbackAnalysis}

**Rekomendasi Respons & Tindakan Medis:**
${fallbackRecs}`;

      const newScreeningFallback = {
        id: `scr-${Date.now()}`,
        weeks: currentWeeks,
        complaint: `Pemeriksaan Mandiri: BB ${weight}kg, TD ${sysNum}/${sysNum} mmHg, Gerak Janin ${fetalNum}kali dlm 12 jam. Keluhan: ${selectedSymptoms.join(', ') || 'tidak ada'}`,
        result: formattedResultFallback,
        timestamp: new Date().toLocaleDateString('id-ID') + " " + new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}),
        status: logRisk
      };

      onAddScreening(newScreeningFallback);
      setActiveScreeningResult(formattedResultFallback);
    } finally {
      setIsGeneratingAiTriage(false);
    }
    
    // Reset inputs
    setSelectedSymptoms([]);
    setCustomNote('');
    
    // Wait for the success indication, then focus on report view
    setTimeout(() => {
      setShowLogSuccess(false);
      setActiveTab('ai_screening'); // Go directly to Weekly AI Triage Reports tab to view the formatted report card!
    }, 1800);
  };

  // Handle direct conversation with assigned Bidan Siti in "Tanya Bidan Wilayah"
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessageText.trim()) return;

    const userMsgText = chatMessageText.trim();

    // Send mother chat message
    const motherMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      senderId: user.id,
      senderRole: 'mother',
      recipientId: 'midwife-1', // Assigned Bidan Siti
      recipientName: 'Siti Rahma, S.Tr.Keb',
      message: userMsgText,
      timestamp: new Date().toLocaleDateString('id-ID') + " " + new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})
    };

    onSendChat(motherMsg);
    setChatMessageText('');
    setIsTyping(true);

    // Automated supportive midwife response simulation after 1.5 seconds!
    setTimeout(() => {
      const msgLower = userMsgText.toLowerCase();
      let reply = `Halo Ibu ${user.name}, pesan Ibu sudah saya terima dengan baik di portal klinis. Apabila Ibu merasakan gejala mendadak atau butuh penapisan mandiri, harap juga coba menu baru 'Skrining Mingguan AI' agar sistem dapat segera mendeteksi risiko Triage secara real-time. Jika darurat, segera hubungi kontak Puskesmas atau bersiap ke IGD ya Bu.`;

      if (msgLower.includes('jadwal') || msgLower.includes('kapan') || msgLower.includes('anc')) {
        reply = `Halo Ibu ${user.name}, untuk jadwal kunjungan antenatal (ANC) atau pemeriksaan darah terencana berikutnya, silakan periksa di tabel 'Jadwal Pemeriksaan ANC' pada menu Ringkasan Kehamilan ya Bu.`;
      } else if (msgLower.includes('posyandu') || msgLower.includes('balai')) {
        reply = `Halo Ibu, posyandu bumil Sukamaju dilaksanakan setiap hari Selasa minggu kedua di Balai Desa. Harap selalu bawa buku pink KIA ya Bu agar terpantau.`;
      } else if (msgLower.includes('vitamin') || msgLower.includes('obat') || msgLower.includes('suplemen')) {
        reply = `Halo Ibu, pastikan konsumsi Tablet Tambah Darah (TTD) satu tablet setiap malam sebelum tidur (diminum dengan air jeruk agar penyerapan maksimal) dan suplemen kalsium dipisah waktunya ya Bu, agar tumbuh kembang janin terus optimal.`;
      }

      const bidanMsg: ChatMessage = {
        id: `chat-auto-${Date.now()}`,
        senderId: 'midwife-1',
        senderRole: 'midwife',
        recipientId: user.id,
        recipientName: user.name,
        message: reply,
        timestamp: new Date().toLocaleDateString('id-ID') + " " + new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})
      };

      onSendChat(bidanMsg);
      setIsTyping(false);
    }, 1500);
  };

  // Handle server-side Gemini AI medical screening triage
  const handleAiScreeningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screeningInput.trim()) return;

    const inputMsg = screeningInput.trim();
    setScreeningInput('');
    setIsScreening(true);
    setActiveScreeningResult(null);

    try {
      // Direct call to our custom full-stack backend endpoint
      const res = await fetch("/api/chat-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputMsg }),
      });
      
      const data = await res.json();
      const reply = data.text || "Terjadi kendala jaringan saat menghubungkan ke satgas AI Triage.";

      const msgLower = inputMsg.toLowerCase();
      const hasSelfRescue = msgLower.includes("sendiri") || 
                           msgLower.includes("tunggal") || 
                           msgLower.includes("pingsan") || 
                           msgLower.includes("tidak ada orang") || 
                           msgLower.includes("seorang diri") ||
                           msgLower.includes("mandiri");
      const hasCrowd = msgLower.includes("umum") || 
                       msgLower.includes("ramai") || 
                       msgLower.includes("keramaian") || 
                       msgLower.includes("kerumunan") || 
                       msgLower.includes("bystander") || 
                       msgLower.includes("pasar") || 
                       msgLower.includes("jalan") || 
                       msgLower.includes("stasiun") || 
                       msgLower.includes("terminal") ||
                       msgLower.includes("panik") || 
                       msgLower.includes("pasif") || 
                       msgLower.includes("banyak orang") || 
                       msgLower.includes("publik") || 
                       msgLower.includes("halte") ||
                       msgLower.includes("mall");
      const hasRural3T = msgLower.includes("terpencil") || 
                         msgLower.includes("3t") || 
                         msgLower.includes("pelosok") || 
                         msgLower.includes("pedalaman") || 
                         msgLower.includes("unreached") ||
                         msgLower.includes("desa jauh") || 
                         msgLower.includes("perbatasan") ||
                         msgLower.includes("pustu");

      const isDanger = msgLower.includes("pendarahan") || 
                       msgLower.includes("darah") || 
                       msgLower.includes("ketuban") || 
                       msgLower.includes("pusing") || 
                       msgLower.includes("kabur") || 
                       msgLower.includes("pandangan") || 
                       msgLower.includes("muntah hebat") ||
                       msgLower.includes("nyeri perut") || 
                       msgLower.includes("nyerut") || 
                       msgLower.includes("kram") ||
                       hasSelfRescue ||
                       hasCrowd ||
                       hasRural3T;

      const newScreening = {
        id: `scr-${Date.now()}`,
        weeks: currentWeeks,
        complaint: inputMsg,
        result: reply,
        timestamp: new Date().toLocaleDateString('id-ID') + " " + new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}),
        status: isDanger ? 'RED' as const : 'GREEN' as const
      };

      onAddScreening(newScreening);
      setActiveScreeningResult(reply);
    } catch (err) {
      console.warn("Falling back to local clinical triage due to API Error:", err);
      
      const msgLower = inputMsg.toLowerCase();
      const hasSelfRescue = msgLower.includes("sendiri") || 
                           msgLower.includes("tunggal") || 
                           msgLower.includes("pingsan") || 
                           msgLower.includes("tidak ada orang") || 
                           msgLower.includes("seorang diri") ||
                           msgLower.includes("mandiri");
      const hasCrowd = msgLower.includes("umum") || 
                       msgLower.includes("ramai") || 
                       msgLower.includes("keramaian") || 
                       msgLower.includes("kerumunan") || 
                       msgLower.includes("bystander") || 
                       msgLower.includes("pasar") || 
                       msgLower.includes("jalan") || 
                       msgLower.includes("stasiun") || 
                       msgLower.includes("terminal") ||
                       msgLower.includes("panik") || 
                       msgLower.includes("pasif") || 
                       msgLower.includes("banyak orang") || 
                       msgLower.includes("publik") || 
                       msgLower.includes("halte") ||
                       msgLower.includes("mall");
      const hasRural3T = msgLower.includes("terpencil") || 
                         msgLower.includes("3t") || 
                         msgLower.includes("pelosok") || 
                         msgLower.includes("pedalaman") || 
                         msgLower.includes("unreached") ||
                         msgLower.includes("desa jauh") || 
                         msgLower.includes("perbatasan") ||
                         msgLower.includes("pustu");

      const isDanger = msgLower.includes('pusing') || 
                       msgLower.includes('sakit') || 
                       msgLower.includes('darah') || 
                       msgLower.includes('muntah') ||
                       msgLower.includes('ketuban') ||
                       msgLower.includes('pecah') ||
                       msgLower.includes('kabur') ||
                       msgLower.includes('pendarahan') ||
                       msgLower.includes('kram') ||
                       msgLower.includes('nyeri') ||
                       hasSelfRescue ||
                       hasCrowd ||
                       hasRural3T;
      
      let reply = "";
      if (isDanger) {
        reply = `**🚨 Gejala Bahaya Terdeteksi! Sambil menunggu Bidan Wilayah merespons, lakukan tindakan P3K berikut sekarang...**\n\n`;
        
        if (hasSelfRescue) {
          reply += `### 🛌 Protokol Mandiri (Self-Rescue):\n`;
          reply += `Ibu, tetaplah tenang, tarik napas dalam-dalam. Karena Ibu sedang sendirian, **jangan mencoba berdiri**. Lakukan langkah mandiri berikut:\n`;
          reply += `1. **Baring Miring Kiri**: Segera berbaringlah miring ke kiri di atas lantai atau kasur tanpa memaksakan diri berdiri untuk melancarkan oksigen ke janin.\n`;
          reply += `2. **Picu Bantuan Luar**: Coba buka kunci/slot pintu terdekat yang bisa dijangkau sambil merangkak agar penolong bisa masuk. Kirim pesan suara darurat atau share lokasi GPS ke WhatsApp keluarga, atau berteriaklah minta tolong.\n`;
          reply += `3. **Longgarkan Pakaian**: Longgarkan ikat pinggang, kancing baju, atau pakaian yang ketat.\n\n`;
        } else {
          reply += `1. **Berbaring Miring Kiri**: Segera baringkan tubuh mengarah ke kiri untuk meningkatkan sirkulasi utero-plasenta dan melancarkan pasokan oksigen janin.\n`;
          reply += `2. **Tirah Baring Total (Bedrest)**: Hentikan segala jenis aktivitas fisik rumah tangga dan berbaringlah.\n`;
          reply += `3. **Amati Keluhan Sekitar**: Perhatikan volume cairan/darah yang keluar, atau segera ukur tensi jika memiliki sfigmomanometer mandiri di rumah.\n`;
          reply += `4. **Hubungi Keluarga & Puskesmas**: Segera ajak pasangan atau keluarga terdekat untuk mengantar Ibu ke Puskesmas Mekar Sari atau fasilitas rujukan terdekat.\n\n`;
        }

        if (hasCrowd) {
          reply += `### 📣 Kendali Massa:\n`;
          reply += `Karena Ibu berada di tempat umum atau keramaian di mana orang sekitar cenderung pasif atau panik, mintalah seseorang berteriak dengan instruksi tegas berikut:\n`;
          reply += `- *"Semua orang tolong mundur 3 langkah sekarang juga agar Ibu ini mendapat ruang oksigen!"*\n`;
          reply += `- Menunjuk orang secara spesifik: *"Bapak kaos merah di depan, tolong telepon Ambulans ke 112 sekarang!"*\n`;
          reply += `- *"Ibu baju kuning di samping, tolong panggil petugas keamanan atau satpam stasiun terdekat!"*\n\n`;
        }

        if (hasRural3T) {
          reply += `### 🩺 Rekomendasi Medis Faskes Terbatas (Daerah 3T):\n`;
          reply += `Rekomendasi tindakan medis darurat jangka pendek yang realistis bagi Bidan Desa menggunakan fasilitas puskesmas terbatas:\n`;
          reply += `1. **Stabilisasi Cairan**: Pasang jalur IV line infus NaCl 0.9% atau Ringer Laktat (RL) untuk mencegah syok.\n`;
          reply += `2. **Oksigenasi**: Berikan oksigen nasal kanul 2-4 L/menit jika tersedia.\n`;
          reply += `3. **Monitor TTV & DJJ**: Ukur tekanan darah ibu dan dengarkan Detak Jantung Janin secara manual sesering mungkin.\n`;
          reply += `4. **Persiapan Rujukan**: Segera persiapkan sarana evakuasi darurat menuju Rumah Sakit rujukan kota terdekat.\n`;
        }
      } else {
        reply = `Halo Ibu, terima kasih sudah berkonsultasi mengenai keluhan Anda. Pada fase kehamilan masa ini, keluhan tersebut umumnya masih tergolong normal akibat adaptasi hormonal tubuh.\n\nCobalah kurangi beban aktivitas bising/melelahkan, cukupi hidrasi cairan (minum air hangat minimal 2-3 liter sehari), beristirahat baring miring kiri, serta tetap hitung gerakan janin secara mandiri (target minimal 10 kali per 12 jam). Tetap tenang, dan jika keluhan semakin memburuk atau timbul tanda bahaya lain, segera laporkan ke Bidan atau kunjungi Puskesmas terdekat ya Bu.`;
      }

      const newScreening = {
        id: `scr-${Date.now()}`,
        weeks: currentWeeks,
        complaint: inputMsg,
        result: reply,
        timestamp: new Date().toLocaleDateString('id-ID') + " " + new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}),
        status: isDanger ? 'RED' as const : 'GREEN' as const
      };

      onAddScreening(newScreening);
      setActiveScreeningResult(reply);
    } finally {
      setIsScreening(false);
    }
  };

  // Determine targeted Trimester
  const trimesterNum = currentWeeks <= 12 ? 1 : currentWeeks <= 27 ? 2 : 3;
  const filteredArticles = articles.filter(art => art.targetTrimester === trimesterNum);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-left">
      
      {/* Top Header */}
      <header className="bg-white border-b border-sage-100 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 font-display">Halo, Ibu {user.name}</h1>
                <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full font-bold font-mono">
                  NIK: {profile.nik}
                </span>
              </div>
              <p className="text-xs text-gray-500">Masa Kehamilan Trimester {trimesterNum} &bull; {profile.village}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* LATIHAN NAPAS WELLNESS TRIGGER */}
            <button
              onClick={() => {
                setShowBreathingModal(true);
                setBreathingPhase('idle');
                setBreathingSecondsLeft(4);
                setBreathCycle(1);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200 hover:border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer"
              title="Mulai Panduan Napas Relaksasi"
            >
              <Smile className="w-4 h-4" />
              <span>Latihan Napas Relaksasi</span>
            </button>

            {/* SOS DARURAT TRIGGER */}
            <button
              onClick={() => {
                if (activeSos && activeSos.motherId === user.id) {
                  // Already active, show options or confirm resolution
                  if (window.confirm("Apakah kondisi darurat Anda sudah teratasi? Klik OK untuk menghentikan alarm SOS.")) {
                    if (onClearSos) onClearSos();
                  }
                } else {
                  setShowSosModal(true);
                  setSosCountdown(3);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold tracking-wider transition-all shadow-2xs cursor-pointer ${
                activeSos && activeSos.motherId === user.id
                  ? 'bg-rose-150 border border-rose-300 text-rose-800 animate-pulse'
                  : 'bg-rose-600 hover:bg-rose-700 border border-rose-500 text-white animate-bounce'
              }`}
              title="Kirim Sinyal SOS Darurat ke Bidan Wilayah"
            >
              <AlertTriangle className="w-4 h-4 text-white" />
              <span>{activeSos && activeSos.motherId === user.id ? '🚨 ALARM SOS AKTIF' : '🚨 SOS DARURAT'}</span>
            </button>

            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-gray-250 rounded-xl transition-all cursor-pointer"
              title="Keluar dari Sistem"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* PERSISTENT REAL-TIME ACTIVE SOS WARNING BAR */}
      {activeSos && activeSos.motherId === user.id && (
        <div className="bg-rose-600 text-white py-3.5 px-6 animate-pulse flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md text-left z-20">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-rose-750/80 rounded-full text-lg shadow-sm">🚨</span>
            <div>
              <h4 className="font-extrabold text-sm tracking-wide">PENGIRIMAN ALARM DARURAT SOS SEDANG BERJALAN!</h4>
              <p className="text-xs text-rose-100 font-medium">Sinyal krisis terkirim ke Bidan Wilayah ({activeSos.timestamp}). Mohon tetap tenang di posisi aman Anda, Bidan Siti Rahma & tim medis sedang merespons cepat.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => {
              if (window.confirm("Apakah masalah selesai atau situasi darurat Anda sudah teratasi? Klik OK untuk menonaktifkan alarm SOS.")) {
                if (onClearSos) onClearSos();
              }
            }}
            className="px-4 py-2 bg-white text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all shadow-sm hover:scale-102 cursor-pointer uppercase shrink-0"
          >
            🟢 Nonaktifkan Alarm SOS
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Dynamic Tabs Selector */}
        <nav className="lg:col-span-3 flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'overview' 
                ? 'bg-sage-600 text-white shadow' 
                : 'text-gray-600 hover:bg-grave-50 hover:text-gray-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            Ringkasan Kehamilan
          </button>
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`flex items-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'monitoring' 
                ? 'bg-sage-600 text-white shadow' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            Catat Log Mingguan
          </button>
          <button
            onClick={() => setActiveTab('education')}
            className={`flex items-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'education' 
                ? 'bg-sage-600 text-white shadow' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Edukasi Trimester {trimesterNum}
          </button>
          <button
            onClick={() => setActiveTab('ai_screening')}
            className={`flex items-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'ai_screening' 
                ? 'bg-sage-600 text-white shadow' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
            Skrining Mingguan AI
          </button>
          <button
            onClick={() => setActiveTab('consultation')}
            className={`flex items-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all whitespace-nowrap mt-0.5 ${
              activeTab === 'consultation' 
                ? 'bg-sage-600 text-white shadow' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Tanya Bidan Wilayah
          </button>
        </nav>

        {/* Right Side: Tab Contents Panel */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Pregnancy progress panel (high density) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sage-100 rounded-bl-full opacity-60 -z-0" />
                
                {/* Growth and weeks visual */}
                <div className="md:col-span-8 space-y-4 relative z-10 text-left">
                  <span className="text-[10px] uppercase font-mono bg-sage-500 text-white px-2.5 py-0.5 rounded-full font-bold">
                    Perkembangan Janin Aktif
                  </span>
                  
                  <h2 className="text-2xl font-bold font-display text-gray-900">
                    Kandungan memasuki <span className="text-sage-600">Minggu Ke-{currentWeeks}</span>
                  </h2>
                  
                  <div className="bg-sage-50 border border-sage-100 p-4 rounded-xl flex items-start gap-3.5">
                    <span className="text-3xl">🍈</span>
                    <div>
                      <h4 className="font-bold text-sage-950 text-sm capitalize">Massa Janin Sebesar {growthInfo.size}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">{growthInfo.description}</p>
                      
                      <div className="flex gap-4 mt-3 font-mono text-[11px] text-sage-800">
                        <span>⚖️ Berat: <strong>{growthInfo.weight}</strong></span>
                        <span>📏 Panjang: <strong>{growthInfo.length}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal visual meter for 40 weeks */}
                  <div className="pt-2 space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-gray-400">
                      <span>Awal (HPHT: {profile.hpht})</span>
                      <span className="text-gray-800">40 Minggu Maksimum</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3.5 rounded-full p-0.5 border">
                      <div 
                        className="bg-sage-500 h-2 rounded-full transition-all duration-1000 flex items-center justify-end pr-2" 
                        style={{ width: `${(currentWeeks / 40) * 100}%` }}
                      >
                        <span className="text-[8px] text-white font-bold leading-none">{Math.round((currentWeeks/40)*100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Countdown and target HPL Card */}
                <div className="md:col-span-4 bg-sage-600 text-white p-5 rounded-xl flex flex-col justify-between text-left shadow-md">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-sage-100">Menuju Kelahiran</span>
                    <h3 className="text-3xl font-black font-display mt-2">{daysRemaining} Hari</h3>
                    <p className="text-xs text-sage-100/90 leading-tight">Hari Perkiraan Lahir (HPL)</p>
                  </div>
                  
                  <div className="mt-6 pt-3 border-t border-white/20">
                    <div className="text-[10px] uppercase font-mono text-sage-200">Kalkulasi Tanggal:</div>
                    <div className="font-mono font-bold text-sm text-yellow-300">{profile.hpl}</div>
                    <p className="text-[10px] text-sage-100/80 mt-1 italic leading-tight">Berdasarkan Naegele's Rule haid terakhir Anda.</p>
                  </div>
                </div>
              </div>

              {/* Grid: ANC Reminders & Last Log Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* ANC Schedules Box */}
                <div className="bg-white p-5 rounded-2xl border border-gray-150 text-left">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-sage-600" />
                      Jadwal ANC (AnteNatal Care)
                    </h3>
                    <span className="text-[10px] bg-amber-55 text-amber-800 px-2.5 py-0.5 rounded font-bold uppercase">Skrining Rutin</span>
                  </div>

                  <div className="space-y-3.5">
                    {motherApts.map((apt) => (
                      <div 
                        key={apt.id} 
                        className={`p-3 rounded-xl border flex items-start gap-3 ${
                          apt.isCompleted 
                            ? 'bg-slate-50 border-gray-200 opacity-75' 
                            : 'bg-indigo-50/40 border-indigo-100 font-semibold'
                        }`}
                      >
                        {apt.isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 mt-2 animate-ping shrink-0" />
                        )}
                        <div className="flex-grow text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-900">{apt.type} &bull; Bidan Siti</span>
                            <span className="text-[10px] font-mono text-slate-500">{apt.date}</span>
                          </div>
                          <p className="text-gray-400 text-[10px] mt-0.5">Pukul {apt.time} WIB</p>
                          {apt.notes && (
                            <p className="text-gray-600 mt-1 text-[11px] leading-relaxed italic">Notes: "{apt.notes}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-slate-900 text-slate-300 rounded-xl text-[11px] flex gap-2">
                    <Bell className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
                    <span>WHO merekomendasikan minimal **6 kali pemeriksaan ANC** selama masa kehamilan untuk mendeteksi bahaya ibu melahirkan.</span>
                  </div>
                </div>

                {/* Last Health Record Box */}
                <div className="bg-white p-5 rounded-2xl border border-gray-150 text-left">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <LineChart className="w-4 h-4 text-emerald-600" />
                      Hasil Pemantauan Mandiri Terakhir
                    </h3>
                    <button 
                      onClick={() => setActiveTab('monitoring')} 
                      className="text-xs text-sage-600 font-bold hover:underline"
                    >
                      + Tambah
                    </button>
                  </div>

                  {latestLog ? (
                    <div className="space-y-4">
                      {/* Grid metrics badges */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-gray-100 text-center">
                          <Weight className="w-4.5 h-4.5 text-sage-600 mx-auto mb-1.5" />
                          <span className="text-[10px] text-gray-400 block uppercase font-mono">Berat Badan</span>
                          <span className="font-mono font-bold text-gray-900 text-sm">{latestLog.weight} kg</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-gray-100 text-center">
                          <Activity className="w-4.5 h-4.5 text-emerald-600 mx-auto mb-1.5" />
                          <span className="text-[10px] text-gray-400 block uppercase font-mono">Tensi (BP)</span>
                          <span className="font-mono font-bold text-gray-900 text-sm">{latestLog.systolic}/{latestLog.diastolic}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-gray-100 text-center">
                          <Heart className="w-4.5 h-4.5 text-rose-500 mx-auto mb-1.5" />
                          <span className="text-[10px] text-gray-400 block uppercase font-mono">Gerakan Janin</span>
                          <span className="font-mono font-bold text-gray-900 text-sm">{latestLog.fetalMovement}x / 12h</span>
                        </div>
                      </div>

                      {/* Symptoms reported */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold font-mono text-gray-400">Gejala Yang Dilaporkan:</span>
                        {latestLog.symptoms.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {latestLog.symptoms.map(s => (
                              <span key={s} className="bg-rose-50 text-rose-800 border border-rose-100 px-2 py-0.5 rounded text-[10px] font-semibold">
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-emerald-600 font-semibold italic">Alhamdulillah, tidak ada keluhan sakit atau tanda bahaya.</p>
                        )}
                      </div>

                      {/* Doctor notes */}
                      {latestLog.notes && (
                        <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-xs text-amber-900 leading-relaxed">
                          <strong>Catatan Ibu:</strong> "{latestLog.notes}"
                        </div>
                      )}

                      <div className="text-[10px] text-gray-400 text-right mt-1 font-mono">
                        Dicatatkan otomatis pada tgl: {latestLog.date}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-400 italic text-xs">
                      Belum ada log harian/mingguan yang diisi. Klik tombol di kanan atas untuk mencatatkan kondisi pertama.
                    </div>
                  )}
                </div>
              </div>

              {/* PANDUAN KOMPREHENSIF TRIMESTER INTERAKTIF */}
              <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 text-left space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono bg-sage-100 text-sage-800 border border-sage-200 px-2.5 py-0.5 rounded-full font-bold">
                      Panduan Interaktif Klinis Berdasarkan Minggu Kehamilan Anda
                    </span>
                    <h3 className="text-lg font-bold text-gray-950 mt-1.5 font-display flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
                      Rekomendasi Pintar Trimester {trimesterNum}
                    </h3>
                  </div>
                  <div className="text-xs text-gray-400 font-medium">
                    Panduan nutrisi, skrining, resep lokal, & aktifitas harian sehat
                  </div>
                </div>

                {/* Sub-Tabs Button Row */}
                <div className="flex gap-1 overflow-x-auto pb-1.5 border-b border-gray-100">
                  <button
                    onClick={() => setOverviewSubTab('info')}
                    className={`flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      overviewSubTab === 'info'
                        ? 'bg-sage-600 text-white'
                        : 'text-gray-600 hover:bg-slate-50'
                    }`}
                  >
                    <Info className="w-3.5 h-3.5" />
                    Informasi Umum
                  </button>
                  <button
                    onClick={() => setOverviewSubTab('screening')}
                    className={`flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      overviewSubTab === 'screening'
                        ? 'bg-sage-600 text-white'
                        : 'text-gray-600 hover:bg-slate-50'
                    }`}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    Skrining Kehamilan
                  </button>
                  <button
                    onClick={() => setOverviewSubTab('nutrition')}
                    className={`flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      overviewSubTab === 'nutrition'
                        ? 'bg-sage-600 text-white'
                        : 'text-gray-600 hover:bg-slate-50'
                    }`}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    Makanan & Nutrisi
                  </button>
                  <button
                    onClick={() => setOverviewSubTab('recipes')}
                    className={`flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      overviewSubTab === 'recipes'
                        ? 'bg-sage-600 text-white'
                        : 'text-gray-600 hover:bg-slate-50'
                    }`}
                  >
                    <CookingPot className="w-3.5 h-3.5" />
                    Resep Makanan Sehat
                  </button>
                  <button
                    onClick={() => setOverviewSubTab('activities')}
                    className={`flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      overviewSubTab === 'activities'
                        ? 'bg-sage-600 text-white'
                        : 'text-gray-600 hover:bg-slate-50'
                    }`}
                  >
                    <Dumbbell className="w-3.5 h-3.5" />
                    Aktifitas & Olahraga
                  </button>
                </div>

                {/* Content Render based on selected Tab and Trimester */}
                <div className="bg-slate-50/50 rounded-xl border border-gray-150 p-4 sm:p-5 mt-4">
                  {overviewSubTab === 'info' && (
                    <div className="space-y-4">
                      <div className="border-l-4 border-sage-500 pl-3">
                        <h4 className="font-bold text-gray-950 text-sm">Fase Tubuh Ibu & Janin Saat Ini (Trimester {trimesterNum})</h4>
                        <p className="text-xs text-slate-500 mt-1">Minggu ke-{currentWeeks} kehamilan Ibu memiliki fokus klinis utama berikut:</p>
                      </div>

                      {trimesterNum === 1 && (
                        <div className="space-y-3.5 text-xs text-gray-700 leading-relaxed">
                          <p>
                            <strong>Fase Pembentukan Organ Vital (Organogenesis):</strong> Pada fase ini, sel-sel janin membelah sangat cepat untuk membangun tabung saraf, saraf pusat, jantung, liver, dan struktur tubuh utama.
                          </p>
                          <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-2">
                            <span className="font-bold text-sage-800 text-[11px] block uppercase font-mono">Simpulan Trimester Pertama</span>
                            <ul className="list-disc pl-4 space-y-1.5">
                              <li><strong>Gejala Umum:</strong> Mual muntah pagi hari (morning sickness), kelelahan ekstrem akibat lonjakan progesteron, dan sensitivitas penciuman.</li>
                              <li><strong>Fokus Utama:</strong> Pastikan asupan asam folat terpenuhi guna menghindari cacat tabung saraf janin.</li>
                              <li><strong>Perubahan Hormon:</strong> Hormon hCG (Human Chorionic) sedang tinggi untuk mempertahankan kehamilan secara alami di rahim.</li>
                            </ul>
                          </div>
                        </div>
                      )}

                      {trimesterNum === 2 && (
                        <div className="space-y-3.5 text-xs text-gray-700 leading-relaxed">
                          <p>
                            <strong>Fase Kenyamanan & Pertumbuhan Cepat:</strong> Banyak ibu merasa trimester kedua adalah fase paling nyaman karena mual berkurang drastis, energi kembali pulih, dan janin mulai aktif bergerak (quickening).
                          </p>
                          <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-2">
                            <span className="font-bold text-sage-800 text-[11px] block uppercase font-mono">Simpulan Trimester Kedua</span>
                            <ul className="list-disc pl-4 space-y-1.5">
                              <li><strong>Gejala Umum:</strong> Perut mulai terlihat condong membesar, nyeri ligamen perut bawah (round ligament pain), serta kaki atau tangan sedikit bengkak ringan di sore hari.</li>
                              <li><strong>Fokus Utama:</strong> Pembentukan jaringan tulang bayi memerlukan kalsium ekstra tinggi serta zat besi pembentuk sel darah merah.</li>
                              <li><strong>Gerakan Janin:</strong> Mulailah melatih kepekaan mendeteksi gerakan janin di dalam rahim, biasanya terasa seperti kepakan sayap kupu-kupu yang hangat.</li>
                            </ul>
                          </div>
                        </div>
                      )}

                      {trimesterNum === 3 && (
                        <div className="space-y-3.5 text-xs text-gray-700 leading-relaxed">
                          <p>
                            <strong>Fase Pematangan & Persiapan Lahir:</strong> Rahim bertambah besar dan menekan lambung, paru-paru, serta kantung kemih. Berat badan bayi bertambah sangat signifikan untuk menumpuk sel lemak pelindung tubuh pasca lahir.
                          </p>
                          <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-2">
                            <span className="font-bold text-sage-800 text-[11px] block uppercase font-mono">Simpulan Trimester Ketiga</span>
                            <ul className="list-disc pl-4 space-y-1.5">
                              <li><strong>Gejala Umum:</strong> Nafas terasa lebih pendek, sering buang air kecil, begah, sakit punggung bagian belakang, dan mulai merasakan kontraksi palsu (Braxton Hicks).</li>
                              <li><strong>Fokus Utama:</strong> Pemantauan ketat gerakan janin harian dan tekanan darah pemicu preeklampsia. Persiapkan tas melahirkan dan mental persalinan.</li>
                              <li><strong>Kematangan Organ Bayi:</strong> Paru-paru janin menghasilkan surfaktan agar siap bernapas mandiri di udara luar saat lahir nanti.</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {overviewSubTab === 'screening' && (
                    <div className="space-y-4">
                      <div className="border-l-4 border-indigo-500 pl-3">
                        <h4 className="font-bold text-gray-950 text-sm">Rekomendasi Skrining & Tes Lab (Trimester {trimesterNum})</h4>
                        <p className="text-xs text-slate-500 mt-1">Berikut skrining penting untuk memastikan tidak ada komplikasi tak bergejala:</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {trimesterNum === 1 && (
                          <>
                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-1 text-left">
                              <span className="text-lg">🔬</span>
                              <h5 className="font-bold text-xs text-gray-950">Triple Eliminasi PPIA</h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed">Tes laboratorium wajib Puskesmas untuk menyaring infeksi HIV, Sifilis, dan Hepatitis B agar tidak menular ke janin.</p>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-1 text-left">
                              <span className="text-lg">🩸</span>
                              <h5 className="font-bold text-xs text-gray-950">Hb & Golongan Darah</h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed">Mendeteksi anemia gizi besi secara dini guna mencegah risiko keguguran atau keterlambatan tumbuh kembang janin.</p>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-1 text-left">
                              <span className="text-lg">🖥️</span>
                              <h5 className="font-bold text-xs text-gray-950">USG Dasar Pertama</h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed">Memastikan kantung kehamilan berada di dalam rahim (bukan ektopik) dan menentukan Hari Perkiraan Lahir (HPL) yang presisi.</p>
                            </div>
                          </>
                        )}

                        {trimesterNum === 2 && (
                          <>
                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-1 text-left">
                              <span className="text-lg">💉</span>
                              <h5 className="font-bold text-xs text-gray-950">Tes Toleransi Glukosa</h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed">Skrining diabetes gestasional antara minggu 24-28 dengan meminum cairan gula pekat dan memantau glukosa darah berkala.</p>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-1 text-left">
                              <span className="text-lg">🖥️</span>
                              <h5 className="font-bold text-xs text-gray-950">USG Kelainan Anomali</h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed">Pemindaian penuh struktur janin (jantung, sela otak, langit-langit mulut, jari tangan-kaki lengkap) di minggu 18-22.</p>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-1 text-left">
                              <span className="text-lg">🧪</span>
                              <h5 className="font-bold text-xs text-gray-950">Tes Hb Ulang Terjadwal</h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed">Mengantisipasi pengenceran darah (hemodilusi) fisiologis kehamilan yang sering memicu anemia sekunder di trimester kedua.</p>
                            </div>
                          </>
                        )}

                        {trimesterNum === 3 && (
                          <>
                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-1 text-left">
                              <span className="text-lg">🩺</span>
                              <h5 className="font-bold text-xs text-gray-950">Protein Urin & Tekanan Darah</h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed">Skrining utama preeklampsia dalam setiap pemeriksaan ANC. Tensi tinggi &ge; 140/90 mmHg dan protein urin positif adalah bahaya.</p>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-1 text-left">
                              <span className="text-lg">🧫</span>
                              <h5 className="font-bold text-xs text-gray-950">Skrining Infeksi GBS</h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed">Uji swab jalan lahir pada minggu ke-35 s.d 37 melacak bakteri Streptococcus Grup B yang berisiko menular ke bayi saat persalinan.</p>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-1 text-left">
                              <span className="text-lg">📏</span>
                              <h5 className="font-bold text-xs text-gray-950">USG Letak Plasenta & Volume Ketuban</h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed">Memeriksa plasenta previa (plasenta menutupi jalan lahir) serta memastikan indeks air ketuban cukup untuk proses bersalin normal.</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {overviewSubTab === 'nutrition' && (
                    <div className="space-y-4">
                      <div className="border-l-4 border-emerald-500 pl-3">
                        <h4 className="font-bold text-gray-950 text-sm">Zat Gizi Esensial & Kebutuhan Nutrisi (Trimester {trimesterNum})</h4>
                        <p className="text-xs text-slate-500 mt-1">Kelompok zat makanan spesifik yang wajib didapatkan ibu untuk kehamilan sehat:</p>
                      </div>

                      <div className="space-y-3.5">
                        {trimesterNum === 1 && (
                          <>
                            <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">F</div>
                              <div className="text-left text-xs">
                                <h5 className="font-bold text-gray-955">Asam Folat (Folate / Vitamin B9) &bull; Target: 605 mcg</h5>
                                <p className="text-gray-550 text-[11px] leading-relaxed mt-0.5">Sangat penting untuk replikasi DNA dan menutup tabung saraf sumsum tulang belakang. Sumber utama: Sayuran hijau (bayam, brokoli), jeruk manis, alpukat, dan hati ayam matang bersih.</p>
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-800 flex items-center justify-center font-bold text-xs shrink-0">B6</div>
                              <div className="text-left text-xs">
                                <h5 className="font-bold text-gray-955">Vitamin B6 (Pyridoxine) &bull; Target: 1.9 mg</h5>
                                <p className="text-gray-555 text-[11px] leading-relaxed mt-0.5">Membantu mengurangi kepekaan lambung dari mual pagi (*emesis gravidarum*). Sumber: Pisang ambon, oat, kacang tanah, dada ayam panggang matang.</p>
                              </div>
                            </div>
                          </>
                        )}

                        {trimesterNum === 2 && (
                          <>
                            <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0 font-display">Fe</div>
                              <div className="text-left text-xs">
                                <h5 className="font-bold text-gray-955">Zat Besi (Iron) &bull; Target: 27 mg</h5>
                                <p className="text-gray-555 text-[11px] leading-relaxed mt-0.5">Membentuk sel darah merah tambahan mendukung sirkulasi ibu-anak yang meningkat pesat. Sumber: Daging sapi/kambing rendah lemak, hati ayam bersih saring, kuning telur matang penuh, bayam.</p>
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 font-display font-bold">Ca</div>
                              <div className="text-left text-xs">
                                <h5 className="font-bold text-gray-955">Kalsium (Calcium) &bull; Target: 1200 mg</h5>
                                <p className="text-gray-555 text-[11px] leading-relaxed mt-0.5">Memperkuat kerangka tubuh janin agar tidak menguras stok kalsium dari tulang dan gigi ibu. Sumber: Susu khusus ibu hamil, yogurt rendah lemak, tempe kacang kedelai, kangkung, teri nasi kering.</p>
                              </div>
                            </div>
                          </>
                        )}

                        {trimesterNum === 3 && (
                          <>
                            <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-800 flex items-center justify-center font-bold text-xs shrink-0 font-display font-bold">Ω3</div>
                              <div className="text-left text-xs">
                                <h5 className="font-bold text-gray-955">Asam Lemak Omega-3 / DHA &bull; Target: 200 mg / Hari</h5>
                                <p className="text-gray-555 text-[11px] leading-relaxed mt-0.5">Mendukung pembentukan jutaan sel saraf otak baru serta retina mata bayi di fase pematangan akhir. Sumber: Ikan kembung (tinggi EPA+DHA, murah, merkuri paling aman), salmon, telur diperkaya omega-3.</p>
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">F</div>
                              <div className="text-left text-xs">
                                <h5 className="font-bold text-gray-955">Serat Sembelit (Dietary Fiber) &bull; Target: 30-35 g</h5>
                                <p className="text-gray-555 text-[11px] leading-relaxed mt-0.5">Mencegah sembelit parah (hemoroid) yang sering terjadi di akhir kehamilan akibat tekanan rahim pada pencernaan. Sumber: Pepaya matang manis, melon jingga, oat gandum, dan biji selasih.</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {overviewSubTab === 'recipes' && (
                    <div className="space-y-4">
                      <div className="border-l-4 border-amber-600 pl-3">
                        <h4 className="font-bold text-gray-955 text-sm">Resep Makanan Sehat Khas Nusantara (Trimester {trimesterNum})</h4>
                        <p className="text-xs text-slate-500 mt-1">Kreasi masakan rumah tangga Indonesia yang lezat, bernutrisi tinggi, dan aman untuk kehamilan:</p>
                      </div>

                      {trimesterNum === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-xl border border-gray-100 text-xs text-left space-y-2 mb-0.5">
                            <h5 className="font-bold text-sage-800 font-display">🍲 Sup Ayam Jahe Merah Segar</h5>
                            <p className="text-[11px] text-gray-500 leading-relaxed italic">Jahe berfungsi meredakan kontraksi lambung pemicu muntah, kaldu ayam mudah diserap tubuh.</p>
                            <div className="text-[10px] space-y-1">
                              <div><strong>Bahan Utama:</strong> Sayap/dada ayam rebus bersih, jahe merah memarkan, wortel segar dipotong bulat, seledri segar.</div>
                              <div><strong>Cara Memasak:</strong> Rebus daging ayam untuk kuah kaldu murni. Tumis bumbu putih dan jahe geprek dengan margarin tipis, masukkan wortel, sajikan hangat agar lambung terasa nyaman.</div>
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-gray-100 text-xs text-left space-y-2 mb-0.5">
                            <h5 className="font-bold text-sage-800 font-display">🥤 Smoothie Alpukat Kurma Yogurt</h5>
                            <p className="text-[11px] text-gray-500 leading-relaxed italic">Kaya asam folat nabati (alpukat) serta probiotik yogurt penenang mual lambung sensitif.</p>
                            <div className="text-[10px] space-y-1">
                              <div><strong>Bahan Utama:</strong> 1 buah alpukat mentega matang, 3 butir kurma tanpa biji, 100ml plain yogurt dingin, 1 sendok teh madu murni.</div>
                              <div><strong>Cara Pembuatan:</strong> Haluskan semua bahan menggunakan blender portabel tanpa menambahkan es batu terlalu dingin. Minum perlahan sedikit demi sedikit demi meredakan lemas di pagi hari (*morning sickness*).</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {trimesterNum === 2 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-xl border border-gray-100 text-xs text-left space-y-2 mb-0.5">
                            <h5 className="font-bold text-sage-800 font-display">🐟 Pepes Tahu Ikan Kembung Daun Kemangi</h5>
                            <p className="text-[11px] text-gray-500 leading-relaxed italic">Ikan kembung lokal mengandung kadar Omega-3 yang setara bahkan lebih tinggi dari ikan salmon impor.</p>
                            <div className="text-[10px] space-y-1">
                              <div><strong>Bahan Utama:</strong> 2 ekor ikan kembung (bersihkan jeroan & kepala), tahu putih hancurkan halus, kemangi segar, bumbu pepes lengkap.</div>
                              <div><strong>Cara Memasak:</strong> Campur tahu halus dengan bumbu halus dan dahu kemangi. Baluri ikan kembung dengan adonan tahu, bungkus rapi dengan daun pisang. Kukus matang 30 menit lalu panggang sebentar di teflon kering.</div>
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-gray-100 text-xs text-left space-y-2 mb-0.5">
                            <h5 className="font-bold text-sage-800 font-display">🍳 Tumis Kangkung Teri Nasi Kalsium Tinggi</h5>
                            <p className="text-[11px] text-gray-500 leading-relaxed italic">Paduan kalsium dari teri nasi (teri basah) dan zat besi alami dari kangkung segar.</p>
                            <div className="text-[10px] space-y-1">
                              <div><strong>Bahan Utama:</strong> 1 ikat kangkung segar cuci bersih, 2 sendok makan teri nasi cuci bersih lalu tiriskan, irisan bawang merah dan putih.</div>
                              <div><strong>Cara Memasak:</strong> Goreng teri nasi sampai kering tiriskan. Tumis bawang hingga harum menggunakan margarin sehat, masukkan kangkung secara cepat, siram sedikit air hangat. Taburkan teri nasi renyah di atas piring saji.</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {trimesterNum === 3 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-xl border border-gray-100 text-xs text-left space-y-2 mb-0.5">
                            <h5 className="font-bold text-sage-800 font-display">🥣 Oatmeal Susu Kurma Pelunak Jalan Lahir</h5>
                            <p className="text-[11px] text-gray-500 leading-relaxed italic">Studi klinis menunjukkan konsumsi kurma di trimester akhir membantu mematangkan serviks secara alami.</p>
                            <div className="text-[10px] space-y-1">
                              <div><strong>Bahan Utama:</strong> 4 sendok makan rolled oat, 250ml susu bubuk khusus hamil hangat, 3 butir kurma manis dicincang lembut, taburan bubuk kayu manis.</div>
                              <div><strong>Cara Penyajian:</strong> Seduh rolled oat bersama kuah susu hangat hingga mengembang kental. Masukkan irisan kurma di atasnya, taburi kayu manis harum. Masakan siap disantap sebagai menu sarapan berserat tinggi.</div>
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-gray-100 text-xs text-left space-y-2 mb-0.5">
                            <h5 className="font-bold text-sage-800 font-display">🐟 Sup Asam Ikan Kakap Merah Segar</h5>
                            <p className="text-[11px] text-gray-500 leading-relaxed italic">Ikan laut kakap mengandung selenium murni, protein pembangun sel janin, dengan kesegaran bumbu asam.</p>
                            <div className="text-[10px] space-y-1">
                              <div><strong>Bahan Utama:</strong> Fillet ikan kakap merah potong kotak besar, tomat segar belah dua, air jeruk nipis, serai geprek, daun jeruk purut.</div>
                              <div><strong>Cara Memasak:</strong> Rebus bumbu sup sup (bawang, kunyit geprek, jahe, serai) sampai mendidih. Masukkan ikan kakap, seimbangkan rasa, peras jeruk nipis sesaat sebelum diangkat agar vitamin C optimal.</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {overviewSubTab === 'activities' && (
                    <div className="space-y-4">
                      <div className="border-l-4 border-indigo-600 pl-3">
                        <h4 className="font-bold text-gray-955 text-sm">Aktifitas Fisik & Senam Hamil Aman (Trimester {trimesterNum})</h4>
                        <p className="text-xs text-slate-500 mt-1">Olahraga mandiri untuk melancarkan sirkulasi rahim dan menguatkan otot dasar panggul:</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {trimesterNum === 1 && (
                          <>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 text-xs text-left space-y-2 mb-0.5">
                              <h5 className="font-bold text-indigo-950">🚶‍♀️ Jalan Kaki Santai Pagi Hari</h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed">
                                Durasi cukup 15-20 menit per sesi di jalanan rata yang aman. Jalan santai di udara sejuk pagi hari membantu menyegarkan pikiran dan mengurangi stres serta mual hormon.
                              </p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 text-xs text-left space-y-2 mb-0.5">
                              <h5 className="font-bold text-indigo-950">🧘‍♀️ Latihan Pernafasan Diafragma (Deep Breathing)</h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed">
                                Duduk dengan posisi bersila tegak nyaman. Tarik nafas lambat lewat hidung rasakan paru-paru dan perut bawah mengembang, buang perlahan lewat mulut. Melatih ketenangan & asupan oksigen janin.
                              </p>
                            </div>
                          </>
                        )}

                        {trimesterNum === 2 && (
                          <>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 text-xs text-left space-y-2 mb-0.5">
                              <h5 className="font-bold text-indigo-950">💪 Prenatal Yoga & Peregangan Ligamen</h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed">
                                Melakukan pose Cat-Cow (posisi merangkak mengayun panggul) untuk meredakan pegal sakit pinggang akibat perut yang membebani otot lumbar belakang. Lakukan perlahan sebanyak 5-10 kali secara aman.
                              </p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 text-xs text-left space-y-2 mb-0.5">
                              <h5 className="font-bold text-indigo-950">🧿 Latihan Senam Kegel Dasar</h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed">
                                Kencangkan otot saluran kemih (seperti menahan buang air kecil) selama 5-10 detik, lalu rilekskan kembali otot. Berguna memperkuat otot dasar panggul menjelang kelahiran melahirkan.
                              </p>
                            </div>
                          </>
                        )}

                        {trimesterNum === 3 && (
                          <>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 text-xs text-left space-y-2 mb-0.5">
                              <h5 className="font-bold text-indigo-950">🧘‍♀️ Prenatal Squats (Berpegangan Kursi / Birthing Ball)</h5>
                              <p className="text-[11px] text-gray-550 leading-relaxed">
                                Membantu menurunkan kepala janin masuk ke pintu atas panggul (PAP). Berdirilah membelakangi kursi stabil, renggangkan kedua kaki selebar bahu, turunkan panggul perlahan sejauh batas nyaman, kembali berdiri tegak.
                              </p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 text-xs text-left space-y-2 mb-0.5">
                              <h5 className="font-bold text-indigo-950">🚶‍♀️ Brisk Walking & Goyang Panggul</h5>
                              <p className="text-[11px] text-gray-550 leading-relaxed">
                                Jalan kaki aktif dengan intensitas sedang di sekitar komplek rumah dibarengi gerakan meliuk lembut panggul kiri-kanan untuk melunakkan sendi sakroiliaca mendekati hari H bersalin.
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HEALTH MONITORING INPUT FORM */}
          {activeTab === 'monitoring' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-150 text-left space-y-6">
              
              <div>
                <h3 className="font-bold text-gray-900 text-[17px] font-display">Isi Form Pemantauan Kesehatan Mandiri</h3>
                <p className="text-xs text-gray-500 mt-1">Mengukur parameter fisik mandiri berguna mencegah risiko preeklampsia dini secara klinis.</p>
              </div>

              {showLogSuccess && (
                <div className={`border p-4 rounded-xl text-[11px] sm:text-xs flex flex-col items-center gap-2.5 justify-center transition-all ${
                  isGeneratingAiTriage 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-800' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {isGeneratingAiTriage ? (
                      <Sparkles className="w-5 h-5 text-indigo-600 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-emerald-600 animate-bounce" />
                    )}
                    <span className="font-bold">
                      {isGeneratingAiTriage 
                        ? 'Menghubungi Gemini AI Triage & Menyusun Laporan Mingguan Ibu...'
                        : 'Sukses menyimpan pemeriksaan mandiri! Laporan & Analisis AI Terkini langsung terkirim ke rekam medis bidan.'
                      }
                    </span>
                  </div>
                  {isGeneratingAiTriage && (
                    <div className="w-full max-w-sm bg-indigo-100 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-indigo-600 h-1.5 rounded-full animate-pulse w-full"></div>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleAddLogSubmit} className="space-y-6">
                
                {/* Numerical rows */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Berat Badan Ibu Hamil (kg)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 focus:bg-white"
                        required
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-mono">KG</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Tekanan Darah (mmHg)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="120"
                          value={systolic}
                          onChange={(e) => setSystolic(e.target.value)}
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 focus:bg-white"
                          required
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] text-gray-400 font-mono">SYS</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="80"
                          value={diastolic}
                          onChange={(e) => setDiastolic(e.target.value)}
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                          required
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] text-gray-400 font-mono">DIA</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Hitung Gerak Janin (12 jam)</label>
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={fetalMov}
                        onChange={(e) => setFetalMov(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 focus:bg-white"
                        required
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-mono">Kali</span>
                    </div>
                  </div>
                </div>

                {/* Checkbox Symptoms */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Keluhan atau Tanda Bahaya Yang Dirasakan Saat ini
                  </label>
                  <p className="text-[10px] text-gray-400 mb-3 block">Beri centang jika mengalami salah satu keluhan klinis di bawah ini:</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {symptomOptions.map((sym) => {
                      const isCheck = selectedSymptoms.includes(sym);
                      return (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => handleSymptomToggle(sym)}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                            isCheck 
                              ? 'bg-rose-50 border-rose-300 text-rose-950 font-semibold' 
                              : 'bg-slate-50 hover:bg-slate-100 border-gray-150 text-gray-600'
                          }`}
                        >
                          <span>{sym}</span>
                          {isCheck ? (
                            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                          ) : (
                            <span className="w-2 h-2 bg-gray-200 rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Catatan Tambahan untuk Bidan Puskesmas</label>
                  <textarea
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Contoh: Merasa begah selesai makan malam, atau kram betis..."
                    rows={3}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 focus:bg-white"
                  />
                </div>



                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className="px-5 py-2.5 text-xs text-gray-500 border rounded-xl hover:bg-slate-50 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs bg-sage-500 text-white rounded-xl font-bold hover:bg-sage-600 shadow cursor-pointer transition-colors"
                  >
                    Kirim & Periksa Risiko
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: TRIMESTER SPECIFIC EDUCATIONAL MATERIALS */}
          {activeTab === 'education' && (
            <div className="space-y-6">
              <div className="text-left border-b border-gray-100 pb-3">
                <span className="text-[10px] font-mono uppercase bg-indigo-600 text-white px-2.5 py-0.5 rounded-full font-bold">
                  Sesuai Usia Kandungan
                </span>
                <h3 className="font-extrabold text-gray-950 font-display text-lg mt-2">
                  Konten Edukasi Terpilih Trimester Ke-{trimesterNum}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Daftar panduan gizi mikro, zat besi, kalsium, dan deteksi bahaya kehamilan yang dikurasi khusus secara klinis oleh faskes penanggung jawab.</p>
              </div>

              {/* Articles loop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredArticles.map((art) => {
                  const isExpanded = expandedArticleId === art.id;
                  return (
                    <div key={art.id} className={`bg-white rounded-2xl border border-gray-150 overflow-hidden flex flex-col justify-between transition-all duration-300 ${isExpanded ? 'ring-2 ring-sage-500/20 md:col-span-2 shadow-md' : 'shadow-xs'}`}>
                      <div className="p-5 space-y-3.5 text-left">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                          <span>Kategori: {art.category}</span>
                          <span>{art.publishedAt}</span>
                        </div>
                        <h4 
                          onClick={() => setExpandedArticleId(isExpanded ? null : art.id)}
                          className={`font-bold text-gray-950 hover:text-sage-600 cursor-pointer leading-snug ${isExpanded ? 'text-base' : 'line-clamp-2'}`}
                        >
                          {art.title}
                        </h4>

                        {isExpanded ? (
                          <div className="text-xs text-gray-700 leading-relaxed space-y-3.5 pt-3 border-t border-gray-100 mt-2">
                            {art.content.split('\n\n').map((paragraph, pIdx) => (
                              <p key={pIdx} className="whitespace-pre-wrap">{paragraph}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                            {art.excerpt}
                          </p>
                        )}
                      </div>

                      <div className="px-5 py-3.5 bg-slate-50/50 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-semibold">Penulis: {art.author}</span>
                        <button 
                          onClick={() => setExpandedArticleId(isExpanded ? null : art.id)}
                          className="text-xs text-sage-600 font-bold hover:text-sage-800 flex items-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? 'Sembunyikan' : 'Baca Lengkap'}
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: WEEKLY AI SCREENING TRIAGE */}
          {activeTab === 'ai_screening' && (
            <div className="space-y-6">
              
              {/* Petunjuk Banner */}
              <div className="bg-gradient-to-r from-teal-50/50 via-sage-50/30 to-indigo-50/45 border border-sage-150 rounded-2xl p-5 text-left shadow-xs animate-fadeIn">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-sage-500/10 text-sage-700 rounded-xl shrink-0">
                    <Sparkles className="w-6 h-6 text-sage-600 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base font-display">Asisten Penapisan Medis Mandiri AI</h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      Menu ini digunakan untuk <strong>memantau kesehatan ibu dan janin secara berkala dari minggu ke minggu</strong> menggunakan teknologi <strong>AI Triage (Penapisan Medis)</strong>. Laporkan segala keluhan fisik, rasa nyeri, pola gerakan janin, atau gejala tak biasa yang Ibu rasakan agar sistem kami mendeteksi tingkat risiko kehamilan secara dini sebelum konsultasi tatap muka.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3.5 text-[10px] text-slate-500 font-bold font-mono">
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-250 px-2.5 py-1 rounded-lg">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> PENAPISAN DINIS GANGGUAN
                      </span>
                      <span className="flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-250 px-2.5 py-1 rounded-lg">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> RESPONS INSTAN INDIKASI BAHAYA
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Screening Station Container */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Side: Centerpiece Weekly Report Card & Action Box */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Centerpiece "Laporan Mingguan Ibu" Card */}
                  {(() => {
                    const latestReport = screeningHistory[0] as any;
                    return (
                      <div className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-2xl border border-gray-150 shadow-md space-y-5 text-left transition-all hover:shadow-lg animate-fadeIn">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-indigo-950 text-base font-display flex items-center gap-2">
                              📋 Laporan Mingguan Ibu
                            </h4>
                            <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase font-bold">
                              Disusun Otomatis dari Pemantauan Mandiri Terakhir
                            </p>
                          </div>
                          <span className="text-[11px] bg-slate-200/60 text-slate-700 font-mono font-bold px-3 py-1 rounded-lg">
                            Minggu ke-{latestReport ? latestReport.weeks : currentWeeks}
                          </span>
                        </div>

                        {latestReport ? (
                          <div className="space-y-5">
                            {/* Parameter Terlampir */}
                            <div className="space-y-2">
                              <span className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider block">
                                🔬 Parameter Fisik Terlampir:
                              </span>
                              <div className="flex flex-wrap gap-2 text-[10.5px] font-medium text-slate-700 font-mono">
                                <span className="bg-indigo-50/40 border border-indigo-150 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
                                  ⚖️ Berat: <strong className="font-extrabold text-indigo-950">{latestReport.weight || '63.5'} kg</strong>
                                </span>
                                <span className="bg-rose-50/40 border border-rose-150 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
                                  🩺 TD: <strong className="font-extrabold text-rose-950">{latestReport.systolic || '120'}/{latestReport.diastolic || '80'} mmHg</strong>
                                </span>
                                <span className="bg-emerald-50/40 border border-emerald-150 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
                                  👶 Gerak Janin: <strong className="font-extrabold text-emerald-950">{latestReport.fetalMovement || '12'} kali/12jam</strong>
                                </span>
                              </div>
                            </div>

                            {/* HASIL ANALISIS AI TRIAGE TERKINI SECTION */}
                            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-xs">
                              <div className="bg-slate-50/80 px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                                <span className="text-xs font-extrabold text-slate-800 font-display uppercase tracking-wider">
                                  Hasil Analisis AI Triage Terkini
                                </span>
                                
                                {/* Badge Kategori Risiko yang presisi */}
                                {(() => {
                                  const isRed = latestReport.status === 'RED';
                                  const isYellow = latestReport.status === 'YELLOW';
                                  
                                  return (
                                    <span className={`text-[10px] uppercase font-mono font-extrabold px-3 py-1 rounded-full border shadow-2xs ${
                                      isRed 
                                        ? 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse' 
                                        : isYellow
                                          ? 'bg-amber-50 text-amber-950 border-amber-200'
                                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    }`}>
                                      {isRed ? '🔴 BAHAYA (Merah)' : isYellow ? '🟡 SENSITIF (Kuning)' : '🟢 AMAN (Hijau)'}
                                    </span>
                                  );
                                })()}
                              </div>

                              <div className="p-4 space-y-4">
                                <div className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap space-y-2">
                                  {renderChatMessageContent(latestReport.result)}
                                </div>
                              </div>
                            </div>

                          </div>
                        ) : (
                          <div className="py-10 text-center bg-white border border-dashed rounded-xl border-gray-200 p-5 space-y-2.5">
                            <span className="text-2xl">📋</span>
                            <h5 className="font-bold text-xs text-gray-700">Belum Ada Pemantauan Mandiri Terkiriman Minggu Ini</h5>
                            <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm mx-auto">
                              Silakan isi parameter fisik harian Ibu di menu Pemantauan terlebih dahulu. Sistem akan otomatis menjalankan Triage AI dan menjadikannya Laporan Mingguan.
                            </p>
                            <button 
                              onClick={() => setActiveTab('monitoring')} 
                              className="mt-2.5 px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                            >
                              Isi Pemantauan Mandiri Sekarang
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Secondary Form for quick additional clinical query */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
                    <div className="text-left">
                      <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider font-mono">
                        💡 Konsultasi Tambahan via AI Triage
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Ingin melakukan analisis keluhan tambahan di luar parameter data utama? Tuliskan keluhan spesifik Ibu di bawah ini.
                      </p>
                    </div>
                    
                    <form onSubmit={handleAiScreeningSubmit} className="space-y-3.5">
                      <div className="text-left space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Pilih keluhan cepat untuk disisipkan:</label>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {[
                            "Pusing hebat di kepala belakang & silau",
                            "Tiba-tiba ada flek darah/pendarahan jalan lahir",
                            "Kaki bengkak parah dan pandangan sedikit kabur",
                            "Nyeri perut bagian bawah / kram kuat",
                            "Gerakan bayi terasa berkurang drastis",
                            "Mual hebat dan tidak bisa masuk makanan"
                          ].map((symptom, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setScreeningInput(symptom)}
                              className="text-[10px] bg-slate-50 hover:bg-sage-50 text-slate-700 hover:text-sage-800 border border-gray-250 hover:border-sage-300 px-2.5 py-1.5 rounded-xl transition-all font-medium text-left cursor-pointer"
                            >
                              + {symptom}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-xs font-bold text-gray-800">Uraikan Detail Keluhan Medis Tambahan:</label>
                        <textarea
                          value={screeningInput}
                          onChange={(e) => setScreeningInput(e.target.value)}
                          placeholder="Ketikkan gejala atau keluhan mendadak yang ingin Ibu analisis sekarang..."
                          className="w-full h-28 p-3 text-xs bg-slate-50/50 border border-gray-150 rounded-xl focus:outline-none focus:ring-1 focus:ring-sage-500 focus:bg-white resize-none"
                        />
                      </div>

                      <div className="flex justify-between items-center pt-1.5">
                        <button
                          type="button"
                          onClick={() => setScreeningInput('')}
                          className="text-xs text-gray-500 hover:text-gray-800 font-bold transition-all px-2.5 cursor-pointer"
                        >
                          Bersihkan
                        </button>
                        <button
                          type="submit"
                          disabled={isScreening || !screeningInput.trim()}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                            !screeningInput.trim() 
                              ? 'bg-slate-105 text-gray-400 cursor-not-allowed' 
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer hover:shadow-md'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          {isScreening ? 'Proses Analisis Medis...' : 'Kirim Konsultasi Tambahan'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Active Analysis Result Box for additional inquiries only */}
                  {(isScreening || (activeScreeningResult && screeningInput)) && (
                    <div className="bg-gradient-to-br from-indigo-50/20 to-slate-50 p-5 rounded-2xl border border-indigo-150 shadow-xs text-left space-y-3.5 animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                          <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider font-mono">
                            Hasil Konsultasi Tambahan
                          </h4>
                        </div>
                        <span className="text-[10px] bg-slate-105 text-slate-600 font-mono font-bold px-2 py-0.5 rounded">
                          Spesifik Keluhan
                        </span>
                      </div>

                      {isScreening ? (
                        <div className="py-8 text-center space-y-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0ms]"></span>
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:150ms]"></span>
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:300ms]"></span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium animate-pulse">Sistem sedang menganalisis tingkat keseriusan gejala tambahan...</p>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-800 leading-relaxed font-sans whitespace-pre-wrap space-y-2">
                          {renderChatMessageContent(activeScreeningResult || '')}
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Right Side: Screening History Logs */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs text-left space-y-4 max-h-[580px] overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider font-mono">
                        🕰️ Riwayat Skrining Mingguan
                      </h4>
                      <span className="text-[10px] font-bold text-gray-400">
                        {screeningHistory.length} Total
                      </span>
                    </div>

                    <div className="space-y-4">
                      {screeningHistory.length === 0 ? (
                        <p className="text-xs text-slate-400 py-6 text-center">Belum ada riwayat skrining.</p>
                      ) : (
                        screeningHistory.map((item) => {
                          const isRed = item.status === 'RED';
                          return (
                            <div key={item.id} className="border border-gray-100 rounded-xl p-3.5 space-y-2.5 bg-slate-50/50 hover:bg-slate-50 transition-all">
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className="font-bold text-sage-800">Minggu Ke-{item.weeks}</span>
                                <span className="text-gray-400 font-semibold">{item.timestamp}</span>
                              </div>

                              <p className="text-xs text-gray-600 bg-white border border-gray-110 p-2.5 rounded-lg italic leading-relaxed">
                                "{item.complaint}"
                              </p>

                              <div className="flex items-center justify-between pt-1 border-t border-dashed border-gray-150">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  isRed ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {isRed ? 'RISIKO BAHAYA (Merah)' : 'NORMAL (Hijau)'}
                                </span>
                                <button
                                  onClick={() => {
                                    setActiveScreeningResult(item.result);
                                    window.scrollTo({ top: 320, behavior: 'smooth' });
                                  }}
                                  className="text-[10px] text-sage-600 hover:text-sage-800 font-bold flex items-center gap-0.5"
                                >
                                  Tampilkan Laporan <ArrowUpRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: VIRTUAL MIDWIFE CHAT */}
          {activeTab === 'consultation' && (
            <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs flex flex-col h-[520px]">
              
              {/* Chat Bidan Header */}
              <div className="bg-sage-600 px-5 py-4 text-white flex items-center justify-between border-b shrink-0 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center font-bold text-white text-xs border border-white/20">
                    🩺
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight">Bidan Siti Rahma, S.Tr.Keb</h4>
                    <p className="text-[10px] text-sage-200">Bidan wilayah pengampu Desa Sukamaju &bull; <span className="bg-emerald-900/60 px-1.5 py-0.2 rounded font-mono font-semibold text-emerald-300">ONLINE</span></p>
                  </div>
                </div>
                <div className="text-right text-[10px] font-mono text-sage-200">
                  SIPB: 446/902-SIPB/DINKES
                </div>
              </div>

              {/* Chat Messages flow */}
              <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/50">
                
                {/* Safe Privacy advice top */}
                <div className="bg-indigo-50 border border-indigo-150 text-indigo-900 rounded-xl p-3 text-[10.5px] max-w-lg mx-auto text-center leading-relaxed">
                  🔒 <strong>Hub Pasien Terenkripsi:</strong> Seluruh pesan konsultasi medis diproteksi oleh skema enkripsi end-to-end selaras Pasal 24 UU PDP. Riwayat diabadikan secara aman dalam modul RME bidan.
                </div>

                {chats.filter(c => (c.senderId === user.id && c.recipientId === 'midwife-1') || (c.senderId === 'midwife-1' && c.recipientId === user.id)).map((msg) => {
                  const isMe = msg.senderRole === 'mother';
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs text-left ${
                        isMe 
                          ? 'bg-sage-600 text-white rounded-tr-none' 
                          : 'bg-white border border-gray-150 text-gray-950 rounded-tl-none'
                      }`}>
                        <div className="font-bold text-[9px] uppercase tracking-wider block opacity-75 mb-1 text-right">
                          {isMe ? 'Anda' : 'Bidan Siti'}
                        </div>
                        <div className="leading-relaxed whitespace-pre-wrap">
                          {isMe ? msg.message : renderChatMessageContent(msg.message)}
                        </div>
                        <span className="text-[8px] opacity-60 font-mono mt-1.5 block text-right">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Animated Typing Status for Bidan Siti */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-[75%] bg-white border border-gray-150 rounded-2xl px-4 py-3 text-xs shadow-xs text-left rounded-tl-none flex items-center gap-3">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-sage-600 animate-pulse">Bidan Siti Sedang Meninjau Gejala...</span>
                      <div className="flex gap-1.2 items-center">
                        <span className="w-1.5 h-1.5 bg-sage-500 rounded-full animate-bounce [animation-delay:0ms]"></span>
                        <span className="w-1.5 h-1.5 bg-sage-500 rounded-full animate-bounce [animation-delay:150ms]"></span>
                        <span className="w-1.5 h-1.5 bg-sage-500 rounded-full animate-bounce [animation-delay:300ms]"></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleChatSubmit} className="p-3 bg-white border-t border-gray-150 flex gap-2.5 items-center shrink-0">
                <input
                  type="text"
                  value={chatMessageText}
                  onChange={(e) => setChatMessageText(e.target.value)}
                  placeholder="Ketik pertanyaan Anda ke Bidan Siti (misal tentang pusing atau kram)..."
                  className="flex-grow px-4 py-2.5 bg-slate-50 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-sage-500 focus:bg-white"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-sage-600 hover:bg-sage-700 text-white rounded-xl transition-all cursor-pointer shadow"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* 1. SOS COUNTDOWN POPUP MODAL (HIGH INTENSITY RED SYSTEM OVERWRITE overlay) */}
      <AnimatePresence>
        {showSosModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-rose-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-md"
            id="sos-maternal-countdown-modal"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-b from-rose-900 to-rose-950 text-white border border-rose-600 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl relative overflow-hidden"
            >
              {/* Outer infected glow border animations */}
              <div className="absolute inset-0 bg-red-600/10 pointer-events-none animate-pulse" />
              
              <div className="relative z-10 space-y-6">
                <div className="mx-auto w-16 h-16 bg-rose-800 border-2 border-rose-400 rounded-full flex items-center justify-center animate-ping text-3xl">
                  🚨
                </div>
                
                <h3 className="text-xl font-extrabold tracking-wide uppercase font-display text-rose-100">
                  ⚠️ AKTIVASI SINYAL KRISIS SOS
                </h3>
                
                <div className="bg-rose-950/60 p-4 rounded-2xl border border-rose-800/80">
                  <p className="text-sm font-semibold text-rose-200">
                    Mengirimkan Sinyal Darurat ke Bidan dalam
                  </p>
                  
                  {/* BIG INTENSITY COUNTDOWN TIMER */}
                  <div className="text-7xl font-black text-rose-100 font-mono my-3 animate-pulse">
                    {sosCountdown}
                  </div>
                  
                  <p className="text-[11px] text-rose-300 italic">
                    Sistem otomatis mengarahkan ambulans wilayah dan menyalakan alarm klinis faskes puskesmas penanggung jawab.
                  </p>
                </div>

                {/* CANCEL BUTTON (Big Green/Gray button to arrest accidental click) */}
                <button
                  type="button"
                  onClick={() => setShowSosModal(false)}
                  className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-md hover:scale-102 uppercase cursor-pointer"
                >
                  🟢 BATALKAN (Salah Tekan)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. WELLNESS BREATHING RELAXATION MODAL (CALMING COMPANION WIDGET) */}
      <AnimatePresence>
        {showBreathingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
            id="wellness-breathing-modal"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border border-slate-150 p-6 md:p-8 rounded-3xl max-w-md w-full text-center shadow-xl relative overflow-hidden"
            >
              {/* Calming gradient accents */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-teal-500 via-emerald-400 to-indigo-500" />
              
              <div className="space-y-6 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-left">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 font-display">
                      🧘 Latihan Napas Relaksasi
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Menenangkan ketegangan, menstabilkan detak jantung maternal</p>
                  </div>
                  <span className="text-[10px] bg-teal-50 border border-teal-200 text-teal-700 px-2 py-0.5 rounded-full font-bold font-mono">
                    PROGRES: SIKLUS {breathCycle}
                  </span>
                </div>

                {/* CENTRAL ANIMATED BREATHING WHEEL Visualizer */}
                <div className="py-6 flex flex-col items-center justify-center relative">
                  
                  {/* Expanding background ripple */}
                  <div 
                    className={`absolute rounded-full transition-all duration-1000 ${
                      breathingPhase === 'inhale' 
                        ? 'w-40 h-40 bg-teal-100/40 scale-125' 
                        : breathingPhase === 'hold' 
                          ? 'w-40 h-40 bg-amber-100/40 scale-110' 
                          : breathingPhase === 'exhale' 
                            ? 'w-40 h-40 bg-indigo-100/40 scale-100' 
                            : 'w-28 h-28 bg-slate-100'
                    }`}
                  />

                  {/* Core Breathing Node */}
                  <div 
                    className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center relative z-10 transition-all duration-1000 ${
                      breathingPhase === 'inhale'
                        ? 'bg-teal-500 border-teal-300 text-white scale-120'
                        : breathingPhase === 'hold'
                          ? 'bg-amber-500 border-amber-300 text-white scale-110 shadow-lg'
                          : breathingPhase === 'exhale'
                            ? 'bg-indigo-500 border-indigo-300 text-white scale-100'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    {breathingPhase === 'idle' ? (
                      <span className="text-2xl">🧘</span>
                    ) : (
                      <span className="text-3xl font-black font-mono">{breathingSecondsLeft}s</span>
                    )}
                  </div>
                </div>

                {/* INSTRUCTION TEXT PANEL */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 min-h-[90px] flex items-center justify-center">
                  {breathingPhase === 'idle' && (
                    <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
                      Latihan pernapasan <strong>4-4-4</strong> terbukti secara klinis meredakan kepanikan maternal, menambah asupan oksigen janin, dan melancarkan sirkulasi plasenta. Tekan <strong>Mulai</strong> untuk memandu ketukan.
                    </p>
                  )}
                  {breathingPhase === 'inhale' && (
                    <div className="space-y-1 text-center">
                      <p className="text-sm font-extrabold text-teal-700 animate-pulse">💨 TARIK NAPAS (Inhale)</p>
                      <p className="text-[11px] text-slate-500 font-medium">Hirup udara bersih perlahan melalui hidung, kembangkan rongga dada...</p>
                    </div>
                  )}
                  {breathingPhase === 'hold' && (
                    <div className="space-y-1 text-center">
                      <p className="text-sm font-extrabold text-amber-700">✋ TAHAN NAPAS (Hold)</p>
                      <p className="text-[11px] text-slate-500 font-medium">Kunci udara di dalam tubuh sejenak, rasakan relaksasi di seluruh otot...</p>
                    </div>
                  )}
                  {breathingPhase === 'exhale' && (
                    <div className="space-y-1 text-center">
                      <p className="text-sm font-extrabold text-indigo-700 animate-pulse">🍃 HEMBUSKAN PERLAHAN (Exhale)</p>
                      <p className="text-[11px] text-slate-500 font-medium">Lepaskan napas perlahan melalui mulut, buang stres & ketegangan kehamilan...</p>
                    </div>
                  )}
                </div>

                {/* INTERACTIVE CONTROLS */}
                <div className="flex gap-3">
                  {breathingPhase === 'idle' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setBreathingPhase('inhale');
                        setBreathingSecondsLeft(4);
                        setBreathCycle(1);
                      }}
                      className="flex-grow py-3 bg-teal-600 hover:bg-teal-700 border border-teal-500 text-white rounded-xl font-bold text-xs tracking-wider transition-all shadow cursor-pointer uppercase"
                    >
                      Mulai Latihan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setBreathingPhase('idle');
                      }}
                      className="flex-grow py-3 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer uppercase"
                    >
                      Hentikan / Reset Seketika
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => {
                      setBreathingPhase('idle');
                      setShowBreathingModal(false);
                    }}
                    className="px-5 py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer uppercase"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
