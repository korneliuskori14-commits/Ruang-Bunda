/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, HealthLog, ChatMessage, Appointment, Referral, Article, AuditLog } from '../types';

// Helper to get formatted dates relative to today
export function getRelativeDateString(daysDiff: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysDiff);
  return date.toISOString().split('T')[0];
}

// Calculate HPHT for a specific week of gestation (e.g., 24 weeks ago)
export function getHphtForGestationWeeks(weeks: number): string {
  const days = weeks * 7;
  return getRelativeDateString(-days);
}

// Naegele's rule helper: standard is +280 days
export function calculateHpl(hpht: string): string {
  if (!hpht) return '';
  const hphtDate = new Date(hpht);
  const hplDate = new Date(hphtDate.getTime() + 280 * 24 * 60 * 60 * 1000);
  return hplDate.toISOString().split('T')[0];
}

export function calculateGestationalWeeks(hpht: string): number {
  if (!hpht) return 0;
  const hphtDate = new Date(hpht);
  const today = new Date();
  const diffTime = today.getTime() - hphtDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.floor(diffDays / 7));
}

// Get size description and illustration guidance for fetus
export function getFetalGrowthDescription(weeks: number): { size: string; description: string; weight: string; length: string; imageHint: string } {
  if (weeks < 4) {
    return {
      size: "biji sesawi",
      description: "Ukuran embrio sangat kecil. Tabung saraf saraf dasar sudah mulai terbentuk.",
      weight: "< 1 g",
      length: "0.2 cm",
      imageHint: "seed"
    };
  } else if (weeks < 8) {
    return {
      size: "biji blueberry",
      description: "Jantung bayi yang mungil mulai berdetak dan terus membelah sel tubuh.",
      weight: "1 g",
      length: "1.6 cm",
      imageHint: "blueberry"
    };
  } else if (weeks < 12) {
    return {
      size: "buah jeruk nipis",
      description: "Struktur wajah bayi, jemari tangan, dan kuku mulai terbentuk dengan baik.",
      weight: "14 g",
      length: "5.4 cm",
      imageHint: "lime"
    };
  } else if (weeks < 16) {
    return {
      size: "buah alpukat",
      description: "Bayi mulai bisa mengisap jempol dan sistem ototnya semakin menguat.",
      weight: "100 g",
      length: "11.6 cm",
      imageHint: "avocado"
    };
  } else if (weeks < 20) {
    return {
      size: "buah pisang",
      description: "Kulit bayi mulai dilapisi zat pelindung verniks kaseosa. Refleks mengisap menguat.",
      weight: "300 g",
      length: "25 cm",
      imageHint: "banana"
    };
  } else if (weeks < 25) {
    return {
      size: "buah belewah",
      description: "Pendengaran janin berkembang penuh. Bayi mulai merespons suara detak jantung ibu dan musik.",
      weight: "600 g",
      length: "30 cm",
      imageHint: "melon"
    };
  } else if (weeks < 30) {
    return {
      size: "sayur terong",
      description: "Bayi mulai bisa membuka mata, berkedip, dan siklus tidurnya mulai lebih teratur.",
      weight: "1.2 kg",
      length: "38 cm",
      imageHint: "eggplant"
    };
  } else if (weeks < 36) {
    return {
      size: "buah nanas besar",
      description: "Paru-paru bayi sudah hampir matang sempurna. Lapisan lemak di bawah kulit semakin tebal.",
      weight: "2.1 kg",
      length: "45 cm",
      imageHint: "pineapple"
    };
  } else {
    return {
      size: "buah semangka kecil",
      description: "Bayi sudah matang penuh (aterm) dan bersiap untuk posisi jalan lahir.",
      weight: "3.2 kg",
      length: "50 cm",
      imageHint: "watermelon"
    };
  }
}

// 1. Predefined Users
const hphtKartika = getHphtForGestationWeeks(24); // exactly 24 weeks!
const hphtRina = getHphtForGestationWeeks(32); // 32 weeks, high risk
const hphtDwi = getHphtForGestationWeeks(10); // 10 weeks, mild risk

