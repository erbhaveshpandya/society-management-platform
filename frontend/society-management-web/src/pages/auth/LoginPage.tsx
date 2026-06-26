import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Home, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      
      // Get the logged in user's role from local storage to decide where to redirect
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        switch (user.role) {
          case 'SuperAdmin':
          case 'SocietyAdmin':
            navigate('/admin', { replace: true });
            break;
          case 'Resident':
            navigate('/resident', { replace: true });
            break;
          case 'SecurityGuard':
            navigate('/security', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Invalid credentials or connection error. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-primary-600 rounded-2xl text-white shadow-lg shadow-primary-500/20 mb-3 animate-pulse">
            <Home size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            SOCIVEXA
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Smart Society Living, Simplified.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100/80 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-left">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-red-700 leading-normal">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. admin@greenvalley.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />

            <div className="pt-2">
              <Button type="submit" fullWidth isLoading={loading}>
                Sign In
              </Button>
            </div>
          </form>

          {/* Quick Login Helper */}
          <div className="mt-8 pt-6 border-t border-slate-50 text-left">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Sample credentials for review
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100/50">
                <p className="font-semibold text-slate-800 mb-0.5">Society Admin</p>
                <p className="font-mono text-slate-400">admin@greenvalley.com</p>
                <p className="font-mono text-slate-400">Password123!</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100/50">
                <p className="font-semibold text-slate-800 mb-0.5">Resident</p>
                <p className="font-mono text-slate-400">amit.kumar@email.com</p>
                <p className="font-mono text-slate-400">Password123!</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100/50">
                <p className="font-semibold text-slate-800 mb-0.5">Security Guard</p>
                <p className="font-mono text-slate-400">security1@greenvalley.com</p>
                <p className="font-mono text-slate-400">Password123!</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100/50">
                <p className="font-semibold text-slate-800 mb-0.5">Super Admin</p>
                <p className="font-mono text-slate-400">superadmin@socivexa.com</p>
                <p className="font-mono text-slate-400">Password123!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
