/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Search, Filter, ShieldCheck, HeartPulse, FileText, CheckCircle2,
  Inbox, Send, PlusCircle, Bus, Heart, Calendar, Eye, RefreshCcw, LogOut
} from 'lucide-react';
import { User, HealthLog, ChatMessage, Appointment, Referral, MaternalProfile } from '../types';
import { calculateHpl, getRelativeDateString } from '../data/initialData';

interface MidwifeDashboardProps {
  user: User;
  onLogout: () => void;
  mockUsers: User[];
  onUpdateUserProfile: (userId: string, updatedProfile: Partial<MaternalProfile>) => void;
  logs: HealthLog[];
  onAddLog: (newLog: HealthLog) => void;
  chats: ChatMessage[];
  onSendChat: (msg: ChatMessage) => void;
  referrals: Referral[];
  onAddReferral: (newRef: Referral) => void;
  appointments: Appointment[];
  onAddAppointment: (newApp: Appointment) => void;
  onUpdateAppointment: (aptId: string, updatedFields: Partial<Appointment>) => void;
  globalScreenings?: Record<string, any[]>;
  activeSos?: any;
  onClearSos?: (customDetails?: string) => void;
}

export default function MidwifeDashboard({
  user,
  onLogout,
  mockUsers,
  onUpdateUserProfile,
  logs,
  onAddLog,
  chats,
  onSendChat,
  referrals,
  onAddReferral,
  appointments,
  onAddAppointment,
  onUpdateAppointment,
  globalScreenings = {},
  activeSos,
  onClearSos
}: MidwifeDashboardProps) {
  
  // STATES
  const [activeMenu, setActiveMenu] = useState<'patients' | 'consultation' | 'referral' | 'pwskia'>('patients');
  const [midwifeSubMenu, setMidwifeSubMenu] = useState<'queue' | 'input_log' | 'anc_schedule'>('queue');

  // ALARM STATE
  const [activeSosPatient, setActiveSosPatient] = useState<any>(null);
  
  // Siren audio synth refs
  const sirenAudioCtxRef = React.useRef<any>(null);
  const sirenOscillatorRef = React.useRef<any>(null);

  const startSiren = () => {
    try {
      if (sirenAudioCtxRef.current) return; // already running
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      sirenAudioCtxRef.current = ctx;
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      mod.type = 'sawtooth';
      mod.frequency.value = 2; // Pulsing speed
      modGain.gain.value = 150; // Pitch swing range
      
      mod.connect(modGain);
      modGain.connect(osc.frequency);
      
      gainNode.gain.setValueAtTime(0.04, ctx.currentTime); // safety low volume
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      mod.start();
      
      sirenOscillatorRef.current = { osc, mod, gainNode };
    } catch (e) {
      console.warn("Web Audio API warning:", e);
    }
  };

  const stopSiren = () => {
    try {
      if (sirenOscillatorRef.current) {
        sirenOscillatorRef.current.osc.stop();
        sirenOscillatorRef.current.mod.stop();
        sirenOscillatorRef.current.osc.disconnect();
        sirenOscillatorRef.current.mod.disconnect();
        sirenOscillatorRef.current.gainNode.disconnect();
        sirenOscillatorRef.current = null;
      }
      if (sirenAudioCtxRef.current) {
        sirenAudioCtxRef.current.close();
        sirenAudioCtxRef.current = null;
      }
    } catch (e) {
      console.warn("Error stopping siren:", e);
    }
  };

  // Synchronize activeSos prop with local activeSosPatient state
  React.useEffect(() => {
    if (activeSos) {
      setActiveSosPatient({
        id: activeSos.motherId,
        nama: activeSos.motherName,
        desa: activeSos.village,
        usia_kehamilan: activeSos.weeks,
        timestamp: activeSos.timestamp
      });
      
      // Auto-inject and prioritize the SOS patient in queue if not present
      setTodayQueue(prev => {
        const exists = prev.some(q => q.patientId === activeSos.motherId);
        if (!exists) {
          return [
            {
              id: 'q-sos-' + Date.now(),
              patientId: activeSos.motherId,
              patientName: activeSos.motherName,
              tokenNumber: '🚨 SOS',
              status: 'Darurat',
              time: 'SOS'
            },
            ...prev
          ];
        } else {
          // Update status of matching queue item to 'Darurat'
          return prev.map(q => q.patientId === activeSos.motherId ? { ...q, status: 'Darurat' } : q);
        }
      });

      // Start siren sound on dashboard focus or trigger
      startSiren();
    } else {
      setActiveSosPatient(null);
      stopSiren();
    }
    
    return () => {
      stopSiren();
    };
  }, [activeSos]);

  const handleResolveSosEmergency = () => {
    if (!activeSosPatient) return;
    
    const targetPatientId = activeSosPatient.id;
    const targetPatientName = activeSosPatient.nama;
    
    // Update queue status from Menunggu / Darurat to Sedang Ditangani or Selesai
    setTodayQueue(prev => prev.map(q => {
      if (q.patientId === targetPatientId) {
        return {
          ...q,
          status: 'Sedang Ditangani'
        };
      }
      return q;
    }));

    const customAuditMsg = `Bidan Siti Rahma telah menyelesaikan penanganan darurat untuk ${targetPatientName}.`;
    
    // Clear local states
    setActiveSosPatient(null);
    stopSiren();

    // Call prop callback to update globally or write audit log
    if (onClearSos) {
      onClearSos(customAuditMsg);
    }
  };

  // ACTIVE PATIENT QUEUES
  const [todayQueue, setTodayQueue] = useState<Array<{
    id: string;
    patientId: string;
    patientName: string;
    tokenNumber: string;
    status: 'Menunggu' | 'Dipanggil' | 'Selesai' | 'Sedang Ditangani' | 'Darurat';
    time: string;
  }>>([
    { id: 'q-1', patientId: 'mother-1', patientName: 'Ibu Kartika Sari', tokenNumber: 'A-01', status: 'Menunggu', time: '08:00' },
    { id: 'q-2', patientId: 'mother-2', patientName: 'Ibu Linda Wardani', tokenNumber: 'A-02', status: 'Menunggu', time: '08:30' },
    { id: 'q-3', patientId: 'mother-3', patientName: 'Ibu Sarah Anastasya', tokenNumber: 'A-03', status: 'Selesai', time: '09:00' },
    { id: 'q-4', patientId: 'mother-4', patientName: 'Ibu Amalia Siregar', tokenNumber: 'A-04', status: 'Menunggu', time: '09:30' },
  ]);

  const [currentlyCalling, setCurrentlyCalling] = useState<string | null>(null);

  // INPUT LOG FORM STATE
  const [logPatientId, setLogPatientId] = useState('mother-1');
  const [logGestWeeks, setLogGestWeeks] = useState(24);
  const [logSystolic, setLogSystolic] = useState(120);
  const [logDiastolic, setLogDiastolic] = useState(80);
  const [logWeight, setLogWeight] = useState(60);
  const [logFhr, setLogFhr] = useState(140); 
  const [logComplaint, setLogComplaint] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logSuccessMsg, setLogSuccessMsg] = useState('');

  // SCHEDULING FORM STATE
  const [schPatientId, setSchPatientId] = useState('mother-1');
  const [schDate, setSchDate] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]); // Default 1 week in future
  const [schTime, setSchTime] = useState('09:00');
  const [schType, setSchType] = useState<'ANC 1' | 'ANC 2' | 'ANC 3' | 'ANC 4' | 'ANC 5' | 'ANC 6' | 'Imunisasi' | 'Konsultasi'>('ANC 4');
  const [schNotes, setSchNotes] = useState('');
  const [schSuccessMsg, setSchSuccessMsg] = useState('');
  
  // PATIENT FILTERING
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVillage, setFilterVillage] = useState('ALL');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [filterTrimester, setFilterTrimester] = useState('ALL');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('mother-1');

  // SELECTED PATIENT EDITING & SCORES
  const [showRmeTab, setShowRmeTab] = useState<'overview' | 'score' | 'lab'>('overview');
  
  // Skor Poedji Rochjati checkboxes
  const [prsCheckboxes, setPrsCheckboxes] = useState<Record<string, boolean>>({
    muda: false, // Terlalu muda (<20 th) +4
    tua: false, // Terlalu tua (>35 th) +4
    jarak: false, // Jarak terlalu dekat (<2 th) +4
    anak: false, // Anak terlalu banyak (>4) +4
    pendek: false, // Tinggi badan pendek (<145cm) +4
    gugur: false, // Pernah keguguran +4
    bengkak: false, // Bengkak kaki & tensi tinggi +8
    posisi: false, // Kelainan letak sungsang +8
    perdarahan: false, // Riwayat perdarahan pasca+8
  });

  // LAB RECORD FORM
  const [labHb, setLabHb] = useState(11.0);
  const [labProtein, setLabProtein] = useState<'Negatif' | 'Positif (+)' | 'Positif (++)'>('Negatif');
  const [labGda, setLabGda] = useState(90);

  // FUNDUS HEIGHT FORM
  const [fundusHeight, setFundusHeight] = useState(24);

  // CLINIC REPLY STATE
  const [msgReplyText, setMsgReplyText] = useState('');

  // DIGITAL REFERRAL FORM
  const [refPatientId, setRefPatientId] = useState('mother-2');
  const [refReason, setRefReason] = useState('Tekanan darah tetap &ge; 140/90 meskipun istirahat, protein urin positif.');
  const [refHospital, setRefHospital] = useState('RSUD Sayang Ibu (Pusat Rujukan Spesialis)');
  const [refBedStatus, setRefBedStatus] = useState<'Tersedia' | 'Penuh'>('Tersedia');
  const [refAmbulanceStatus, setRefAmbulanceStatus] = useState<'Siaga' | 'Sedang Jalan'>('Siaga');
  const [refSubmitSuccess, setRefSubmitSuccess] = useState(false);

  // FETCH ALL PATIENT USERS
  const patients = mockUsers.filter(u => u.role === 'mother');

  // FIND ACTIVE SELECTED PATIENT
  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];
  const patientProfile = selectedPatient?.maternalProfile;

  // PATIENT FILTERS APPLICATION
  const filteredPatients = patients.filter(pat => {
    const prof = pat.maternalProfile!;
    const matchesSearch = pat.name.toLowerCase().includes(searchQuery.toLowerCase()) || prof.nik.includes(searchQuery);
    const matchesVillage = filterVillage === 'ALL' || prof.village === filterVillage;
    const matchesRisk = filterRisk === 'ALL' || prof.riskStatus === filterRisk;
    
    const trim = prof.gestationalWeeks <= 12 ? 'TRIM1' : prof.gestationalWeeks <= 27 ? 'TRIM2' : 'TRIM3';
    const matchesTrimester = filterTrimester === 'ALL' || trim === filterTrimester;

    return matchesSearch && matchesVillage && matchesRisk && matchesTrimester;
  });

  // SORT PATIENTS: Prioritize Ibu Kartika Sari (mother-1) if she has screening history
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    const aScreenings = globalScreenings[a.id] || [];
    const bScreenings = globalScreenings[b.id] || [];

    const hasA = a.id === 'mother-1' && aScreenings.length > 0;
    const hasB = b.id === 'mother-1' && bScreenings.length > 0;

    if (hasA && !hasB) return -1;
    if (!hasA && hasB) return 1;

    // Second priority: anyone with any screenings
    if (aScreenings.length > 0 && bScreenings.length === 0) return -1;
    if (aScreenings.length === 0 && bScreenings.length > 0) return 1;

    return 0;
  });

  // CHAT INBOX MANAGEMENT
  const incomingChats = chats.reduce((acc: ChatMessage[], curr) => {
    // Only get unique threads by mother ID
    const threadKey = curr.senderRole === 'mother' ? curr.senderId : curr.recipientId;
    const existing = acc.find(c => (c.senderId === threadKey || c.recipientId === threadKey));
    if (!existing) {
      acc.push(curr);
    } else {
      // Keep newest
      const currTime = new Date(curr.timestamp).getTime();
      const exTime = new Date(existing.timestamp).getTime();
      if (currTime > exTime) {
        acc.filter(c => (c.senderId !== threadKey && c.recipientId !== threadKey));
        acc.push(curr);
      }
    }
    return acc;
  }, []);

  // CALCULATE ACTIVE POEDJI ROCHJATI SCORE
  const calculatePrsScore = () => {
    let baseScore = 2; // Skor Awal Ibu Hamil
    if (prsCheckboxes.muda) baseScore += 4;
    if (prsCheckboxes.tua) baseScore += 4;
    if (prsCheckboxes.jarak) baseScore += 4;
    if (prsCheckboxes.anak) baseScore += 4;
    if (prsCheckboxes.pendek) baseScore += 4;
    if (prsCheckboxes.gugur) baseScore += 4;
    if (prsCheckboxes.bengkak) baseScore += 8;
    if (prsCheckboxes.posisi) baseScore += 8;
    if (prsCheckboxes.perdarahan) baseScore += 8;
    return baseScore;
  };

  const getPrsRiskCategory = (score: number): 'KRR' | 'KST' | 'KRT' => {
    if (score === 2) return 'KRR'; // Rendah
    if (score < 12) return 'KST'; // Sedang
    return 'KRT'; // Tinggi
  };

  // SUBMIT MEDICAL SCORE
  const handleSavePrsScore = () => {
    const calculatedScore = calculatePrsScore();
    const cat = getPrsRiskCategory(calculatedScore);
    const triage: 'GREEN' | 'YELLOW' | 'RED' = cat === 'KRR' ? 'GREEN' : cat === 'KST' ? 'YELLOW' : 'RED';

    onUpdateUserProfile(selectedPatient.id, {
      riskScore: calculatedScore,
      riskStatus: triage
    });
    alert(`Sukses Menyimpan Skor Poedji Rochjati!\nPasien: ${selectedPatient.name}\nTotal Skor: ${calculatedScore} (${cat})`);
  };

  // SUBMIT LAB RECORD
  const handleAddLabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientProfile) return;

    const newLab = {
      date: getRelativeDateString(0),
      hbLevel: parseFloat(labHb as any),
      proteinUrine: labProtein,
      glycemia: Number(labGda)
    };

    const updatedHistory = [...(patientProfile.labHistory || []), newLab];
    onUpdateUserProfile(selectedPatient.id, {
      labHistory: updatedHistory,
      riskStatus: (labProtein !== 'Negatif' || labHb < 10) ? 'RED' : patientProfile.riskStatus
    });

    setLabHb(11.0);
    setLabProtein('Negatif');
    setLabGda(90);
    alert('Rekam Lab Berhasil Ditambahkan ke RME!');
  };

  // SUBMIT FUNDUS MEASUREMENT
  const handleAddFundusHeight = () => {
    if (!patientProfile) return;
    const newHeight = {
      date: getRelativeDateString(0),
      height: Number(fundusHeight)
    };
    const updatedHistory = [...(patientProfile.fundusHeightHistory || []), newHeight];
    onUpdateUserProfile(selectedPatient.id, {
      fundusHeightHistory: updatedHistory
    });
    alert('Grafik Fundus Uteri Diperbarui!');
  };

  // CHAT REPLY
  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgReplyText.trim() || !selectedPatient) return;

    const newReply: ChatMessage = {
      id: `reply-${Date.now()}`,
      senderId: user.id,
      senderRole: 'midwife',
      recipientId: selectedPatient.id,
      recipientName: selectedPatient.name,
      message: msgReplyText.trim(),
      timestamp: new Date().toLocaleDateString('id-ID') + " " + new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})
    };

    onSendChat(newReply);
    setMsgReplyText('');
  };

  // REFERRAL SUBMIT
  const handleReferralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patObj = patients.find(p => p.id === refPatientId);
    if (!patObj) return;

    const newRef: Referral = {
      id: `ref-${Date.now()}`,
      patientId: refPatientId,
      patientName: patObj.name,
      gpaText: patObj.maternalProfile ? `G${patObj.maternalProfile.gpa.g}P${patObj.maternalProfile.gpa.p}A${patObj.maternalProfile.gpa.a}` : 'G1P0A0',
      riskStatus: patObj.maternalProfile?.riskStatus || 'YELLOW',
      referralReason: refReason,
      targetHospital: refHospital,
      bedStatus: refBedStatus,
      ambulanceStatus: refAmbulanceStatus,
      timestamp: getRelativeDateString(0) + " " + new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}),
      status: 'Diajukan'
    };

    onAddReferral(newRef);
    setRefSubmitSuccess(true);
    setTimeout(() => {
      setRefSubmitSuccess(false);
      setActiveMenu('patients');
    }, 2000);
  };

  // QUEUE SERVICE AND CLINICAL EVENT HANDLERS
  const handleCallQueue = (queueId: string, patientName: string, token: string) => {
    setTodayQueue(prev => prev.map(q => q.id === queueId ? { ...q, status: 'Dipanggil' } : q));
    setCurrentlyCalling(`Memanggil Nomor Antrean ${token}: ${patientName} untuk masuk ke Ruang Pemeriksaan Bidan...`);
    setTimeout(() => {
      setCurrentlyCalling(null);
    }, 6000);
  };

  const handleCompleteQueue = (queueId: string, patientId: string) => {
    setTodayQueue(prev => prev.map(q => q.id === queueId ? { ...q, status: 'Selesai' } : q));
    setLogPatientId(patientId);
    setSelectedPatientId(patientId);
    setMidwifeSubMenu('input_log'); // switch view automatically to input medical checkup
  };

  const handleSaveMedicalLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logPatientId) {
      alert("Silakan pilih pasien terlebih dahulu!");
      return;
    }

    const selectedMother = mockUsers.find(u => u.id === logPatientId);
    if (!selectedMother) return;

    // Construct a beautiful health record
    const newLog: HealthLog = {
      id: `log-${Date.now()}`,
      motherId: logPatientId,
      date: new Date().toISOString().split('T')[0],
      weight: Number(logWeight),
      systolic: Number(logSystolic),
      diastolic: Number(logDiastolic),
      fetalMovement: 10,
      symptoms: logComplaint ? [logComplaint] : [],
      notes: `DJJ: ${logFhr} bpm. Catatan: ${logNotes || 'Kondisi terpantau stabil'}`,
      riskStatus: (logSystolic >= 140 || logSystolic <= 90 || logDiastolic >= 90) ? 'RED' : 'GREEN'
    };

    // Update global list state in real-time
    onAddLog(newLog);

    // Sync gestational weeks & risk triage factor
    onUpdateUserProfile(logPatientId, {
      gestationalWeeks: Number(logGestWeeks),
      riskStatus: (logSystolic >= 140 || logSystolic <= 90 || logDiastolic >= 90) ? 'RED' : 'GREEN'
    });

    setLogSuccessMsg(`Sukses menyimpan catatan pemeriksaan medis Ibu ${selectedMother.name}!`);
    setTimeout(() => {
      setLogSuccessMsg('');
      setMidwifeSubMenu('queue'); // redirect back to active queues
    }, 2500);

    // Clear symptoms
    setLogComplaint('');
    setLogNotes('');
  };

  const handleSaveScheduledANC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schPatientId) return;

    const targetPatient = mockUsers.find(u => u.id === schPatientId);
    if (!targetPatient) return;

    // Create a real-time calendar appointment
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      motherId: schPatientId,
      date: schDate,
      time: schTime,
      midwifeName: user.name,
      type: schType,
      notes: schNotes || 'Kontrol rutin bidan area.',
      isCompleted: false,
      status: 'Menunggu'
    };

    onAddAppointment(newApt);
    
    setSchSuccessMsg(`Jadwal ANC berhasil dibuat untuk Ibu ${targetPatient.name} pada ${schDate} ${schTime}!`);
    setTimeout(() => {
      setSchSuccessMsg('');
    }, 2500);

    setSchNotes('');
  };

  // GENERATE AUTOMATIC PWS-KIA METRIC VALUES
  const activeReferralsCount = referrals.length;
  const redAlertCount = patients.filter(p => p.maternalProfile?.riskStatus === 'RED').length;
  const yellowAlertCount = patients.filter(p => p.maternalProfile?.riskStatus === 'YELLOW').length;
  const greenAlertCount = patients.filter(p => p.maternalProfile?.riskStatus === 'GREEN').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-left">
      
      {/* Top clinical Navbar */}
      <header className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-30 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 rounded-xl">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold font-display leading-tight">{user.name}</h1>
            <p className="text-[11px] text-slate-400">Bidan Wilayah Pengampu &bull; Puskesmas Mekar Sari</p>
          </div>
        </div>

        {/* Action Menu tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMenu('patients')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeMenu === 'patients' ? 'bg-emerald-600 text-white' : 'text-slate-350 hover:bg-slate-800'
            }`}
          >
            📋 RME & Pemantauan
          </button>
          <button
            onClick={() => setActiveMenu('consultation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeMenu === 'consultation' ? 'bg-emerald-600 text-white' : 'text-slate-350 hover:bg-slate-800'
            }`}
          >
            💬 Respon Chat
          </button>
          <button
            onClick={() => setActiveMenu('referral')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeMenu === 'referral' ? 'bg-emerald-600 text-white' : 'text-slate-350 hover:bg-slate-800'
            }`}
          >
            🚑 Rujukan Digital
          </button>
          <button
            onClick={() => setActiveMenu('pwskia')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeMenu === 'pwskia' ? 'bg-emerald-600 text-white' : 'text-slate-350 hover:bg-slate-800'
            }`}
          >
            📈 Laporan PWS-KIA
          </button>

          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-rose-500 rounded-lg"
            title="Log Out Bidan"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* REAL-TIME EMERGENCY REACTION FLOATING BANNER FOR Bidan WILAYAH */}
      {activeSosPatient && (
        <div className="bg-rose-600 text-white py-4 px-6 animate-pulse flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xl z-25 text-left border-b border-rose-700">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-rose-800 rounded-full text-lg shrink-0">⚠️</span>
            <div>
              <h4 className="font-extrabold text-sm tracking-wider uppercase">ALARM DARURAT AKTIF (SINYAL KRISIS SOS)!</h4>
              <p className="text-xs text-rose-100 mt-0.5 font-medium">
                Sinyal krisis dipicu oleh Ibu <strong>{activeSosPatient.nama}</strong> (Gestasi {activeSosPatient.usia_kehamilan} Minggu, Desa {activeSosPatient.desa}) pada pukul <strong>{activeSosPatient.timestamp || 'Saat Ini'}</strong>. Mohon hubungi pasien, siapkan tim rujukan klinis, dan kirimkan ambulans penolong segera!
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => {
                if (window.confirm(`Konfirmasi penanganan: Apakah krisis gawat darurat untuk Ibu ${activeSosPatient.nama} sudah ditangani dengan selamat?`)) {
                  handleResolveSosEmergency();
                }
              }}
              className="px-4 py-2.5 bg-white text-rose-700 hover:bg-rose-50 border border-white rounded-xl text-xs font-extrabold transition-all shadow-sm cursor-pointer uppercase flex items-center gap-1.5"
            >
              <span>✔️ SELESAIKAN PENANGANAN / MATIKAN ALARM</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
        
        {/* VIEW 1: PATIENT DIRECTORY & RME */}
        {activeMenu === 'patients' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Col: Navigation Menus & Directory (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* SUB-MENU NAVIGATION HARMONIZED WITH ESTHETIC MAROON ACCENTS */}
              <div id="midwife-submenu-nav" className="bg-white p-4 rounded-2xl border border-gray-150 space-y-3 shadow-sm">
                <div className="border-b border-gray-100 pb-2.5">
                  <h3 className="font-bold text-rose-950 text-xs uppercase tracking-wider font-display flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-rose-800 animate-pulse" />
                    Manajemen Layanan Bidan
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Navigasi rekam klinis & antrean bidan</p>
                </div>
                
                <div className="space-y-1.5">
                  {/* Menu 1: Daftar Antrean Pasien */}
                  <button
                    id="menu-queue-toggle"
                    onClick={() => setMidwifeSubMenu('queue')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border-l-4 text-left ${
                      midwifeSubMenu === 'queue'
                        ? 'bg-rose-50 border-rose-900 text-rose-950 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-transparent hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-rose-900" />
                      Daftar Antrean Pasien
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] rounded-full font-mono font-bold ${
                      midwifeSubMenu === 'queue' ? 'bg-rose-900 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {todayQueue.filter(q => q.status !== 'Selesai').length} Aktif
                    </span>
                  </button>

                  {/* Menu 2: Input Log Pemeriksaan */}
                  <button
                    id="menu-input-log-toggle"
                    onClick={() => setMidwifeSubMenu('input_log')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border-l-4 text-left ${
                      midwifeSubMenu === 'input_log'
                        ? 'bg-rose-50 border-rose-900 text-rose-950 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-transparent hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-rose-900" />
                      Input Log Pemeriksaan
                    </span>
                    <span className="text-[10px] text-rose-900 font-mono font-bold">Baru</span>
                  </button>

                  {/* Menu 3: Agenda & Jadwal ANC */}
                  <button
                    id="menu-anc-schedule-toggle"
                    onClick={() => setMidwifeSubMenu('anc_schedule')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border-l-4 text-left ${
                      midwifeSubMenu === 'anc_schedule'
                        ? 'bg-rose-50 border-rose-900 text-rose-950 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-transparent hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-rose-900" />
                      Agenda & Jadwal ANC
                    </span>
                    <span className="text-[10px] text-indigo-900 font-mono font-bold">Plan</span>
                  </button>
                </div>
              </div>

              {/* The Original Populasi Pasien Ibu Hamil Panel */}
              <div className="bg-white p-4 rounded-2xl border border-gray-150 space-y-4 shadow-sm">
              
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-950 text-sm">Populasi Pasien Ibu Hamil</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Saring berdasarkan desa atau trimester</p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama atau NIK KTP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none"
                />
              </div>

              {/* Filters dropdowns */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <label className="text-gray-400 uppercase font-mono block mb-1">Desa:</label>
                  <select
                    value={filterVillage}
                    onChange={(e) => setFilterVillage(e.target.value)}
                    className="w-full border bg-slate-50 p-1.5 rounded text-[10.5px]"
                  >
                    <option value="ALL">Semua Desa</option>
                    <option value="Desa Sukamaju">Desa Sukamaju</option>
                    <option value="Desa Karanganyar">Desa Karanganyar</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 uppercase font-mono block mb-1">Triage Risiko:</label>
                  <select
                    value={filterRisk}
                    onChange={(e) => setFilterRisk(e.target.value)}
                    className="w-full border bg-slate-50 p-1.5 rounded text-[10.5px]"
                  >
                    <option value="ALL">Semua Risiko</option>
                    <option value="GREEN">Normal (Hijau)</option>
                    <option value="YELLOW">Sedang (Kuning)</option>
                    <option value="RED">Tinggi (Merah)</option>
                  </select>
                </div>
              </div>

              {/* Patient List loops */}
              <div className="space-y-2 max-h-[360px] overflow-y-auto pt-1">
                {sortedPatients.map((pat) => {
                  const prof = pat.maternalProfile!;
                  const isSelect = pat.id === selectedPatientId;
                  const patientScreenings = globalScreenings[pat.id] || [];
                  const latestScreening = patientScreenings[0];
                  
                  return (
                    <button
                      key={pat.id}
                      onClick={() => { setSelectedPatientId(pat.id); setShowRmeTab('overview'); }}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        isSelect 
                          ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-50' 
                          : 'border-gray-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                          {pat.name}
                          {latestScreening && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                          )}
                        </span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono ${
                          prof.riskStatus === 'RED' 
                            ? 'bg-rose-100 text-rose-800' 
                            : prof.riskStatus === 'YELLOW'
                              ? 'bg-amber-150 text-amber-900'
                              : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {prof.riskStatus === 'RED' ? 'KRT' : prof.riskStatus === 'YELLOW' ? 'KST' : 'KRR'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1.5">
                        <span>Min-{prof.gestationalWeeks} &bull; {prof.gpa.g === 1 ? 'G1P0A0' : `G${prof.gpa.g}P${prof.gpa.p}A${prof.gpa.a}`}</span>
                        <span>{prof.village}</span>
                      </div>

                      {latestScreening && (
                        <div className="mt-2.5 p-2 bg-rose-100/50 border border-rose-200 rounded-lg text-[10px] space-y-1 animate-pulse">
                          <div className="flex items-center gap-1 text-rose-700 font-extrabold uppercase tracking-wider text-[8px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                            <span>Laporan Skrining Terkini</span>
                          </div>
                          <p className="text-gray-700 font-medium line-clamp-2 italic">"{latestScreening.complaint}"</p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

            {/* Right Col: Active RME Sheet (8 cols) */}
            {midwifeSubMenu === 'queue' && (
              <div className="lg:col-span-8 space-y-6">
                
                {/* Calling notification alert banner */}
                {currentlyCalling && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-rose-900 text-white rounded-xl p-4 flex items-center gap-3 shadow border border-rose-955/20 text-left"
                  >
                    <div className="p-2 bg-white/20 rounded-lg animate-bounce">
                      <HeartPulse className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-xs text-left">
                      <span className="font-bold tracking-widest font-mono uppercase bg-white/20 px-1.5 py-0.5 rounded text-[10px] mr-2">PANGGILAN</span>
                      <strong className="text-xs font-semibold">{currentlyCalling}</strong>
                    </div>
                  </motion.div>
                )}

                {/* Today's Queue Table Card */}
                <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm text-left">
                  <div className="bg-rose-900 text-white px-5 py-3.5 flex justify-between items-center text-left">
                    <div>
                      <h3 className="text-xs font-bold tracking-widest uppercase font-mono text-rose-200">Layanan Antrean Hari Ini</h3>
                      <h2 className="text-base font-extrabold font-display mt-0.5">Daftar Antrean Pasien Bidan</h2>
                    </div>
                    <span className="bg-white/20 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-white">
                      {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  <div className="p-4 overflow-x-auto text-left">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-150 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50">
                          <th className="p-3 text-center">No. Tiket</th>
                          <th className="p-3">Nama Ibu Hamil</th>
                          <th className="p-3">Jam Kontrol</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Aksi Layanan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {todayQueue.map((item) => {
                          const isSelected = item.patientId === selectedPatientId;
                          return (
                            <tr 
                              key={item.id} 
                              className={`transition-all hover:bg-slate-50/50 ${isSelected ? 'bg-rose-50/10' : ''}`}
                            >
                              <td className="p-3 font-mono font-bold text-rose-900 text-center">{item.tokenNumber}</td>
                              <td className="p-3">
                                <button 
                                  onClick={() => setSelectedPatientId(item.patientId)}
                                  className="font-bold text-slate-800 hover:underline hover:text-rose-900 text-left cursor-pointer"
                                >
                                  {item.patientName}
                                </button>
                              </td>
                              <td className="p-3 font-mono text-slate-550">{item.time} WIB</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.status === 'Selesai' 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : item.status === 'Dipanggil'
                                      ? 'bg-purple-100 text-purple-800 animate-pulse font-extrabold'
                                      : item.status === 'Sedang Ditangani'
                                        ? 'bg-amber-100 text-amber-800 font-semibold border border-amber-200'
                                        : item.status === 'Darurat'
                                          ? 'bg-rose-100 text-rose-800 animate-pulse font-black border border-rose-300'
                                          : 'bg-blue-100 text-blue-800 bg-blue-105'
                                  }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="p-3 text-right space-x-2">
                                {item.status !== 'Selesai' && item.status !== 'Sedang Ditangani' ? (
                                  <>
                                    <button
                                      onClick={() => handleCallQueue(item.id, item.patientName, item.tokenNumber)}
                                      className="bg-rose-900 hover:bg-rose-950 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                                    >
                                      📢 Panggil
                                    </button>
                                    <button
                                      onClick={() => handleCompleteQueue(item.id, item.patientId)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                                    >
                                      ✓ Selesai
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-emerald-700 font-semibold italic text-[11px] pr-2">Selesai diperiksa</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden text-left shadow-sm">
              
              {/* RME Header */}
              <div className="bg-slate-100 px-6 py-4 border-b flex justify-between items-center">
                <div>
                  <span className="text-[9px] uppercase font-bold font-mono tracking-widest text-slate-500">Rekam Medis Elektronik (RME) Maternal</span>
                  <h2 className="text-base font-extrabold text-gray-900 mt-0.5">{selectedPatient?.name}</h2>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => setShowRmeTab('overview')}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      showRmeTab === 'overview' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    Identitas & Log
                  </button>
                  <button
                    onClick={() => setShowRmeTab('score')}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      showRmeTab === 'score' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    Skor Poedji R.
                  </button>
                  <button
                    onClick={() => setShowRmeTab('lab')}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      showRmeTab === 'lab' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    Tes Laboratorium
                  </button>
                </div>
              </div>

              {/* RME BODY: OVERVIEW & ANAMNESA */}
              {showRmeTab === 'overview' && patientProfile && (
                <div className="p-6 space-y-6">
                  
                  {/* Grid details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-gray-400 font-mono block">NIK:</span>
                      <strong className="text-gray-900 font-mono">{patientProfile.nik}</strong>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-gray-400 font-mono block">HPL Perkiraan:</span>
                      <strong className="text-sage-700 font-mono">{patientProfile.hpl}</strong>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-gray-400 font-mono block">GPA Gizi:</span>
                      <strong className="text-gray-900">G{patientProfile.gpa.g} P{patientProfile.gpa.p} A{patientProfile.gpa.a}</strong>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-gray-400 font-mono block">Golongan Darah:</span>
                      <strong className="text-rose-600 font-mono">{patientProfile.bloodType}</strong>
                    </div>
                  </div>

                  {/* Comorbid lists */}
                  <div className="flex gap-2.5 items-center">
                    <span className="text-xs font-bold text-gray-500">Penyakit Penyerta:</span>
                    {patientProfile.comorbidities.length > 0 ? (
                      <div className="flex gap-1.5">
                        {patientProfile.comorbidities.map(c => (
                          <span key={c} className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">{c}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Tidak ada komorbiditas terdaftar.</span>
                    )}
                  </div>

                  {/* Fundus Heights list & input */}
                  <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50">
                    <div className="flex justify-between items-center pb-2 border-b mb-3">
                      <h4 className="text-xs font-bold text-slate-700 tracking-wide uppercase">Tinggi Fundus Uteri (TFU)</h4>
                      
                      <div className="flex gap-1.5 items-center">
                        <input
                          type="number"
                          value={fundusHeight}
                          onChange={(e) => setFundusHeight(Number(e.target.value))}
                          className="w-12 border bg-white p-1 rounded text-xs font-mono text-center"
                        />
                        <button 
                          onClick={handleAddFundusHeight}
                          className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700 font-bold"
                        >
                          + Catat cm
                        </button>
                      </div>
                    </div>

                    {patientProfile.fundusHeightHistory.length > 0 ? (
                      <div className="flex items-center gap-4 text-xs overflow-x-auto py-1">
                        {patientProfile.fundusHeightHistory.map((rec, i) => (
                          <div key={i} className="bg-white p-2 border rounded-lg text-center font-mono min-w-[70px]">
                            <div className="text-[9px] text-gray-450">{rec.date}</div>
                            <div className="font-bold text-indigo-700 mt-0.5">{rec.height} cm</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Belum ada pencatatan TFU. Sesuai kehamilan {patientProfile.gestationalWeeks}w, idealnya TFU sekitar {patientProfile.gestationalWeeks - 2} - {patientProfile.gestationalWeeks + 2} cm.</p>
                    )}
                  </div>

                  {/* Symptoms & log history entries */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest font-mono">Riwayat Log Masuk Harian Pasien</h4>
                    
                    <div className="space-y-2.5 max-h-[200px] overflow-y-auto">
                      {logs.filter(l => l.motherId === selectedPatient.id).map((log) => (
                        <div key={log.id} className="p-3 border rounded-xl bg-white border-gray-150 text-xs flex justify-between items-start gap-3">
                          <div className="space-y-1.5 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-400 font-mono">{log.date}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                log.riskStatus === 'RED' ? 'bg-rose-100 text-rose-800' : log.riskStatus === 'YELLOW' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>Triage: {log.riskStatus}</span>
                            </div>
                            
                            <div className="font-mono text-[11px] text-gray-600">
                              Massa: <strong>{log.weight}kg</strong> &bull; Tensi: <strong className="text-indigo-700">{log.systolic}/{log.diastolic}</strong> &bull; Gerakan: <strong>{log.fetalMovement}x</strong>
                            </div>

                            {log.symptoms.length > 0 && (
                              <div className="flex flex-wrap gap-1 font-semibold text-[9px] text-rose-800">
                                Gejala: {log.symptoms.join(', ')}
                              </div>
                            )}
                          </div>

                          {log.notes && (
                            <p className="max-w-[200px] text-[10px] text-slate-450 italic leading-snug">"{log.notes}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Screenings history entries */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                        Riwayat Skrining Keluhan Mandiri (AI Triage)
                      </h4>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold">Resilence & Safety Protocols</span>
                    </div>
                    
                    <div className="space-y-3 max-h-[220px] overflow-y-auto">
                      {globalScreenings[selectedPatient.id] && globalScreenings[selectedPatient.id].length > 0 ? (
                        globalScreenings[selectedPatient.id].map((scr: any) => (
                          <div key={scr.id} className="p-3 border rounded-xl bg-white border-gray-150 text-xs space-y-2.5 text-left">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2 font-mono text-[9px]">
                                <span className="font-bold text-slate-400">{scr.timestamp}</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-gray-550 font-bold">Usia Hamil {scr.weeks} Minggu</span>
                              </div>
                              <span className={`text-[8.5px] font-extrabold px-2 py-0.5 rounded font-mono shadow-3xs uppercase ${
                                scr.status === 'RED' 
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse' 
                                  : scr.status === 'YELLOW'
                                    ? 'bg-amber-100 text-amber-950 border border-amber-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {scr.status === 'RED' ? '🔴 BAHAYA (Merah)' : scr.status === 'YELLOW' ? '🟡 SENSITIF (Kuning)' : '🟢 AMAN (Hijau)'}
                              </span>
                            </div>
                            
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-gray-100 text-[11px] space-y-1">
                              <span className="text-slate-400 font-mono text-[8.5px] uppercase tracking-wider font-extrabold">Keluhan Ibu:</span>
                              <p className="font-bold text-slate-800 italic">"{scr.complaint}"</p>
                            </div>

                            <div className="text-[10.5px] leading-relaxed text-gray-700 bg-indigo-50/20 p-2.5 rounded-lg border border-indigo-200/30">
                              <span className="text-indigo-600 font-mono text-[8.5px] uppercase tracking-wider font-extrabold block mb-1">Rekomendasi Respons Medis AI:</span>
                              <div className="whitespace-pre-line text-slate-700 font-sans">{scr.result}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic">Belum ada riwayat skrining mandiri berbasis AI untuk pasien ini.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* RME BODY: AUTOMATED POEDJI ROCHJATI SCORE */}
              {showRmeTab === 'score' && patientProfile && (
                <div className="p-6 space-y-4">
                  
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-xs space-y-2 text-indigo-950">
                    <h4 className="font-bold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-indigo-700" />
                      Adaptasi Skrining Skor Poedji Rochjati (Klinis Indonesia)
                    </h4>
                    <p className="leading-relaxed text-indigo-900/90">
                      Merupakan instrumen prediksi risiko kehamilan menggunakan bobot angka. Skor Awal Ibu Hamil adalah **2**. Skrining menghasilkan kategori risiko:
                    </p>
                    <div className="flex gap-4 font-mono font-bold text-[10.5px]">
                      <span className="text-emerald-700">Skor 2: Kelompok Rendah (KRR)</span>
                      <span className="text-amber-700">Skor 6-10: Kelompok Sedang (KST)</span>
                      <span className="text-rose-700">Skor &ge;12: Kelompok Tinggi (KRT)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    
                    {/* Checkboxes parameters */}
                    <div className="space-y-2 border-r pr-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Faktor Risiko Ibu (+4)</h4>
                      
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={prsCheckboxes.muda}
                          onChange={(e) => setPrsCheckboxes({...prsCheckboxes, muda: e.target.checked})}
                          className="w-4 h-4"
                        />
                        Terlalu muda (&lt; 20 Tahun)
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={prsCheckboxes.tua}
                          onChange={(e) => setPrsCheckboxes({...prsCheckboxes, tua: e.target.checked})}
                          className="w-4 h-4"
                        />
                        Terlalu tua (&gt; 35 Tahun)
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={prsCheckboxes.jarak}
                          onChange={(e) => setPrsCheckboxes({...prsCheckboxes, jarak: e.target.checked})}
                          className="w-4 h-4"
                        />
                        Terlalu dekat jarak anak (&lt; 2 Th)
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={prsCheckboxes.anak}
                          onChange={(e) => setPrsCheckboxes({...prsCheckboxes, anak: e.target.checked})}
                          className="w-4 h-4"
                        />
                        Terlalu banyak persalinan (&gt; 4)
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={prsCheckboxes.pendek}
                          onChange={(e) => setPrsCheckboxes({...prsCheckboxes, pendek: e.target.checked})}
                          className="w-4 h-4"
                        />
                        Tinggi badan pendek (&lt; 145 cm)
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={prsCheckboxes.gugur}
                          onChange={(e) => setPrsCheckboxes({...prsCheckboxes, gugur: e.target.checked})}
                          className="w-4 h-4"
                        />
                        Ada riwayat keguguran abortus
                      </label>
                    </div>

                    {/* Highly severe parameters */}
                    <div className="space-y-2 pl-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Faktor Risiko Tinggi (+8)</h4>
                      
                      <label className="flex items-center gap-2 text-xs text-rose-700 font-semibold">
                        <input
                          type="checkbox"
                          checked={prsCheckboxes.bengkak}
                          onChange={(e) => setPrsCheckboxes({...prsCheckboxes, bengkak: e.target.checked})}
                          className="w-4 h-4 text-rose-600"
                        />
                        Preeklampsia / Tensi Tinggi & Proteinuria
                      </label>
                      <label className="flex items-center gap-2 text-xs text-rose-700">
                        <input
                          type="checkbox"
                          checked={prsCheckboxes.posisi}
                          onChange={(e) => setPrsCheckboxes({...prsCheckboxes, posisi: e.target.checked})}
                          className="w-4 h-4 text-rose-600"
                        />
                        Kelainan Letak Janin (Sungsang / Lintang)
                      </label>
                      <label className="flex items-center gap-2 text-xs text-rose-700">
                        <input
                          type="checkbox"
                          checked={prsCheckboxes.perdarahan}
                          onChange={(e) => setPrsCheckboxes({...prsCheckboxes, perdarahan: e.target.checked})}
                          className="w-4 h-4 text-rose-600"
                        />
                        Riwayat Perdarahan Melahirkan Dulu
                      </label>

                      {/* Score output box */}
                      <div className="pt-6 border-t mt-6 text-center">
                        <span className="text-[10px] text-gray-400 block font-mono">LIVE MITIKASI SCORE:</span>
                        <div className="text-4xl font-extrabold font-mono text-indigo-900 mt-1">{calculatePrsScore()}</div>
                        <span className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase mt-2 inline-block ${
                          getPrsRiskCategory(calculatePrsScore()) === 'KRT' 
                            ? 'bg-rose-100 text-rose-800' 
                            : getPrsRiskCategory(calculatePrsScore()) === 'KST'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {getPrsRiskCategory(calculatePrsScore()) === 'KRT' 
                            ? 'Risiko Tinggi (KRT)' 
                            : getPrsRiskCategory(calculatePrsScore()) === 'KST'
                              ? 'Risiko Sedang (KST)'
                              : 'Risiko Rendah (KRR)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t flex justify-end gap-3">
                    <button
                      onClick={() => setPrsCheckboxes({
                        muda: false, tua: false, jarak: false, anak: false, pendek: false, gugur: false, bengkak: false, posisi: false, perdarahan: false
                      })}
                      className="px-4 py-1.5 text-xs text-gray-500 border rounded hover:bg-slate-50"
                    >
                      Reset Parameter
                    </button>
                    <button
                      onClick={handleSavePrsScore}
                      className="px-5 py-1.5 text-xs bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 cursor-pointer"
                    >
                      Simpan Skor RME Ibu
                    </button>
                  </div>
                </div>
              )}

              {/* RME BODY: INTRUSIVE LABORATORY RECORD */}
              {showRmeTab === 'lab' && patientProfile && (
                <div className="p-6 space-y-6">
                  
                  {/* Lab addition form */}
                  <form onSubmit={handleAddLabSubmit} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-gray-150">
                    <h3 className="font-bold text-xs text-gray-700 uppercase tracking-widest font-mono">Input Hasil Laboratorium Baru (Masa Kehamilan)</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Kadar Hemoglobin (Hb)</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={labHb}
                            onChange={(e) => setLabHb(parseFloat(e.target.value) || 0)}
                            className="w-full bg-white border rounded p-1.5 text-xs focus:outline-none"
                            required
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-gray-400 font-mono">g/dL</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Protein Urine</label>
                        <select
                          value={labProtein}
                          onChange={(e) => setLabProtein(e.target.value as any)}
                          className="w-full bg-white border rounded p-1.5 text-xs focus:outline-none"
                        >
                          <option value="Negatif">Negatif (Normal)</option>
                          <option value="Positif (+)">Positif (+)</option>
                          <option value="Positif (++)">Positif (++)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Gula Darah Acak (GDA)</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={labGda}
                            onChange={(e) => setLabGda(parseInt(e.target.value) || 0)}
                            className="w-full bg-white border rounded p-1.5 text-xs focus:outline-none"
                            required
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-gray-400 font-mono">mg/dL</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                    >
                      + Rekam Pemeriksaan Laboratorium Pasien
                    </button>
                  </form>

                  {/* Lab records History list */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Riwayat Rekaman Laboratorium</h4>
                    
                    {patientProfile.labHistory && patientProfile.labHistory.length > 0 ? (
                      <div className="space-y-2">
                        {patientProfile.labHistory.map((lh, idx) => (
                          <div key={idx} className="p-3 border rounded-xl bg-white flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-400 font-mono">{lh.date}</span>
                            <div className="font-mono space-x-4">
                              <span>Hb: <strong className={lh.hbLevel < 11 ? "text-rose-600" : "text-emerald-700"}>{lh.hbLevel} g/dL</strong></span>
                              <span>Protein Urine: <strong className={lh.proteinUrine !== 'Negatif' ? "text-rose-600" : "text-emerald-700"}>{lh.proteinUrine}</strong></span>
                              <span>GDA: <strong>{lh.glycemia} mg/dL</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic text-center py-4">Belum ada hasil pemeriksaan laboratorium klinis yang tercatat.</p>
                    )}
                  </div>
                </div>
              )}
              </div>
              </div>
            )}

            {/* IF INPUT LOG PEMERIKSAAN FORM IS ACTIVE */}
            {midwifeSubMenu === 'input_log' && (
              <div className="lg:col-span-8 space-y-6 text-left">
                <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm text-left animate-fadeIn">
                  <div className="bg-rose-900 text-white px-6 py-5">
                    <span className="text-[10px] font-mono text-rose-150 uppercase tracking-widest font-bold">Layanan Entri Data Kebidanan</span>
                    <h2 className="text-lg font-extrabold font-display mt-0.5">Form Input Log Pemeriksaan Pasien</h2>
                    <p className="text-xs text-rose-105 mt-1 opacity-90">Isi rekam klinis pemeriksaan fisik, tanda vital, dan DJJ untuk mengupdate database RME dan tingkat Triage secara real-time.</p>
                  </div>

                  {logSuccessMsg && (
                    <div className="m-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold animate-pulse text-left">
                      ✓ {logSuccessMsg}
                    </div>
                  )}

                  <form onSubmit={handleSaveMedicalLog} className="p-6 space-y-6 text-xs text-slate-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* Pasien Select */}
                      <div>
                        <label className="text-gray-550 block font-bold uppercase font-mono tracking-wider mb-1.5">1. Pilih Nama Pasien dari Antrean:</label>
                        <select
                          value={logPatientId}
                          onChange={(e) => {
                            setLogPatientId(e.target.value);
                            const selectedMother = mockUsers.find(u => u.id === e.target.value);
                            if (selectedMother?.maternalProfile) {
                              setLogGestWeeks(selectedMother.maternalProfile.gestationalWeeks);
                            }
                          }}
                          className="w-full bg-slate-50 border border-gray-200 p-3 rounded-xl focus:outline-none focus:border-rose-300 font-medium text-xs cursor-pointer"
                        >
                          {mockUsers.filter(u => u.role === 'mother').map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name} (NIK: {u.maternalProfile?.nik || 'N/A'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Usia Kandungan */}
                      <div>
                        <label className="text-gray-555 block font-bold uppercase font-mono tracking-wider mb-1.5">2. Usia Kandungan (Minggu):</label>
                        <input
                          type="number"
                          value={logGestWeeks}
                          onChange={(e) => setLogGestWeeks(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-gray-200 p-3 rounded-xl focus:outline-none focus:border-rose-300 font-mono font-bold"
                          placeholder="Contoh: 28"
                          required
                          min="1"
                          max="43"
                        />
                      </div>

                      {/* Tekanan Darah (Sistolik & Diastolik) */}
                      <div>
                        <label className="text-gray-555 block font-bold uppercase font-mono tracking-wider mb-1.5">3. Tensi Tekanan Darah (mmHg):</label>
                        <div className="flex gap-3 items-center">
                          <input
                            type="number"
                            value={logSystolic}
                            onChange={(e) => setLogSystolic(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-gray-200 p-3 rounded-xl text-center font-mono font-bold focus:outline-none"
                            placeholder="Sistol"
                            required
                            min="50"
                            max="250"
                          />
                          <span className="text-lg font-bold text-slate-400">/</span>
                          <input
                            type="number"
                            value={logDiastolic}
                            onChange={(e) => setLogDiastolic(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-gray-200 p-3 rounded-xl text-center font-mono font-bold focus:outline-none"
                            placeholder="Diastol"
                            required
                            min="30"
                            max="180"
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 text-left">Normal: 120/80 mmHg. Risiko tinggi jika tensi &ge; 140/90 mmHg.</p>
                      </div>

                      {/* Berat Badan */}
                      <div>
                        <label className="text-gray-555 block font-bold uppercase font-mono tracking-wider mb-1.5">4. Berat Badan (kg):</label>
                        <input
                          type="number"
                          value={logWeight}
                          onChange={(e) => setLogWeight(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-gray-200 p-3 rounded-xl font-mono focus:outline-none"
                          placeholder="Berat tubuh ibu hamil"
                          required
                          min="30"
                          max="180"
                        />
                      </div>

                      {/* Detak Jantung Janin (DJJ) */}
                      <div>
                        <label className="text-gray-555 block font-bold uppercase font-mono tracking-wider mb-1.5">5. Detak Jantung Janin (DJJ - bpm):</label>
                        <input
                          type="number"
                          value={logFhr}
                          onChange={(e) => setLogFhr(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-gray-200 p-3 rounded-xl font-mono font-bold focus:outline-none"
                          placeholder="Nominal djj per menit"
                          required
                          min="80"
                          max="220"
                        />
                        <p className="text-[10px] text-gray-400 mt-1 text-left">Batas aman djj janin: 120 - 160 bpm.</p>
                      </div>

                      {/* Keluhan */}
                      <div>
                        <label className="text-gray-555 block font-bold uppercase font-mono tracking-wider mb-1.5">6. Keluhan Utama Pasien:</label>
                        <input
                          type="text"
                          value={logComplaint}
                          onChange={(e) => setLogComplaint(e.target.value)}
                          className="w-full bg-slate-50 border border-gray-200 p-3 rounded-xl font-medium focus:outline-none"
                          placeholder="Tulis keluhan utama pasien jika ada"
                        />
                      </div>

                    </div>

                    {/* Catatan Bidan */}
                    <div>
                      <label className="text-gray-555 block font-bold uppercase font-mono tracking-wider mb-1.5">7. Analisa / Catatan Edukasi Bidan:</label>
                      <textarea
                        value={logNotes}
                        onChange={(e) => setLogNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 p-3 rounded-xl font-medium text-xs focus:outline-none"
                        rows={3}
                        placeholder="Berikan saran suplemen Fe, gizi diet rendah garam, atau arahan rujukan..."
                      />
                    </div>

                    <div className="pt-4 flex justify-end gap-3.5 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setMidwifeSubMenu('queue')}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="bg-rose-900 hover:bg-rose-955 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-sm transition-all"
                      >
                        ✓ Simpan Catatan Pemeriksaan
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* IF AGENDA & JADWAL ANC IS ACTIVE */}
            {midwifeSubMenu === 'anc_schedule' && (
              <div className="lg:col-span-8 space-y-6 text-left">
                
                {/* Calendar booking card */}
                <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
                  <div className="bg-rose-900 text-white px-6 py-5 text-left">
                    <span className="text-[10px] font-mono text-rose-150 uppercase tracking-widest font-bold">Penjadwalan Kunjungan</span>
                    <h2 className="text-lg font-extrabold font-display mt-0.5">Buat Agenda Kontrol Kunjungan ANC Baru</h2>
                    <p className="text-xs text-rose-105 mt-1 opacity-90">Daftarkan tanggal, waktu, dan jenis pemantauan berkala (ANC 1 s.d ANC 6) agar sinkron ke kalender aplikasi seluler Ibu.</p>
                  </div>

                  {schSuccessMsg && (
                    <div className="m-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold animate-pulse text-left">
                      ✓ {schSuccessMsg}
                    </div>
                  )}

                  <form onSubmit={handleSaveScheduledANC} className="p-6 space-y-4 text-xs text-slate-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Mother patient select */}
                      <div>
                        <label className="text-gray-500 block font-bold mb-1 font-mono tracking-wider">PASIEN IBU HAMIL:</label>
                        <select
                          value={schPatientId}
                          onChange={(e) => setSchPatientId(e.target.value)}
                          className="w-full bg-slate-50 border border-gray-200 p-3 rounded-xl focus:outline-none cursor-pointer"
                          required
                        >
                          {mockUsers.filter(u => u.role === 'mother').map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Visit Type selector */}
                      <div>
                        <label className="text-gray-500 block font-bold mb-1 font-mono tracking-wider">TIPE KUNJUNGAN:</label>
                        <select
                          value={schType}
                          onChange={(e) => setSchType(e.target.value as any)}
                          className="w-full bg-slate-50 border border-gray-200 p-3 rounded-xl focus:outline-none cursor-pointer"
                          required
                        >
                          <option value="ANC 1">ANC 1 (Trimester I)</option>
                          <option value="ANC 2">ANC 2 (Trimester I)</option>
                          <option value="ANC 3">ANC 3 (Trimester II)</option>
                          <option value="ANC 4">ANC 4 (Trimester II)</option>
                          <option value="ANC 5">ANC 5 (Trimester III)</option>
                          <option value="ANC 6">ANC 6 (Trimester III)</option>
                          <option value="Imunisasi">Imunisasi TT Lanjutan</option>
                          <option value="Konsultasi">Konsultasi Khusus</option>
                        </select>
                      </div>

                      {/* Date */}
                      <div>
                        <label className="text-gray-500 block font-bold mb-1 font-mono tracking-wider">TANGGAL ANC:</label>
                        <input
                          type="date"
                          value={schDate}
                          onChange={(e) => setSchDate(e.target.value)}
                          className="w-full bg-slate-50 border border-gray-200 p-3 rounded-xl font-mono focus:outline-none"
                          required
                        />
                      </div>

                      {/* Time */}
                      <div>
                        <label className="text-gray-500 block font-bold mb-1 font-mono tracking-wider">JAM KEDATANGAN:</label>
                        <input
                          type="time"
                          value={schTime}
                          onChange={(e) => setSchTime(e.target.value)}
                          className="w-full bg-slate-50 border border-gray-200 p-3 rounded-xl font-mono focus:outline-none"
                          required
                        />
                      </div>

                    </div>

                    {/* Deskripsi Catatan Rujukan */}
                    <div>
                      <label className="text-gray-500 block font-bold mb-1 font-mono tracking-wider">INSTRUKSI / CATATAN KHUSUS:</label>
                      <textarea
                        value={schNotes}
                        onChange={(e) => setSchNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 p-3 rounded-xl focus:outline-none"
                        placeholder="Harap bawa Buku KIA, minum tablet besi yang cukup sebelum kontrol, atau bawa contoh sampel urin pagi hari."
                        rows={2}
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="bg-rose-900 hover:bg-rose-955 text-white font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-sm transition-all"
                      >
                        📅 Buat Agenda ANC Baru
                      </button>
                    </div>
                  </form>
                </div>

                {/* Appointments status logs list table */}
                <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
                  <div className="bg-slate-100 p-4 border-b flex justify-between items-center text-left">
                    <div>
                      <h3 className="font-extrabold text-xs text-gray-900 uppercase font-mono tracking-wider text-left">Log Rencana Kunjungan & Kehadiran Pasien</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5 text-left">Daftar agenda janji temu ANC di wilayah Puskesmas Mekarsari</p>
                    </div>
                  </div>

                  <div className="p-4 overflow-x-auto text-left">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50">
                          <th className="p-3">Tanggal & Jam</th>
                          <th className="p-3">Ibu Hamil</th>
                          <th className="p-3">Tipe Kunjungan</th>
                          <th className="p-3">Instruksi Medis</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Aksi Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-700">
                        {appointments.map((apt) => {
                          const matchedMother = mockUsers.find(u => u.id === apt.motherId);
                          const currentStatusValue = apt.status || (apt.isCompleted ? 'Hadir' : 'Menunggu');

                          return (
                            <tr key={apt.id} className="hover:bg-slate-50/30">
                              <td className="p-3 font-mono">
                                <div className="font-bold text-slate-900 text-left">{apt.date}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5 text-left">{apt.time} WIB</div>
                              </td>
                              <td className="p-3 font-semibold text-slate-900 text-left">{matchedMother?.name || "Pasien"}</td>
                              <td className="p-3 text-left">
                                <span className="bg-rose-100 text-rose-900 border border-rose-900/10 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                                  {apt.type}
                                </span>
                              </td>
                              <td className="p-3 max-w-[200px] truncate text-slate-550 italic text-left">
                                {apt.notes || "Tidak ada catatan."}
                              </td>
                              <td className="p-3 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  currentStatusValue === 'Hadir'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : currentStatusValue === 'Terlewatkan'
                                      ? 'bg-rose-105 text-rose-800 bg-rose-100'
                                      : 'bg-blue-105 text-blue-800 bg-blue-100'
                                }`}>
                                  {currentStatusValue}
                                </span>
                              </td>
                              <td className="p-3 text-right space-x-1.5">
                                {currentStatusValue === 'Menunggu' ? (
                                  <>
                                    <button
                                      onClick={() => onUpdateAppointment(apt.id, { status: 'Hadir', isCompleted: true })}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-2 py-1 rounded transition-all cursor-pointer"
                                    >
                                      Hadir
                                    </button>
                                    <button
                                      onClick={() => onUpdateAppointment(apt.id, { status: 'Terlewatkan', isCompleted: false })}
                                      className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-[9px] px-2 py-1 rounded transition-all cursor-pointer"
                                    >
                                      Terlewatkan
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-gray-400 text-[10px] italic pr-1">Telah Tercatat</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* VIEW 2: CONSULTATION RESPONSE CENTRAL CHAT INBOX */}
        {activeMenu === 'consultation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Col: Messages Swarm threads (4 cols) */}
            <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-gray-150 space-y-4 text-left">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-950 text-sm flex items-center gap-1.5">
                  <Inbox className="w-4 h-4 text-emerald-600" />
                  Kotak Masuk Konsultasi Ibu Hamil
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Pertanyaan klinis terbaru terkait masa kehamilan</p>
              </div>

              <div className="space-y-2">
                {patients.map((pat) => {
                  const patientMsg = chats.filter(c => (c.senderId === pat.id && c.recipientId === user.id) || (c.senderId === user.id && c.recipientId === pat.id)).slice(-1)[0];
                  const hasHistory = !!patientMsg;
                  const isSelect = pat.id === selectedPatientId;
                  
                  return (
                    <button
                      key={pat.id}
                      onClick={() => setSelectedPatientId(pat.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        isSelect 
                          ? 'border-emerald-600 bg-emerald-50/50' 
                          : 'border-gray-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start font-bold">
                        <span className="text-gray-900 text-xs">{pat.name}</span>
                        <span className="text-[8px] font-mono text-gray-400 block mt-0.5">{pat.maternalProfile?.village}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-2 mt-1.5">
                        {hasHistory ? patientMsg.message : "Belum memulai konsultasi di sistem."}
                      </p>
                      {hasHistory && (
                        <div className="text-[8px] text-right font-mono text-emerald-600 mt-1 font-bold">
                          {patientMsg.timestamp}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Col: Consultation Chat board (8 cols) */}
            <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl overflow-hidden flex flex-col h-[480px] text-left">
              
              <div className="bg-slate-900 text-white px-5 py-4 border-b shrink-0 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm leading-tight">Konsultasi: Ibu {selectedPatient?.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">NIK: {selectedPatient?.maternalProfile?.nik} &bull; Trimester {selectedPatient?.maternalProfile?.gestationalWeeks <= 12 ? 'I' : selectedPatient?.maternalProfile?.gestationalWeeks <= 27 ? 'II' : 'III'}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold uppercase font-mono ${
                    selectedPatient?.maternalProfile?.riskStatus === 'RED' ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                  }`}>
                    {selectedPatient?.maternalProfile?.riskStatus} RISK
                  </span>
                </div>
              </div>

              {/* Conversation messages thread */}
              <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/40">
                {chats.filter(c => (c.senderId === selectedPatient?.id && c.recipientId === user.id) || (c.senderId === user.id && c.recipientId === selectedPatient?.id)).map((msg) => {
                  const isMe = msg.senderRole === 'midwife';
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-xl p-3 text-xs shadow-xs text-left ${
                        isMe 
                          ? 'bg-emerald-600 text-white rounded-tr-none' 
                          : 'bg-white border text-gray-900 rounded-tl-none'
                      }`}>
                        <div className="font-bold text-[8px] uppercase tracking-widest block opacity-75 mb-1 text-right">
                          {isMe ? 'Anda (Bidan)' : 'Pasien'}
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        <span className="text-[8px] opacity-60 font-mono mt-1 block text-right">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Clinicians reply box */}
              <form onSubmit={handleReplySubmit} className="p-3 bg-white border-t flex gap-2 shrink-0">
                <input
                  type="text"
                  value={msgReplyText}
                  onChange={(e) => setMsgReplyText(e.target.value)}
                  placeholder={`Tulis arahan medis terenkripsi untuk Ibu ${selectedPatient?.name}...`}
                  className="flex-grow px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow"
                >
                  Arahan Medis
                </button>
              </form>
            </div>
          </div>
        )}

        {/* VIEW 3: CLINIC DIGITAL REFERRALS LOGISTIC AND SUBMIT */}
        {activeMenu === 'referral' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
            
            {/* Form to issue a maternal referral (7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-gray-150 space-y-6">
              <div>
                <h3 className="font-bold text-gray-950 text-base font-display flex items-center gap-2">
                  <Bus className="w-5 h-5 text-emerald-600" />
                  Rujukan Digital Cepat (Faskes Lanjutan)
                </h3>
                <p className="text-xs text-gray-500 mt-1">Mengantarkan pasien maternal dengan risiko tinggi menuju Rumah Sakit Spesialis.</p>
              </div>

              {refSubmitSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-semibold">
                  ✓ Berhasil Mengajukan Rujukan Medis! Sireg RSUD & Ambulans telah disiapkan secara otomatis.
                </div>
              )}

              <form onSubmit={handleReferralSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Pilih Pasien Risiko Tinggi (KRT/KST)</label>
                  <select
                    value={refPatientId}
                    onChange={(e) => setRefPatientId(e.target.value)}
                    className="w-full border bg-slate-50 p-2.5 rounded-xl font-semibold text-gray-800"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.maternalProfile?.riskStatus} Risk) &bull; NIK {p.maternalProfile?.nik}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Indikasi Klinis Rujukan (ICD-10)</label>
                  <textarea
                    rows={3}
                    value={refReason}
                    onChange={(e) => setRefReason(e.target.value)}
                    className="w-full border bg-slate-50 p-2.5 rounded-xl"
                    placeholder="Tulis diagnosa rujukan darurat..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Rumah Sakit Tujuan Spesialis</label>
                    <select
                      value={refHospital}
                      onChange={(e) => setRefHospital(e.target.value)}
                      className="w-full border bg-slate-50 p-2.5 rounded-xl"
                    >
                      <option value="RSUD Sayang Ibu (Pusat Rujukan Spesialis)">RSUD Sayang Ibu (Pusat Rujukan Spesialis)</option>
                      <option value="RS Siloam Jantung Sehat">RS Siloam Jantung Sehat</option>
                      <option value="RS Hermina Ibu & Anak">RS Hermina Ibu & Anak</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Status Ambulans Penjemput wilayah</label>
                    <select
                      value={refAmbulanceStatus}
                      onChange={(e) => setRefAmbulanceStatus(e.target.value as any)}
                      className="w-full border bg-slate-50 p-2.5 rounded-xl"
                    >
                      <option value="Siaga">Siaga (Ready di Garasi Puskesmas)</option>
                      <option value="Sedang Jalan">Sedang Mengantar Rujukan Lain</option>
                    </select>
                  </div>
                </div>



                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 shadow shadow-emerald-100 cursor-pointer"
                >
                  Kirim Pengajuan Sireg Rujukan maternal
                </button>
              </form>
            </div>

            {/* Right Col: Logistics monitor log (5 cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-150 space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-900 text-sm">Log & Telemetri Rujukan Darurat</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Sistem integrasi faskes tingkat lanjut (RSUD)</p>
              </div>

              <div className="space-y-3">
                {referrals.map((ref) => (
                  <div key={ref.id} className="p-4 border rounded-xl bg-slate-50/50 space-y-3 text-xs">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="font-bold text-gray-400 uppercase">UID: {ref.id}</span>
                      <span className="text-gray-500 font-bold">{ref.timestamp}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-950 text-sm">{ref.patientName} ({ref.gpaText})</h4>
                      <p className="text-gray-650 text-[11px] mt-1 italic font-semibold leading-relaxed">Indikasi: "{ref.referralReason}"</p>
                    </div>

                    <div className="bg-white border rounded-lg p-2.5 space-y-1.5 font-mono text-[10.5px]">
                      <div className="flex justify-between">
                        <span className="text-gray-400">RS Rujukan:</span>
                        <strong className="text-slate-800">{ref.targetHospital}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ketersediaan Kamar:</span>
                        <strong className={ref.bedStatus === 'Tersedia' ? 'text-emerald-600' : 'text-rose-600'}>{ref.bedStatus}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status Ambulans:</span>
                        <strong className="text-emerald-700 bg-emerald-50 px-1 rounded">{ref.ambulanceStatus}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10.5px] font-bold">
                      <span className="text-gray-500">Status Rujukan:</span>
                      <span className="bg-indigo-100 text-indigo-800 px-2.5 py-0.2 rounded-full font-bold">
                        {ref.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: AUTOMATIC PWS-KIA REPORT GENERATOR */}
        {activeMenu === 'pwskia' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-150 text-left space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">PWS-KIA Depkes RI</span>
                <h3 className="font-bold text-gray-900 text-[18px] font-display mt-2">Laporan Pemantauan Wilayah Setempat (PWS-KIA)</h3>
                <p className="text-xs text-gray-500 mt-1">Dihasilkan otomatis per bulan untuk dilaporkan langsung ke Dinas Kesehatan Kota / Puskesmas Induk.</p>
              </div>
              <button
                onClick={() => window.print()}
                className="bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs px-4  py-2.5 rounded-lg border shadow cursor-pointer text-center"
              >
                🖨️ Cetak / Unduh Laporan PDF
              </button>
            </div>

            {/* Macro metrics summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 text-center">
                <span className="text-[10px] font-mono uppercase text-gray-400 block font-bold">Total Bumil Terdaftar</span>
                <strong className="text-3xl font-bold font-mono text-slate-800 mt-2 block">{patients.length}</strong>
              </div>
              <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-100 text-center">
                <span className="text-[10px] font-mono uppercase text-rose-800/80 block font-bold">Risiko Tinggi (KRT/Red)</span>
                <strong className="text-3xl font-bold font-mono text-rose-800 mt-2 block">{redAlertCount}</strong>
              </div>
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-center">
                <span className="text-[10px] font-mono uppercase text-amber-800/80 block font-bold">Risiko Sedang (KST/Yellow)</span>
                <strong className="text-3xl font-bold font-mono text-amber-800 mt-2 block">{yellowAlertCount}</strong>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-150 text-center">
                <span className="text-[10px] font-mono uppercase text-emerald-800/90 block font-bold">Kooperatif Rujukan Sukses</span>
                <strong className="text-3xl font-bold font-mono text-emerald-800 mt-2 block">{activeReferralsCount}</strong>
              </div>
            </div>

            {/* Geographical epidemiological spreadsheet */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest font-mono">Ketuntasan Cakupan Geografis per Desa Kontrol</h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-gray-150">
                  <thead>
                    <tr className="bg-slate-100 font-bold uppercase tracking-wider text-slate-600 text-[10px]">
                      <th className="p-3 border">Nama Desa binaan</th>
                      <th className="p-3 border text-center">Jumlah Bumil (Anak)</th>
                      <th className="p-3 border text-center">Cakupan ANC-1 (Trimester 1)</th>
                      <th className="p-3 border text-center">Cakupan ANC-4 (Trimester 2)</th>
                      <th className="p-3 border text-center">Cakupan ANC-6 (Melahirkan)</th>
                      <th className="p-3 border text-center">Kasus Risiko Tinggi (KRT)</th>
                      <th className="p-3 border text-center">Tingkat Penatalaksanaan (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-800">
                    <tr>
                      <td className="p-3 border font-semibold">Desa Sukamaju</td>
                      <td className="p-3 border text-center font-mono font-bold">2</td>
                      <td className="p-3 border text-center text-emerald-600 font-bold">&#10003; 100%</td>
                      <td className="p-3 border text-center text-emerald-600 font-bold">&#10003; 100%</td>
                      <td className="p-3 border text-center text-amber-600 font-bold">75% (Tunda)</td>
                      <td className="p-3 border text-center font-bold text-emerald-600">0 Kasus</td>
                      <td className="p-3 border text-center font-mono text-emerald-700 font-bold">100% (Kooperatif)</td>
                    </tr>
                    <tr>
                      <td className="p-3 border font-semibold">Desa Karanganyar</td>
                      <td className="p-3 border text-center font-mono font-bold">1</td>
                      <td className="p-3 border text-center text-emerald-600 font-bold">&#10003; 100%</td>
                      <td className="p-3 border text-center text-rose-600 font-bold">40% Anemia</td>
                      <td className="p-3 border text-center text-rose-600 font-semibold">Bypass (Dirujuk)</td>
                      <td className="p-3 border text-center font-bold text-rose-600">1 Kasus (Preeklampsia)</td>
                      <td className="p-3 border text-center font-mono text-emerald-700 font-bold">100% (Dirujuk Cepat)</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td className="p-3 border uppercase font-mono">Agregat Wilayah Mekarsari</td>
                      <td className="p-3 border text-center font-mono">3</td>
                      <td className="p-3 border text-center text-emerald-700">100%</td>
                      <td className="p-3 border text-center text-amber-700">71.4%</td>
                      <td className="p-3 border text-center text-indigo-700">62.5%</td>
                      <td className="p-3 border text-center text-rose-700">1 Kasus Aktif</td>
                      <td className="p-3 border text-center font-mono text-emerald-700">100% Tanggap Saji</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature official simulation footer block */}
            <div className="pt-12 flex justify-between items-center text-xs">
              <div>
                <span className="text-gray-400 block font-mono">Mengetahui Puskesmas Mekarsari:</span>
                <strong className="text-slate-800 mt-6 block border-t pt-1.5 w-44">dr. Hendra Setiawan</strong>
                <span className="text-gray-400 font-mono text-[10px]">Kepala Puskesmas Pembina</span>
              </div>

              <div>
                <span className="text-gray-400 block font-mono">Disusun Oleh Bidan Wilayah:</span>
                <strong className="text-slate-800 mt-6 block border-t pt-1.5 w-44">Siti Rahma, S.Tr.Keb</strong>
                <span className="text-gray-400 font-mono text-[10px]">NIP: 198901122015032001</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
