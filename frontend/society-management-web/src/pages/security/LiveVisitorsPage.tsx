import React, { useEffect, useState, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { VisitorLog } from '../../types';
import { Search, LogOut, Users, Clock, Phone, RefreshCw } from 'lucide-react';

export const LiveVisitorsPage: React.FC = () => {
  const [visitors, setVisitors] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOutId, setCheckingOutId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchActiveVisitors = useCallback(async () => {
    try {
      const res = await axiosClient.get<VisitorLog[]>('visitors', { params: { activeOnly: true } });
      setVisitors(res.data);
    } catch (err) {
      console.error('Failed to load active visitors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveVisitors();
    const interval = setInterval(fetchActiveVisitors, 15000);
    return () => clearInterval(interval);
  }, [fetchActiveVisitors]);

  const handleCheckout = async (id: number) => {
    setCheckingOutId(id);
    try {
      await axiosClient.post(`visitors/${id}/checkout`);
      setVisitors((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error('Failed to checkout visitor:', err);
    } finally {
      setCheckingOutId(null);
    }
  };

  const filteredVisitors = visitors.filter(
    (v) =>
      v.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.flatNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Live Visitor Log</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time view of all visitors currently inside the society premises
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-1.5" onClick={() => { setLoading(true); fetchActiveVisitors(); }}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Currently Inside</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{visitors.length}</p>
          </div>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Avg. Duration</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">
              {visitors.length > 0
                ? Math.round(
                    visitors.reduce((sum, v) => sum + (Date.now() - new Date(v.entryTime).getTime()) / 60000, 0) /
                      visitors.length
                  )
                : 0}{' '}
              min
            </p>
          </div>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <Phone size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">With Vehicle</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">
              {visitors.filter((v) => v.vehicleNumber).length}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-4 flex items-center gap-4 bg-white">
        <div className="flex flex-1 max-w-md items-center relative">
          <Search className="absolute left-3 text-slate-400" size={16} />
          <Input
            placeholder="Search by name, flat, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 mb-0"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">Auto-refreshes every 15s</span>
      </Card>

      {filteredVisitors.length === 0 ? (
        <EmptyState
          title="No Active Visitors"
          message="There are no visitors currently checked in at the gate."
          icon={<Users size={48} className="text-slate-300" />}
        />
      ) : (
        <Card>
          <Table headers={['Visitor', 'Phone', 'Vehicle', 'Destination', 'Purpose', 'Entry Time', 'Duration', 'Action']}>
            {filteredVisitors.map((visitor) => {
              const duration = Math.round((Date.now() - new Date(visitor.entryTime).getTime()) / 60000);
              const hours = Math.floor(duration / 60);
              const mins = duration % 60;
              return (
                <tr key={visitor.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-800 block">{visitor.visitorName}</span>
                    <span className="text-[10px] text-slate-400">By: {visitor.checkedInByName || 'System'}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium text-sm">{visitor.phone}</td>
                  <td className="px-6 py-4">
                    {visitor.vehicleNumber ? (
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono font-bold text-slate-700">
                        {visitor.vehicleNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Walk-in</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700 text-sm">Flat {visitor.flatNumber || 'N/A'}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">{visitor.purpose}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold text-slate-700 block">
                      {new Date(visitor.entryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(visitor.entryTime).toLocaleDateString('en-IN')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold ${duration > 120 ? 'text-red-500' : duration > 60 ? 'text-amber-500' : 'text-emerald-600'}`}>
                      {hours > 0 ? `${hours}h ` : ''}{mins}m
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      variant="danger"
                      className="flex items-center gap-1 text-xs px-3 py-1.5"
                      onClick={() => handleCheckout(visitor.id)}
                      disabled={checkingOutId === visitor.id}
                    >
                      <LogOut size={13} />
                      {checkingOutId === visitor.id ? 'Leaving...' : 'Check Out'}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </Table>
        </Card>
      )}
    </div>
  );
};
