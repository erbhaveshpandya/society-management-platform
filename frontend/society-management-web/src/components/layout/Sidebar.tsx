import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Home,
  DollarSign,
  FileSpreadsheet,
  AlertCircle,
  Megaphone,
  Vote,
  Calendar,
  Users,
  ShieldAlert,
  Settings,
  UserCheck,
  UserPlus,
  Clock,
  Car,
  LogOut,
  Building,
  Building2,
  UserCog,
  LifeBuoy
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    ...(user.role === 'SuperAdmin' ? [{ to: '/admin/societies', label: 'Societies', icon: Building2 }] : []),
    { to: '/admin/users', label: 'User Management', icon: UserCog },
    { to: '/admin/flats', label: 'Flats & Residents', icon: Building },
    { to: '/admin/maintenance', label: 'Maintenance', icon: DollarSign },
    { to: '/admin/expenses', label: 'Expenses', icon: FileSpreadsheet },
    { to: '/admin/complaints', label: 'Complaints', icon: AlertCircle },
    { to: '/admin/notices', label: 'Notices', icon: Megaphone },
    { to: '/admin/polls', label: 'Polls', icon: Vote },
    { to: '/admin/amenities', label: 'Amenities', icon: Calendar },
    { to: '/admin/staff', label: 'Staff Directory', icon: UserCheck },
    { to: '/admin/visitors', label: 'Visitors Log', icon: Users },
    { to: '/admin/support-tickets', label: 'Support & Feedback', icon: LifeBuoy },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const residentLinks = [
    { to: '/resident', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/resident/dues', label: 'My Dues', icon: DollarSign },
    { to: '/resident/complaints', label: 'My Complaints', icon: AlertCircle },
    { to: '/resident/notices', label: 'Notices', icon: Megaphone },
    { to: '/resident/polls', label: 'Polls', icon: Vote },
    { to: '/resident/amenities', label: 'Amenity Booking', icon: Calendar },
    { to: '/resident/vehicles', label: 'My Vehicles', icon: Car },
    { to: '/resident/staff', label: 'Domestic Staff', icon: UserCheck },
    { to: '/resident/visitors', label: 'Visitors', icon: Users },
    { to: '/resident/support-tickets', label: 'Support & Feedback', icon: LifeBuoy },
  ];

  const securityLinks = [
    { to: '/security', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/security/visitor-entry', label: 'Visitor Entry', icon: UserPlus },
    { to: '/security/live-visitors', label: 'Live Visitors', icon: Users },
    { to: '/security/staff-attendance', label: 'Staff Attendance', icon: Clock },
    { to: '/security/wrong-parking', label: 'Wrong Parking', icon: Car },
    { to: '/security/emergency-alerts', label: 'Emergency Alerts', icon: ShieldAlert },
    { to: '/security/support-tickets', label: 'Support & Feedback', icon: LifeBuoy },
  ];

  let links = adminLinks;
  if (user.role === 'Resident') links = residentLinks;
  if (user.role === 'SecurityGuard') links = securityLinks;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 w-64">
      {/* Logo Area */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-800/50">
        <div className="p-1.5 bg-primary-600 rounded-lg text-white">
          <Home size={20} />
        </div>
        <div className="text-left">
          <h2 className="font-bold text-white text-sm tracking-wide leading-none">SOCIVEXA</h2>
          <p className="text-[9px] text-slate-500 font-medium tracking-wider mt-0.5 uppercase">Smart Society Living</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin' || link.to === '/resident' || link.to === '/security'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <Icon size={18} />
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800/50">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-slate-400 hover:bg-red-950/20 hover:text-red-400 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
};
