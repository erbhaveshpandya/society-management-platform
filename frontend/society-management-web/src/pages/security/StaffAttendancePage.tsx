import React, { useEffect, useState, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Staff } from '../../types';
import { LogIn, LogOut, UserCheck, Users, Clock, RefreshCw } from 'lucide-react';

export const StaffAttendancePage: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await axiosClient.get<Staff[]>('staff');
      setStaffList(res.data);
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleCheckIn = async (id: number) => {
    setActionId(id);
    try {
      await axiosClient.post(`staff/${id}/checkin`);
      fetchStaff();
    } catch (err) {
      console.error('Failed to check in staff:', err);
    } finally {
      setActionId(null);
    }
  };

  const handleCheckOut = async (id: number) => {
    setActionId(id);
    try {
      await axiosClient.post(`staff/${id}/checkout`);
      fetchStaff();
    } catch (err) {
      console.error('Failed to check out staff:', err);
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const checkedIn = staffList.filter((s) => s.isCheckedIn);
  const checkedOut = staffList.filter((s) => !s.isCheckedIn);

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Staff Attendance</h2>
          <p className="text-xs text-slate-500 mt-1">
            Track check-in and check-out for domestic helpers, cooks, drivers, and service personnel
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-1.5" onClick={() => { setLoading(true); fetchStaff(); }}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Staff</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{staffList.length}</p>
          </div>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Inside Gate</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{checkedIn.length}</p>
          </div>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Not Yet Arrived</p>
            <p className="text-2xl font-bold text-amber-600 mt-0.5">{checkedOut.length}</p>
          </div>
        </Card>
      </div>

      {staffList.length === 0 ? (
        <EmptyState
          title="No Staff Registered"
          message="The admin has not registered any domestic staff yet."
          icon={<Users size={48} className="text-slate-300" />}
        />
      ) : (
        <Card>
          <Table headers={['Staff Name', 'Phone', 'Role', 'Gate Status', 'Last Check-In', 'Last Check-Out', 'Action']}>
            {staffList.map((staff) => (
              <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-semibold text-slate-800 block">{staff.name}</span>
                  <span className="text-[10px] text-slate-400">ID: #{staff.id}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{staff.phone}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-semibold text-slate-700">
                    {staff.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={staff.isCheckedIn ? 'Paid' : 'Pending'} />
                  <span className="text-xs font-semibold text-slate-500 ml-1.5">
                    {staff.isCheckedIn ? 'Inside' : 'Outside'}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {staff.lastCheckIn
                    ? new Date(staff.lastCheckIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    : 'Never'}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {staff.lastCheckOut
                    ? new Date(staff.lastCheckOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    : 'N/A'}
                </td>
                <td className="px-6 py-4">
                  {staff.isCheckedIn ? (
                    <Button
                      variant="danger"
                      className="flex items-center gap-1 text-xs px-3 py-1.5"
                      onClick={() => handleCheckOut(staff.id)}
                      disabled={actionId === staff.id}
                    >
                      <LogOut size={13} />
                      {actionId === staff.id ? 'Processing...' : 'Check Out'}
                    </Button>
                  ) : (
                    <Button
                      className="flex items-center gap-1 text-xs px-3 py-1.5"
                      onClick={() => handleCheckIn(staff.id)}
                      disabled={actionId === staff.id}
                    >
                      <LogIn size={13} />
                      {actionId === staff.id ? 'Processing...' : 'Check In'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </div>
  );
};
