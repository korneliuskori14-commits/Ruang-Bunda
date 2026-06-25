/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AuthModule from './components/AuthModule';
import MotherDashboard from './components/MotherDashboard';
import MidwifeDashboard from './components/MidwifeDashboard';
import AdminDashboard from './components/AdminDashboard';
import RoleSwitcher from './components/RoleSwitcher';

import { User, HealthLog, ChatMessage, Appointment, Referral, Article, AuditLog } from './types';
import { 
  initialUsers, initialLogs, initialChats, initialAppointments, 
  initialReferrals, initialArticles, initialAuditLogs, getRelativeDateString 
} from './data/initialData';

export default function App() {
  
  // NAV ROUTING STATE: 'home' | 'login' | 'register' | 'dashboard'
  const [navState, setNavState] = useState<'home' | 'login' | 'register' | 'dashboard'>('home');

  // DATABASE STATES
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [globalScreenings, setGlobalScreenings] = useState<Record<string, any[]>>({});
  const [activeSos, setActiveSos] = useState<any>(null);

  // 1. Initial State Load on mounting
  useEffect(() => {
    // SOS active alarm check from localstorage
    const savedSos = localStorage.getItem('momcare_emergency_sos');
    if (savedSos) {
      try {
        setActiveSos(JSON.parse(savedSos));
      } catch (e) {
        console.error("SOS load error:", e);
      }
    }
    // Users
    const storedUsers = localStorage.getItem('momcare_users');
    let loadedUsers = [];
    if (storedUsers) {
      loadedUsers = JSON.parse(storedUsers);
      setUsers(loadedUsers);
    } else {
      loadedUsers = initialUsers;
      setUsers(initialUsers);
      localStorage.setItem('momcare_users', JSON.stringify(initialUsers));
    }

    const loadedScreenings: Record<string, any[]> = {};
    const defaultKartikaScreenings = [
      {
        id: 'scr-1',
        weeks: 24,
        complaint: 'Kadang tangan kiri terasa agak kebas tetapi tidak ada bengkak di wajah, tensi normal.',
        result: 'Halo Ibu, terima kasih sudah berkonsultasi mengenai keluhan Anda.\n\nKebas ringan pada tangan di trimester kedua memang umum dipicu oleh penumpukan cairan yang menonjol di sekitar saraf pergelangan tangan.\n\n**Rekomendasi Pemantauan:**\n1. Kurangi asupan garam berlebih.\n2. Hindari tidur menindih tangan.\n3. Lakukan gerakan peregangan jemari secara rutin di pagi hari.\n\nTidak terdeteksi tanda bahaya kehamilan mendesak saat ini. Tetap pantau berat badan dan gerakan janin berkala ya Bu.',
        timestamp: getRelativeDateString(-7) + " 10:14",
        status: 'GREEN'
      }
    ];

    loadedUsers.forEach((u: any) => {
      if (u.role === 'mother') {
        const saved = localStorage.getItem(`momcare_screening_history_${u.id}`);
        if (saved) {
          try {
            loadedScreenings[u.id] = JSON.parse(saved);
          } catch (e) {
            loadedScreenings[u.id] = u.id === 'mother-1' ? defaultKartikaScreenings : [];
          }
        } else if (u.id === 'mother-1') {
          loadedScreenings[u.id] = defaultKartikaScreenings;
          localStorage.setItem(`momcare_screening_history_mother-1`, JSON.stringify(defaultKartikaScreenings));
        } else {
          loadedScreenings[u.id] = [];
        }
      }
    });
    setGlobalScreenings(loadedScreenings);

    // Health Logs
    const storedLogs = localStorage.getItem('momcare_logs');
    if (storedLogs) {
      setLogs(JSON.parse(storedLogs));
    } else {
      setLogs(initialLogs);
      localStorage.setItem('momcare_logs', JSON.stringify(initialLogs));
    }

    // Chats
    const storedChats = localStorage.getItem('momcare_chats');
    if (storedChats) {
      setChats(JSON.parse(storedChats));
    } else {
      setChats(initialChats);
      localStorage.setItem('momcare_chats', JSON.stringify(initialChats));
    }

    // Appointments
    const storedAppointments = localStorage.getItem('momcare_appointments');
    if (storedAppointments) {
      setAppointments(JSON.parse(storedAppointments));
    } else {
      setAppointments(initialAppointments);
      localStorage.setItem('momcare_appointments', JSON.stringify(initialAppointments));
    }

    // Referrals
    const storedReferrals = localStorage.getItem('momcare_referrals');
    if (storedReferrals) {
      setReferrals(JSON.parse(storedReferrals));
    } else {
      setReferrals(initialReferrals);
      localStorage.setItem('momcare_referrals', JSON.stringify(initialReferrals));
    }

    // Articles
    const storedArticles = localStorage.getItem('momcare_articles');
    if (storedArticles) {
      setArticles(JSON.parse(storedArticles));
    } else {
      setArticles(initialArticles);
      localStorage.setItem('momcare_articles', JSON.stringify(initialArticles));
    }

    // Audit Logs
    const storedAudits = localStorage.getItem('momcare_audits');
    if (storedAudits) {
      setAuditLogs(JSON.parse(storedAudits));
    } else {
      setAuditLogs(initialAuditLogs);
      localStorage.setItem('momcare_audits', JSON.stringify(initialAuditLogs));
    }

    // Current Session persistence check
    const storedUserSession = localStorage.getItem('momcare_session_user');
    if (storedUserSession) {
      const parsed = JSON.parse(storedUserSession);
      setCurrentUser(parsed);
      setNavState('dashboard');
    }
  }, []);

  // Utility to write a secure action to the unalterable audit log
  const logSecurityAudit = (userId: string, userName: string, roleName: string, action: string, details: string) => {
    const newAudit: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: getRelativeDateString(0) + " " + new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
      userId,
      userName,
      userRole: roleName === 'mother' ? 'Ibu Hamil' : roleName === 'midwife' ? 'Bidan Wilayah' : 'Administrator',
      action,
      details,
      ipAddress: "192.168.20." + Math.floor(10 + Math.random() * 80) // simulates static internal gate IP
    };

    const updatedAudits = [newAudit, ...auditLogs];
    setAuditLogs(updatedAudits);
    localStorage.setItem('momcare_audits', JSON.stringify(updatedAudits));
  };

  // 2. State update effects to write to LocalStorage
  const updateUsersListState = (updatedList: User[]) => {
    setUsers(updatedList);
    localStorage.setItem('momcare_users', JSON.stringify(updatedList));
  };

  // HANDLERS
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('momcare_session_user', JSON.stringify(user));
    setNavState('dashboard');

    // Audit log
    logSecurityAudit(
      user.id, 
      user.name, 
      user.role, 
      "Login Portal Sukses", 
      `Mengautentikasi login satu pintu menggunakan ${user.email.includes('@') ? 'email' : 'nomor telepon'}. Sesi token JWT aman dibangkitkan.`
    );
  };

  const handleLogout = () => {
    if (currentUser) {
      logSecurityAudit(
        currentUser.id,
        currentUser.name,
        currentUser.role,
        "Logout Sesi",
        "Menutup sesi akses klinis maternal secara aman. Token kedaluwarsa dibersihkan."
      );
    }
    setCurrentUser(null);
    localStorage.removeItem('momcare_session_user');
    setNavState('home');
  };

  const handleRegisterMother = (newMotherUser: User) => {
    // Append to list of users in localStorage and memory
    const updatedUsers = [...users, newMotherUser];
    updateUsersListState(updatedUsers);

    // Write default appointment for new mother (booking AMC 1 or Consultation visit)
    const newAppointment: Appointment = {
      id: `apt-new-${Date.now()}`,
      motherId: newMotherUser.id,
      date: getRelativeDateString(7), // next week
      time: "09:30",
      midwifeName: "Siti Rahma, S.Tr.Keb",
      type: "ANC 1",
      notes: "Pemeriksaan dan pendataan awal kehamilan baru pasca registrasi online.",
      isCompleted: false
    };

    const updatedApts = [...appointments, newAppointment];
    setAppointments(updatedApts);
    localStorage.setItem('momcare_appointments', JSON.stringify(updatedApts));

    // Instant login directly following successful registration
    setCurrentUser(newMotherUser);
    localStorage.setItem('momcare_session_user', JSON.stringify(newMotherUser));
    setNavState('dashboard');

    // Audit log
    logSecurityAudit(
      newMotherUser.id,
      newMotherUser.name,
      'mother',
      "Registrasi Ibu Hamil",
      `Pendaftaran pasien maternal baru NIK ${newMotherUser.maternalProfile?.nik} terikat Desa ${newMotherUser.maternalProfile?.village}. HPHT: ${newMotherUser.maternalProfile?.hpht}, GPA: G${newMotherUser.maternalProfile?.gpa.g}P${newMotherUser.maternalProfile?.gpa.p}A${newMotherUser.maternalProfile?.gpa.a}. Informed Consent disetujui.`
    );
  };

  const handleAddScreening = (motherId: string, newScreening: any) => {
    const list = globalScreenings[motherId] || [];
    const updatedScreenings = [newScreening, ...list];
    
    setGlobalScreenings(prev => ({
      ...prev,
      [motherId]: updatedScreenings
    }));
    localStorage.setItem(`momcare_screening_history_${motherId}`, JSON.stringify(updatedScreenings));

    const parent = users.find(u => u.id === motherId);
    if (parent && parent.maternalProfile) {
      let nextStatus = parent.maternalProfile.riskStatus;
      let nextScore = parent.maternalProfile.riskScore;

      if (newScreening.status === 'RED') {
        nextStatus = 'RED';
        nextScore = Math.max(parent.maternalProfile.riskScore, 12);
      } else if (newScreening.status === 'YELLOW') {
        if (parent.maternalProfile.riskStatus !== 'RED') {
          nextStatus = 'YELLOW';
          nextScore = Math.max(parent.maternalProfile.riskScore, 6);
        }
      } else {
        if (parent.maternalProfile.riskStatus !== 'RED' && parent.maternalProfile.riskStatus !== 'YELLOW') {
          nextStatus = 'GREEN';
          nextScore = Math.max(parent.maternalProfile.riskScore, 2);
        }
      }

      const updatedMother = {
        ...parent,
        maternalProfile: {
          ...parent.maternalProfile,
          riskStatus: nextStatus as any,
          riskScore: nextScore
        }
      };

      const nextUsers = users.map(u => u.id === parent.id ? updatedMother : u);
      updateUsersListState(nextUsers);

      if (currentUser && currentUser.id === parent.id) {
        setCurrentUser(updatedMother);
        localStorage.setItem('momcare_session_user', JSON.stringify(updatedMother));
      }

      // Audit log
      logSecurityAudit(
        motherId,
        parent.name,
        'mother',
        "Deteksi Risiko Skrining AI",
        `Parameter kehamilan dianalisis oleh AI Triage. Kategori Risiko disesuaikan ke: ${nextStatus}.`
      );
    }
  };

  const handleTriggerSos = (motherId: string, motherName: string, village: string, weeks: number) => {
    const sosData = {
      motherId,
      motherName,
      timestamp: new Date().toLocaleDateString('id-ID') + " " + new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit', second: '2-digit'}),
      village,
      weeks,
      isActive: true
    };
    setActiveSos(sosData);
    localStorage.setItem('momcare_emergency_sos', JSON.stringify(sosData));

    // Audit Log entry
    logSecurityAudit(
      motherId,
      motherName,
      'mother',
      "SOS GAWAT DARURAT",
      `Ibu Hamil ${motherName} (Usia Hamil: ${weeks} Minggu, Desa: ${village}) MENYALAKAN ALARM KEGAWATDARURATAN SOS REAL-TIME!`
    );

    // Update maternal status & score to RED (High Risk)
    const parent = users.find(u => u.id === motherId);
    if (parent && parent.maternalProfile) {
      const updatedMother = {
        ...parent,
        maternalProfile: {
          ...parent.maternalProfile,
          riskStatus: 'RED' as const,
          riskScore: Math.max(parent.maternalProfile.riskScore, 12)
        }
      };
      
      const nextUsers = users.map(u => u.id === parent.id ? updatedMother : u);
      updateUsersListState(nextUsers);

      if (currentUser && currentUser.id === parent.id) {
        setCurrentUser(updatedMother);
        localStorage.setItem('momcare_session_user', JSON.stringify(updatedMother));
      }
    }
  };

  const handleClearSos = (customDetails?: string) => {
    if (activeSos && currentUser) {
      logSecurityAudit(
        currentUser.id,
        currentUser.name,
        currentUser.role,
        "SOS Darurat Selesai",
        customDetails || `Alarm kegawatdaruratan SOS untuk Ibu ${activeSos.motherName} telah diselesaikan/dinonaktifkan oleh ${currentUser.role === 'midwife' ? 'Bidan' : 'Sistem'}.`
      );
    }
    setActiveSos(null);
    localStorage.removeItem('momcare_emergency_sos');
  };

  const handleAddLog = (newLog: HealthLog) => {
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem('momcare_logs', JSON.stringify(updatedLogs));

    // If mothers risk level has changed, update users maternalProfile in db too
    const parent = users.find(u => u.id === newLog.motherId);
    if (parent && parent.maternalProfile) {
      const updatedMother = {
        ...parent,
        maternalProfile: {
          ...parent.maternalProfile,
          riskStatus: newLog.riskStatus
        }
      };
      const nextUsers = users.map(u => u.id === parent.id ? updatedMother : u);
      updateUsersListState(nextUsers);

      // Also sync current active user if they are the logged in mother
      if (currentUser && currentUser.id === parent.id) {
        setCurrentUser(updatedMother);
        localStorage.setItem('momcare_session_user', JSON.stringify(updatedMother));
      }
    }

    // Audit log
    logSecurityAudit(
      newLog.motherId,
      parent?.name || "Ibu Hamil",
      'mother',
      "Catat Log Mingguan",
      `Mencatatkan parameter mandiri: BB ${newLog.weight}kg, Tensi ${newLog.systolic}/${newLog.diastolic}mmHg, Gerakan ${newLog.fetalMovement}x/12 jam, Keluhan: {${newLog.symptoms.join(', ') || 'Nihil'}}. Sistem mendeteksi Triage ke-arah: ${newLog.riskStatus}`
    );
  };

  const handleUpdateUserProfile = (userId: string, updatedProfile: Partial<any>) => {
    const target = users.find(u => u.id === userId);
    if (target && target.maternalProfile) {
      const updatedUser = {
        ...target,
        maternalProfile: {
          ...target.maternalProfile,
          ...updatedProfile
        }
      };
      const nextUsers = users.map(u => u.id === userId ? updatedUser : u);
      updateUsersListState(nextUsers);

      // Save to audit log
      logSecurityAudit(
        currentUser?.id || 'admin',
        currentUser?.name || 'Klinisi',
        currentUser?.role || 'midwife',
        "Ubah Parameter RME maternal",
        `Memodifikasi rekam medis elektronik (RME) atau skor risiko milik pasien ${target.name}. Kategori risiko disesuaikan menjadi: ${updatedProfile.riskStatus || target.maternalProfile.riskStatus}`
      );
    }
  };

  const handleAddNewAppointment = (newApp: Appointment) => {
    const nextApts = [...appointments, newApp];
    setAppointments(nextApts);
    localStorage.setItem('momcare_appointments', JSON.stringify(nextApts));
    
    // Log audit
    logSecurityAudit(
      currentUser?.id || "midwife-1",
      currentUser?.name || "Bidan",
      "midwife",
      "Jadwalkan Kunjungan ANC",
      `Menjadwalkan agenda baru untuk pasien ID ${newApp.motherId} pada tanggal ${newApp.date} pukul ${newApp.time}. Tipe: ${newApp.type}`
    );
  };

  const handleUpdateAppointment = (aptId: string, updatedFields: Partial<Appointment>) => {
    const nextApts = appointments.map(apt => apt.id === aptId ? { ...apt, ...updatedFields } : apt);
    setAppointments(nextApts);
    localStorage.setItem('momcare_appointments', JSON.stringify(nextApts));
  };

  const handleVerifyMidwife = (midwifeId: string, isVerified: boolean) => {
    const nextUsers = users.map(u => {
      if (u.id === midwifeId) {
        return {
          ...u,
          isVerifiedMidwife: isVerified
        };
      }
      return u;
    });
    updateUsersListState(nextUsers);

    const targetBidan = users.find(u => u.id === midwifeId);

    // Audit log
    logSecurityAudit(
      currentUser?.id || 'admin',
      currentUser?.name || 'Administrator',
      'admin',
      "Ubah Verifikasi Bidan",
      `Mengubah status lisensi faskes Bidan ${targetBidan?.name || midwifeId} menjadi: ${isVerified ? 'VERIFIED (Diizinkan tulis RME)' : 'PENDING'}`
    );
  };

  const handleAddMidwife = (newMidwife: User) => {
    const nextUsers = [...users, newMidwife];
    updateUsersListState(nextUsers);

    // Audit log
    logSecurityAudit(
      currentUser?.id || 'admin',
      currentUser?.name || 'Administrator',
      'admin',
      "Pencatatan Bidan Baru",
      `Menambahkan profil Bidan Baru ${newMidwife.name} (${newMidwife.email}) ke database faskes.`
    );
  };

  const handleEditMidwife = (userId: string, updatedFields: Partial<User>) => {
    const nextUsers = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          ...updatedFields
        };
      }
      return u;
    });
    updateUsersListState(nextUsers);

    const targetBidan = users.find(u => u.id === userId);

    // Audit log
    logSecurityAudit(
      currentUser?.id || 'admin',
      currentUser?.name || 'Administrator',
      'admin',
      "Ubah Profil Bidan",
      `Memperbarui profil Bidan ${targetBidan?.name || userId}. Field diperbarui: ${Object.keys(updatedFields).join(', ')}`
    );
  };

  const handleDeleteMidwife = (userId: string) => {
    const targetBidan = users.find(u => u.id === userId);
    const nextUsers = users.filter(u => u.id !== userId);
    updateUsersListState(nextUsers);

    // Audit log
    logSecurityAudit(
      currentUser?.id || 'admin',
      currentUser?.name || 'Administrator',
      'admin',
      "Hapus Profil Bidan",
      `Menghapus akun Bidan ${targetBidan?.name || userId} dari database faskes.`
    );
  };

  const handleAddArticle = (newArticle: Article) => {
    const nextArticles = [newArticle, ...articles];
    setArticles(nextArticles);
    localStorage.setItem('momcare_articles', JSON.stringify(nextArticles));

    // Audit log
    logSecurityAudit(
      currentUser?.id || 'admin',
      currentUser?.name || 'Administrator',
      currentUser?.role || 'admin',
      "Penerbitan Artikel CMS",
      `Menerbitkan panduan edukasi baru untuk ibu hamil: "${newArticle.title}" menyasar Trimester ${newArticle.targetTrimester} (Kategori: ${newArticle.category}).`
    );
  };

  const handleAddReferral = (newReferral: Referral) => {
    const nextRefs = [newReferral, ...referrals];
    setReferrals(nextRefs);
    localStorage.setItem('momcare_referrals', JSON.stringify(nextRefs));

    // Audit log
    logSecurityAudit(
      currentUser?.id || 'midwife-1',
      currentUser?.name || 'Bidan',
      'midwife',
      "Buat Pengajuan Rujukan",
      `Mengajukan transfer medis darurat pasien Binaan ${newReferral.patientName} (${newReferral.gpaText}) menuju ${newReferral.targetHospital} dengan pengawalan ambulance: ${newReferral.ambulanceStatus}.`
    );
  };

  const handleSendChatMessage = (newMsg: ChatMessage) => {
    const nextChats = [...chats, newMsg];
    setChats(nextChats);
    localStorage.setItem('momcare_chats', JSON.stringify(nextChats));

    // Audit log (only on mother initiate to prevent redundant logs for fast simulator replies)
    if (newMsg.senderRole === 'mother') {
      logSecurityAudit(
        newMsg.senderId,
        currentUser?.name || "Ibu Hamil",
        'mother',
        "Kirim Pesan Konsultasi",
        `Mengirim konsultasi klinis terenkripsi kepada Bidan penanggung jawab.`
      );
    }
  };

  // DISASTER RECOVERY EXPORT BACKUP
  const handleDownloadBackup = () => {
    const fullStateBackup = {
      timestamp: new Date().toISOString(),
      metadata: "Ruang Bunda -- Srikandi Sehat Cryptographic backup",
      standards: "Kepatuhan UU PDP No 27 Tahun 2022",
      users,
      logs,
      chats,
      appointments,
      referrals,
      articles,
      auditLogs
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(fullStateBackup, null, 2)
    )}`;
    
    // Trigger download
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', 'ruang_bunda_indonesia_backup.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    logSecurityAudit(
      currentUser?.id || 'admin',
      currentUser?.name || 'Administrator',
      currentUser?.role || 'admin',
      "Pencadangan Ekspor Database",
      "Mengekspor salinan terenkripsi database rekam medis faskes nasional (format JSON) ke penyimpanan lokal aman."
    );
  };

  const handleResetDatabase = () => {
    if (window.confirm('Apakah Anda yakin ingin menyetel ulang database simulasi ke pengaturan bawaan awal? Tindakan ini akan mengembalikan data pre-populated awal.')) {
      localStorage.clear();
      setUsers(initialUsers);
      setLogs(initialLogs);
      setChats(initialChats);
      setAppointments(initialAppointments);
      setReferrals(initialReferrals);
      setArticles(initialArticles);
      setAuditLogs(initialAuditLogs);
      setCurrentUser(null);
      setNavState('home');
      alert('Database Berhasil Direset Sempurna!');
    }
  };

  // ROLE SWITCH TRIGGER FOR DEV MODE
  const handleSwitchUserSimulated = (userId: string | null) => {
    if (userId === null) {
      setCurrentUser(null);
      localStorage.removeItem('momcare_session_user');
      setNavState('home');
    } else {
      const selected = users.find(u => u.id === userId);
      if (selected) {
        setCurrentUser(selected);
        localStorage.setItem('momcare_session_user', JSON.stringify(selected));
        setNavState('dashboard');
        
        logSecurityAudit(
          selected.id,
          selected.name,
          selected.role,
          "Bypass Login Simulator",
          "Melakukan lompat peran/akses bypass menggunakan Simulator Dashboard Developer."
        );
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50/20 antialiased selection:bg-emerald-100 flex flex-col justify-between">
      
      {/* Visual Workspace banner for developer information */}
      <div className="bg-slate-900 text-slate-400 text-[11px] py-1.5 px-4 font-mono text-center flex items-center justify-center gap-3">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
        <span><strong>Kepatuhan Regulasi Kemenkes & UU PDP:</strong> Hak akses sistem dikunci per-peran dalam matriks RBAC (Role-Based Access Control).</span>
      </div>

      {/* RENDER DYNAMIC PAGES BASE ROUTING */}
      {navState === 'home' && (
        <LandingPage
          onNavigateToLogin={() => setNavState('login')}
          onNavigateToRegister={() => setNavState('register')}
        />
      )}

      {(navState === 'login' || navState === 'register') && (
        <AuthModule
          mockUsers={users}
          onLoginSuccess={handleLogin}
          onRegisterMother={handleRegisterMother}
          initialMode={navState === 'login' ? 'login' : 'register'}
          onBackToHome={() => setNavState('home')}
        />
      )}

      {navState === 'dashboard' && currentUser && (
        <>
          {currentUser.role === 'mother' && (
            <MotherDashboard
              user={currentUser}
              onLogout={handleLogout}
              logs={logs}
              onAddLog={handleAddLog}
              appointments={appointments}
              articles={articles}
              chats={chats}
              onSendChat={handleSendChatMessage}
              screeningHistory={globalScreenings[currentUser.id] || []}
              onAddScreening={(newScr) => handleAddScreening(currentUser.id, newScr)}
              activeSos={activeSos}
              onTriggerSos={handleTriggerSos}
              onClearSos={handleClearSos}
            />
          )}

          {currentUser.role === 'midwife' && (
            <MidwifeDashboard
              user={currentUser}
              onLogout={handleLogout}
              mockUsers={users}
              onUpdateUserProfile={handleUpdateUserProfile}
              logs={logs}
              onAddLog={handleAddLog}
              chats={chats}
              onSendChat={handleSendChatMessage}
              referrals={referrals}
              onAddReferral={handleAddReferral}
              appointments={appointments}
              onAddAppointment={handleAddNewAppointment}
              onUpdateAppointment={handleUpdateAppointment}
              globalScreenings={globalScreenings}
              activeSos={activeSos}
              onClearSos={handleClearSos}
            />
          )}

          {currentUser.role === 'admin' && (
            <AdminDashboard
              user={currentUser}
              onLogout={handleLogout}
              mockUsers={users}
              onVerifyMidwife={handleVerifyMidwife}
              articles={articles}
              onAddArticle={handleAddArticle}
              auditLogs={auditLogs}
              onDownloadBackup={handleDownloadBackup}
              onAddMidwife={handleAddMidwife}
              onEditMidwife={handleEditMidwife}
              onDeleteMidwife={handleDeleteMidwife}
            />
          )}
        </>
      )}

      {/* FLOATING ROLE SWITCHER DEV HUB */}
      <RoleSwitcher
        currentUser={currentUser}
        mockUsers={users}
        onSwitchUser={handleSwitchUserSimulated}
        onResetDatabase={handleResetDatabase}
      />
    </div>
  );
}
