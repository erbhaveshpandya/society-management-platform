import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { KpiCard } from '../../components/shared/KpiCard';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { DollarSign, MessageSquare, Calendar, Bell, Building, Siren, Flame, ShieldAlert, AlertTriangle } from 'lucide-react';

interface RecentNotice {
  id: number;
  title: string;
  category: string;
  publishedDate: string;
}

interface ResidentDashboardData {
  totalDues: number;
  openComplaints: number;
  activeBookings: number;
  unreadNotifications: number;
  flatNumber: string;
  buildingName: string;
  recentNotices: RecentNotice[];
}

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<ResidentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // SOS state
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [sosType, setSosType] = useState<'MedicalEmergency' | 'Fire' | 'Theft'>('MedicalEmergency');
  const [sosDescription, setSosDescription] = useState('');
  const [sosSubmitting, setSosSubmitting] = useState(false);
  const [sosSuccess, setSosSuccess] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await axiosClient.get<ResidentDashboardData>('dashboard/resident');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load resident dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleTriggerSOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setSosSubmitting(true);
    setSosSuccess('');

    try {
      const desc = sosDescription.trim() || `SOS Panic Alert triggered from Flat ${data.flatNumber} (${data.buildingName})`;
      await axiosClient.post('emergency-alerts', {
        type: sosType,
        description: desc
      });
      setSosSuccess('🚨 Emergency SOS alert broadcasted! Gate security has been notified.');
      setSosDescription('');
      setTimeout(() => {
        setIsSosOpen(false);
        setSosSuccess('');
      }, 5000);
    } catch (err) {
      console.error('Failed to trigger panic alert:', err);
      alert('Failed to trigger panic alert. Please contact emergency services directly.');
    } finally {
      setSosSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="text-center py-10">Failed to load dashboard.</div>;

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Resident Portal</h2>
          <p className="text-xs text-slate-500 mt-1">Welcome back. Access billing, submit issues, and book amenities.</p>
        </div>
        <div className="mt-3 sm:mt-0 px-4 py-2 bg-primary-50 rounded-xl border border-primary-100 flex items-center gap-2">
          <Building className="text-primary-600" size={16} />
          <span className="text-xs font-semibold text-primary-800">
            {data.buildingName} — Flat {data.flatNumber}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Outstanding Dues"
          value={`₹${data.totalDues.toLocaleString()}`}
          icon={<DollarSign size={20} />}
          description="Pending maintenance fees"
          trend="Dues"
          trendColor={data.totalDues > 0 ? 'red' : 'green'}
        />
        <KpiCard
          title="Open Complaints"
          value={data.openComplaints}
          icon={<MessageSquare size={20} />}
          description="Tickets in progress"
          trend="My Tickets"
          trendColor={data.openComplaints > 0 ? 'red' : 'slate'}
        />
        <KpiCard
          title="Active Bookings"
          value={data.activeBookings}
          icon={<Calendar size={20} />}
          description="Reserved slots for amenities"
          trend="Bookings"
          trendColor="blue"
        />
        <KpiCard
          title="Unread Messages"
          value={data.unreadNotifications}
          icon={<Bell size={20} />}
          description="New inbox notifications"
          trend="Alerts"
          trendColor={data.unreadNotifications > 0 ? 'red' : 'slate'}
        />
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Notices */}
        <Card title="Latest Announcements & Bulletins" className="lg:col-span-2">
          {data.recentNotices.length === 0 ? (
            <div className="text-xs text-slate-400 py-8 text-center">No announcements published recently.</div>
          ) : (
            <div className="space-y-4">
              {data.recentNotices.map((notice) => (
                <div key={notice.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-primary-600 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded">
                      {notice.category}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(notice.publishedDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-1">{notice.title}</h4>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right Sidebar: SOS Alert & Guidelines */}
        <div className="space-y-6 lg:col-span-1">
          {/* Panic SOS Widget */}
          <Card className="border-red-100 bg-red-50/10 p-5 shadow-sm text-left">
            <div className="flex items-center gap-2.5 mb-3 text-red-600">
              <Siren size={20} className="animate-pulse" />
              <h3 className="text-sm font-extrabold tracking-tight uppercase">Emergency SOS Panic</h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
              Experiencing a life-threatening scenario? Instantly trigger a loud siren alert at the security guard station.
            </p>
            <Button
              variant="primary"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 animate-bounce shadow-md flex items-center justify-center gap-1.5"
              onClick={() => setIsSosOpen(true)}
            >
              <Siren size={15} /> Trigger SOS Alarm
            </Button>
          </Card>

          {/* Quick Guidelines */}
          <Card title="Quick Guidelines">
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                <strong>Maintenance:</strong> Dues must be settled online by the 10th of every month.
              </p>
              <p>
                <strong>Complaints:</strong> Submit ticket details for plumbing, elevator, or safety concerns. Our staff updates log comments.
              </p>
              <p>
                <strong>Amenity Booking:</strong> Slots can be reserved up to 15 days in advance. Duplicate requests are auto-rejected.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* SOS TRIGGER SELECTION MODAL */}
      <Modal
        isOpen={isSosOpen}
        onClose={() => !sosSubmitting && setIsSosOpen(false)}
        title="⚠️ Trigger Security SOS Alarm"
      >
        <form onSubmit={handleTriggerSOS} className="space-y-4 text-left">
          {sosSuccess ? (
            <div className="p-4 bg-red-600 border border-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-2.5 animate-pulse">
              <Siren size={20} />
              <span>{sosSuccess}</span>
            </div>
          ) : (
            <>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  <strong>WARNING:</strong> This will sound an alarm alert at the security gate room. Use ONLY in genuine emergencies. Abuse is subject to society panel penalties.
                </p>
              </div>

              <div className="text-left space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase">Emergency Category</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSosType('MedicalEmergency')}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                      sosType === 'MedicalEmergency'
                        ? 'border-red-500 bg-red-50/30 text-red-600'
                        : 'border-slate-100 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <Siren size={16} />
                    <span>Medical</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSosType('Fire')}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                      sosType === 'Fire'
                        ? 'border-red-500 bg-red-50/30 text-red-600'
                        : 'border-slate-100 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <Flame size={16} />
                    <span>Fire Alert</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSosType('Theft')}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                      sosType === 'Theft'
                        ? 'border-red-500 bg-red-50/30 text-red-600'
                        : 'border-slate-100 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <ShieldAlert size={16} />
                    <span>Security</span>
                  </button>
                </div>
              </div>

              <div className="text-left space-y-1">
                <label className="block text-xs font-bold text-slate-600 uppercase">Additional Info (Optional)</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 text-xs bg-white h-20 leading-relaxed text-slate-700"
                  placeholder="e.g. Heart pain, Fire in kitchen, Suspicious stranger at window..."
                  value={sosDescription}
                  onChange={(e) => setSosDescription(e.target.value)}
                  disabled={sosSubmitting}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setIsSosOpen(false)} disabled={sosSubmitting}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={sosSubmitting} className="bg-red-600 hover:bg-red-700 text-white font-bold">
                  {sosSubmitting ? 'Broadcasting...' : 'ACTIVATE ALARM NOW'}
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
};
