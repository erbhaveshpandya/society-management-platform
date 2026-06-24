import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { VisitorLog } from '../../types';
import { Search, Calendar, User, Phone, CheckCircle, Clock } from 'lucide-react';

export const VisitorsPage: React.FC = () => {
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('All');

  const fetchVisitorLogs = async () => {
    try {
      const res = await axiosClient.get<VisitorLog[]>('visitors');
      setVisitorLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch visitor logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitorLogs();
  }, []);

  const filteredLogs = visitorLogs.filter((log) => {
    const matchesSearch =
      (log.visitorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.flatNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.vehicleNumber || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPurpose = purposeFilter === 'All' || log.purpose === purposeFilter;

    return matchesSearch && matchesPurpose;
  });

  const purposes = ['All', ...Array.from(new Set(visitorLogs.map((log) => log.purpose)))];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Visitor Logs History</h2>
        <p className="text-xs text-slate-500 mt-1">
          Monitor all visitor entries, vehicle numbers, check-in times, purposes, and checkout statuses.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
            <User size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Visitors</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{visitorLogs.length}</p>
          </div>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Currently Checked In</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">
              {visitorLogs.filter((v) => v.isActive).length}
            </p>
          </div>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Today's Visits</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">
              {
                visitorLogs.filter(
                  (v) =>
                    new Date(v.entryTime).toDateString() === new Date().toDateString()
                ).length
              }
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-4 flex flex-wrap gap-4 items-center justify-between bg-white">
        <div className="flex flex-1 max-w-md items-center relative">
          <Search className="absolute left-3 text-slate-400" size={16} />
          <Input
            placeholder="Search by visitor name, flat #, phone, plate #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 mb-0"
          />
        </div>
        <div>
          <select
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={purposeFilter}
            onChange={(e) => setPurposeFilter(e.target.value)}
          >
            {purposes.map((p) => (
              <option key={p} value={p}>
                {p === 'All' ? 'All Purposes' : p}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card>
        <Table headers={['Visitor', 'Phone', 'Vehicle Plate', 'Flat #', 'Purpose', 'Check-In Time', 'Check-Out Time', 'Status']}>
          {filteredLogs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <span className="font-semibold text-slate-800 block">{log.visitorName}</span>
                <span className="text-[10px] text-slate-400">By Guard: {log.checkedInByName || 'System'}</span>
              </td>
              <td className="px-6 py-4 text-slate-600 font-medium">
                <span className="flex items-center gap-1">
                  <Phone size={12} className="text-slate-400" />
                  {log.phone}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono font-bold text-slate-700">
                  {log.vehicleNumber || 'No Vehicle'}
                </span>
              </td>
              <td className="px-6 py-4 font-semibold text-slate-700">Flat {log.flatNumber || 'N/A'}</td>
              <td className="px-6 py-4 text-slate-500 font-medium text-xs">{log.purpose}</td>
              <td className="px-6 py-4">
                <span className="text-xs font-semibold text-slate-700 block">
                  {new Date(log.entryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {new Date(log.entryTime).toLocaleDateString('en-IN')}
                </span>
              </td>
              <td className="px-6 py-4">
                {log.exitTime ? (
                  <>
                    <span className="text-xs font-semibold text-slate-700 block">
                      {new Date(log.exitTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(log.exitTime).toLocaleDateString('en-IN')}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 font-medium italic">Still inside</span>
                )}
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={log.isActive ? 'Pending' : 'Paid'} />
                <span className="text-xs font-semibold text-slate-600 ml-2">
                  {log.isActive ? 'Inside' : 'Departed'}
                </span>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
};
