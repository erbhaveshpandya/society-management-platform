import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Staff, StaffAttendance } from '../../types';
import { Search, ShieldAlert, Calendar, Users, Phone, Shield, ArrowRightLeft, Clock } from 'lucide-react';

const ROLES = ['All', 'Maid', 'Cook', 'Driver', 'Gardener', 'Plumber', 'Electrician', 'Security', 'Others'];

export const DomesticStaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<StaffAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'directory' | 'logs'>('directory');

  const fetchData = async () => {
    try {
      const [staffRes, attendanceRes] = await Promise.all([
        axiosClient.get<Staff[]>('staff'),
        axiosClient.get<StaffAttendance[]>('staff/attendance')
      ]);
      setStaffList(staffRes.data);
      setAttendance(attendanceRes.data);
    } catch (err) {
      console.error('Failed to load domestic staff details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStaff = staffList.filter((helper) => {
    const matchesSearch =
      (helper.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (helper.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'All' || helper.role.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const checkedInHelpersCount = staffList.filter((s) => s.isCheckedIn).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Domestic Staff Directory</h2>
        <p className="text-xs text-slate-500 mt-1">
          View all registered daily helps, maids, drivers, plumbers, and track their check-in status at the security gates.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Helpers Registered</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{staffList.length}</p>
          </div>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 relative">
            <Shield size={20} />
            {checkedInHelpersCount > 0 && (
              <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Currently Inside Gate</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{checkedInHelpersCount}</p>
          </div>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <ArrowRightLeft size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Entries Recorded Today</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{attendance.length}</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-100 pb-px">
        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all flex items-center gap-2 ${
            activeTab === 'directory'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users size={15} /> Helper Directory
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock size={15} /> Gate Pass Logs
        </button>
      </div>

      {activeTab === 'directory' ? (
        <>
          {/* Filters */}
          <Card className="p-4 flex flex-wrap gap-4 items-center justify-between bg-white">
            <div className="flex flex-1 max-w-md items-center relative">
              <Search className="absolute left-3 text-slate-400" size={16} />
              <Input
                placeholder="Search by helper name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 mb-0"
              />
            </div>
            <div>
              <select
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-primary-100"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role === 'All' ? 'All Roles' : role}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* Directory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaff.length > 0 ? (
              filteredStaff.map((helper) => (
                <Card key={helper.id} className="p-5 bg-white border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{helper.name}</h3>
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-600 mt-1 inline-block">
                          {helper.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${helper.isCheckedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                        <StatusBadge status={helper.isCheckedIn ? 'Approved' : 'Pending'} />
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-xs font-semibold text-slate-500">
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-slate-400" />
                        <span className="text-slate-700">{helper.phone}</span>
                      </div>
                      {helper.address && (
                        <div className="text-[11px] text-slate-400 font-medium">
                          Address: {helper.address}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-50 text-[10px] text-slate-400 flex flex-col gap-1">
                    <div>
                      Last Entry:{' '}
                      <span className="font-bold text-slate-600">
                        {helper.lastCheckIn
                          ? new Date(helper.lastCheckIn).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : 'Never'}
                      </span>
                    </div>
                    {helper.lastCheckOut && (
                      <div>
                        Last Exit:{' '}
                        <span className="font-bold text-slate-600">
                          {new Date(helper.lastCheckOut).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-10">
                <Card className="p-8 text-center bg-slate-50 border-slate-100 flex flex-col items-center">
                  <ShieldAlert className="text-slate-400 mb-2" size={32} />
                  <p className="text-sm font-semibold text-slate-600">No helpers matched your filter</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting the role selection or search query.</p>
                </Card>
              </div>
            )}
          </div>
        </>
      ) : (
        <Card className="p-0 overflow-hidden bg-white">
          <Table headers={['Helper Name', 'Role', 'Gate Check-In Time', 'Gate Check-Out Time', 'Approved By']}>
            {attendance.length > 0 ? (
              attendance.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800">{log.staffName}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-600">
                      {log.staffRole}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {new Date(log.checkInTime).toLocaleString('en-IN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {log.checkOutTime ? (
                      <span className="text-slate-500">
                        {new Date(log.checkOutTime).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded animate-pulse">
                        Active Inside
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-semibold">{log.markedByName || 'Gate Guard'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-10">
                  <Card className="p-8 text-center bg-slate-50 border-slate-100 flex flex-col items-center">
                    <Calendar className="text-slate-400 mb-2" size={32} />
                    <p className="text-sm font-semibold text-slate-600">No attendance records found today</p>
                    <p className="text-xs text-slate-400 mt-1">Helper entries are logged when they check-in at the gate.</p>
                  </Card>
                </td>
              </tr>
            )}
          </Table>
        </Card>
      )}
    </div>
  );
};
