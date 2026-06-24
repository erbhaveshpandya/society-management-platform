import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { KpiCard } from '../../components/shared/KpiCard';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DollarSign, MessageSquare, Users, Building, Activity } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardData {
  totalMaintenanceCollected: number;
  pendingMaintenanceAmount: number;
  openComplaints: number;
  activeVisitors: number;
  upcomingMeetings: number;
  totalFlats: number;
  occupiedFlats: number;
  vacantFlats: number;
  monthlyCollections: { month: string; amount: number }[];
  complaintsByCategory: { category: string; count: number }[];
}

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axiosClient.get<DashboardData>('dashboard/admin');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="text-center py-10">Failed to load dashboard.</div>;

  const COLORS = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#0284c7'];

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Admin Dashboard</h2>
        <p className="text-xs text-slate-500 mt-1">Real-time statistics and overview of your housing society.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Maintenance Collected"
          value={`₹${data.totalMaintenanceCollected.toLocaleString()}`}
          icon={<DollarSign size={20} />}
          description="Total funds collected"
          trend="₹ Collected"
          trendColor="green"
        />
        <KpiCard
          title="Pending Invoices"
          value={`₹${data.pendingMaintenanceAmount.toLocaleString()}`}
          icon={<DollarSign size={20} />}
          description="Awaiting resident payments"
          trend="₹ Pending"
          trendColor="red"
        />
        <KpiCard
          title="Open Complaints"
          value={data.openComplaints}
          icon={<MessageSquare size={20} />}
          description="Requires committee action"
          trend={`${data.openComplaints} Active`}
          trendColor={data.openComplaints > 0 ? 'red' : 'green'}
        />
        <KpiCard
          title="Active Visitors"
          value={data.activeVisitors}
          icon={<Users size={20} />}
          description="Currently inside society gate"
          trend="On Premise"
          trendColor="blue"
        />
      </div>

      {/* Occupancy Status & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flats Occupancy Summary */}
        <Card title="Flat Occupancy Summary" className="lg:col-span-1">
          <div className="flex flex-col justify-between h-64">
            <div className="space-y-4 mt-2">
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <Building size={16} className="text-slate-400" />
                  Total Flats
                </span>
                <span className="text-base font-bold text-slate-800">{data.totalFlats}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <Building size={16} className="text-emerald-500" />
                  Occupied Flats
                </span>
                <span className="text-base font-bold text-emerald-600">{data.occupiedFlats}</span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <Building size={16} className="text-amber-500" />
                  Vacant Flats
                </span>
                <span className="text-base font-bold text-amber-600">{data.vacantFlats}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                <span>Occupancy Rate</span>
                <span>{data.totalFlats > 0 ? Math.round((data.occupiedFlats / data.totalFlats) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${data.totalFlats > 0 ? (data.occupiedFlats / data.totalFlats) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Monthly Collections Chart */}
        <Card title="Maintenance Collections History" className="lg:col-span-2">
          <div className="h-64 w-full">
            {data.monthlyCollections.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">No collection history available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyCollections} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="amount" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Complaints by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Complaints By Category" className="lg:col-span-2">
          <div className="h-64 w-full flex items-center justify-center">
            {data.complaintsByCategory.length === 0 ? (
              <div className="text-xs text-slate-400">No complaint data recorded.</div>
            ) : (
              <div className="flex w-full h-full items-center justify-around flex-col sm:flex-row">
                <div className="h-full w-full max-w-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.complaintsByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="count"
                      >
                        {data.complaintsByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 text-left">
                  {data.complaintsByCategory.map((c, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="font-medium">{c.category}:</span>
                      <span className="text-slate-800 font-bold">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Board Meetings / Announcements */}
        <Card title="Upcoming Committee Events" className="lg:col-span-1">
          <div className="h-64 flex flex-col justify-start space-y-4 overflow-y-auto">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
              <div className="p-2 bg-primary-50 rounded-lg text-primary-600 shrink-0">
                <Activity size={18} />
              </div>
              <div className="text-xs text-left">
                <p className="font-semibold text-slate-800 mb-0.5">Annual General Meeting (AGM)</p>
                <p className="text-slate-500 mb-1 leading-normal">Community hall at 6:00 PM. Seeding review & budgeting.</p>
                <span className="text-[10px] text-primary-600 font-semibold uppercase">June 30, 2026</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
              <div className="p-2 bg-primary-50 rounded-lg text-primary-600 shrink-0">
                <Activity size={18} />
              </div>
              <div className="text-xs text-left">
                <p className="font-semibold text-slate-800 mb-0.5">Water Pipe Restoration</p>
                <p className="text-slate-500 mb-1 leading-normal">Wakad pipeline replacement by main contractor.</p>
                <span className="text-[10px] text-primary-600 font-semibold uppercase">June 25, 2026</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
