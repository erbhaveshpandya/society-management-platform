import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmergencyAlert } from '../../types';
import { AlertOctagon, Flame, ShieldAlert, HeartPulse, UserX, Clock, MapPin, Radio } from 'lucide-react';

const EMERGENCY_TYPES = [
  {
    type: 'Fire',
    label: 'Fire Emergency',
    color: 'from-rose-500 to-red-700 hover:from-rose-600 hover:to-red-800 focus:ring-red-300',
    icon: Flame,
    description: 'Smoke, gas leak, or active fire sightings.'
  },
  {
    type: 'Theft',
    label: 'Burglary / Theft',
    color: 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 focus:ring-orange-300',
    icon: ShieldAlert,
    description: 'Intrusion, break-in, or property damage reports.'
  },
  {
    type: 'SuspiciousActivity',
    label: 'Suspicious Activity',
    color: 'from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 focus:ring-amber-300',
    icon: UserX,
    description: 'Unidentified loiterers, tailgating vehicles.'
  },
  {
    type: 'Medical', // Backend enum is 'MedicalEmergency' ? Wait! In types.ts it is type: 'Fire' | 'Theft' | 'Medical' | 'SuspiciousActivity' | 'Other'
    label: 'Medical Emergency', // Let's match whatever matches backend
    color: 'from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 focus:ring-blue-300',
    icon: HeartPulse,
    description: 'Ambulance requirement, severe injury, elder distress.'
  }
];

export const EmergencyAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    description: ''
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAlerts = async () => {
    try {
      const res = await axiosClient.get<EmergencyAlert[]>('emergency-alerts');
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to load emergency alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleSirenTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !formData.description) return;

    // Map "Medical" frontend representation to backend expected "MedicalEmergency"
    const apiType = selectedType === 'Medical' ? 'MedicalEmergency' : selectedType;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await axiosClient.post('emergency-alerts', {
        type: apiType,
        description: formData.description
      });
      
      setSuccessMsg(`🚨 Broadcast successfully sent: ${selectedType.toUpperCase()} ALERT ACTIVE!`);
      setFormData({ description: '' });
      setSelectedType(null);
      fetchAlerts();
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      console.error('Failed to raise emergency alert:', err);
      setErrorMsg('Failed to broadcast alert. Please verify connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Emergency Alert Centre</h2>
          <p className="text-xs text-slate-500 mt-1">
            Trigger global community alerts in case of crisis. Residents and admins receive push notifications immediately.
          </p>
        </div>
        <div className="p-3 bg-red-100 text-red-600 rounded-xl border border-red-200 animate-pulse">
          <AlertOctagon size={24} />
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-lg flex items-center gap-3 shadow-md animate-bounce">
          <Radio size={20} className="text-red-600 animate-ping" />
          <div>
            <p className="text-sm font-black">{successMsg}</p>
            <p className="font-medium text-red-600 mt-0.5">Sirens & logs populated throughout the society database.</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold rounded-lg flex items-center gap-2">
          <AlertOctagon size={16} />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Panic Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-slate-900 border-none text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-24 bg-red-600/10 rounded-full blur-3xl"></div>
            <div className="relative space-y-4">
              <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                <Radio className="text-red-500 animate-pulse" size={18} /> Panic Hub - Click to Select Emergency Mode
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {EMERGENCY_TYPES.map((btn) => {
                  const Icon = btn.icon;
                  const isChosen = selectedType === btn.type;
                  return (
                    <button
                      key={btn.type}
                      type="button"
                      onClick={() => setSelectedType(btn.type)}
                      className={`p-4 rounded-xl text-left border transition-all flex items-start gap-3 bg-gradient-to-br ${btn.color} ${
                        isChosen
                          ? 'ring-4 ring-offset-2 ring-offset-slate-900 ring-red-500 border-transparent shadow-lg scale-98'
                          : 'border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="p-2.5 bg-white/10 rounded-lg text-white">
                        <Icon size={20} className={isChosen ? 'animate-bounce' : ''} />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-white">{btn.label}</h4>
                        <p className="text-[10px] text-slate-200 mt-0.5 leading-relaxed">{btn.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Form when emergency type is selected */}
          {selectedType && (
            <Card className="p-6 bg-white border border-red-100 shadow-md animate-slide-in">
              <div className="flex items-center gap-2 text-red-600 mb-4">
                <AlertOctagon size={18} className="animate-spin-slow" />
                <h4 className="font-bold text-sm">
                  Active Setup: Broadcast {selectedType.toUpperCase()} Emergency
                </h4>
              </div>
              <form onSubmit={handleSirenTrigger} className="space-y-4">
                <div className="text-left">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Describe Incident & Location (Required)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100 font-medium"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={`e.g. Smoke coming from Block A flat 402 kitchen area, fire engine notified. Residents please evacuate.`}
                    required
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setSelectedType(null);
                      setFormData({ description: '' });
                    }}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-red-600 hover:bg-red-700 text-xs font-bold flex items-center gap-1.5 px-6 shadow-red-100 shadow-lg"
                  >
                    <Radio size={14} className="animate-pulse" />
                    {submitting ? 'Broadcasting...' : 'ACTIVATE SIREN'}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>

        {/* Info Rules Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-5 bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Protocol & Guidelines</h4>
            <ul className="text-xs text-slate-500 space-y-2 list-disc list-inside leading-relaxed font-semibold">
              <li>Emergency sirens cannot be deleted or resolved inside the security ledger</li>
              <li>Always check double verification signals before pushing alerts</li>
              <li>Residents will immediately view alerts at the header of their dashboards</li>
              <li>Provide exact building code/flat number in details</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Broadcast History */}
      <Card className="p-0 overflow-hidden bg-white border border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 p-4 border-b border-slate-100 flex items-center gap-2">
          <Clock size={16} className="text-slate-500" /> Broadcast Alarm Logs
        </h3>
        <Table headers={['Emergency Type', 'Broadcast Description', 'Reported By', 'Role', 'Flat / Location', 'Timestamp']}>
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <tr key={alert.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                    alert.type === 'Fire'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : alert.type === 'Theft'
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : alert.type === 'SuspiciousActivity'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-sky-50 text-sky-700 border-sky-200'
                  }`}>
                    {alert.type === 'SuspiciousActivity' ? 'Suspicious Activity' : alert.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-slate-700 leading-relaxed max-w-md">
                  {alert.description}
                </td>
                <td className="px-6 py-4 font-semibold text-slate-700 text-xs">
                  {alert.reportedByName || 'System Guard'}
                </td>
                <td className="px-6 py-4 text-xs">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase">
                    {alert.reportedByRole === 'SocietyAdmin' ? 'Admin' : 
                     alert.reportedByRole === 'SecurityGuard' ? 'Guard' : 
                     alert.reportedByRole === 'SuperAdmin' ? 'Super Admin' : 'Resident'}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-slate-700 text-xs">
                  {alert.flatNumber ? `${alert.buildingName} - ${alert.flatNumber}` : 'Main Gate / General'}
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-slate-700 block">
                    {new Date(alert.reportedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    {new Date(alert.reportedAt).toLocaleDateString('en-IN')}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-10">
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 max-w-sm mx-auto my-4 rounded-lg border border-dashed border-slate-200">
                  <Radio size={36} className="text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-600">No Alarms Broadcasted</p>
                  <p className="text-xs text-slate-400 mt-1">Excellent! No emergency reports logged inside this society.</p>
                </div>
              </td>
            </tr>
          )}
        </Table>
      </Card>
    </div>
  );
};