export const initialUsers: User[] = [
  {
    id: "mother-1",
    email: "ibu.kartika@email.com",
    phone: "081234567890",
    name: "Kartika Sari",
    role: "mother",
    maternalProfile: {
      nik: "3273012345670001",
      bloodType: "A+",
      emergencyContact: {
        name: "Andi Wijaya",
        phone: "081234567891",
        relation: "Suami"
      },
      hpht: hphtKartika,
      hpl: calculateHpl(hphtKartika),
      gestationalWeeks: 24,
      gpa: { g: 2, p: 1, a: 0 }, // G2P1A0
      comorbidities: [],
      village: "Desa Sukamaju",
      riskScore: 2, // Skor Awal Ibu Hamil (KRR: Kehamilan Risiko Rendah)
      riskStatus: "GREEN",
      fundusHeightHistory: [
        { date: getRelativeDateString(-60), height: 16 },
        { date: getRelativeDateString(-30), height: 20 },
        { date: getRelativeDateString(-1), height: 23 }
      ],
      labHistory: [
        {
          date: getRelativeDateString(-60),
          hbLevel: 11.5,
          proteinUrine: "Negatif",
          glycemia: 95
        }
      ]
    }
  },
  {
    id: "mother-2",
    email: "ibu.rina@email.com",
    phone: "081234567892",
    name: "Rina Astuti",
    role: "mother",
    maternalProfile: {
      nik: "3273012345670002",
      bloodType: "O-",
      emergencyContact: {
        name: "Budi Santoso",
        phone: "081234567893",
        relation: "Suami"
      },
      hpht: hphtRina,
      hpl: calculateHpl(hphtRina),
      gestationalWeeks: 32,
      gpa: { g: 3, p: 1, a: 1 }, // G3P1A1
      comorbidities: ["Hipertensi Kronis", "Riwayat Preeklampsia"],
      village: "Desa Karanganyar",
      riskScore: 12, // KRT (Kehamilan Risiko Tinggi) - Skor Poedji Rochjati
      riskStatus: "RED",
      fundusHeightHistory: [
        { date: getRelativeDateString(-90), height: 18 },
        { date: getRelativeDateString(-60), height: 22 },
        { date: getRelativeDateString(-30), height: 26 },
        { date: getRelativeDateString(-5), height: 30 }
      ],
      labHistory: [
        {
          date: getRelativeDateString(-90),
          hbLevel: 10.2,
          proteinUrine: "Negatif",
          glycemia: 102
        },
        {
          date: getRelativeDateString(-5),
          hbLevel: 9.8,
          proteinUrine: "Positif (+)",
          glycemia: 110
        }
      ]
    }
  },
  {
    id: "mother-3",
    email: "ibu.dwi@email.com",
    phone: "08567123456",
    name: "Dwi Lestari",
    role: "mother",
    maternalProfile: {
      nik: "3273012345670003",
      bloodType: "B+",
      emergencyContact: {
        name: "Suryo Setiawan",
        phone: "08567123457",
        relation: "Suami"
      },
      hpht: hphtDwi,
      hpl: calculateHpl(hphtDwi),
      gestationalWeeks: 10,
      gpa: { g: 1, p: 0, a: 0 }, // G1P0A0
      comorbidities: ["Asma"],
      village: "Desa Sukamaju",
      riskScore: 6, // KST (Kehamilan Risiko Sedang)
      riskStatus: "YELLOW",
      fundusHeightHistory: [],
      labHistory: [
        {
          date: getRelativeDateString(-10),
          hbLevel: 12.1,
          proteinUrine: "Negatif",
          glycemia: 88
        }
      ]
    }
  },
  {
    id: "midwife-1",
    email: "bidan.siti@email.com",
    phone: "081122334455",
    name: "Siti Rahma, S.Tr.Keb",
    role: "midwife",
    isVerifiedMidwife: true
  },
  {
    id: "admin-1",
    email: "admin.hendra@email.com",
    phone: "081998877665",
    name: "dr. Hendra Setiawan",
    role: "admin"
  }
];

