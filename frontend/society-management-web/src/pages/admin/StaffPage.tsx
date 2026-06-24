import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Staff, StaffAttendance } from '../../types';
import { Plus, Users, Calendar, UserCheck } from 'lucide-react';

const ROLES = ['Maid', 'Cook', 'Driver', 'Gardener', 'Plumber', 'Electrician', 'Security', 'Others'];

export const StaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<StaffAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Partial<Staff>>({
    role: 'Maid',
  });
  const [activeTab, setActiveTab] = useState<'roster' | 'attendance'>('roster');

  const fetchData = async () => {
    try {
      const staffRes = await axiosClient.get<Staff[]>('staff');
      setStaffList(staffRes.data);
      const attendanceRes = await axiosClient.get<StaffAttendance[]>('staff/attendance');
      setAttendance(attendanceRes.data);
    } catch (err) {
      console.error('Failed to load staff data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.post('staff', currentStaff);
      setIsOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving staff member:', err);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Domestic Staff</h2>
          <p className="text-xs text-slate-500 mt-1">Manage society helpers, daily helps, service personnel, and track their gate attendance.</p>
        </div>
        <Button className="flex items-center gap-1.5" onClick={() => {
          setCurrentStaff({
            name: '',
            phone: '',
            role: 'Maid',
            address: '',
          });
          setIsOpen(true);
        }}>
          <Plus size={16} /> Register Staff
        </Button>
      </div>

      <div className="border-b border-slate-100 flex gap-4">
        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all ${
            activeTab === 'roster' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Roster Directory ({staffList.length})
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all ${
            activeTab === 'attendance' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Daily Helper Attendance ({attendance.length})
        </button>
      </div>

      {activeTab === 'roster' ? (
        <Card>
          <Table headers={['Helper Name', 'Phone', 'Role', 'Status', 'Last Check-In', 'Last Check-Out']}>
            {staffList.map((helper) => (
              <tr key={helper.id}>
                <td className="px-6 py-4 font-semibold text-slate-800">{helper.name}</td>
                <td className="px-6 py-4">{helper.phone}</td>
                <td className="px-6 py-4 font-medium">{helper.role}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={helper.isCheckedIn ? 'Paid' : 'Pending'} />
                  <span className="text-xs font-semibold text-slate-500 ml-1.5">{helper.isCheckedIn ? 'Inside Gate' : 'Out'}</span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {helper.lastCheckIn ? new Date(helper.lastCheckIn).toLocaleString('en-IN') : 'Never'}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {helper.lastCheckOut ? new Date(helper.lastCheckOut).toLocaleString('en-IN') : 'N/A'}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : (
        <Card>
          <Table headers={['Helper Name', 'Role', 'Check-In Time', 'Check-Out Time', 'Approved By']}>
            {attendance.map((log) => (
              <tr key={log.id}>
                <td className="px-6 py-4 font-semibold text-slate-800">{log.staffName}</td>
                <td className="px-6 py-4 font-medium">{log.staffRole}</td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {new Date(log.checkInTime).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {log.checkOutTime ? new Date(log.checkOutTime).toLocaleString('en-IN') : (
                    <span className="text-emerald-600 font-bold">Active Inside</span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-600">{log.markedByName || 'System'}</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Register Domestic Staff Member"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Staff Name"
            type="text"
            value={currentStaff.name || ''}
            onChange={(e) => setCurrentStaff({ ...currentStaff, name: e.target.value })}
            placeholder="e.g. Ramesh Kadam"
            required
          />

          <Input
            label="Phone Number"
            type="text"
            value={currentStaff.phone || ''}
            onChange={(e) => setCurrentStaff({ ...currentStaff, phone: e.target.value })}
            placeholder="e.g. 9876543210"
            required
          />

          <div className="text-left">
            <label className="block text-sm font-medium text-slate-700 mb-1">Staff Role</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={currentStaff.role || ''}
              onChange={(e) => setCurrentStaff({ ...currentStaff, role: e.target.value })}
              required
            >
              {ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <Input
            label="Home Address"
            type="text"
            value={currentStaff.address || ''}
            onChange={(e) => setCurrentStaff({ ...currentStaff, address: e.target.value })}
            placeholder="e.g. Wakad Chowk, Wakad"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Register Member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
