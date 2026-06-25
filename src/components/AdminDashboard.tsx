/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Shield, Users, BookOpen, Key, Activity, ShieldAlert, FileText, Database,
  Download, ArrowUpRight, CheckCircle2, XCircle, Search, ToggleLeft, ToggleRight, LogOut,
  Plus, Trash2, Edit2, Check, X
} from 'lucide-react';
import { User, Article, AuditLog } from '../types';
import { getRelativeDateString } from '../data/initialData';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  mockUsers: User[];
  onVerifyMidwife: (userId: string, isVerified: boolean) => void;
  articles: Article[];
  onAddArticle: (newArticle: Article) => void;
  auditLogs: AuditLog[];
  onDownloadBackup: () => void;
  onAddMidwife: (newMidwife: User) => void;
  onEditMidwife: (userId: string, updatedFields: Partial<User>) => void;
  onDeleteMidwife: (userId: string) => void;
}

export default function AdminDashboard({
  user,
  onLogout,
  mockUsers,
  onVerifyMidwife,
  articles,
  onAddArticle,
  auditLogs,
  onDownloadBackup,
  onAddMidwife,
  onEditMidwife,
  onDeleteMidwife
}: AdminDashboardProps) {
  
  // STATES
  const [activeMenu, setActiveMenu] = useState<'analytics' | 'users' | 'cms' | 'security' | 'accounts'>('analytics');

  // USER ACCOUNTS GENERIC CRUD STATES
  const [accShowForm, setAccShowForm] = useState(false);
  const [accEditingUserId, setAccEditingUserId] = useState<string | null>(null);
  const [accIdToDelete, setAccIdToDelete] = useState<string | null>(null);
  const [accSearchQuery, setAccSearchQuery] = useState('');
  const [accFilterRole, setAccFilterRole] = useState<'all' | 'mother' | 'midwife' | 'admin'>('all');

  // Input fields for Account CRUD
  const [accName, setAccName] = useState('');
  const [accEmail, setAccEmail] = useState('');
  const [accPhone, setAccPhone] = useState('');
  const [accRole, setAccRole] = useState<'mother' | 'midwife' | 'admin'>('mother');
  
  // Under role 'mother' specific fields
  const [accNik, setAccNik] = useState('');
  const [accBloodType, setAccBloodType] = useState('O');
  const [accVillage, setAccVillage] = useState('Mekar Sari');
  const [accGestationalWeeks, setAccGestationalWeeks] = useState(12);
  const [accRiskStatus, setAccRiskStatus] = useState<'GREEN' | 'YELLOW' | 'RED'>('GREEN');
  const [accHpht, setAccHpht] = useState(new Date().toISOString().split('T')[0]);
  const [accG, setAccG] = useState(1);
  const [accP, setAccP] = useState(0);
  const [accA, setAccA] = useState(0);

  // Under role 'midwife' specific fields
  const [accIsVerifiedMidwife, setAccIsVerifiedMidwife] = useState(true);

  const resetAccountForm = () => {
    setAccName('');
    setAccEmail('');
    setAccPhone('');
    setAccRole('mother');
    setAccNik('');
    setAccBloodType('O');
    setAccVillage('Mekar Sari');
    setAccGestationalWeeks(12);
    setAccRiskStatus('GREEN');
    setAccHpht(new Date().toISOString().split('T')[0]);
    setAccG(1);
    setAccP(0);
    setAccA(0);
    setAccIsVerifiedMidwife(true);
    setAccEditingUserId(null);
    setAccShowForm(false);
  };

  const handleSelectEditAccount = (u: User) => {
    setAccEditingUserId(u.id);
    setAccName(u.name);
    setAccEmail(u.email);
    setAccPhone(u.phone);
    setAccRole(u.role);
    if (u.role === 'mother' && u.maternalProfile) {
      setAccNik(u.maternalProfile.nik || '');
      setAccBloodType(u.maternalProfile.bloodType || 'O');
      setAccVillage(u.maternalProfile.village || 'Mekar Sari');
      setAccGestationalWeeks(u.maternalProfile.gestationalWeeks || 12);
      setAccRiskStatus(u.maternalProfile.riskStatus || 'GREEN');
      setAccHpht(u.maternalProfile.hpht || new Date().toISOString().split('T')[0]);
      setAccG(u.maternalProfile.gpa?.g ?? 1);
      setAccP(u.maternalProfile.gpa?.p ?? 0);
      setAccA(u.maternalProfile.gpa?.a ?? 0);
    } else if (u.role === 'midwife') {
      setAccIsVerifiedMidwife(!!u.isVerifiedMidwife);
    }
    setAccShowForm(true);
  };

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName || !accEmail || !accPhone) {
      return;
    }

    const calculatedHpl = (hphtDateStr: string) => {
      try {
        const d = new Date(hphtDateStr);
        d.setDate(d.getDate() + 280);
        return d.toISOString().split('T')[0];
      } catch (err) {
        return new Date().toISOString().split('T')[0];
      }
    };

    const maternalProfileData = accRole === 'mother' ? {
      nik: accNik.trim() || Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString(),
      bloodType: accBloodType,
      emergencyContact: {
        name: "Suami Pasien",
        phone: "08" + Math.floor(100000000 + Math.random() * 900000000),
        relation: "Suami"
      },
      hpht: accHpht,
      hpl: calculatedHpl(accHpht),
      gestationalWeeks: Number(accGestationalWeeks),
      gpa: {
        g: Number(accG),
        p: Number(accP),
        a: Number(accA),
      },
      comorbidities: [],
      village: accVillage,
      riskScore: accRiskStatus === 'GREEN' ? 2 : accRiskStatus === 'YELLOW' ? 6 : 10,
      riskStatus: accRiskStatus,
      fundusHeightHistory: [],
      labHistory: []
    } : undefined;

    if (accEditingUserId) {
      // Update
      const updatedFields: Partial<User> = {
        name: accName.trim(),
        email: accEmail.trim(),
        phone: accPhone.trim(),
        role: accRole,
        maternalProfile: accRole === 'mother' ? maternalProfileData : undefined,
        isVerifiedMidwife: accRole === 'midwife' ? accIsVerifiedMidwife : undefined,
      };

      onEditMidwife(accEditingUserId, updatedFields);
    } else {
      // Create
      const newId = accRole === 'mother' ? `mother-${Date.now()}` : accRole === 'midwife' ? `midwife-${Date.now()}` : `admin-${Date.now()}`;
      const newUserObj: User = {
        id: newId,
        name: accName.trim(),
        email: accEmail.trim(),
        phone: accPhone.trim(),
        role: accRole,
        isVerifiedMidwife: accRole === 'midwife' ? accIsVerifiedMidwife : undefined,
        maternalProfile: maternalProfileData
      };

      onAddMidwife(newUserObj);
    }

    resetAccountForm();
  };
  
  // MIDWIFE ADM STATES
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMidwifeId, setEditingMidwifeId] = useState<string | null>(null);
  const [midwifeIdToDelete, setMidwifeIdToDelete] = useState<string | null>(null);

  // Form Fields State
  const [midwifeName, setMidwifeName] = useState('');
  const [midwifeEmail, setMidwifeEmail] = useState('');
  const [midwifePhone, setMidwifePhone] = useState('');
  const [midwifeSipb, setMidwifeSipb] = useState('SIPB-' + Math.floor(1980 + Math.random() * 45) + '/446/V-' + Math.floor(2010 + Math.random() * 15));
  const [midwifeIsVerified, setMidwifeIsVerified] = useState(true);

  // CMS STATE
  const [newTitle, setNewTitle] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'Gizi' | 'Kehamilan' | 'Persalinan' | 'Bayi Baru Lahir'>('Gizi');
  const [newTrimester, setNewTrimester] = useState(2);
  const [cmsSuccess, setCmsSuccess] = useState(false);

  // SECURITY AUDIT SEARCH
  const [searchAuditQuery, setSearchAuditQuery] = useState('');

  // RBAC MATRIX SIMULATION STATE
  const [rbacMatrix, setRbacMatrix] = useState({
    admin: { rme: false, cms: true, audit: true, userVer: true },
    midwife: { rme: true, cms: false, audit: false, userVer: false },
    mother: { rme: false, cms: false, audit: false, userVer: false }, // only can read own, write own logs
  });

  const handleToggleRbac = (role: 'admin' | 'midwife' | 'mother', privilege: 'rme' | 'cms' | 'audit' | 'userVer') => {
    setRbacMatrix({
      ...rbacMatrix,
      [role]: {
        ...rbacMatrix[role],
        [privilege]: !rbacMatrix[role][privilege]
      }
    });
  };

  // HANDLERS
  const handleCmsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newExcerpt || !newContent) return;

    const cmsArticle: Article = {
      id: `art-${Date.now()}`,
      title: newTitle.trim(),
      excerpt: newExcerpt.trim(),
      content: newContent.trim(),
      category: newCategory,
      targetTrimester: Number(newTrimester),
      author: user.name,
      publishedAt: getRelativeDateString(0)
    };

    onAddArticle(cmsArticle);
    setCmsSuccess(true);
    setNewTitle('');
    setNewExcerpt('');
    setNewContent('');

    setTimeout(() => {
      setCmsSuccess(false);
      setActiveMenu('cms');
    }, 1800);
  };

  const handleAddNewMidwifeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!midwifeName || !midwifeEmail || !midwifePhone) return;

    const newMidwifeObj: User = {
      id: `midwife-${Date.now()}`,
      name: midwifeName.trim(),
      email: midwifeEmail.trim(),
      phone: midwifePhone.trim(),
      role: 'midwife',
      isVerifiedMidwife: midwifeIsVerified,
    };

    onAddMidwife(newMidwifeObj);
    
    // reset form
    setMidwifeName('');
    setMidwifeEmail('');
    setMidwifePhone('');
    setMidwifeSipb('SIPB-' + Math.floor(1980 + Math.random() * 45) + '/446/V-' + Math.floor(2010 + Math.random() * 15));
    setMidwifeIsVerified(true);
    setShowAddForm(false);
  };

  const handleStartEditMidwife = (mid: User) => {
    setEditingMidwifeId(mid.id);
    setMidwifeName(mid.name);
    setMidwifeEmail(mid.email);
    setMidwifePhone(mid.phone);
    setMidwifeIsVerified(!!mid.isVerifiedMidwife);
  };

  const handleSaveEditMidwife = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMidwifeId || !midwifeName || !midwifeEmail || !midwifePhone) return;

    onEditMidwife(editingMidwifeId, {
      name: midwifeName.trim(),
      email: midwifeEmail.trim(),
      phone: midwifePhone.trim(),
      isVerifiedMidwife: midwifeIsVerified,
    });

    // reset
    setEditingMidwifeId(null);
    setMidwifeName('');
    setMidwifeEmail('');
    setMidwifePhone('');
  };

  const handleCancelEditOrAdd = () => {
    setEditingMidwifeId(null);
    setShowAddForm(false);
    setMidwifeName('');
    setMidwifeEmail('');
    setMidwifePhone('');
  };

  // ANALYTICS DATA COMPILATION
  // 1. Regional distribution of risk (Green, Yellow, Red)
  const redCount = mockUsers.filter(u => u.maternalProfile?.riskStatus === 'RED').length;
  const yellowCount = mockUsers.filter(u => u.maternalProfile?.riskStatus === 'YELLOW').length;
  const greenCount = mockUsers.filter(u => u.maternalProfile?.riskStatus === 'GREEN').length;

  const riskPieData = [
    { name: 'Risiko Rendah (Normal)', value: greenCount || 1, color: '#10b981' },
    { name: 'Risiko Sedang', value: yellowCount || 1, color: '#f59e0b' },
    { name: 'Risiko Tinggi', value: redCount || 1, color: '#f43f5e' }
  ];

  // 2. ANC month compliance tracking chart
  const ancComplianceData = [
    { name: 'Januari', 'Target Sasaran': 94, 'Realisasi Capaian': 88 },
    { name: 'Februari', 'Target Sasaran': 95, 'Realisasi Capaian': 91 },
    { name: 'Maret', 'Target Sasaran': 95, 'Realisasi Capaian': 90 },
    { name: 'April', 'Target Sasaran': 96, 'Realisasi Capaian': 93 },
    { name: 'Mei', 'Target Sasaran': 98, 'Realisasi Capaian': 97 },
    { name: 'Juni', 'Target Sasaran': 98, 'Realisasi Capaian': 98 }
  ];

  // Separating midwives and clinic profiles
  const midwives = mockUsers.filter(u => u.role === 'midwife');
  const mothersCount = mockUsers.filter(u => u.role === 'mother').length;

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter(log => 
    log.userName.toLowerCase().includes(searchAuditQuery.toLowerCase()) || 
    log.action.toLowerCase().includes(searchAuditQuery.toLowerCase()) || 
    log.details.toLowerCase().includes(searchAuditQuery.toLowerCase())
  ).sort((a,b) => b.timestamp.localeCompare(a.timestamp));

  // Filter user accounts for generic CRUD management
  const filteredUsers = mockUsers.filter(u => {
    if (accFilterRole !== 'all' && u.role !== accFilterRole) return false;
    const q = accSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) ||
      (u.maternalProfile?.nik && u.maternalProfile.nik.includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-left">
      
      {/* Top Admin Header */}
      <header className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-30 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-650 rounded-xl text-white">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold font-display leading-tight">{user.name}</h1>
            <p className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">Administrator Faskes & Dinkes</p>
          </div>
        </div>

        {/* Admin Menu Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMenu('analytics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display tracking-wider ${
              activeMenu === 'analytics' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            📊 Health Analytics
          </button>
          <button
            onClick={() => setActiveMenu('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display tracking-wider ${
              activeMenu === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            👥 Verifikasi Bidan
          </button>
          <button
            onClick={() => setActiveMenu('accounts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display tracking-wider ${
              activeMenu === 'accounts' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            ⚙️ Kelola Akun (CRUD)
          </button>
          <button
            onClick={() => setActiveMenu('cms')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display tracking-wider ${
              activeMenu === 'cms' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            ✍️ CMS Artikel
          </button>
          <button
            onClick={() => setActiveMenu('security')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display tracking-wider ${
              activeMenu === 'security' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            🔒 Audit Log PDP
          </button>

          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-rose-500 rounded-lg"
            title="Log Out Administrator"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
        
        {/* VIEW 1: HEALTHCARE INTELLIGENCE / MACRO ANALYTICS */}
        {activeMenu === 'analytics' && (
          <div className="space-y-6">
            
            {/* Health indicators headline */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-150 text-left">
                <span className="text-[10px] font-mono text-gray-400 block uppercase font-bold">Ibu Hamil Terbina</span>
                <strong className="text-3xl font-bold font-mono text-gray-900 block mt-1">{mothersCount} Jiwa</strong>
                <span className="text-[9px] text-emerald-600 font-semibold mt-1 block">✓ 100% Tercatatkan di RME</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-150 text-left">
                <span className="text-[10px] font-mono text-gray-400 block uppercase font-bold">Bidan Binaan Posyandu</span>
                <strong className="text-3xl font-bold font-mono text-gray-900 block mt-1">{midwives.length} bidan</strong>
                <span className="text-[9px] text-indigo-600 font-semibold mt-1 block">Sertifikasi SIPB Terintegrasi</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-150 text-left">
                <span className="text-[10px] font-mono text-gray-400 block uppercase font-bold">Cakupan ANC Nasional</span>
                <strong className="text-3xl font-bold font-mono text-gray-900 block mt-1">98%</strong>
                <span className="text-[9px] text-emerald-600 font-semibold mt-1 block">Sangat Memenuhi Batas Aman WHO</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-150 text-left">
                <span className="text-[10px] font-mono text-gray-400 block uppercase font-bold">Referral Success Rate</span>
                <strong className="text-3xl font-bold font-mono text-gray-900 block mt-1">100%</strong>
                <span className="text-[9px] text-indigo-600 font-semibold mt-1 block">Integrasi Sireg Ambulans Cepat</span>
              </div>
            </div>

            {/* Recharts Grid container */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Monthly ANC Compliance performance (Bar chart) */}
              <div className="md:col-span-8 bg-white p-5 sm:p-6 rounded-2xl border border-gray-150 text-left space-y-4">
                <div>
                  <h3 className="font-bold text-gray-950 text-sm font-display">Tingkat Penjaringan & Kepatuhan ANC (Imunisasi & Lab)</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Analisis tren capaian wilayah Sukamaju terhadap target Kementerian Kesehatan RI</p>
                </div>

                <div className="h-64 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ancComplianceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} iconSize={12} iconType="circle" />
                      <Bar dataKey="Target Sasaran" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Realisasi Capaian" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Triage distribution pie chart */}
              <div className="md:col-span-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-150 text-left flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-950 text-sm font-display">Status Risiko Epidemiologi</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Penyebaran status triage bahaya bumil saat ini</p>
                </div>

                <div className="h-44 relative mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {riskPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 pt-4 border-t border-gray-100 text-[11px]">
                  {riskPieData.map((entry) => (
                    <div key={entry.name} className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: entry.color }} />
                        {entry.name}
                      </span>
                      <strong className="text-gray-900 font-mono">{entry.value} Pasien</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: USER VERIFICATION & ACCESS CONTROL RBAC */}
        {activeMenu === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Midwives credentials verification list (7 cols) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-gray-150 space-y-4 text-left">
              <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h3 className="font-bold text-gray-950 text-sm">Verifikasi Profil Sumpah Bidan</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Memastikan hanya bidan ber-SIPB aktif yang diperkenankan menulis RME</p>
                </div>
                {!showAddForm && !editingMidwifeId && (
                  <button
                    onClick={() => {
                      setShowAddForm(true);
                      setEditingMidwifeId(null);
                      setMidwifeName('');
                      setMidwifeEmail('');
                      setMidwifePhone('');
                      setMidwifeIsVerified(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Bidan Baru
                  </button>
                )}
              </div>

              {/* Form Tambah/Edit Bidan */}
              {(showAddForm || editingMidwifeId) && (
                <div className="p-4 border border-indigo-100 rounded-xl bg-indigo-50/20 space-y-3.5 text-xs animate-fade-in">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-indigo-950 text-xs uppercase tracking-wider">
                      {editingMidwifeId ? 'Ubah Profil/Lisensi Bidan' : 'Mendaftarkan Bidan Baru'}
                    </h4>
                    <button 
                      onClick={handleCancelEditOrAdd}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form 
                    onSubmit={editingMidwifeId ? handleSaveEditMidwife : handleAddNewMidwifeSubmit} 
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Lengkap</label>
                        <input
                          type="text"
                          required
                          placeholder="Bd. Linda Wardani, S.ST"
                          value={midwifeName}
                          onChange={(e) => setMidwifeName(e.target.value)}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Aktif</label>
                        <input
                          type="email"
                          required
                          placeholder="linda@faskes.id"
                          value={midwifeEmail}
                          onChange={(e) => setMidwifeEmail(e.target.value)}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">No. Handphone (WA)</label>
                        <input
                          type="text"
                          required
                          placeholder="08123456789"
                          value={midwifePhone}
                          onChange={(e) => setMidwifePhone(e.target.value)}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Nomor Registrasi SIPB</label>
                        <input
                          type="text"
                          required
                          placeholder="SIPB-1989/446/V-2015"
                          value={midwifeSipb}
                          onChange={(e) => setMidwifeSipb(e.target.value)}
                          className="w-full p-2 border bg-slate-50 text-slate-500 rounded-lg focus:outline-none font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-750 font-bold">
                        <input
                          type="checkbox"
                          checked={midwifeIsVerified}
                          onChange={(e) => setMidwifeIsVerified(e.target.checked)}
                          className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>Sahkan Akun & Berikan Akses RME Seketika?</span>
                      </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={handleCancelEditOrAdd}
                        className="px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-slate-705 rounded-lg font-bold transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all cursor-pointer shadow-sm"
                      >
                        {editingMidwifeId ? 'Simpan Perubahan' : 'Sahkan Bidan'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-3">
                {midwives.map((mid) => (
                  <div key={mid.id} className="p-4 border rounded-xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5 flex-wrap">
                        {mid.name}
                        {mid.isVerifiedMidwife ? (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold font-mono">
                            ✓ TERVERIFIKASI
                          </span>
                        ) : (
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold font-mono">
                            TERTUNDA
                          </span>
                        )}
                      </h4>
                      <p className="text-gray-500 text-[11px] font-mono mt-0.5">Email: {mid.email} &bull; HP: {mid.phone}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-semibold uppercase">Puskesmas Mekar Sari</span>
                        <span className="text-[9.5px] text-gray-400 font-mono">SIPB: {mid.id === 'midwife-1' ? 'SIPB-1989/446/V-2015' : 'SIPB-2022/446/X-2022'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onVerifyMidwife(mid.id, !mid.isVerifiedMidwife)}
                        className={`px-3 py-1 text-[11px] font-bold rounded transition-all cursor-pointer whitespace-nowrap ${
                          mid.isVerifiedMidwife 
                            ? 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {mid.isVerifiedMidwife ? 'Tangguhkan' : 'Sahkan Bidan'}
                      </button>

                      <button
                        onClick={() => handleStartEditMidwife(mid)}
                        className="p-1 px-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded transition-all cursor-pointer flex items-center gap-1"
                        title="Edit Profil"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                        <span>Ubah</span>
                      </button>

                      {midwifeIdToDelete === mid.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-0.5 rounded animate-pulse">
                          <span className="text-[9px] text-rose-700 font-bold px-1">Hapus?</span>
                          <button
                            onClick={() => {
                              onDeleteMidwife(mid.id);
                              setMidwifeIdToDelete(null);
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            Ya
                          </button>
                          <button
                            onClick={() => setMidwifeIdToDelete(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setMidwifeIdToDelete(mid.id)}
                          className="p-1 px-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded transition-all cursor-pointer flex items-center gap-1"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: RBAC Matriks settings toggles (5 cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-150 space-y-4 text-left">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-indigo-600" />
                  Konfigurasi Matriks RBAC
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Membongkar-pasang perizinan sori secara dinamikal</p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Admin block */}
                <div className="border p-3.5 rounded-xl bg-slate-50/50 space-y-2">
                  <span className="font-bold text-[11px] text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded font-mono uppercase">Role: Administrator</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                    <button
                      onClick={() => handleToggleRbac('admin', 'rme')}
                      className={`p-1.5 rounded border text-left flex justify-between items-center font-mono ${rbacMatrix.admin.rme ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-150'}`}
                    >
                      <span>Tulis RME</span>
                      <span>{rbacMatrix.admin.rme ? 'YES' : 'NO'}</span>
                    </button>
                    <button
                      onClick={() => handleToggleRbac('admin', 'cms')}
                      className={`p-1.5 rounded border text-left flex justify-between items-center font-mono ${rbacMatrix.admin.cms ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-150'}`}
                    >
                      <span>Kelola CMS</span>
                      <span>{rbacMatrix.admin.cms ? 'YES' : 'NO'}</span>
                    </button>
                  </div>
                </div>

                {/* Midwife block */}
                <div className="border p-3.5 rounded-xl bg-slate-50/50 space-y-2">
                  <span className="font-bold text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-mono uppercase">Role: Bidan Wilayah</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                    <button
                      onClick={() => handleToggleRbac('midwife', 'rme')}
                      className={`p-1.5 rounded border text-left flex justify-between items-center font-mono ${rbacMatrix.midwife.rme ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-150'}`}
                    >
                      <span>Tulis RME</span>
                      <span>{rbacMatrix.midwife.rme ? 'YES' : 'NO'}</span>
                    </button>
                    <button
                      onClick={() => handleToggleRbac('midwife', 'cms')}
                      className={`p-1.5 rounded border text-left flex justify-between items-center font-mono ${rbacMatrix.midwife.cms ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-150'}`}
                    >
                      <span>Kelola CMS</span>
                      <span>{rbacMatrix.midwife.cms ? 'YES' : 'NO'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 text-slate-300 p-3.5 rounded-xl text-[10px] leading-relaxed">
                  🛡️ <strong>Kunci Pengaman Terintegrasi:</strong> Merubah matrik di atas seketika diterapkan ke reaktivasi token JWT di sisi client-side faskes.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2.5: USER ACCOUNTS CRUD MANAGER */}
        {activeMenu === 'accounts' && (
          <div className="space-y-6 text-left animate-fade-in">
            {/* Header section with summary cards */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-150">
              <div>
                <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-50 text-indigo-750 rounded-lg">⚙️</span>
                  Manajemen & Kredensial Akun Pengguna
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Kelola rekam autentikasi satu pintu, sahkan peran, serta sesuaikan profil klinis faskes secara real-time.
                </p>
              </div>

              {!accShowForm && (
                <button
                  onClick={() => {
                    resetAccountForm();
                    setAccShowForm(true);
                  }}
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Akun Pengguna
                </button>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-450 block font-mono">Total Akun</span>
                <span className="text-2xl font-black text-slate-800 mt-1 block font-mono">{mockUsers.length}</span>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <span className="text-[10px] uppercase font-bold text-blue-700 block font-mono">Bidan Terdaftar</span>
                <span className="text-2xl font-black text-blue-800 mt-1 block font-mono">
                  {mockUsers.filter(u => u.role === 'midwife').length}
                </span>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <span className="text-[10px] uppercase font-bold text-purple-700 block font-mono">Ibu Hamil Terbina</span>
                <span className="text-2xl font-black text-purple-800 mt-1 block font-mono">
                  {mockUsers.filter(u => u.role === 'mother').length}
                </span>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-indigo-300 block font-mono">Administrator</span>
                <span className="text-2xl font-black text-white mt-1 block font-mono">
                  {mockUsers.filter(u => u.role === 'admin').length}
                </span>
              </div>
            </div>

            {/* Account Creator or Editor Form Container */}
            {accShowForm && (
              <div className="bg-white border-2 border-indigo-100 p-6 rounded-2xl shadow-sm space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h3 className="font-bold text-slate-950 text-sm flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-indigo-650 rounded-full"></span>
                      {accEditingUserId ? 'Ubah Informasi Detail Pengguna' : 'Mendaftarkan Akun Pengguna Baru'}
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Seluruh formulir divalidasi ketat berlandaskan aturan hak akses klinis UU PDP.</p>
                  </div>
                  <button
                    onClick={resetAccountForm}
                    className="p-1 text-slate-405 hover:text-slate-705 border rounded-lg transition hover:bg-slate-50 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAccountSubmit} className="space-y-4 text-xs">
                  {/* Basic Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Nama Pengguna (Gelar Lengkap)</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Bd. Siti Rahma, S.Tr.Keb / Ny. Risma"
                        value={accName}
                        onChange={(e) => setAccName(e.target.value)}
                        className="w-full p-2.5 border bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Alamat Email Aktif</label>
                      <input
                        type="email"
                        required
                        placeholder="email@faskes.go.id"
                        value={accEmail}
                        onChange={(e) => setAccEmail(e.target.value)}
                        className="w-full p-2.5 border bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Nomor Telepon Seluler (WA)</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: 081234567890"
                        value={accPhone}
                        onChange={(e) => setAccPhone(e.target.value)}
                        className="w-full p-2.5 border bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                      />
                    </div>
                  </div>

                  {/* Role Row */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Peran Sektor Pengguna (Role)</label>
                      <select
                        value={accRole}
                        onChange={(e) => {
                          const val = e.target.value as 'mother' | 'midwife' | 'admin';
                          setAccRole(val);
                        }}
                        className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold"
                      >
                        <option value="mother">🤰 Ibu Hamil (Pasien Maternal)</option>
                        <option value="midwife">👩‍⚕️ Bidan Wilayah (Petugas Medis)</option>
                        <option value="admin">🛡️ Administrator (Pusat Kendali)</option>
                      </select>
                    </div>

                    {accRole === 'midwife' && (
                      <div className="md:col-span-2 flex items-center h-full pt-1 sm:pt-6">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-750">
                          <input
                            type="checkbox"
                            checked={accIsVerifiedMidwife}
                            onChange={(e) => setAccIsVerifiedMidwife(e.target.checked)}
                            className="h-4.5 w-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                          <div>
                            <span className="block text-xs">Sahkan Kredensial Praktik Segera?</span>
                            <span className="block text-[10px] text-gray-400 font-normal">Mengizinkan bidan login untuk mengisi RME & asuhan kebidanan.</span>
                          </div>
                        </label>
                      </div>
                    )}

                    {accRole === 'admin' && (
                      <div className="md:col-span-2 flex items-center h-full text-slate-500 text-[10.5px] pt-1 sm:pt-6 leading-relaxed">
                        ⚠️ <strong>Perhatian:</strong> Peran administrator faskes memiliki wewenang penuh untuk melihat audit logs, mengunduh backup basis data terenkripsi, serta mendelegasikan akses RME global.
                      </div>
                    )}
                  </div>

                  {/* Mother-specific Maternal Profile Fields */}
                  {accRole === 'mother' && (
                    <div className="p-4 border border-rose-100 rounded-xl bg-rose-50/5/10 space-y-4">
                      <h4 className="font-bold text-rose-950 text-[11px] uppercase tracking-wider flex items-center gap-1">
                        <span>🤰</span> Profil Maternal Kedokteran (Pasien Ibu Hamil)
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-650 mb-1">NIK (Nomor Induk Kependudukan)</label>
                          <input
                            type="text"
                            maxLength={16}
                            placeholder="16 Digit NIK Ibu Hamil"
                            value={accNik}
                            onChange={(e) => setAccNik(e.target.value)}
                            className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-650 mb-1">Golongan Darah</label>
                          <select
                            value={accBloodType}
                            onChange={(e) => setAccBloodType(e.target.value)}
                            className="w-full p-2 border bg-white rounded-lg focus:outline-none text-xs"
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="AB">AB</option>
                            <option value="O">O</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-650 mb-1">Kabinet Desa / Wilayah Binaan</label>
                          <select
                            value={accVillage}
                            onChange={(e) => setAccVillage(e.target.value)}
                            className="w-full p-2 border bg-white rounded-lg focus:outline-none text-xs"
                          >
                            <option value="Mekar Sari">Mekar Sari</option>
                            <option value="Suka Maju">Suka Maju</option>
                            <option value="Cempaka Putih">Cempaka Putih</option>
                            <option value="Duren Jaya">Duren Jaya</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-650 mb-1">Status Tingkat Risiko</label>
                          <select
                            value={accRiskStatus}
                            onChange={(e) => setAccRiskStatus(e.target.value as 'GREEN' | 'YELLOW' | 'RED')}
                            className="w-full p-2 border bg-white rounded-lg focus:outline-none text-xs font-bold"
                          >
                            <option value="GREEN" className="text-emerald-700 font-bold">🟢 RISIKO RENDAH (GREEN)</option>
                            <option value="YELLOW" className="text-amber-700 font-bold">🟡 RISIKO SEDANG (YELLOW)</option>
                            <option value="RED" className="text-rose-700 font-bold">🔴 RISIKO TINGGI (RED)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-650 mb-1">HPHT (Hari Pertama Haid Terakhir)</label>
                          <input
                            type="date"
                            value={accHpht}
                            onChange={(e) => setAccHpht(e.target.value)}
                            className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-650 mb-1">Usia Kehamilan (Minggu)</label>
                          <input
                            type="number"
                            min={1}
                            max={42}
                            value={accGestationalWeeks}
                            onChange={(e) => setAccGestationalWeeks(Number(e.target.value))}
                            className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono"
                          />
                        </div>
                        <div className="md:col-span-2 grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-650 mb-1" title="Gravida (Kehamilan Keberapa)">G (Gravida)</label>
                            <input
                              type="number"
                              min={1}
                              value={accG}
                              onChange={(e) => setAccG(Number(e.target.value))}
                              className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-650 mb-1" title="Para (Kelahiran Hidup)">P (Para)</label>
                            <input
                              type="number"
                              min={0}
                              value={accP}
                              onChange={(e) => setAccP(Number(e.target.value))}
                              className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-650 mb-1" title="Abortus (Keguguran)">A (Abortus)</label>
                            <input
                              type="number"
                              min={0}
                              value={accA}
                              onChange={(e) => setAccA(Number(e.target.value))}
                              className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono text-center"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions footer */}
                  <div className="flex justify-end gap-2.5 pt-3.5 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={resetAccountForm}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
                    >
                      Batal & Kosongkan
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all cursor-pointer shadow-md hover:shadow-lg"
                    >
                      {accEditingUserId ? 'Simpan Perubahan Akun' : 'Daftarkan Akun'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Read: Search, filters, grid view */}
            <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b pb-4">
                <h3 className="font-bold text-slate-900 text-sm">
                  Daftar Kredensial Pengguna Terdaftar ({filteredUsers.length} Jiwa)
                </h3>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {/* Search text filter */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2" />
                    <input
                      type="text"
                      value={accSearchQuery}
                      onChange={(e) => setAccSearchQuery(e.target.value)}
                      placeholder="Cari nama, email, HP, atau NIK..."
                      className="w-full sm:w-56 p-1.5 pl-8 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-505"
                    />
                  </div>

                  {/* Role enum filter */}
                  <div className="flex rounded-lg border overflow-hidden p-0.5 bg-slate-50 text-xs text-slate-600">
                    <button
                      onClick={() => setAccFilterRole('all')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer font-bold select-none text-[10.5px] ${accFilterRole === 'all' ? 'bg-white text-indigo-750 shadow-sm' : 'hover:bg-white/50'}`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setAccFilterRole('mother')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer font-bold select-none text-[10.5px] ${accFilterRole === 'mother' ? 'bg-white text-indigo-750 shadow-sm' : 'hover:bg-white/50'}`}
                    >
                      🤰 Ibu Hamil
                    </button>
                    <button
                      onClick={() => setAccFilterRole('midwife')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer font-bold select-none text-[10.5px] ${accFilterRole === 'midwife' ? 'bg-white text-indigo-750 shadow-sm' : 'hover:bg-white/50'}`}
                    >
                      👩‍⚕️ Bidan
                    </button>
                    <button
                      onClick={() => setAccFilterRole('admin')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer font-bold select-none text-[10.5px] ${accFilterRole === 'admin' ? 'bg-white text-indigo-750 shadow-sm' : 'hover:bg-white/50'}`}
                    >
                      🛡️ Admin
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid / Table list */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-100">
                  <thead>
                    <tr className="bg-slate-50 font-bold uppercase tracking-wider text-slate-600 text-[10px] border-b">
                      <th className="p-3">Nama Lengkap & Kontak Terdaftar</th>
                      <th className="p-3">Sektor Peran (Role)</th>
                      <th className="p-3">Grup Wilayah / Status Medis</th>
                      <th className="p-3 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-400 font-medium">
                          Tidak ditemukan pengguna dengan filter pencarian tersebut.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        // Badge formatting
                        const roleBadges = {
                          admin: 'bg-indigo-50 border-indigo-200 text-indigo-800',
                          midwife: 'bg-emerald-50 border-emerald-200 text-emerald-800',
                          mother: 'bg-rose-50 border-rose-250 text-rose-800'
                        };

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-3 space-y-0.5">
                              <div className="font-bold text-slate-850 text-sm flex items-center gap-1.5">
                                {u.name}
                                {u.id === user.id && (
                                  <span className="text-[9px] bg-slate-900 text-white font-bold p-0.5 px-1.5 rounded-full font-mono uppercase">
                                    SAYA (ADMIN)
                                  </span>
                                )}
                              </div>
                              <div className="text-[10.5px] text-gray-500 font-mono">
                                Email: {u.email} &bull; HP: {u.phone}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`px-2.5 py-1 border rounded-lg text-[10.5px] font-bold uppercase ${roleBadges[u.role] || 'bg-slate-100'}`}>
                                {u.role === 'admin' ? '🛡️ Administrator' : u.role === 'midwife' ? '👩‍⚕️ Bidan Wilayah' : '🤰 Ibu Hamil'}
                              </span>
                            </td>
                            <td className="p-3 text-[11px]">
                              {u.role === 'admin' && (
                                <span className="text-gray-405 italic">Fasilitas Kesehatan Pusat</span>
                              )}

                              {u.role === 'midwife' && (
                                <div className="space-y-0.5">
                                  <div className="text-slate-800 font-medium">SIPB Terintegrasi:</div>
                                  <div className="text-gray-400 text-[10px] font-mono">
                                    {u.id === 'midwife-1' ? 'SIPB-1989/446/V-2015' : 'SIPB-W-REG-AKTIF-' + u.phone.substring(u.phone.length - 4)}
                                  </div>
                                </div>
                              )}

                              {u.role === 'mother' && u.maternalProfile && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <span className="font-mono text-[10px] text-gray-400">NIK: {u.maternalProfile.nik}</span>
                                    <span className="text-slate-450 font-medium">&bull; Desa: {u.maternalProfile.village}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="bg-slate-100 text-slate-700 px-1.5 rounded text-[10px] font-bold font-mono">
                                      {u.maternalProfile.gestationalWeeks} MINGGU
                                    </span>
                                    <span className="bg-slate-100 text-slate-700 px-1.5 rounded text-[10px] font-bold font-mono">
                                      G{u.maternalProfile.gpa?.g}P{u.maternalProfile.gpa?.p}A{u.maternalProfile.gpa?.a}
                                    </span>
                                    <span className={`text-[9.5px] font-bold px-2 py-0.2 rounded font-mono ${
                                      u.maternalProfile.riskStatus === 'RED' ? 'bg-red-100 text-red-800' :
                                      u.maternalProfile.riskStatus === 'YELLOW' ? 'bg-yellow-100 text-yellow-850' : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {u.maternalProfile.riskStatus === 'RED' ? '🔴 TINGGI' :
                                      u.maternalProfile.riskStatus === 'YELLOW' ? '🟡 SEDANG' : '🟢 RENDAH'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex justify-center items-center gap-1.5">
                                <button
                                  onClick={() => handleSelectEditAccount(u)}
                                  className="p-1 px-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition flex items-center gap-1 cursor-pointer font-bold text-[11px]"
                                  title="Ubah Rincian Akun"
                                >
                                  <Edit2 className="w-3 h-3 text-slate-500" />
                                  <span>Ubah</span>
                                </button>

                                {u.id === user.id ? (
                                  <span className="text-[10px] text-gray-300 italic">Protected</span>
                                ) : accIdToDelete === u.id ? (
                                  <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-0.5 rounded-lg animate-pulse text-[10px]">
                                    <span className="text-rose-700 font-bold px-1.5">Siri Hapus Ibu/Bidan?</span>
                                    <button
                                      onClick={() => {
                                        onDeleteMidwife(u.id);
                                        setAccIdToDelete(null);
                                      }}
                                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-0.5 rounded cursor-pointer"
                                    >
                                      Ya
                                    </button>
                                    <button
                                      onClick={() => setAccIdToDelete(null)}
                                      className="bg-slate-250 hover:bg-slate-350 text-slate-800 font-bold px-2 py-0.5 rounded cursor-pointer"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setAccIdToDelete(u.id)}
                                    className="p-1 px-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition flex items-center gap-1 cursor-pointer font-bold text-[11px]"
                                    title="Hapus Akun Pengguna"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Hapus</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: CMS ARTICLES MANAGER */}
        {activeMenu === 'cms' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
            
            {/* Form layout (7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-gray-150 space-y-6">
              <div>
                <h3 className="font-bold text-gray-950 text-base font-display">Komposisi Artikel Edukasi Ibu (CMS)</h3>
                <p className="text-xs text-gray-400 mt-0.5">Gizi seimbang, info ketuban, laktasi, dan perawatan nifas resmi tervalidasi Dokter Faskes.</p>
              </div>

              {cmsSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-semibold">
                  ✓ Sukses Menerbitkan Artikel! Konten baru langsung diposting ke timeline feed ibu hamil sesuai trimesternya.
                </div>
              )}

              <form onSubmit={handleCmsSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Judul Artikel Edukatif</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Contoh: Manfaat Asam Folat Bagi Ibu Trimester Pertama"
                    className="w-full border bg-slate-50 p-2.5 rounded-xl focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1.5">Kategori Medis</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full border bg-slate-50 p-2.5 rounded-xl font-semibold"
                    >
                      <option value="Gizi">Gizi Mikro & Makro</option>
                      <option value="Kehamilan">Fisiologi Kehamilan</option>
                      <option value="Persalinan">Masa Persalinan Aman</option>
                      <option value="Bayi Baru Lahir">Neonatal & Laktasi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1.5">Trimester Sasaran</label>
                    <select
                      value={newTrimester}
                      onChange={(e) => setNewTrimester(Number(e.target.value))}
                      className="w-full border bg-slate-50 p-2.5 rounded-xl"
                    >
                      <option value={1}>Trimester I (Minggu 1-12)</option>
                      <option value={2}>Trimester II (Minggu 13-27)</option>
                      <option value={3}>Trimester III (Minggu 28-Lahir)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1.5">Identitas Penulis Konten</label>
                    <input
                      type="text"
                      className="w-full border bg-slate-100 p-2.5 rounded-xl font-mono"
                      value={user.name}
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Ringkasan Cuplikan (Excerpt)</label>
                  <input
                    type="text"
                    value={newExcerpt}
                    onChange={(e) => setNewExcerpt(e.target.value)}
                    placeholder="Mencakup highlight ringkas artikel untuk tampilan depannya..."
                    className="w-full border bg-slate-50 p-2.5 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1.5 font-display">Teks Artikel Lengkap</label>
                  <textarea
                    rows={5}
                    value={newContent}
                    onChange={(newVal) => setNewContent(newVal.target.value)}
                    className="w-full border bg-slate-50 p-2.5 rounded-xl font-sans"
                    placeholder="Tuliskan petunjuk gizi medis atau tanda bahaya..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition-all shadow"
                >
                  Publikasi & Tayangkan ke Linimasa Bumil
                </button>
              </form>
            </div>

            {/* List entries CMS (5 cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-150 space-y-4">
              <h3 className="font-bold text-gray-950 text-sm">Arsip Edukasi Medis Terbit</h3>
              
              <div className="space-y-3 max-h-[460px] overflow-y-auto">
                {articles.map((art) => (
                  <div key={art.id} className="p-3 border rounded-xl bg-slate-50 text-xs text-left space-y-1">
                    <div className="flex justify-between items-center text-[9px] uppercase font-mono text-gray-400">
                      <span>{art.category} &bull; Trimester {art.targetTrimester}</span>
                      <span>{art.publishedAt}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 line-clamp-1">{art.title}</h4>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{art.excerpt}</p>
                    <div className="pt-1.5 border-t border-gray-200 mt-1.5 text-[10px] text-gray-400 flex justify-between">
                      <span>Oleh Dr. {art.author}</span>
                      <span className="text-emerald-600 font-mono font-bold">TERBIT</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: SECURITY SYSTEM AUDIT LOGS, IP TELEMETRY, & DATA BACKUP */}
        {activeMenu === 'security' && (
          <div className="space-y-6">
            
            {/* Top row backup triggers */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <h3 className="font-bold text-sm">Disaster Recovery & Daily Backups Panel</h3>
                  <p className="text-xs text-slate-450 mt-0.5">Mengarsip salinan inkremental klinis maternal bersandi SHA-256 demi kesiapan darurat.</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onDownloadBackup}
                  className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Backup Enkripsi JSON
                </button>
                <button
                  onClick={() => alert('Simulasi Disaster Recovery Berhasil!\nSeluruh tabel rekam medis PDP dipulihkan dalam 0.4 detik dari backup sore ini.')}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-4 py-2 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
                >
                  🔄 Uji Pemulihan DB
                </button>
              </div>
            </div>

            {/* Audit Logs list panel */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 space-y-4">
              
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 border-b pb-4">
                <div className="text-left">
                  <h3 className="font-bold text-gray-950 text-base font-display">Logs Audit Keamanan RME & Hak Akses (UU PDP)</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Catatan ketat rekam aktivitas klinis yang tidak dapat diubah (immutable logs) demi transparansi kepatuhan hukum data medis.</p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchAuditQuery}
                    onChange={(e) => setSearchAuditQuery(e.target.value)}
                    placeholder="Cari pelaku, IP, atau tindakan..."
                    className="w-full bg-slate-50 border rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Logs loops */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-gray-150">
                  <thead>
                    <tr className="bg-slate-100 font-bold uppercase tracking-wider text-slate-600 text-[9.5px]">
                      <th className="p-3 border">Waspada Waktu (WIB)</th>
                      <th className="p-3 border">Akun Pelaku</th>
                      <th className="p-3 border">Hak Peran</th>
                      <th className="p-3 border">Tindakan Keamanan</th>
                      <th className="p-3 border">Detil Akses & Hasil Medik</th>
                      <th className="p-3 border text-center">Nomor IP Asal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-800 font-mono text-[11px]">
                    {filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="p-3 border text-slate-400 font-semibold">{log.timestamp}</td>
                        <td className="p-3 border font-sans font-bold text-slate-900">{log.userName}</td>
                        <td className="p-3 border font-sans font-semibold text-indigo-700">{log.userRole}</td>
                        <td className="p-3 border text-amber-700 font-bold">{log.action}</td>
                        <td className="p-3 border font-sans text-gray-600 leading-normal">{log.details}</td>
                        <td className="p-3 border text-center font-bold text-slate-500">{log.ipAddress}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