// 2. Health Monitoring Logs
export const initialLogs: HealthLog[] = [
  {
    id: "log-1",
    motherId: "mother-1",
    date: getRelativeDateString(-3),
    weight: 62.5,
    systolic: 120,
    diastolic: 80,
    fetalMovement: 12,
    symptoms: ["Kram kaki ringan"],
    notes: "Kram kaki muncul di malam hari saja, minum air hangat sedikit membantu.",
    riskStatus: "GREEN"
  },
  {
    id: "log-2",
    motherId: "mother-1",
    date: getRelativeDateString(-1),
    weight: 63.0,
    systolic: 118,
    diastolic: 78,
    fetalMovement: 14,
    symptoms: [],
    notes: "Merasa segar hari ini, bayi aktif berpindah posisi.",
    riskStatus: "GREEN"
  },
  {
    id: "log-3",
    motherId: "mother-2",
    date: getRelativeDateString(-6),
    weight: 71.2,
    systolic: 142,
    diastolic: 92,
    fetalMovement: 10,
    symptoms: ["Pusing", "Kaki bengkak"],
    notes: "Pusing setelah beraktivitas, istirahat baring miring kiri mengurangi keluhan.",
    riskStatus: "RED"
  },
  {
    id: "log-4",
    motherId: "mother-2",
    date: getRelativeDateString(-2),
    weight: 72.5,
    systolic: 150,
    diastolic: 95,
    fetalMovement: 8,
    symptoms: ["Pusing", "Kaki bengkak", "Pandangan kabur sekilas"],
    notes: "Pandangan agak kabur, tekanan darah terpantau tinggi.",
    riskStatus: "RED"
  },
  {
    id: "log-5",
    motherId: "mother-3",
    date: getRelativeDateString(-2),
    weight: 54.0,
    systolic: 110,
    diastolic: 70,
    fetalMovement: 0, // Trimester 1, gerakan belum terasa jelas oleh ibu
    symptoms: ["Mual muntah (Morning sickness)", "Sakit kepala bergantian"],
    notes: "Susah makan nasi, diganti makan biskuit dan ubi jalar rebus porsi kecil.",
    riskStatus: "YELLOW"
  }
];

// 3. Simulated Chats
export const initialChats: ChatMessage[] = [
  {
    id: "msg-1",
    senderId: "mother-1",
    senderRole: "mother",
    recipientId: "midwife-1",
    recipientName: "Siti Rahma, S.Tr.Keb",
    message: "Selamat sore Bidan Siti, saya Kartika dari Desa Sukamaju. Di kehamilan minggu ke-24 ini tangan saya kadang terasa agak kebas, apakah itu normal?",
    timestamp: getRelativeDateString(-2) + " 15:30:00"
  },
  {
    id: "msg-2",
    senderId: "midwife-1",
    senderRole: "midwife",
    recipientId: "mother-1",
    recipientName: "Kartika Sari",
    message: "Selamat sore Ibu Kartika. Kebas pada trimester 2 dan 3 memang umum dipicu oleh retensi cairan yang menekan saraf di pergelangan tangan (Carpal Tunnel Syndrome ringan). Coba kurangi konsumsi garam berlebih, hindari tidur menindih tangan, dan rutin regangkan jemari. Namun jika kebas disertai bengkak wajah atau sakit kepala berat, tolong segera kabari saya ya.",
    timestamp: getRelativeDateString(-2) + " 16:05:00"
  },
  {
    id: "msg-3",
    senderId: "mother-1",
    senderRole: "mother",
    recipientId: "midwife-1",
    recipientName: "Siti Rahma, S.Tr.Keb",
    message: "Baik Bidan, Alhamdulillah bengkak wajah tidak ada. Terima kasih atas sarannya ya.",
    timestamp: getRelativeDateString(-2) + " 16:15:00"
  },
  {
    id: "msg-4",
    senderId: "mother-2",
    senderRole: "mother",
    recipientId: "midwife-1",
    recipientName: "Siti Rahma, S.Tr.Keb",
    message: "Bidan Siti, kepala saya pusing sekali sore ini dan pandangan mata agak silau kabur. Gerakan janin hari ini terasa lebih lambat dibanding biasanya.",
    timestamp: getRelativeDateString(-1) + " 17:00:00"
  }
];

