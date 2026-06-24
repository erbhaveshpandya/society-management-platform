import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { KpiCard } from '../../components/shared/KpiCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ShieldAlert, UserPlus, Users, Clock, AlertTriangle, Car } from 'lucide-react';

interface SecurityDashboardData {
  activeVisitors: number;
  todayVisitors: number;
  staffCheckedIn: number;
  parkingAlerts: number;
  emergencyAlerts: number;
}

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<SecurityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const res = await axiosClient.get<SecurityDashboardData>('dashboard/security');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load security dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const triggerEmergency = async (type: string) => {
    if (!window.confirm(`Are you sure you want to raise a ${type} emergency alert? This will notify the society admin immediately!`)) return;

    try {
      await axiosClient.post('emergency-alerts', {
        type,
        description: `Emergency ${type} reported by guard at main gate.`
      });
      alert('Emergency alert broadcasted successfully!');
      fetchDashboard();
    } catch (err) {
      console.error(err);
      alert('Failed to trigger emergency.');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="text-center py-10">Failed to load dashboard.</div>;

  return (
    <div className="space-y-6 text-left max-w-lg mx-auto">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg shadow-slate-900/10">
        <h2 className="text-xl font-bold">Gate Guard Terminal</h2>
        <p className="text-xs text-slate-400 mt-1 leading-normal">
          Real-time check-in log, attendance logs, and instant emergency notification dials.
        </p>
        
        <div className="grid grid-cols-2 gap-3 mt-6">
          <Button
            variant="primary"
            className="flex items-center justify-center gap-1.5 py-3 text-xs bg-primary-500 hover:bg-primary-600 border-none"
            onClick={() => navigate('/security/visitor-entry')}
          >
            <UserPlus size={16} /> New Visitor
          </Button>
          <Button
            variant="secondary"
            className="flex items-center justify-center gap-1.5 py-3 text-xs bg-slate-800 hover:bg-slate-700 text-white border-none"
            onClick={() => navigate('/security/live-visitors')}
          >
            <Users size={16} /> View Logs
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="space-y-4">
        <KpiCard
          title="On-Premise Visitors"
          value={data.activeVisitors}
          icon={<Users size={20} />}
          description="Awaiting checkout"
          trend="In Log"
          trendColor="blue"
        />
        <KpiCard
          title="Domestic Staff In"
          value={data.staffCheckedIn}
          icon={<Clock size={20} />}
          description="Housemaids & drivers active"
          trend="Checked In"
          trendColor="green"
        />
        <KpiCard
          title="Parking Violations"
          value={data.parkingAlerts}
          icon={<Car size={20} />}
          description="Active wrong parking reports"
          trend="Alerts"
          trendColor={data.parkingAlerts > 0 ? 'red' : 'slate'}
        />
        <KpiCard
          title="Active Emergencies"
          value={data.emergencyAlerts}
          icon={<ShieldAlert size={20} />}
          description="Requires immediate action"
          trend="Critical"
          trendColor={data.emergencyAlerts > 0 ? 'red' : 'slate'}
        />
      </div>

      {/* Instant Emergency Dials */}
      <Card title="Instant Emergency Dials">
        <p className="text-xs text-slate-500 mb-4 leading-normal">
          Clicking these dials creates an emergency ticket in the system and triggers administrative alarms immediately.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="danger"
            className="flex flex-col items-center gap-1 py-4 text-xs font-semibold"
            onClick={() => triggerEmergency('Fire')}
          >
            <AlertTriangle size={24} />
            FIRE EMERGENCY
          </Button>
          <Button
            variant="danger"
            className="flex flex-col items-center gap-1 py-4 text-xs font-semibold"
            onClick={() => triggerEmergency('Medical')}
          >
            <AlertTriangle size={24} />
            MEDICAL AID
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white flex flex-col items-center gap-1 py-4 text-xs font-semibold"
            onClick={() => triggerEmergency('Theft')}
          >
            <AlertTriangle size={24} />
            THEFT REPORT
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white flex flex-col items-center gap-1 py-4 text-xs font-semibold"
            onClick={() => triggerEmergency('SuspiciousActivity')}
          >
            <AlertTriangle size={24} />
            SUSPICIOUS PERS
          </Button>
        </div>
      </Card>
    </div>
  );
};
