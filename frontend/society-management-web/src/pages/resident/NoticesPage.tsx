import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Notice } from '../../types';
import { Megaphone, Calendar, AlertTriangle, Sparkles, Clock, Info } from 'lucide-react';

export const NoticesPage: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('All');

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

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'emergency':
        return 'danger';
      case 'event':
        return 'success';
      case 'maintenance':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'emergency':
        return <AlertTriangle className="text-red-500 animate-pulse" size={16} />;
      case 'event':
        return <Sparkles className="text-emerald-500" size={16} />;
      case 'maintenance':
        return <Clock className="text-amber-500" size={16} />;
      default:
        return <Info className="text-primary-500" size={16} />;
    }
  };

  const filteredNotices = notices.filter(
    (n) => filterCategory === 'All' || n.category === filterCategory
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Society Notice Board</h2>
          <p className="text-xs text-slate-500 mt-1">
            Stay updated with official broadcasts, emergency alerts, maintenance schedules, and events.
          </p>
        </div>
        <div className="p-2 bg-slate-100/80 rounded-lg text-slate-600">
          <Megaphone size={20} />
        </div>
      </div>

      {/* Category selector pills */}
      <div className="flex flex-wrap gap-2">
        {['All', 'General', 'Maintenance', 'Event', 'Emergency'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              (filterCategory === cat)
                ? 'bg-primary-600 border-primary-600 text-white shadow-sm shadow-primary-200'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            {cat} Notices
          </button>
        ))}
      </div>

      {filteredNotices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNotices.map((notice) => (
            <Card
              key={notice.id}
              className={`p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden bg-white border ${
                notice.category.toLowerCase() === 'emergency'
                  ? 'border-red-100 bg-red-50/10'
                  : 'border-slate-100'
              }`}
            >
              {/* Top gradient highlight for emergency */}
              {notice.category.toLowerCase() === 'emergency' && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-amber-500"></div>
              )}

              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-1.5">
                    {getCategoryIcon(notice.category)}
                    <Badge variant={getCategoryColor(notice.category)}>
                      {notice.category}
                    </Badge>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(notice.publishedDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800 leading-tight mb-2">
                  {notice.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {notice.content}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
                <span>By: {notice.creatorName || 'Socivexa'}</span>
                <span>Active notice</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
          <Megaphone className="mx-auto text-slate-300 mb-3" size={36} />
          <h4 className="text-sm font-bold text-slate-700">No notice bulletins found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            There are currently no announcements matching the selected category.
          </p>
        </div>
      )}
    </div>
  );
};