// 4. Calendar ANC Appointments
export const initialAppointments: Appointment[] = [
  {
    id: "apt-1",
    motherId: "mother-1",
    date: getRelativeDateString(-14),
    time: "09:00",
    midwifeName: "Siti Rahma, S.Tr.Keb",
    type: "ANC 3",
    notes: "Pemeriksaan gula darah dan tes tekanan darah. Kondisi ibu dan bayi baik.",
    isCompleted: true
  },
  {
    id: "apt-2",
    motherId: "mother-1",
    date: getRelativeDateString(10), // Future visit
    time: "08:30",
    midwifeName: "Siti Rahma, S.Tr.Keb",
    type: "ANC 4",
    notes: "Konsultasi persiapan persalinan & imunisasi TT lanjutan.",
    isCompleted: false
  },
  {
    id: "apt-3",
    motherId: "mother-2",
    date: getRelativeDateString(-5),
    time: "10:00",
    midwifeName: "Siti Rahma, S.Tr.Keb",
    type: "ANC 5",
    notes: "Rujukan tinggi protein urin positif. Disarankan memantau tensi secara ketat.",
    isCompleted: true
  },
  {
    id: "apt-4",
    motherId: "mother-3",
    date: getRelativeDateString(3),
    time: "11:00",
    midwifeName: "Siti Rahma, S.Tr.Keb",
    type: "ANC 1",
    notes: "Pemeriksaan awal kehamilan, USG rujukan trimester pertama & skrining anemia.",
    isCompleted: false
  }
];

// 5. Digital Referral logs
export const initialReferrals: Referral[] = [
  {
    id: "ref-1",
    patientId: "mother-2",
    patientName: "Rina Astuti",
    gpaText: "G3P1A1",
    riskStatus: "RED",
    referralReason: "Preeklampsia Berat (TD 150/95mmHg, Proteinuria +1, Gangguan Pandangan Visual)",
    targetHospital: "RSUD Sayang Ibu (Pusat Rujukan Spesialis)",
    bedStatus: "Tersedia",
    ambulanceStatus: "Siaga",
    timestamp: getRelativeDateString(-1) + " 17:15",
    status: "Disetujui"
  }
];

// 6. Educational Content / CMS Articles
export const initialArticles: Article[] = [
  {
    id: "art-1",
    title: "Nutrisi Kehamilan Trimester Kedua: Panduan Lengkap Kalsium dan Protein",
    excerpt: "Memasuki minggu ke-13 sampai ke-27, kebutuhan kalsium untuk pembentukan tulang bayi dan protein meningkat pesat.",
    content: `Memasuki Trimester Kedua (Minggu 13-27), tubuh ibu hamil mengalami berbagai adaptasi luar biasa. Janin sedang aktif membangun struktur kerangka tubuh dan sistem ototnya.

Langkah Utama Pemenuhan Nutrisi:
1. Sumber Kalsium Tinggi: Konsumsi susu kedelai atau susu sapi khusus hamil, yogurt rendah lemak, sayur brokoli, kangkung, dan tahu/tempe berkualitas.
2. Tambahan Zat Besi: Zat besi sangat krusial untuk mencegah anemia gizi besi yang meningkatkan risiko perdarahan bersalin. Konsumsi sayuran hijau gelap, hati ayam/sapi matang sempurna, dan daging merah rendah lemak.
3. Protein Berkualitas Tinggi: Telur rebus matang (jangan setengah matang untuk menghindari Salmonella), dada ayam, ikan teri nasi kering, serta polong-polongan.

Makanan yang Harus Dihindari: Ensure any meats or seafood are thoroughly cooked (well done). Avoid raw salad bars if the washing practices are not guaranteed clean.
`,
    category: "Gizi",
    targetTrimester: 2,
    author: "Bidan Siti Rahma",
    publishedAt: getRelativeDateString(-30)
  },
  {
    id: "art-2",
    title: "Mengenal Tanda Bahaya Kehamilan Trimester Ketiga: Deteksi Dini Preeklampsia",
    excerpt: "Preeklampsia adalah komplikasi kehamilan serius yang ditandai tekanan darah tinggi dan protein urin positif.",
    content: `Pada Trimester Ketiga (Minggu 28-Melahirkan), pemantauan kesehatan harus dilakukan lebih ketat. Salah satu risiko yang paling diwaspadai adalah Preeklampsia Gestasional.

Tanda Bahaya Utama yang Harus Segera Dirujuk:
1. Sakit Kepala Hebat: Sakit kepala yang berdenyut kencang di bagian belakang kepala dan tidak hilang setelah istirahat.
2. Gangguan Penglihatan (Visual): Pandangan menjadi kabur, berkunang-kunang, atau peka berlebih pada cahaya (silau).
3. Nyeri Ulu Hati (Epigastrium): Rasa terbakar hebat di bagian ulu hati, sering kali disalahartikan sebagai sakit maag biasa.
4. Bengkak Mendadak: Pembengkakan tidak hanya di kaki, melainkan menjalar ke wajah (pipi dan kelopak mata) serta pergelangan tangan dalam waktu singkat.
5. Berkurangnya Gerakan Janin: Menurunnya aktivitas gerak bayi (< 10 kali gerakan aktif dalam durasi waktu 12 jam).

Jika Anda mengalami salah satu dari 5 kondisi darurat di atas, harap tidak menunda akses ke Fasilitas Kesehatan Tingkat Lanjut (Rumah Sakit) atau memanggil Bidan Wilayah terdekat.
`,
    category: "Kehamilan",
    targetTrimester: 3,
    author: "dr. Hendra Setiawan",
    publishedAt: getRelativeDateString(-15)
  },
  {
    id: "art-3",
    title: "Cara Menghitung Gerakan Janin Secara Mandiri Berbasis Metode 'Count-to-10'",
    excerpt: "Metode melacak gerakan aktif bayi untuk mendeteksi dini gawat janin secara murah di rumah.",
    content: `Melacak gerakan bayi adalah salah satu bentuk ikatan batin sekaligus metode mitigasi risiko kehamilan yang dianjurkan oleh WHO.

Kapan mulai dipantau? Mulai dari kehamilan minggu ke-24 dan seterusnya.

Cara Praktis Menghitung Gerakan:
1. Pilih Waktu yang Sama: Umumnya bayi sangat aktif setelah ibu makan atau saat malam hari dalam posisi istirahat baring miring ke kiri.
2. Hitung 10 Gerakan Terasa: Catat jam saat mulainya hitungan gerakan mandiri. Hitung setiap tendangan, desiran, atau geseran kuat janin.
3. Batas Waktu Aman: Idealnya, 10 gerakan harus dicapai dalam rentang waktu kurang dari 2 jam.
4. Batas Kritis: Jika dalam waktu 2 jam penuh, Anda merasakan kurang dari 10 gerakan ataupun jika respon gerakan dirasa lemah, segera minum air manis, berbaring miring kiri, dan jikalau belum merespon juga, datangi Bidan atau faskes terdekat untuk cek detak jantung bayi (dopler/CTG).
`,
    category: "Kehamilan",
    targetTrimester: 2,
    author: "Bidan Siti Rahma",
    publishedAt: getRelativeDateString(-10)
  }
];

