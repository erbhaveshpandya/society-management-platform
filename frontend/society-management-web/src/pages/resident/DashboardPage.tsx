import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { KpiCard } from '../../components/shared/KpiCard';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DollarSign, MessageSquare, Calendar, Bell, Building } from 'lucide-react';

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

  useEffect(() => {
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
    fetchDashboard();
  }, []);

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

        {/* Quick Links */}
        <Card title="Quick Guidelines" className="lg:col-span-1">
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
  );
};
