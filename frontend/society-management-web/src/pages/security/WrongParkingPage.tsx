import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ParkingAlert } from '../../types';
import { AlertTriangle, Plus, Search, CheckCircle, MapPin, Eye, Car } from 'lucide-react';

export const WrongParkingPage: React.FC = () => {
  const [alerts, setAlerts] = useState<ParkingAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    location: '',
    description: ''
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAlerts = async () => {
    try {
      const res = await axiosClient.get<ParkingAlert[]>('parking-alerts');
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to load parking alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleNumber || !formData.location) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await axiosClient.post('parking-alerts', {
        vehicleNumber: formData.vehicleNumber,
        location: formData.location,
        description: formData.description
      });
      setSuccessMsg(`🚨 Alert filed successfully for ${formData.vehicleNumber}!`);
      setFormData({ vehicleNumber: '', location: '', description: '' });
      fetchAlerts();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Failed to report parking alert:', err);
      setErrorMsg('Failed to log parking alert. Please check connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await axiosClient.post(`parking-alerts/${id}/resolve`);
      setSuccessMsg('✅ Violation resolved successfully.');
      fetchAlerts();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Failed to resolve parking alert:', err);
      setErrorMsg('Failed to mark alert as resolved.');
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      (alert.vehicleNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && !alert.isResolved) ||
      (statusFilter === 'Resolved' && alert.isResolved);

    return matchesSearch && matchesStatus;
  });

  const activeAlerts = alerts.filter((a) => !a.isResolved).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Wrong Parking Alerts</h2>
          <p className="text-xs text-slate-500 mt-1">
            File wrong parking violation reports at security gates, block pathways, or assign resolved flags.
          </p>
        </div>
        <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100">
          <AlertTriangle size={20} className="animate-pulse" />
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-lg flex items-center gap-2">
          <CheckCircle size={16} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-lg flex items-center gap-2">
          <AlertTriangle size={16} />
          {errorMsg}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-red-50 rounded-lg text-red-600">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Active Violations</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{activeAlerts}</p>
          </div>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Resolved Cases</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{alerts.length - activeAlerts}</p>
          </div>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
            <Car size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Reports Filed</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{alerts.length}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Violation Log Form */}
        <Card className="p-6 bg-white lg:col-span-1 border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
            <Plus size={16} className="text-red-500" /> Report Violation
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="License Plate Number"
              value={formData.vehicleNumber}
              onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
              placeholder="e.g. MH12AB1234"
              required
            />
            <Input
              label="Location of Incident"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Parking area Block C / Gate 2"
              required
            />
            <div className="text-left">
              <label className="block text-sm font-medium text-slate-700 mb-1">Violation Description</label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Double parked, blocking fire hydrant"
              ></textarea>
            </div>
            <Button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700">
              <AlertTriangle size={15} />
              {submitting ? 'Submitting...' : 'File Violation Report'}
            </Button>
          </form>
        </Card>

        {/* Violations List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 flex flex-wrap gap-4 items-center justify-between bg-white border border-slate-100">
            <div className="flex flex-1 max-w-md items-center relative">
              <Search className="absolute left-3 text-slate-400" size={16} />
              <Input
                placeholder="Search by license number, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 mb-0"
              />
            </div>
            <div>
              <select
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-primary-100"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Violations</option>
                <option value="Active">Active Alerts</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden bg-white border border-slate-100">
            <Table headers={['Vehicle Plate', 'Incident Location', 'Details', 'Reported At', 'Status', 'Actions']}>
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 rounded font-mono font-bold text-xs select-all">
                        {alert.vehicleNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700 text-xs">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        {alert.location}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 leading-relaxed max-w-xs truncate">
                      {alert.description || 'No additional details provided'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-slate-700 block">
                        {new Date(alert.reportedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[9px] text-slate-400 block">
                        {new Date(alert.reportedAt).toLocaleDateString('en-IN')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={alert.isResolved ? 'Resolved' : 'Overdue'} />
                    </td>
                    <td className="px-6 py-4">
                      {!alert.isResolved ? (
                        <Button
                          variant="outline"
                          onClick={() => handleResolve(alert.id)}
                          className="py-1 px-2.5 text-[10px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 font-semibold"
                        >
                          Resolve Alert
                        </Button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold italic">No Actions</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 max-w-sm mx-auto my-4 rounded-lg">
                      <Car size={36} className="text-slate-300 mb-2" />
                      <p className="text-sm font-semibold text-slate-600">No Parking Alerts Active</p>
                      <p className="text-xs text-slate-400 mt-1">Excellent! No parking violations logged under filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
};
