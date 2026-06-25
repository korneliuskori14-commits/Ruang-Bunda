/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, useDragControls } from 'motion/react';
import { Shield, Users, RefreshCw, Key, ChevronDown, ChevronUp, Database, GripVertical } from 'lucide-react';
import { User } from '../types';

interface RoleSwitcherProps {
  currentUser: User | null;
  onSwitchUser: (userId: string | null) => void;
  mockUsers: User[];
  onResetDatabase: () => void;
}

export default function RoleSwitcher({ currentUser, onSwitchUser, mockUsers, onResetDatabase }: RoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dragControls = useDragControls();

  // Separate users by role for quick access
  const mothers = mockUsers.filter(u => u.role === 'mother');
  const midwives = mockUsers.filter(u => u.role === 'midwife');
  const admins = mockUsers.filter(u => u.role === 'admin');

  return (
    <motion.div 
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      className="fixed bottom-4 right-4 z-50 max-w-sm w-80 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700/80 overflow-hidden font-sans"
      style={{ touchAction: 'none' }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-900 transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          {/* Drag grip handle */}
          <div 
            onPointerDown={(e) => {
              dragControls.start(e);
              e.stopPropagation();
            }}
            className="p-1 -ml-1 text-slate-500 hover:text-slate-350 rounded cursor-grab active:cursor-grabbing transition-colors"
            title="Tarik dengan kursor untuk geser kemana saja"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
            <Database className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold font-display tracking-wider text-slate-300 uppercase">
              Simulator Hub
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">
            UU PDP Compliant
          </span>
          {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {isOpen && (
        <div className="p-3 space-y-3 text-xs max-h-[400px] overflow-y-auto">
          {/* Current Session status */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold mb-1">Sesi Aktif</div>
            {currentUser ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white text-[13px]">{currentUser.name}</div>
                  <div className="text-[10px] text-emerald-400 font-mono capitalize flex items-center gap-1 mt-0.5">
                    <Shield className="w-3 h-3 text-emerald-400 inline" />
                    Role: {currentUser.role === 'mother' ? 'Ibu Hamil' : currentUser.role === 'midwife' ? 'Bidan' : 'Administrator'}
                  </div>
                </div>
                <div className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-900 px-1.5 py-0.5 rounded font-mono">
                  JWT: Verified
                </div>
              </div>
            ) : (
              <div className="text-slate-400 italic">Belum Login (Guest Landing Page)</div>
            )}
          </div>

          {/* Switch buttons */}
          <div className="space-y-2">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Simulasi Lompat Peran</div>
            
            {/* Guest Option */}
            <button
              onClick={() => onSwitchUser(null)}
              className={`w-full text-left p-1.5 rounded flex items-center justify-between border transition-all ${
                currentUser === null 
                  ? 'bg-slate-800 border-slate-600 text-white font-semibold' 
                  : 'bg-slate-950 hover:bg-slate-800 border-slate-900 text-slate-400'
              }`}
            >
              <span>🌐 Landing Page (Guest)</span>
              <span className="text-[9px] font-mono opacity-60">GUEST</span>
            </button>

            {/* Mother list */}
            <div className="space-y-1">
              <div className="text-[9px] text-slate-500 font-mono">Pasien Ibu Hamil:</div>
              {mothers.map(mo => {
                const isSelected = currentUser?.id === mo.id;
                const risk = mo.maternalProfile?.riskStatus;
                const badgeColor = risk === 'RED' ? 'text-rose-400 border-rose-900 bg-rose-950/40' : risk === 'YELLOW' ? 'text-amber-400 border-amber-900 bg-amber-950/40' : 'text-emerald-400 border-emerald-950 bg-emerald-950/40';
                
                return (
                  <button
                    key={mo.id}
                    onClick={() => onSwitchUser(mo.id)}
                    className={`w-full text-left p-1.5 rounded flex items-center justify-between border transition-all ${
                      isSelected 
                        ? 'bg-slate-800 border-indigo-500 text-indigo-200 font-semibold' 
                        : 'bg-slate-950 hover:bg-slate-800 border-slate-900 text-slate-300'
                    }`}
                  >
                    <span>🤰 {mo.name}</span>
                    <span className={`text-[8px] border px-1 py-0.2 rounded font-mono ${badgeColor}`}>
                      {risk} ({mo.maternalProfile?.gestationalWeeks}w)
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Midwives */}
            <div className="space-y-1">
              <div className="text-[9px] text-slate-500 font-mono">Klinis (Bidan):</div>
              {midwives.map(mi => {
                const isSelected = currentUser?.id === mi.id;
                return (
                  <button
                    key={mi.id}
                    onClick={() => onSwitchUser(mi.id)}
                    className={`w-full text-left p-1.5 rounded flex items-center justify-between border transition-all ${
                      isSelected 
                        ? 'bg-slate-800 border-emerald-500 text-emerald-200 font-semibold' 
                        : 'bg-slate-950 hover:bg-slate-800 border-slate-900 text-slate-300'
                    }`}
                  >
                    <span>🩺 {mi.name}</span>
                    <span className="text-[9px] text-emerald-400 font-mono">BIDAN</span>
                  </button>
                );
              })}
            </div>

            {/* Administrators */}
            <div className="space-y-1">
              <div className="text-[9px] text-slate-500 font-mono">Faskes / Dinkes (Admin):</div>
              {admins.map(ad => {
                const isSelected = currentUser?.id === ad.id;
                return (
                  <button
                    key={ad.id}
                    onClick={() => onSwitchUser(ad.id)}
                    className={`w-full text-left p-1.5 rounded flex items-center justify-between border transition-all ${
                      isSelected 
                        ? 'bg-slate-800 border-purple-500 text-purple-200 font-semibold' 
                        : 'bg-slate-950 hover:bg-slate-800 border-slate-900 text-slate-300'
                    }`}
                  >
                    <span>⚙️ {ad.name}</span>
                    <span className="text-[9px] text-purple-400 font-mono">ADMIN</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick operations */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={onResetDatabase}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors py-1 px-2 hover:bg-slate-800 rounded text-[10px]"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Database
            </button>
            <div className="flex items-center gap-1 text-slate-400 text-[10px]">
              <Key className="w-3 h-3 text-amber-500" />
              <span>TLS v1.3 SHA-256</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
