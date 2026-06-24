import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Flat } from '../../types';
import { UserPlus, Car, Phone, Home, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const PURPOSES = ['Guest', 'Delivery', 'Cab', 'Maintenance', 'Domestic Help', 'Official', 'Other'];

export const VisitorEntryPage: React.FC = () => {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    visitorName: '',
    phone: '',
    vehicleNumber: '',
    flatId: '',
    purpose: 'Guest',
  });

  useEffect(() => {
    const fetchFlats = async () => {
      try {
        const res = await axiosClient.get<Flat[]>('flats');
        setFlats(res.data);
      } catch (err) {
        console.error('Failed to fetch flats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFlats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await axiosClient.post('visitors', {
        visitorName: formData.visitorName,
        phone: formData.phone,
        vehicleNumber: formData.vehicleNumber || null,
        flatId: parseInt(formData.flatId),
        purpose: formData.purpose,
      });
      setSuccessMsg(`✅ ${formData.visitorName} checked in successfully!`);
      setFormData({ visitorName: '', phone: '', vehicleNumber: '', flatId: '', purpose: 'Guest' });
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to check in visitor. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary-50 rounded-xl text-primary-600 border border-primary-100">
          <UserPlus size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Check In Visitor</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register guest details at the gate for society entry
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-lg flex items-center gap-2 animate-pulse">
          <CheckCircle size={16} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-lg flex items-center gap-2">
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      <Card className="p-6 bg-white">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Visitor Name"
                value={formData.visitorName}
                onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                placeholder="e.g. Rajesh Kumar"
                required
              />
            </div>
            <div>
              <Input
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Vehicle Number (Optional)"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                placeholder="e.g. MH12AB1234"
              />
            </div>
            <div className="text-left">
              <label className="block text-sm font-medium text-slate-700 mb-1">Purpose of Visit</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 text-sm"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                required
              >
                {PURPOSES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-left">
            <label className="block text-sm font-medium text-slate-700 mb-1">Destination Flat</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 text-sm"
              value={formData.flatId}
              onChange={(e) => setFormData({ ...formData, flatId: e.target.value })}
              required
            >
              <option value="">-- Select Flat --</option>
              {flats.map((flat) => (
                <option key={flat.id} value={flat.id}>
                  {flat.flatNumber} {flat.buildingName ? `(${flat.buildingName})` : ''} {flat.ownerName ? `— ${flat.ownerName}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormData({ visitorName: '', phone: '', vehicleNumber: '', flatId: '', purpose: 'Guest' })}
            >
              Clear Form
            </Button>
            <Button type="submit" disabled={submitting} className="flex items-center gap-1.5">
              <UserPlus size={16} />
              {submitting ? 'Checking In...' : 'Check In Visitor'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-4 bg-slate-50/50 border-slate-100">
        <div className="flex items-start gap-3">
          <FileText size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-slate-500 leading-relaxed">
            <p className="font-semibold text-slate-600 mb-1">Gate Entry Protocol</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Verify visitor identity before entry</li>
              <li>Flat residents will receive an automatic notification</li>
              <li>Vehicle number plate is optional for walk-in visitors</li>
              <li>All entries are logged with timestamp and guard ID</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
