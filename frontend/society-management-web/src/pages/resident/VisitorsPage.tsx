import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Flat, VisitorLog } from '../../types';
import { User, Phone, CheckCircle, Clock, Calendar, QrCode, ClipboardCheck, Plus, List, ArrowRight } from 'lucide-react';

interface PreRegisteredPass {
  id: number;
  visitorName: string;
  phone: string;
  vehicleNumber?: string;
  expectedDate: string;
  purpose: string;
  passcode: string;
  flatNumber: string;
}

const PURPOSES = ['Guest', 'Delivery', 'Cab', 'Maintenance', 'Official', 'Other'];

export const VisitorsPage: React.FC = () => {
  const { user } = useAuth();
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [preRegistered, setPreRegistered] = useState<PreRegisteredPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'logs' | 'preregister' | 'passes'>('logs');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    visitorName: '',
    phone: '',
    vehicleNumber: '',
    flatId: '',
    purpose: 'Guest',
    expectedDate: new Date().toISOString().split('T')[0],
  });

  const [createdPass, setCreatedPass] = useState<PreRegisteredPass | null>(null);

  const fetchData = async () => {
    try {
      const [visitorsRes, flatsRes, passesRes] = await Promise.all([
        axiosClient.get<VisitorLog[]>('visitors'),
        axiosClient.get<Flat[]>('flats'),
        axiosClient.get<PreRegisteredPass[]>('visitors/pre-registered')
      ]);

      setVisitorLogs(visitorsRes.data);
      setFlats(flatsRes.data);
      setPreRegistered(passesRes.data);
    } catch (err) {
      console.error('Failed to load visitors data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Identify resident's flats
  const myFlats = flats.filter(
    (f) =>
      f.ownerId === user?.id ||
      (f.residents && f.residents.some((r: any) => r.userId === user?.id))
  );

  const myFlatIds = myFlats.map((f) => f.id);

  // Filter visitor logs to only show guests for resident's flats
  const myVisitorLogs = visitorLogs.filter((log) => myFlatIds.includes(log.flatId));

  const handlePreRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.visitorName || !formData.phone || !formData.flatId) return;

    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await axiosClient.post<PreRegisteredPass>('visitors/pre-register', {
        visitorName: formData.visitorName,
        phone: formData.phone,
        vehicleNumber: formData.vehicleNumber || null,
        flatId: parseInt(formData.flatId),
        purpose: formData.purpose,
        expectedDate: formData.expectedDate,
      });

      const newPass = res.data;
      setPreRegistered([newPass, ...preRegistered]);
      setCreatedPass(newPass);
      setSuccessMsg('Guest pre-registered successfully!');
      setFormData({
        visitorName: '',
        phone: '',
        vehicleNumber: '',
        flatId: '',
        purpose: 'Guest',
        expectedDate: new Date().toISOString().split('T')[0],
      });
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to pre-register guest. Please try again.');
    }
  };

  const copyInviteMessage = (pass: PreRegisteredPass) => {
    const message = `Hi ${pass.visitorName}, here is your Pre-Entry digital pass for ${user?.societyName || 'our society'}.\n📍 Destination: Flat ${pass.flatNumber}\n📅 Date: ${pass.expectedDate}\n🔑 Gate Code: ${pass.passcode}\nPlease show this pass / code at the security gate for seamless entry.`;
    navigator.clipboard.writeText(message);
    alert('Invitation message copied to clipboard!');
  };

  const deletePass = async (id: number) => {
    if (!window.confirm('Are you sure you want to revoke this digital gate pass?')) return;
    try {
      await axiosClient.delete(`visitors/pre-registered/${id}`);
      setPreRegistered(preRegistered.filter((p) => p.id !== id));
      setSuccessMsg('Gate pass revoked successfully.');
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err) {
      console.error(err);
      alert('Failed to revoke pass.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-bold text-slate-800">My Visitors & Guest Entry</h2>
        <p className="text-xs text-slate-500 mt-1">
          Monitor current guests checked into your flats and pre-register upcoming visitors.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
            <User size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Guest Visits</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{myVisitorLogs.length}</p>
          </div>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Guests Currently Inside</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">
              {myVisitorLogs.filter((v) => v.isActive).length}
            </p>
          </div>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
            <QrCode size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Pre-registered Invites</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{preRegistered.length}</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-100 pb-px">
        <button
          onClick={() => {
            setActiveTab('logs');
            setCreatedPass(null);
          }}
          className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all flex items-center gap-2 ${
            activeTab === 'logs' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <List size={15} /> My Visitor History
        </button>
        <button
          onClick={() => {
            setActiveTab('preregister');
          }}
          className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all flex items-center gap-2 ${
            activeTab === 'preregister' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Plus size={15} /> Pre-Register Guest
        </button>
        <button
          onClick={() => {
            setActiveTab('passes');
            setCreatedPass(null);
          }}
          className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all flex items-center gap-2 ${
            activeTab === 'passes' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <QrCode size={15} /> Boarding Passes ({preRegistered.length})
        </button>
      </div>

      {activeTab === 'logs' && (
        <Card className="p-0 overflow-hidden bg-white">
          <Table headers={['Visitor', 'Phone', 'Vehicle No.', 'Destination Flat', 'Purpose', 'Check-In', 'Check-Out', 'Status']}>
            {myVisitorLogs.length > 0 ? (
              myVisitorLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-800 block">{log.visitorName}</span>
                    <span className="text-[9px] text-slate-400">By Guard: {log.checkedInByName || 'System'}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-semibold">{log.phone}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono font-bold text-slate-700">
                      {log.vehicleNumber || 'Walk-in'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">Flat {log.flatNumber || 'N/A'}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">{log.purpose}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-700 block">
                      {new Date(log.entryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(log.entryTime).toLocaleDateString('en-IN')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {log.exitTime ? (
                      <>
                        <span className="text-xs font-bold text-slate-700 block">
                          {new Date(log.exitTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(log.exitTime).toLocaleDateString('en-IN')}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium italic">Inside</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={log.isActive ? 'Pending' : 'Paid'} />
                    <span className="text-xs font-bold text-slate-600 ml-2">
                      {log.isActive ? 'Inside' : 'Departed'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-lg max-w-sm mx-auto my-4">
                    <Clock size={36} className="text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">No Visitor Logs Found</p>
                    <p className="text-xs text-slate-400 text-center mt-1">
                      Logs will appear here when visitors are checked-in by security guards at the gate.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </Table>
        </Card>
      )}

      {activeTab === 'preregister' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Card className="p-6 bg-white">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Generate Gate Pass</h3>
            <form onSubmit={handlePreRegister} className="space-y-4">
              <Input
                label="Visitor Name"
                value={formData.visitorName}
                onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
                required
              />
              <Input
                label="Visitor Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Vehicle Number"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                  placeholder="e.g. MH12AB1234"
                />
                <div className="text-left">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Purpose</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 text-sm"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  >
                    {PURPOSES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Expected Date"
                  type="date"
                  value={formData.expectedDate}
                  onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                  required
                />
                <div className="text-left">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Flat</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 text-sm"
                    value={formData.flatId}
                    onChange={(e) => setFormData({ ...formData, flatId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Flat --</option>
                    {myFlats.map((f) => (
                      <option key={f.id} value={f.id}>Flat {f.flatNumber}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button type="submit" className="w-full mt-4 flex items-center justify-center gap-2">
                <QrCode size={16} /> Generate Invitation Pass
              </Button>
            </form>
          </Card>

          <div>
            {createdPass ? (
              <Card className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-none text-white text-center shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-16 bg-primary-500/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 p-16 bg-emerald-500/10 rounded-full blur-2xl"></div>

                <div className="relative space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-700/60 pb-3">
                    <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Boarding Pass</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold uppercase">
                      Approved Entry
                    </span>
                  </div>

                  <div className="flex justify-center py-2">
                    <div className="p-3 bg-white rounded-xl shadow-inner border border-slate-700">
                      {/* Premium Mock QR code */}
                      <div className="grid grid-cols-4 gap-2 w-28 h-28 items-center bg-slate-50 p-2 rounded border border-slate-200">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-4 w-4 rounded-sm ${
                              (i * 7 + 13) % 3 === 0 || i % 4 === 0 ? 'bg-slate-900' : 'bg-transparent'
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Gate Passcode</span>
                    <span className="text-2xl font-black text-emerald-400 tracking-widest font-mono select-all">
                      {createdPass.passcode}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-slate-700/60 my-4"></div>

                  <div className="grid grid-cols-2 gap-4 text-left text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">Guest Name</span>
                      <p className="font-bold text-slate-100">{createdPass.visitorName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">Flat Destination</span>
                      <p className="font-bold text-slate-100">Flat {createdPass.flatNumber}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">Visit Purpose</span>
                      <p className="font-bold text-slate-100">{createdPass.purpose}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">Arrival Date</span>
                      <p className="font-bold text-slate-100">{createdPass.expectedDate}</p>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent hover:bg-slate-800 text-slate-200 border-slate-700 text-xs flex items-center justify-center gap-1.5"
                      onClick={() => setCreatedPass(null)}
                    >
                      Reset Card
                    </Button>
                    <Button
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-xs flex items-center justify-center gap-1.5"
                      onClick={() => copyInviteMessage(createdPass)}
                    >
                      <ClipboardCheck size={14} /> Share WhatsApp
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 bg-slate-50 border-slate-200/60 border-dashed text-slate-500 h-full flex flex-col justify-center items-center text-center">
                <QrCode size={36} className="text-slate-300 mb-2" />
                <p className="text-sm font-semibold">No Invitation Generated</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[250px]">
                  Fill out the registration form on the left to instantly generate a digital entrance pass for your guest.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'passes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {preRegistered.length > 0 ? (
            preRegistered.map((pass) => (
              <Card key={pass.id} className="p-5 bg-white border border-slate-100 hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{pass.visitorName}</h4>
                      <span className="text-[10px] px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-100 rounded font-bold mt-1 inline-block">
                        {pass.purpose}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded">
                      {pass.passcode}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                    <p>Phone: <span className="font-bold text-slate-700">{pass.phone}</span></p>
                    <p>Expected Date: <span className="font-bold text-slate-700">{pass.expectedDate}</span></p>
                    <p>Flat Destination: <span className="font-bold text-slate-700">Flat {pass.flatNumber}</span></p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 py-1.5 text-[11px]"
                    onClick={() => copyInviteMessage(pass)}
                  >
                    Share Code
                  </Button>
                  <Button
                    variant="outline"
                    className="py-1.5 px-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 border-slate-200"
                    onClick={() => deletePass(pass.id)}
                  >
                    Revoke
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-10">
              <Card className="p-8 text-center bg-slate-50 border-slate-100 flex flex-col items-center">
                <QrCode className="text-slate-400 mb-2" size={32} />
                <p className="text-sm font-semibold text-slate-600">No active invitations found</p>
                <p className="text-xs text-slate-400 mt-1">Pre-registered invite codes will be saved here.</p>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
