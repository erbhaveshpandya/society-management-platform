import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../hooks/useAuth';
import axiosClient from '../../api/axiosClient';
import { Siren, Volume2, VolumeX, AlertOctagon, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';

interface EmergencyAlert {
  id: number;
  type: string;
  description: string;
  reportedByName: string;
  reportedByRole: string;
  flatNumber?: string;
  buildingName?: string;
  reportedAt: string;
  isResolved: boolean;
}

export const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // SOS Alarm Monitoring states
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [residentEmergency, setResidentEmergency] = useState<EmergencyAlert | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  const audioIntervalRef = useRef<any>(null);

  // Background polling for emergencies
  useEffect(() => {
    if (!user) return;

    const checkEmergencies = async () => {
      try {
        const res = await axiosClient.get<EmergencyAlert[]>('emergency-alerts');
        // Find latest unresolved alert
        const unresolved = res.data.find(
          (alert) => !alert.isResolved
        );

        if (unresolved) {
          // If guard or admin, show overlay if they haven't acknowledged it locally yet
          if ((user.role === 'SecurityGuard' || user.role === 'SocietyAdmin') && !acknowledgedIds.includes(unresolved.id)) {
            setActiveAlert(unresolved);
          } else {
            setActiveAlert(null);
          }
          // For residents, set the active alert so we can show the banner
          if (user.role === 'Resident') {
            setResidentEmergency(unresolved);
          } else {
            setResidentEmergency(null);
          }
        } else {
          setActiveAlert(null);
          setResidentEmergency(null);
        }
      } catch (err) {
        console.error('Failed to poll emergency alerts:', err);
      }
    };

    checkEmergencies(); // check immediately
    const interval = setInterval(checkEmergencies, 8000); // check every 8 seconds

    return () => clearInterval(interval);
  }, [user, acknowledgedIds]);

  // Audio Siren synthesizer loop
  useEffect(() => {
    if (activeAlert && !isMuted) {
      const playSirenBeep = () => {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(500, audioCtx.currentTime);
          osc.frequency.linearRampToValueAtTime(900, audioCtx.currentTime + 0.4);
          osc.frequency.linearRampToValueAtTime(500, audioCtx.currentTime + 0.8);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
          
          osc.start();
          osc.stop(audioCtx.currentTime + 0.8);
        } catch (e) {
          console.warn('Audio synthesis blocked by user interaction requirements');
        }
      };

      playSirenBeep(); // play immediately
      audioIntervalRef.current = setInterval(playSirenBeep, 1000);
    } else {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
    }

    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
    };
  }, [activeAlert, isMuted]);

  const handleAcknowledge = async () => {
    if (activeAlert) {
      try {
        await axiosClient.post(`emergency-alerts/${activeAlert.id}/resolve`);
      } catch (err) {
        console.warn('Failed to mark SOS as resolved in database:', err);
      }
      setAcknowledgedIds([...acknowledgedIds, activeAlert.id]);
      setActiveAlert(null);
      setIsMuted(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar (Sidebar is persistent on md screens and up) */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Drawer (overlay on mobile screen when hamburger clicked) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer content */}
          <div className="relative flex flex-col flex-1 max-w-xs w-full bg-slate-900 animate-slide-in">
            <Sidebar onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Pulsing Resident Warning Banner */}
        {residentEmergency && (
          <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white text-xs font-black py-3 px-6 text-center animate-pulse flex items-center justify-center gap-2 shadow-md border-b border-red-700">
            <span className="text-sm">🚨</span>
            <span className="tracking-wide uppercase">
              ACTIVE EMERGENCY: {residentEmergency.type.replace(/([A-Z])/g, ' $1').toUpperCase()} reported by {residentEmergency.reportedByName}
              {residentEmergency.flatNumber ? ` (Flat ${residentEmergency.flatNumber})` : ''} - "{residentEmergency.description}"
            </span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* EMERGENCY SOS GLOBAL ALARM OVERLAY MODAL */}
      {activeAlert && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-red-950/80 backdrop-blur-md p-4 animate-pulse-slow">
          <div className="bg-white border-4 border-red-600 rounded-2xl shadow-2xl p-6 md:p-8 max-w-lg w-full text-center space-y-6 animate-scale-up">
            <div className="flex justify-center">
              <div className="p-4 bg-red-100 text-red-600 rounded-full animate-bounce">
                <ShieldAlert size={48} />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-red-600 tracking-wider uppercase animate-pulse">
                🚨 EMERGENCY SOS SIGNAL 🚨
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                An active distress signal has been reported in the society.
              </p>
            </div>

            <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 text-left space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase">Reported By</span>
                <span className="col-span-2 font-bold text-slate-800">{activeAlert.reportedByName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-2.5">
                <span className="text-xs text-slate-400 font-bold uppercase">User Role</span>
                <span className="col-span-2 font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-xs inline-block w-fit">
                  {activeAlert.reportedByRole === 'SocietyAdmin' ? 'Society Admin' : 
                   activeAlert.reportedByRole === 'SecurityGuard' ? 'Security Guard' : 
                   activeAlert.reportedByRole === 'SuperAdmin' ? 'System Super Admin' : 'Resident'}
                </span>
              </div>
              {activeAlert.flatNumber && (
                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-2.5">
                  <span className="text-xs text-slate-400 font-bold uppercase">Flat / Location</span>
                  <span className="col-span-2 font-black text-slate-800">
                    {activeAlert.buildingName} - Flat {activeAlert.flatNumber}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-2.5">
                <span className="text-xs text-slate-400 font-bold uppercase">Alert Category</span>
                <span className="col-span-2 font-black text-red-600 uppercase tracking-wide">
                  {activeAlert.type.replace(/([A-Z])/g, ' $1')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-2.5">
                <span className="text-xs text-slate-400 font-bold uppercase">Timestamp</span>
                <span className="col-span-2 text-slate-600 font-medium">
                  {new Date(activeAlert.reportedAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-2.5">
                <span className="text-xs text-slate-400 font-bold uppercase">Description</span>
                <span className="col-span-2 text-slate-700 italic font-semibold leading-relaxed">
                  "{activeAlert.description}"
                </span>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="flex items-center justify-center p-3 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
              <Button
                variant="primary"
                onClick={handleAcknowledge}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm py-3 flex items-center justify-center gap-1.5 shadow-md"
              >
                <AlertOctagon size={16} /> Acknowledge & Mute Alarm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
