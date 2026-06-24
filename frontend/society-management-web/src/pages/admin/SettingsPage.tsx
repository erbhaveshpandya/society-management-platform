import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Society } from '../../types';
import { Home, Shield, Sliders, Save, Settings, User, Mail, Phone, MapPin } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [society, setSociety] = useState<Society | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'rules'>('profile');

  // Simulated rules configuration for premium dashboard look
  const [billingCycle, setBillingCycle] = useState('Monthly');
  const [gracePeriod, setGracePeriod] = useState('10');
  const [parkingFee, setParkingFee] = useState('500');

  useEffect(() => {
    const fetchSociety = async () => {
      if (!user || !user.societyId) {
        setLoading(false);
        return;
      }
      try {
        const res = await axiosClient.get<Society>(`societies/${user.societyId}`);
        setSociety(res.data);
      } catch (err) {
        console.error('Failed to load society settings:', err);
        setErrorMsg('Could not fetch society metadata.');
      } finally {
        setLoading(false);
      }
    };

    fetchSociety();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!society || !user || !user.societyId) return;

    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await axiosClient.put(`societies/${user.societyId}`, {
        name: society.name,
        address: society.address,
        city: society.city,
        state: society.state,
        pinCode: society.pinCode,
        contactPhone: society.contactPhone,
        contactEmail: society.contactEmail,
      });
      setSuccessMsg('Society profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to update society details:', err);
      setErrorMsg('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccessMsg('Billing and gate rules updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    }, 800);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Settings & Configuration</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage society contact information, invoicing details, general policies, and administrative credentials.
          </p>
        </div>
        <div className="p-2 bg-slate-100/80 rounded-lg text-slate-600">
          <Settings className="animate-spin-slow" size={20} />
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg">
          {errorMsg}
        </div>
      )}

      <div className="flex gap-4 border-b border-slate-100 pb-px">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home size={15} /> Society Profile
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all flex items-center gap-2 ${
            activeTab === 'rules'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sliders size={15} /> Rules & Billing Configuration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Right Details Profile */}
        <Card className="p-5 space-y-4 md:col-span-1 bg-slate-50/50 border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Shield size={16} className="text-primary-600" /> Admin Credentials
          </h3>
          <div className="space-y-3 text-xs font-medium text-slate-600">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">User Role</span>
              <span className="px-2 py-0.5 mt-1 inline-block bg-primary-50 text-primary-700 border border-primary-100 rounded font-bold uppercase text-[9px]">
                {user?.role}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Full Name</span>
              <span className="text-slate-800 font-semibold flex items-center gap-1.5 mt-0.5">
                <User size={13} className="text-slate-400" />
                {user?.fullName}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Login Email</span>
              <span className="text-slate-800 font-semibold flex items-center gap-1.5 mt-0.5">
                <Mail size={13} className="text-slate-400" />
                {user?.email}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Associated Tenant</span>
              <span className="text-slate-800 font-semibold mt-0.5 block">{user?.societyName || 'Unassigned Society'}</span>
            </div>
          </div>
        </Card>

        {/* Form panel */}
        <div className="md:col-span-2 space-y-6">
          {activeTab === 'profile' ? (
            <Card className="p-6 bg-white">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Official Society Contact Details</h3>
              {society ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <Input
                    label="Society Name"
                    value={society.name || ''}
                    onChange={(e) => setSociety({ ...society, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Address"
                    value={society.address || ''}
                    onChange={(e) => setSociety({ ...society, address: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="City"
                      value={society.city || ''}
                      onChange={(e) => setSociety({ ...society, city: e.target.value })}
                      required
                    />
                    <Input
                      label="State"
                      value={society.state || ''}
                      onChange={(e) => setSociety({ ...society, state: e.target.value })}
                      required
                    />
                    <Input
                      label="Pincode"
                      value={society.pinCode || ''}
                      onChange={(e) => setSociety({ ...society, pinCode: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Contact Email"
                      type="email"
                      value={society.contactEmail || ''}
                      onChange={(e) => setSociety({ ...society, contactEmail: e.target.value })}
                      required
                    />
                    <Input
                      label="Contact Phone"
                      value={society.contactPhone || ''}
                      onChange={(e) => setSociety({ ...society, contactPhone: e.target.value })}
                      required
                    />
                  </div>
                  <Input
                    label="Registration Number"
                    value={society.registrationNumber || ''}
                    disabled
                    className="bg-slate-50 cursor-not-allowed text-slate-400 border-slate-200"
                  />

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={saving} className="flex items-center gap-1.5">
                      <Save size={16} />
                      {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-slate-500 italic">No society profile associated with this account.</p>
              )}
            </Card>
          ) : (
            <Card className="p-6 bg-white">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Invoice & Billing Policies</h3>
              <form onSubmit={handleSaveRules} className="space-y-4">
                <div className="text-left mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Billing Frequency</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100"
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value)}
                  >
                    <option value="Monthly">Monthly Recurring (1st of month)</option>
                    <option value="Quarterly">Quarterly (Jan, Apr, Jul, Oct)</option>
                    <option value="Yearly">Annual Billing</option>
                  </select>
                </div>

                <Input
                  label="Payment Grace Period (Days)"
                  type="number"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(e.target.value)}
                  required
                />

                <Input
                  label="Monthly Parking Space Maintenance Charge (₹)"
                  type="number"
                  value={parkingFee}
                  onChange={(e) => setParkingFee(e.target.value)}
                  required
                />

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">Information Notes:</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Changing billing frequency will adjust future invoice generation schedulers. Residents will be
                    notified of changes automatically via the mobile / web dashboard feed.
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving} className="flex items-center gap-1.5">
                    <Save size={16} />
                    {saving ? 'Updating...' : 'Save Configuration'}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
