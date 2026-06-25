/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MaternalProfile {
  nik: string;
  bloodType: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  hpht: string; // YYYY-MM-DD
  hpl: string; // YYYY-MM-DD
  gestationalWeeks: number;
  gpa: {
    g: number; // Gravida (kehamilan)
    p: number; // Para (kelahiran)
    a: number; // Abortus (keguguran)
  };
  comorbidities: string[];
  village: string;
  riskScore: number; // Poedji Rochjati Score
  riskStatus: 'GREEN' | 'YELLOW' | 'RED';
  fundusHeightHistory: { date: string; height: number }[]; // cm
  labHistory: {
    date: string;
    hbLevel: number; // g/dL
    proteinUrine: 'Negatif' | 'Positif (+)' | 'Positif (++)';
    glycemia: number; // mg/dL
  }[];
}

export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: 'mother' | 'midwife' | 'admin';
  isVerifiedMidwife?: boolean;
  maternalProfile?: MaternalProfile;
}

export interface HealthLog {
  id: string;
  motherId: string;
  date: string;
  weight: number; // kg
  systolic: number;
  diastolic: number;
  fetalMovement: number; // kali per 12 jam
  symptoms: string[];
  notes?: string;
  riskStatus: 'GREEN' | 'YELLOW' | 'RED';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: 'mother' | 'midwife';
  recipientId: string;
  recipientName: string;
  message: string;
  timestamp: string;
}

export interface Appointment {
  id: string;
  motherId: string;
  date: string;
  time: string;
  midwifeName: string;
  type: 'ANC 1' | 'ANC 2' | 'ANC 3' | 'ANC 4' | 'ANC 5' | 'ANC 6' | 'Imunisasi' | 'Konsultasi';
  notes?: string;
  isCompleted: boolean;
  status?: 'Menunggu' | 'Hadir' | 'Terlewatkan';
}

export interface Referral {
  id: string;
  patientId: string;
  patientName: string;
  gpaText: string;
  riskStatus: 'GREEN' | 'YELLOW' | 'RED';
  referralReason: string;
  targetHospital: string;
  bedStatus: 'Tersedia' | 'Penuh';
  ambulanceStatus: 'Siaga' | 'Sedang Jalan';
  timestamp: string;
  status: 'Diajukan' | 'Disetujui' | 'Tiba di RS';
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'Gizi' | 'Kehamilan' | 'Persalinan' | 'Bayi Baru Lahir';
  targetTrimester: number;
  author: string;
  publishedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  ipAddress: string;
}
