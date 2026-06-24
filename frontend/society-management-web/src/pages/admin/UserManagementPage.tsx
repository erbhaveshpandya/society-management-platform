import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import {
  Plus,
  Users,
  Shield,
  UserCheck,
  UserX,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Eye,
  EyeOff,
} from 'lucide-react';

interface UserListItem {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  societyId: number | null;
  isActive: boolean;
  createdAt: string;
}

interface SocietyItem {
  id: number;
  name: string;
}

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');

  const isSuperAdmin = currentUser?.role === 'SuperAdmin';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'Resident',
    societyId: '',
  });

  const fetchUsers = async () => {
    try {
      const res = await axiosClient.get<UserListItem[]>('users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSocieties = async () => {
    if (isSuperAdmin) {
      try {
        const res = await axiosClient.get<SocietyItem[]>('societies');
        setSocieties(res.data);
      } catch (err) {
        console.error('Failed to load societies:', err);
      }
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSocieties();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload: any = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || null,
        password: formData.password,
        role: formData.role,
      };
      if (isSuperAdmin && formData.societyId) {
        payload.societyId = parseInt(formData.societyId);
      }

      await axiosClient.post('users', payload);
      setSuccessMsg(`✅ User "${formData.fullName}" created successfully!`);
      setFormData({ fullName: '', email: '', phone: '', password: '', role: 'Resident', societyId: '' });
      setIsOpen(false);
      fetchUsers();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      const msg = err?.response?.data || 'Failed to create user. Please try again.';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await axiosClient.put(`users/${id}/toggle-active`);
      fetchUsers();
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'secondary'> = {
      SuperAdmin: 'danger',
      SocietyAdmin: 'primary',
      Resident: 'success',
      SecurityGuard: 'warning',
    };
    return <Badge variant={variants[role] || 'secondary'}>{role}</Badge>;
  };

  const roleOptions = isSuperAdmin
    ? ['SocietyAdmin', 'Resident', 'SecurityGuard']
    : ['Resident', 'SecurityGuard'];

  const filteredUsers = roleFilter ? users.filter((u) => u.role === roleFilter) : users;

  const roleCounts = users.reduce(
    (acc: Record<string, number>, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">User Management</h2>
          <p className="text-xs text-slate-500 mt-1">
            Create and manage user accounts for{' '}
            {isSuperAdmin ? 'all societies' : 'your society'}.
          </p>
        </div>
        <Button className="flex items-center gap-1.5" onClick={() => setIsOpen(true)}>
          <Plus size={16} /> Add User
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          className={`p-4 cursor-pointer transition-all ${!roleFilter ? 'ring-2 ring-primary-500' : 'hover:shadow-md'}`}
          onClick={() => setRoleFilter('')}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">All Users</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{users.length}</p>
            </div>
          </div>
        </Card>
        {['SocietyAdmin', 'Resident', 'SecurityGuard'].map((role) => {
          const icons: Record<string, React.ReactNode> = {
            SocietyAdmin: <Shield size={20} />,
            Resident: <UserCheck size={20} />,
            SecurityGuard: <UserIcon size={20} />,
          };
          const colors: Record<string, string> = {
            SocietyAdmin: 'bg-primary-50 text-primary-600',
            Resident: 'bg-emerald-50 text-emerald-600',
            SecurityGuard: 'bg-amber-50 text-amber-600',
          };
          return (
            <Card
              key={role}
              className={`p-4 cursor-pointer transition-all ${roleFilter === role ? 'ring-2 ring-primary-500' : 'hover:shadow-md'}`}
              onClick={() => setRoleFilter(roleFilter === role ? '' : role)}
            >
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${colors[role]}`}>{icons[role]}</div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">{role.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-0.5">{roleCounts[role] || 0}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Users Table */}
      <Card className="p-0 overflow-hidden">
        <Table headers={['User', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Actions']}>
          {filteredUsers.map((u) => (
            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs uppercase">
                    {u.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block text-sm">{u.fullName}</span>
                    <span className="text-[9px] text-slate-400">ID: {u.id}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Mail size={12} className="text-slate-400" /> {u.email}
                </span>
              </td>
              <td className="px-6 py-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Phone size={12} className="text-slate-400" /> {u.phone || 'N/A'}
                </span>
              </td>
              <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
              <td className="px-6 py-4">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {u.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar size={12} className="text-slate-400" />
                  {new Date(u.createdAt).toLocaleDateString('en-IN')}
                </span>
              </td>
              <td className="px-6 py-4">
                {u.role !== 'SuperAdmin' && (
                  <button
                    onClick={() => handleToggleActive(u.id)}
                    className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
                      u.isActive ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {u.isActive ? (
                      <>
                        <UserX size={14} /> Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck size={14} /> Activate
                      </>
                    )}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {/* Add User Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create New User">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Full Name"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="e.g. Rajesh Kumar"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. rajesh@email.com"
              required
            />
            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. 9876543210"
            />
          </div>

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Create a strong password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="text-left">
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 text-sm"
              required
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/([A-Z])/g, ' $1').trim()}
                </option>
              ))}
            </select>
          </div>

          {isSuperAdmin && (
            <div className="text-left">
              <label className="block text-sm font-medium text-slate-700 mb-1">Society</label>
              <select
                value={formData.societyId}
                onChange={(e) => setFormData({ ...formData, societyId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 text-sm"
                required
              >
                <option value="">Select a society</option>
                {societies.map((s) => (
                  <option key={s.id} value={s.id.toString()}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-500 leading-relaxed">
            <p className="font-bold text-slate-600 mb-1">Account Details</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>User will receive an Active account immediately</li>
              <li>They can login with the email and password provided</li>
              <li>You can deactivate an account anytime from this page</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex items-center gap-1.5">
              <UserCheck size={16} />
              {submitting ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
