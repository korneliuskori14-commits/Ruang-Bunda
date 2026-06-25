/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Mail, Phone, ArrowLeft, ArrowRight, ShieldCheck, 
  Eye, EyeOff, AlertTriangle, HelpCircle, CheckCircle, Smartphone 
} from 'lucide-react';
import { User, MaternalProfile } from '../types';
import { calculateHpl, calculateGestationalWeeks } from '../data/initialData';

interface AuthModuleProps {
  mockUsers: User[];
  onLoginSuccess: (user: User) => void;
  onRegisterMother: (newUser: User) => void;
  initialMode?: 'login' | 'register';
  onBackToHome: () => void;
}

export default function AuthModule({ 
  mockUsers, 
  onLoginSuccess, 
  onRegisterMother, 
  initialMode = 'login',
  onBackToHome 
}: AuthModuleProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // LOGIN STATE
  const [loginInput, setLoginInput] = useState(''); // Email or Phone
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);

  // FORGOT PASSWORD STATE
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [forgotStatusMessage, setForgotStatusMessage] = useState('');

  // REGISTER MULTI-STEP STATE
  const [regStep, setRegStep] = useState(1);
  
  // Step 1: Account
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  
  // Step 2: Personal Info
  const [regName, setRegName] = useState('');
  const [regNik, setRegNik] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regBloodType, setRegBloodType] = useState('O+');
  const [regAddress, setRegAddress] = useState('');
  const [regEmergencyName, setRegEmergencyName] = useState('');
  const [regEmergencyPhone, setRegEmergencyPhone] = useState('');
  const [regEmergencyRelation, setRegEmergencyRelation] = useState('Suami');

  // Step 3: Pregnancy Info
  const [regHpht, setRegHpht] = useState(new Date().toISOString().split('T')[0]);
  const [regGravida, setRegGravida] = useState(1); // G
  const [regPara, setRegPara] = useState(0); // P
  const [regAbortus, setRegAbortus] = useState(0); // A
  const [regComorbidities, setRegComorbidities] = useState<string[]>([]);
  const [comorbidityInput, setComorbidityInput] = useState('');
  const [regVillage, setRegVillage] = useState('Desa Sukamaju');

  // Step 4: Informed Consent
  const [consentUupdp, setConsentUupdp] = useState(false);

  // Common Comorbidities templates
  const comorbidityTemplates = ["Diabetes Gestasional", "Hipertensi Kehamilan", "Asma", "Anemia Ringan", "Riwayat Pembedahan"];

  // LOGIN HANDLER
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setLoginError('Sistem terkunci sementara karena keamanan brute-force. Silakan tunggu.');
      return;
    }

    if (!loginInput || !loginPassword) {
      setLoginError('Harap lengkapi email/nomor telepon dan kata sandi Anda.');
      return;
    }

    // Find user
    const foundUser = mockUsers.find(
      u => (u.email.toLowerCase() === loginInput.trim().toLowerCase() || u.phone === loginInput.trim())
    );

    if (!foundUser) {
      handleFailedAttempt();
      setLoginError('Akun tidak ditemukan. Periksa kembali email atau nomor telepon Anda.');
      return;
    }

    // Since this is a high-fidelity visual simulator, we allow credentials but enforce standard password check
    if (loginPassword !== 'password123' && loginPassword !== foundUser.phone) {
      handleFailedAttempt();
      setLoginError('Kata sandi salah. Harap diingat untuk simulasi gunakan "password123".');
      return;
    }

    // Success Authentication
    setFailedAttempts(0);
    setLoginError('');
    onLoginSuccess(foundUser);
  };

  const handleFailedAttempt = () => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    if (nextAttempts >= 5) {
      setIsLocked(true);
      setLockCountdown(30); // 30 seconds lockdown
      setLoginError('PERINGATAN KEAMANAN: Akun diblokir sementara karena 5x salah sandi. Silakan gunakan bypass di simulator widget.');
      const interval = setInterval(() => {
        setLockCountdown(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // FORGOT PASSWORD OTP TRIGGER
  const handleRequestOtp = () => {
    if (!forgotInput) {
      setForgotStatusMessage('Masukkan email atau nomor telepon yang terdaftar.');
      return;
    }
    
    // Check if user exists
    const user = mockUsers.find(u => u.email === forgotInput || u.phone === forgotInput);
    if (!user) {
      setForgotStatusMessage('Email atau nomor ponsel tidak terdaftar di sistem.');
      return;
    }

    // Generate random 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    setForgotStatusMessage(`SUKSES: OTP dikirim ke ${user.phone}.`);
  };

  const handleVerifyOtp = () => {
    if (enteredOtp === generatedOtp) {
      setOtpVerified(true);
      setForgotStatusMessage('Kode OTP Terverifikasi Secara Aman!');
    } else {
      setForgotStatusMessage('Masukkan kode OTP dengan benar. Periksa simulasi banner.');
    }
  };

  const handleResetPasswordSubmit = () => {
    if (!newPassword || newPassword.length < 5) {
      setForgotStatusMessage('Kata sandi baru minimal 5 karakter.');
      return;
    }
    // Simulate updating password in the memory state
    const user = mockUsers.find(u => u.email === forgotInput || u.phone === forgotInput);
    if (user) {
      // Direct success
      setForgotStatusMessage('Selesai! Kata sandi telah disetel ulang secara aman.');
      setTimeout(() => {
        setIsForgotModalOpen(false);
        // Reset states
        setForgotInput('');
        setOtpSent(false);
        setOtpVerified(false);
        setNewPassword(false as any);
        setLoginInput(user.email);
        setLoginPassword('password123'); // reset inside simulator to default for login ease
      }, 2000);
    }
  };

  // MULTI-STEP REGISTRATION HANDLERS
  const handleNextStep = () => {
    if (regStep === 1) {
      if (!regEmail || !regPhone || !regPassword) {
        setLoginError('Lengkapi seluruh biodata akun terlebih dahulu.');
        return;
      }
      if (regPassword !== regPasswordConfirm) {
        setLoginError('Konfirmasi kata sandi tidak cocok.');
        return;
      }
      setLoginError('');
      setRegStep(2);
    } else if (regStep === 2) {
      if (!regName || !regNik || !regDob || !regAddress || !regEmergencyName || !regEmergencyPhone) {
        setLoginError('Mohon isi seluruh data identitas KTP dan nomor kontak darurat.');
        return;
      }
      if (regNik.length !== 16) {
        setLoginError('NIK harus berupa 16 digit angka sesuai KTP.');
        return;
      }
      setLoginError('');
      setRegStep(3);
    } else if (regStep === 3) {
      if (!regHpht) {
        setLoginError('Harap tentukan tanggal HPHT untuk kalkulasi HPL janin.');
        return;
      }
      setLoginError('');
      setRegStep(4);
    }
  };

  const handleRegisterSubmit = () => {
    if (!consentUupdp) {
      setLoginError('Anda wajib mencentang persetujuan pemrosesan rekam medis UU PDP.');
      return;
    }

    const calculatedHplDate = calculateHpl(regHpht);
    const calculatedWeeks = calculateGestationalWeeks(regHpht);

    // Build maternal info
    const maternalProfile: MaternalProfile = {
      nik: regNik,
      bloodType: regBloodType,
      emergencyContact: {
        name: regEmergencyName,
        phone: regEmergencyPhone,
        relation: regEmergencyRelation
      },
      hpht: regHpht,
      hpl: calculatedHplDate,
      gestationalWeeks: calculatedWeeks,
      gpa: {
        g: regGravida,
        p: regPara,
        a: regAbortus
      },
      comorbidities: regComorbidities,
      village: regVillage,
      riskScore: 2, // Default KRR
      riskStatus: regComorbidities.length > 0 ? 'YELLOW' : 'GREEN',
      fundusHeightHistory: [],
      labHistory: []
    };

    const newCreatedUser: User = {
      id: `mother-${Date.now()}`,
      email: regEmail,
      phone: regPhone,
      name: regName,
      role: 'mother',
      maternalProfile: maternalProfile
    };

    onRegisterMother(newCreatedUser);
  };

  const addComorbidity = () => {
    if (comorbidityInput && !regComorbidities.includes(comorbidityInput)) {
      setRegComorbidities([...regComorbidities, comorbidityInput]);
      setComorbidityInput('');
    }
  };

  const removeComorbidity = (item: string) => {
    setRegComorbidities(regComorbidities.filter(c => c !== item));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sage-100/20 via-slate-50 to-slate-100">
      
      {/* Decorative Brand Header */}
      <div className="absolute top-6 left-6 flex items-center gap-2.5 cursor-pointer" onClick={onBackToHome}>
        <div className="text-left">
          <span className="font-bold text-base tracking-tight block">Ruang Bunda</span>
        </div>
      </div>

      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
        
        {/* Banner header inside card */}
        <div className="bg-sage-600 px-6 py-8 text-white relative">
          <div className="absolute inset-0 bg-gradient-to-r from-sage-600 to-emerald-700 opacity-90" />
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative text-left">
            <h2 className="text-2xl font-bold font-display">
              {mode === 'login' ? 'Portal Masuk Satu Pintu' : 'Registrasi Ibu Hamil Baru'}
            </h2>
            <p className="text-sage-100 text-xs mt-1.5">
              {mode === 'login' 
                ? 'Satu formulir tunggal yang mencakup akses Ibu, Bidan Wilayah, dan Administrator.' 
                : 'Lengkapi 4 langkah pendataan rekam medis secara bertahap yang ramah pengguna.'}
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          
          {/* Top selection for login vs register toggle */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl mb-6">
            <button
              onClick={() => { setMode('login'); setLoginError(''); }}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Masuk Portal
            </button>
            <button
              onClick={() => { setMode('register'); setLoginError(''); setRegStep(1); }}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Daftar Ibu Baru
            </button>
          </div>

          {/* Validation Alert */}
          {loginError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-xl mb-6 flex items-start gap-2.5 text-left">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Terjadi Kendala</p>
                <p className="mt-0.5 text-rose-700/90 leading-relaxed">{loginError}</p>
              </div>
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5 text-left">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Email atau Nomor Handphone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="Contoh: ibu.kartika@email.com atau 081234567890"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:bg-white transition-all"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  Bidan: <code className="font-mono bg-slate-100 px-1 rounded">bidan.siti@email.com</code> | Admin: <code className="font-mono bg-slate-100 px-1 rounded">admin.hendra@email.com</code>
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-xs text-sage-600 font-semibold hover:text-sage-800 transition-colors"
                  >
                    Lupa Kata Sandi?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan sandi keanggotaan"
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {failedAttempts > 0 && failedAttempts < 5 && (
                  <p className="text-[11px] text-amber-600 font-semibold mt-2">
                    Kesempatan login tersisa: {5 - failedAttempts} kali sebelum proteksi brute-force mengunci akun.
                  </p>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="w-1/3 py-2.5 px-4 bg-slate-100 hover:bg-slate-250 hover:text-slate-900 text-gray-600 font-semibold text-sm rounded-xl transition-all"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isLocked}
                  className={`flex-1 py-2.5 px-4 font-semibold text-sm text-white rounded-xl shadow-md transition-all cursor-pointer ${
                    isLocked 
                      ? 'bg-rose-300 cursor-not-allowed' 
                      : 'bg-sage-600 hover:bg-sage-700 shadow-sage-200 hover:shadow-lg'
                  }`}
                >
                  {isLocked ? `Sistem Dikunci (${lockCountdown}s)` : 'Masuk Sistem'}
                </button>
              </div>
            </form>
          ) : (
            
            /* MODE: MULTI-STEP REGISTER FOR PREGNANT MOTHER */
            <div className="text-left space-y-6">
              
              {/* Stepper Progress Indicator */}
              <div id="registration-stepper" className="relative flex items-center justify-between mb-8">
                {/* Background Connecting line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-10" />
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-sage-500 -z-10 transition-all duration-300" 
                  style={{ width: `${((regStep - 1) / 3) * 100}%` }}
                />

                {[1, 2, 3, 4].map((step) => {
                  const isActive = step <= regStep;
                  const isCurrent = step === regStep;
                  return (
                    <div key={step} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                        isCurrent 
                          ? 'bg-sage-600 border-sage-600 text-white ring-4 ring-sage-100 scale-110' 
                          : isActive 
                            ? 'bg-sage-500 border-sage-500 text-white' 
                            : 'bg-white border-gray-200 text-gray-400'
                      }`}>
                        {step}
                      </div>
                      <span className={`text-[10px] mt-2 font-semibold tracking-tight ${isCurrent ? 'text-sage-700 font-bold' : 'text-gray-400'}`}>
                        {step === 1 ? 'Akun' : step === 2 ? 'Keluarga' : step === 3 ? 'Klinis/HPL' : 'Persetujuan'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* STEP 1: ACCOUNT INFOR */}
              {regStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">Langkah 1: Informasi Dasar Akun</h3>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Alamat Email Aktif <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="Contoh: mama.kartika@gmail.com"
                      className="block w-full px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Nomor Handphone (WhatsApp) <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-mono text-xs font-bold">
                        ID (+62)
                      </div>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="81234567890"
                        className="block w-full pl-14 pr-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 focus:bg-white"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Guna mengirim notifikasi jadwal ANC atau verifikasi OTP.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Kata Sandi <span className="text-rose-500">*</span></label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Sandi minimal 6 karakter"
                        className="block w-full px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Konfirmasi Kata Sandi <span className="text-rose-500">*</span></label>
                      <input
                        type="password"
                        value={regPasswordConfirm}
                        onChange={(e) => setRegPasswordConfirm(e.target.value)}
                        placeholder="Ketik ulang sandi"
                        className="block w-full px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: PERSONAL IDENTITY */}
              {regStep === 2 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">Langkah 2: Data Identitas KTP & Kontak Darurat</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Nama Lengkap Sesuai KTP <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Contoh: Kartika Sari"
                        className="block w-full px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Nomor Induk Kependudukan (NIK) <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        maxLength={16}
                        value={regNik}
                        onChange={(e) => setRegNik(e.target.value.replace(/\D/g, ''))}
                        placeholder="16 Digit Angka KTP"
                        className="block w-full px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sage-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Tanggal Lahir Ibu <span className="text-rose-500">*</span></label>
                      <input
                        type="date"
                        value={regDob}
                        onChange={(e) => setRegDob(e.target.value)}
                        className="block w-full px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Golongan Darah & Rhesus <span className="text-rose-500">*</span></label>
                      <select
                        value={regBloodType}
                        onChange={(e) => setRegBloodType(e.target.value)}
                        className="block w-full px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                      >
                        <option value="A+">A dengan Rhesus Positif (+)</option>
                        <option value="A-">A dengan Rhesus Negatif (-)</option>
                        <option value="B+">B dengan Rhesus Positif (+)</option>
                        <option value="B-">B dengan Rhesus Negatif (-)</option>
                        <option value="O+">O dengan Rhesus Positif (+)</option>
                        <option value="O-">O dengan Rhesus Negatif (-)</option>
                        <option value="AB+">AB dengan Rhesus Positif (+)</option>
                        <option value="AB-">AB dengan Rhesus Negatif (-)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Alamat Domisili Lengkap <span className="text-rose-500">*</span></label>
                    <textarea
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      placeholder="Contoh: Jl. Sukamaju No 24 RT 02/RW 03, Kelurahan Sukamanah, Kec. Cibiru"
                      rows={2}
                      className="block w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-gray-150 space-y-3">
                    <h4 className="text-xs font-bold text-gray-700 tracking-wide uppercase">Kontak Darurat (Keluarga Terdekat)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Hubungan</label>
                        <select
                          value={regEmergencyRelation}
                          onChange={(e) => setRegEmergencyRelation(e.target.value)}
                          className="block w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                        >
                          <option value="Suami">Suami</option>
                          <option value="Orang Tua">Orang Tua</option>
                          <option value="Saudara Kandung">Saudara Kandung</option>
                        </select>
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Nama Kontak</label>
                        <input
                          type="text"
                          value={regEmergencyName}
                          onChange={(e) => setRegEmergencyName(e.target.value)}
                          placeholder="Andi Wijaya"
                          className="block w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">HP Darurat</label>
                        <input
                          type="tel"
                          value={regEmergencyPhone}
                          onChange={(e) => setRegEmergencyPhone(e.target.value)}
                          placeholder="081234567..."
                          className="block w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: PREGNANCY CLINICAL DETAILS */}
              {regStep === 3 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">Langkah 3: Detail Riwayat Kehamilan & Comorbid</h3>

                  <div className="bg-sage-50/70 p-4 rounded-2xl border border-sage-100 space-y-4">
                    <div className="flex gap-4 items-center">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-sage-800 uppercase tracking-wider mb-1.5">Hari Pertama Haid Terakhir (HPHT) <span className="text-rose-500">*</span></label>
                        <input
                          type="date"
                          value={regHpht}
                          onChange={(e) => setRegHpht(e.target.value)}
                          className="block w-full px-3 py-2 bg-white border border-sage-200 rounded-xl text-xs font-mono text-sage-900 focus:outline-none focus:ring-2 focus:ring-sage-500"
                        />
                      </div>
                      
                      {/* LIVE SYSTEM CALCULATION PANEL */}
                      <div className="bg-white p-3 rounded-xl border border-sage-150 text-left min-w-[160px] shadow-sm">
                        <div className="text-[9px] uppercase tracking-wider text-gray-400 font-mono font-bold">Live Kalkulasi</div>
                        <div className="mt-1">
                          <span className="text-xs text-slate-500">HPL (Perkiraan):</span>
                          <div className="font-mono font-bold text-sage-700 text-sm">{calculateHpl(regHpht)}</div>
                        </div>
                        <div className="mt-1.5">
                          <span className="text-xs text-slate-500">Usia Kehamilan:</span>
                          <div className="font-mono font-bold text-indigo-700 text-sm">
                            {calculateGestationalWeeks(regHpht)} Minggu
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GPA counts */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Gravida (Hamil Ke-)</label>
                      <input
                        type="number"
                        min={1}
                        value={regGravida}
                        onChange={(e) => setRegGravida(parseInt(e.target.value) || 1)}
                        className="block w-full px-2.5 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Para (Persalinan)</label>
                      <input
                        type="number"
                        min={0}
                        value={regPara}
                        onChange={(e) => setRegPara(parseInt(e.target.value) || 0)}
                        className="block w-full px-2.5 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Abortus (Keguguran)</label>
                      <input
                        type="number"
                        min={0}
                        value={regAbortus}
                        onChange={(e) => setRegAbortus(parseInt(e.target.value) || 0)}
                        className="block w-full px-2.5 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Comorbidities */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Riwayat Penyakit Penyerta (Comorbid)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={comorbidityInput}
                        onChange={(e) => setComorbidityInput(e.target.value)}
                        placeholder="Misal: Penyakit Jantung, Asthma, Diabetes"
                        className="block flex-1 px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sage-500"
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addComorbidity(); } }}
                      />
                      <button
                        type="button"
                        onClick={addComorbidity}
                        className="px-4 py-1.5 bg-sage-500 text-white rounded-xl text-xs hover:bg-sage-600 transition-colors font-semibold"
                      >
                        Tambah
                      </button>
                    </div>

                    {/* Predefined templates chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {comorbidityTemplates.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => { if (!regComorbidities.includes(item)) setRegComorbidities([...regComorbidities, item]); }}
                          className="bg-slate-100 hover:bg-slate-200/80 text-gray-600 text-[10px] px-2 py-0.5 rounded-full border border-gray-200"
                        >
                          + {item}
                        </button>
                      ))}
                    </div>

                    {/* Active comorbidities */}
                    {regComorbidities.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 p-2 bg-amber-50 rounded-lg border border-amber-100">
                        {regComorbidities.map((item) => (
                          <span key={item} className="bg-amber-100 text-amber-800 text-[10px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            {item}
                            <button type="button" onClick={() => removeComorbidity(item)} className="text-[9px] text-amber-500 hover:text-amber-700 font-bold ml-1">x</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-650 mb-1.5">Desa/Posyandu Tempat Tinggal (Wilayah Kerja Bidan) <span className="text-rose-500">*</span></label>
                    <select
                      value={regVillage}
                      onChange={(e) => setRegVillage(e.target.value)}
                      className="block w-full px-3 py-2 bg-slate-50 border border-gray-250 rounded-xl text-sm"
                    >
                      <option value="Desa Sukamaju">Desa Sukamaju (Bidan Siti - Puskesmas Utama)</option>
                      <option value="Desa Karanganyar">Desa Karanganyar (Bidan Siti - Posyandu Anggrek)</option>
                      <option value="Desa Mekarsari">Desa Mekarsari (Puskesmas Pembantu Mekar)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 4: INFORMED CONSENT UNDER INDONESIAN DATA PRIVACY LAW (UU PDP) */}
              {regStep === 4 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">Langkah 4: Persetujuan Informasi & Hak Keamanan Data</h3>
                  
                  <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 text-xs space-y-4 shadow-inner">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <span className="font-bold text-amber-400 font-display uppercase tracking-wider">Informed Consent Hukum PDP</span>
                    </div>

                    <p className="leading-relaxed text-slate-300">
                      Sesuai **Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP)**, kami berkomitmen penuh menjaga hak privasi rekam medis maternal Anda.
                    </p>

                    <div className="space-y-2.5 font-mono text-[10px] text-slate-400">
                      <div className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">&#10003;</span>
                        <span>Pasal 22: Pengumpulan data klinis terperinci semata-mata digunakan untuk pencegahan kematian ibu & deteksi preeklampsia.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">&#10003;</span>
                        <span>Pasal 24: Rekam Medis (RME) tidak disebarluaskan dan dienkripsi AES-256 bits selama tersimpan di cloud storage.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">&#10003;</span>
                        <span>Pasal 26: Pasien berhak meminta pencabutan, pemusnahan, atau perpindahan ekspor data medis ke sistem Puskesmas rujukan kapan pun.</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-sage-50 rounded-xl border border-sage-150">
                    <input
                      type="checkbox"
                      id="checkbox-uupdp"
                      checked={consentUupdp}
                      onChange={(e) => setConsentUupdp(e.target.checked)}
                      className="w-4 h-4 text-sage-600 border-sage-300 rounded focus:ring-sage-500 mt-0.5 cursor-pointer"
                    />
                    <label htmlFor="checkbox-uupdp" className="text-xs text-sage-900 leading-normal font-semibold cursor-pointer select-none">
                      Saya memberikan persetujuan eksplisit kepada Ruang Bunda untuk mencatatkan, memantau, dan membagikan data medis ini sebatas penanganan klinis oleh Bidan Wilayah yang sah demi keselamatan kehamilan saya.
                    </label>
                  </div>
                </div>
              )}

              {/* Navigation Actions for Multi-step */}
              <div className="pt-4 flex gap-3">
                {regStep > 1 && (
                  <button
                    type="button"
                    onClick={() => { setRegStep(prev => prev - 1); setLoginError(''); }}
                    className="w-1/3 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-gray-700 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                  </button>
                )}
                
                {regStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 py-2.5 px-4 bg-sage-600 hover:bg-sage-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ml-auto"
                  >
                    Lanjutkan
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRegisterSubmit}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Setuju & Daftarkan Kehamilan Saya
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LUPA KATA SANDI MODAL (OTP SIMULATOR) */}
      <AnimatePresence>
        {isForgotModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-6 text-white text-left relative shadow-2xl overflow-hidden"
            >
              {/* Internal decorative background */}
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
              
              <div className="flex items-center gap-2 text-amber-400 mb-4">
                <Smartphone className="w-5 h-5" />
                <span className="font-bold uppercase font-display tracking-wide text-xs">Simulasi WhatsApp OTP Gateway</span>
              </div>

              <h3 className="text-base font-bold text-white leading-tight">Pulihkan Lupa Kata Sandi</h3>
              <p className="text-slate-400 text-xs mt-1">Menggunakan integrasi notifikasi cepat wilayah terpencil.</p>

              {forgotStatusMessage && (
                <div className="mt-3 p-2.5 bg-slate-950 text-amber-300 font-mono text-[10px] rounded-lg border border-slate-800">
                  {forgotStatusMessage}
                </div>
              )}

              <div className="mt-4 space-y-3.5">
                {!otpSent ? (
                  <>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Email atau No. Handphone Terdaftar</label>
                      <input
                        type="text"
                        value={forgotInput}
                        onChange={(e) => setForgotInput(e.target.value)}
                        placeholder="081234567890 atau ibu.kartika@email.com"
                        className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-xs text-white focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Kirimkan OTP WhatsApp / SMS
                    </button>
                  </>
                ) : !otpVerified ? (
                  <>
                    <div className="bg-amber-950/40 border border-amber-900 p-3 rounded-xl">
                      <div className="text-[10px] uppercase font-bold text-amber-400 font-mono">📱 Notifikasi WhatsApp Terkirim!</div>
                      <p className="text-[10px] text-amber-200 mt-1">
                        Sistem mensimulasikan pengرسalan pesan. Kode OTP Rahasia Anda: <strong className="font-mono text-xs text-white">{generatedOtp}</strong>
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Masukkan 6 Digit OTP</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        placeholder="Ketik 6 digit OTP"
                        className="w-full bg-slate-950 tracking-[0.25em] text-center font-bold border border-slate-850 px-3 py-2 rounded-xl text-sm"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-755 text-slate-300 text-xs rounded-xl"
                      >
                        Ganti Nomor
                      </button>
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="flex-1 py-2 bg-amber-500 hover:bg-amber-650 text-slate-950 font-bold text-xs rounded-xl"
                      >
                        Verifikasi Kode
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Kata Sandi Baru</label>
                      <input
                        type="password"
                        value={newPassword as any}
                        onChange={(e) => setNewPassword(e.target.value as any)}
                        placeholder="Sandi baru minimal 5 huruf"
                        className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-xs focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleResetPasswordSubmit}
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl"
                    >
                      Ubah Kata Sandi & Selesaikan
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setOtpSent(false);
                  setOtpVerified(false);
                  setForgotStatusMessage('');
                }}
                className="absolute top-2 right-2 text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
