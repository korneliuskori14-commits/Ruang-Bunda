/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, Users, FileText, ChevronRight, CheckCircle2, UserCheck, Activity } from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

export default function LandingPage({ onNavigateToLogin, onNavigateToRegister }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between selection:bg-sage-200">
      
      {/* Navbar */}
      <nav id="landing-nav" className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-sage-100 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div>
              <span className="font-bold font-display text-xl tracking-tight text-sage-900 block leading-none">Ruang Bunda</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              id="btn-login-nav"
              onClick={onNavigateToLogin}
              className="text-sage-700 font-medium hover:text-sage-900 text-sm py-2 px-4 transition-colors"
            >
              Masuk
            </button>
            <button 
              id="btn-register-nav"
              onClick={onNavigateToRegister}
              className="bg-sage-600 hover:bg-sage-700 text-white font-medium text-sm py-2 px-5 rounded-lg shadow-md transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              Daftar Ibu Hamil
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow">
        <section id="hero-section" className="relative overflow-hidden py-16 lg:py-24 px-6">
          {/* Ambient background blur circles */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-sage-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -z-10 animate-blob" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 -z-10 animate-blob animation-delay-2000" />
          
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <div className="inline-flex items-center gap-2 bg-sage-100 border border-sage-200 text-sage-800 text-xs px-3.5 py-1.5 rounded-full font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-sage-600" />
                <span>Kepatuhan UU PDP & Terenkripsi Sempurna</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display text-gray-900 tracking-tight leading-tight">
                Detak demi Detak,<br />
                <span className="text-sage-600">Mengawal Keselamatan</span><br />
                Ibu & Bayi Indonesia.
              </h1>
              
              <p className="text-gray-600 text-base sm:text-lg max-w-xl leading-relaxed">
                Ruang Bunda (Srikandi Sehat) hadir sebagai pusat kendali kesehatan maternal berbasis peran. Menghubungkan Ibu Hamil, Bidan Wilayah, dan Administrator Faskes dalam satu sistem rekam medis digital yang aman, cepat, dan suportif.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <button
                  id="btn-register-hero"
                  onClick={onNavigateToRegister}
                  className="bg-sage-600 hover:bg-sage-700 text-white font-semibold py-3.5 px-7 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                >
                  🤰 Registrasi Ibu Hamil Baru
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  id="btn-login-hero"
                  onClick={onNavigateToLogin}
                  className="bg-white hover:bg-sage-50 text-gray-800 border border-gray-200 font-semibold py-3.5 px-7 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-sage-500" />
                  Masuk Portal Klinis (Ibu, Bidan, Admin)
                </button>
              </div>

              {/* Badges of trust */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-gray-200/80">
                <div>
                  <div className="text-2xl font-bold font-display text-sage-700">100%</div>
                  <div className="text-xs text-gray-400 mt-1 uppercase font-mono tracking-wider">Rekam Medis Digital</div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-display text-sage-700">&lt; 3 Detik</div>
                  <div className="text-xs text-gray-400 mt-1 uppercase font-mono tracking-wider">Triage Tanda Bahaya</div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-display text-sage-700">PWS-KIA</div>
                  <div className="text-xs text-gray-400 mt-1 uppercase font-mono tracking-wider">Laporan Otomatis Dinkes</div>
                </div>
              </div>
            </div>

            {/* Hero Right Visual Interface Mockup */}
            <div className="lg:col-span-5 relative mt-6 lg:mt-0">
              <div className="bg-white p-6 rounded-3xl shadow-2xl border border-sage-100 relative overflow-hidden">
                {/* Simulated Device Top Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4 text-xs font-mono text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-sage-500 animate-pulse" />
                    <span>Layanan Ruang Bunda Aktif</span>
                  </div>
                  <span className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-semibold">Terkoneksi</span>
                </div>

                {/* Main Visual: Interactive Demo Card preview */}
                <div className="space-y-4">
                  <div className="bg-sage-50/70 p-4 rounded-2xl border border-sage-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] bg-sage-200 text-sage-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Trimester II</span>
                        <h4 className="font-bold text-gray-900 mt-2">Kehamilan Kartika Sari</h4>
                        <p className="text-xs text-sage-600 mt-0.5 font-mono">Usia Kehamilan: Minggu ke-24</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400">HPL (Perkiraan):</span>
                        <div className="font-bold text-sage-600 font-mono text-sm">20-Oktober-2026</div>
                      </div>
                    </div>
                    {/* Visual Growth bar */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[11px] text-gray-500">
                        <span>Ukuran Janin: <strong>Buah Belewah (600g)</strong></span>
                        <span>24 / 40 Minggu</span>
                      </div>
                      <div className="w-full bg-sage-200/50 rounded-full h-2">
                        <div className="bg-sage-500 h-2 rounded-full" style={{ width: '60%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Triase Preview */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-emerald-100 bg-emerald-50/50 p-3.5 rounded-xl text-left">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
                        Triage Hijau
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">Tekan Darah: 118/78 mmHg. Janin stabil.</p>
                    </div>
                    <div className="border border-rose-100 bg-rose-50/50 p-3.5 rounded-xl text-left">
                      <div className="flex items-center gap-1.5 text-rose-700 font-semibold text-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping block" style={{ animationDuration: '1.5s' }} />
                        Triage Merah
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">Preeklampsia & Tekanan tinggi dirujuk instan.</p>
                    </div>
                  </div>

                  {/* Encrypted tip */}
                  <div className="flex items-center gap-2.5 bg-slate-900 text-slate-300 p-3 rounded-xl border border-slate-800 text-[11px]">
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Hukum PDP: Data klinis rahasia dienkripsi dengan standar TLS & AES-256.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Overview Section */}
        <section id="features-section" className="bg-white py-20 border-t border-b border-sage-100 px-6">
          <div className="max-w-7xl mx-auto text-center space-y-16">
            <div className="max-w-3xl mx-auto space-y-4">
              <span className="text-sage-600 font-bold uppercase tracking-wider text-xs font-mono">Modul & Kemampuan Utama</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-gray-900">
                Ekosistem Maternal Digital yang Terintegrasi
              </h2>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Tiga pilar solusi yang didesain secara humanis untuk mendukung deteksi dini dan respons cepat bagi kesehatan ibu hamil di seluruh nusantara.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-sage-50/50 hover:bg-sage-100/30 p-8 rounded-2xl border border-sage-100 text-left transition-all hover:shadow-md hover:-translate-y-1">
                <div className="w-12 h-12 bg-sage-500 rounded-xl text-white flex items-center justify-center mb-6 shadow-md shadow-sage-200">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-950 font-display mb-3">
                  Pemantauan Kesehatan Mandiri
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  Input parameter harian dengan mudah seperti berat badan, tekanan darah, denyut nadi, gerakan janin, dan gejala yang dirasakan. Sistem otomatis menghitung usia kandungan Anda dari HPHT.
                </p>
                <ul className="space-y-2 text-xs text-gray-500">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Grafik perkembangan berat badan</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Triage otomatis 3-warna (Hijau, Kuning, Merah)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Hitung mundur HPL otomatis</li>
                </ul>
              </div>

              {/* Feature 2 */}
              <div className="bg-white hover:bg-sage-50/30 p-8 rounded-2xl border border-sage-100 text-left transition-all shadow-sm hover:shadow-md hover:-translate-y-1">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl text-white flex items-center justify-center mb-6 shadow-md shadow-emerald-200">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-950 font-display mb-3">
                  Koneksi Bidan Wilayah 24/7
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  Konsultasikan setiap gejala dengan Bidan puskesmas di wilayah tempat tinggal Anda melalui interaksi percakapan virtual terenkripsi. Deteksi bahaya diinisiasi sedini mungkin.
                </p>
                <ul className="space-y-2 text-xs text-gray-500">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Chat langsung dengan Bidan penanggung jawab</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Integrasi rekam medis ANC digital</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Rujukan instan rumah sakit dengan data ambulans</li>
                </ul>
              </div>

              {/* Feature 3 */}
              <div className="bg-sage-50/50 hover:bg-sage-100/30 p-8 rounded-2xl border border-sage-100 text-left transition-all hover:shadow-md hover:-translate-y-1">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl text-white flex items-center justify-center mb-6 shadow-md shadow-indigo-200">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-950 font-display mb-3">
                  Edukasi Medis Tervalidasi
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  Dapatkan tips pemenuhan nutrisi zat besi, kalsium, pelacakan ketuban, gizi, dan info kehamilan resmi yang disesuaikan secara dinamis dan otomatis berdasarkan usia trimester kandungan Anda.
                </p>
                <ul className="space-y-2 text-xs text-gray-500">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Konten disesuaikan per Trimester (1, 2, 3)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Panduan tertulis gizi mikro dan makro resmi</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Dikelola langsung melalui Modul CMS Admin</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="text-left">
              <span className="font-bold text-base tracking-tight block">Ruang Bunda</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-400" /> Kepatuhan UU PDP No 27 Tahun 2022</span>
            <span>Standar PWS-KIA Depkes RI</span>
            <span>Enkripsi AES-256</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
