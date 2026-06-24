import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Notice } from '../../types';
import { Plus, Trash2, Megaphone } from 'lucide-react';

const CATEGORIES = ['General', 'Maintenance', 'Event', 'Emergency'];

export const NoticesPage: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [currentNotice, setCurrentNotice] = useState<Partial<Notice>>({
    category: 'General',
  });

  const fetchNotices = async () => {
    try {
      const res = await axiosClient.get<Notice[]>('notices');
      setNotices(res.data);
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.post('notices', currentNotice);
      setIsOpen(false);
      fetchNotices();
    } catch (err) {
      console.error('Error saving notice:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await axiosClient.delete(`notices/${id}`);
      fetchNotices();
    } catch (err) {
      console.error('Failed to delete notice:', err);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Society Notices</h2>
          <p className="text-xs text-slate-500 mt-1">Publish and manage official communications, emergency warnings, and events for residents.</p>
        </div>
        <Button className="flex items-center gap-1.5" onClick={() => {
          setCurrentNotice({
            category: 'General',
            title: '',
            content: '',
          });
          setIsOpen(true);
        }}>
          <Plus size={16} /> Broadcast Notice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {notices.map((notice) => (
          <Card key={notice.id} className="p-6 relative hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                  notice.category === 'Emergency' ? 'bg-red-50 text-red-600 border border-red-100' :
                  notice.category === 'Maintenance' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                  notice.category === 'Event' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                  'bg-slate-50 text-slate-600 border border-slate-100'
                }`}>
                  {notice.category}
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-2">{notice.title}</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Published: {new Date(notice.publishedDate).toLocaleDateString('en-IN')} by {notice.creatorName || 'Admin'}
                </p>
              </div>
              <button
                onClick={() => handleDelete(notice.id)}
                className="p-1 text-slate-400 hover:text-red-600 transition-colors focus:outline-none"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{notice.content}</p>
          </Card>
        ))}

        {notices.length === 0 && (
          <div className="col-span-2 py-12 text-center">
            <Megaphone className="mx-auto text-slate-300 mb-2" size={48} />
            <p className="text-slate-500 font-medium">No notices published yet</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Broadcast New Notice"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Notice Title"
            type="text"
            value={currentNotice.title || ''}
            onChange={(e) => setCurrentNotice({ ...currentNotice, title: e.target.value })}
            placeholder="e.g. Water Tank Cleaning Schedule"
            required
          />

          <div className="text-left">
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={currentNotice.category || ''}
              onChange={(e) => setCurrentNotice({ ...currentNotice, category: e.target.value as any })}
              required
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="text-left">
            <label className="block text-sm font-medium text-slate-700 mb-1">Content Body</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 min-h-[120px]"
              value={currentNotice.content || ''}
              onChange={(e) => setCurrentNotice({ ...currentNotice, content: e.target.value })}
              placeholder="Write the details of the announcement here..."
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Publish
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