// 7. Security Action Audit Logs
export const initialAuditLogs: AuditLog[] = [
  {
    id: "audit-1",
    timestamp: getRelativeDateString(-3) + " 08:31:02",
    userId: "admin-1",
    userName: "dr. Hendra Setiawan",
    userRole: "Administrator",
    action: "Ubah Hak Akses / Matriks RBAC",
    details: "Melakukan verifikasi akun Bidan baru atas nama Bidan Siti Rahma, S.Tr.Keb untuk area kerja Puskesmas Mekar Sari.",
    ipAddress: "192.168.12.44"
  },
  {
    id: "audit-2",
    timestamp: getRelativeDateString(-2) + " 10:15:45",
    userId: "midwife-1",
    userName: "Siti Rahma, S.Tr.Keb",
    userRole: "Bidan Wilayah",
    action: "Akses Rekam Medis Elektronik (RME)",
    details: "Membuka riwayat pemeriksaan laboratorium Kartika Sari (NIK 3273012345670001) terkait kepatuhan gizi besi.",
    ipAddress: "192.168.20.10"
  },
  {
    id: "audit-3",
    timestamp: getRelativeDateString(-1) + " 17:15:32",
    userId: "midwife-1",
    userName: "Siti Rahma, S.Tr.Keb",
    userRole: "Bidan Wilayah",
    action: "Buat Pengajuan Rujukan Digital",
    details: "Mengisi form rujukan darurat preeklampsia Rina Astuti (NIK 3273012345670002) menuju RSUD Sayang Ibu.",
    ipAddress: "192.168.20.10"
  },
  {
    id: "audit-4",
    timestamp: getRelativeDateString(0) + " 09:30:11",
    userId: "admin-1",
    userName: "dr. Hendra Setiawan",
    userRole: "Administrator",
    action: "Inisiasi Pencadangan Otomatis (Automated Backup)",
    details: "Menyalin enkripsi database klinis pasien triwulan II/III ke Cloud Storage terenkripsi untuk pencegahan bencana data.",
    ipAddress: "192.168.12.44"
  }
];
