import React from 'react';
import { Menu, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NotificationBell } from '../shared/NotificationBell';
import axiosClient from '../../api/axiosClient';

interface HeaderProps {
  onMenuClick: () => void;
}

interface HeaderSociety {
  id: number;
  name: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const [societies, setSocieties] = React.useState<HeaderSociety[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>(() => {
    return localStorage.getItem('selectedSocietyId') || '1';
  });

  React.useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      axiosClient.get<HeaderSociety[]>('societies')
        .then(res => {
          setSocieties(res.data);
        })
        .catch(err => {
          console.error('Failed to load societies', err);
        });
    }
  }, [user]);

  const handleSocietyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    localStorage.setItem('selectedSocietyId', newId);
    setSelectedId(newId);
    window.location.reload();
  };

  if (!user) return null;

  return (
    <header className="bg-white border-b border-slate-100 h-16 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left: Mobile Toggle & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors md:hidden focus:outline-none"
        >
          <Menu size={20} />
        </button>
        {user.role === 'SuperAdmin' ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">Active Tenant:</span>
            <select
              value={selectedId}
              onChange={handleSocietyChange}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1.5 font-medium outline-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              {societies.map(soc => (
                <option key={soc.id} value={soc.id.toString()}>
                  {soc.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-left">
            <h1 className="text-base font-bold text-slate-800 leading-none">
              {user.societyName || 'System Admin Portal'}
            </h1>
            {user.societyName && (
              <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5 block">
                Housing Society
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {user.role !== 'SuperAdmin' && <NotificationBell />}

        {/* User Profile Summary */}
        <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
          <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm">
            <UserIcon size={16} />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">{user.fullName}</p>
            <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-0.5 block">
              {user.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
