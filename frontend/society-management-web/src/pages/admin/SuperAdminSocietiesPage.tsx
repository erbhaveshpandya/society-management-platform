import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Plus, Building2, Users, Home, MapPin, Phone, Mail, Shield, ToggleLeft, ToggleRight } from 'lucide-react';

interface SocietyListItem {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  registrationNumber: string;
  contactPhone: string;
  contactEmail: string;
  isActive: boolean;
  createdAt: string;
  totalBuildings: number;
  totalFlats: number;
  totalResidents: number;
}

export const SuperAdminSocietiesPage: React.FC = () => {
  const [societies, setSocieties] = useState<SocietyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    registrationNumber: '',
    contactPhone: '',
    contactEmail: '',
  });

  const fetchSocieties = async () => {
    try {
      const res = await axiosClient.get<SocietyListItem[]>('societies');
      setSocieties(res.data);
    } catch (err) {
      console.error('Failed to load societies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocieties();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await axiosClient.post('societies', formData);
      setSuccessMsg(`✅ Society "${formData.name}" registered successfully!`);
      setFormData({
        name: '', address: '', city: '', state: '', pinCode: '',
        registrationNumber: '', contactPhone: '', contactEmail: '',
      });
      setIsOpen(false);
      fetchSocieties();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to create society. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await axiosClient.put(`societies/${id}`, {
        ...societies.find((s) => s.id === id),
        isActive: !currentActive,
      });
      fetchSocieties();
    } catch (err) {
      console.error('Failed to toggle society status:', err);
    }
  };

  const totalFlatsAllSocieties = societies.reduce((sum, s) => sum + s.totalFlats, 0);
  const totalResidentsAllSocieties = societies.reduce((sum, s) => sum + s.totalResidents, 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Society Management</h2>
          <p className="text-xs text-slate-500 mt-1">
            Register new housing societies, manage tenants, and monitor community metrics across all registered communities.
          </p>
        </div>
        <Button className="flex items-center gap-1.5" onClick={() => setIsOpen(true)}>
          <Plus size={16} /> Register Society
        </Button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-lg">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Registered Societies</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{societies.length}</p>
          </div>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Active</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">
              {societies.filter((s) => s.isActive).length}
            </p>
          </div>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
            <Home size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Flats</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalFlatsAllSocieties}</p>
          </div>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Residents</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalResidentsAllSocieties}</p>
          </div>
        </Card>
      </div>

      {/* Societies Table */}
      <Card className="p-0 overflow-hidden">
        <Table
          headers={[
            'Society Name',
            'Location',
            'Reg. Number',
            'Contact',
            'Buildings',
            'Flats',
            'Residents',
            'Status',
            'Actions',
          ]}
        >
          {societies.map((soc) => (
            <tr key={soc.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <span className="font-bold text-slate-800 block">{soc.name}</span>
                <span className="text-[9px] text-slate-400">
                  ID: {soc.id} · Created {new Date(soc.createdAt).toLocaleDateString('en-IN')}
                </span>
              </td>
              <td className="px-6 py-4 text-xs">
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  <MapPin size={12} className="text-slate-400" />
                  {soc.city}, {soc.state} — {soc.pinCode}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{soc.address}</span>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono font-bold text-slate-600">
                  {soc.registrationNumber || 'N/A'}
                </span>
              </td>
              <td className="px-6 py-4 text-xs text-slate-500 space-y-0.5">
                <span className="flex items-center gap-1">
                  <Phone size={11} className="text-slate-400" /> {soc.contactPhone || 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <Mail size={11} className="text-slate-400" /> {soc.contactEmail || 'N/A'}
                </span>
              </td>
              <td className="px-6 py-4 text-center font-bold text-slate-700">{soc.totalBuildings}</td>
              <td className="px-6 py-4 text-center font-bold text-slate-700">{soc.totalFlats}</td>
              <td className="px-6 py-4 text-center font-bold text-slate-700">{soc.totalResidents}</td>
              <td className="px-6 py-4">
                <StatusBadge status={soc.isActive ? 'Approved' : 'Rejected'} />
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => handleToggleActive(soc.id, soc.isActive)}
                  className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
                    soc.isActive
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {soc.isActive ? (
                    <>
                      <ToggleRight size={14} /> Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={14} /> Activate
                    </>
                  )}
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {/* Registration Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Register New Housing Society">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Society Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Sunrise Heights Co-op"
            required
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g. Plot 42, Sector 7, Baner"
            required
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g. Pune"
              required
            />
            <Input
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="e.g. Maharashtra"
              required
            />
            <Input
              label="Pincode"
              value={formData.pinCode}
              onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
              placeholder="e.g. 411045"
              required
            />
          </div>
          <Input
            label="Registration Number"
            value={formData.registrationNumber}
            onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
            placeholder="e.g. MH/HSG/2024/12345"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              placeholder="e.g. 9876543210"
              required
            />
            <Input
              label="Contact Email"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="e.g. admin@sunrise.com"
              required
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-500 leading-relaxed">
            <p className="font-bold text-slate-600 mb-1">What happens next?</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>The society is created with Active status</li>
              <li>Use the "User Management" page to create an Admin user for this society</li>
              <li>The admin can then onboard residents, create buildings, and flats</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex items-center gap-1.5">
              <Building2 size={16} />
              {submitting ? 'Registering...' : 'Register Society'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
