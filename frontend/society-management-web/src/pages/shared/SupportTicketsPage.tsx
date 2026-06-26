import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { SupportTicket } from '../../types';
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Building,
  User,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

export const SupportTicketsPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Form state
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('UI Bug');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTickets = async () => {
    try {
      const res = await axiosClient.get<SupportTicket[]>('support-tickets');
      setTickets(res.data);
    } catch (err) {
      console.error('Failed to fetch support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('description', description);
      formData.append('category', category);
      if (file) {
        formData.append('file', file);
      }

      await axiosClient.post('support-tickets', formData, {
        headers: {
          'Content-Type': undefined
        }
      });
      setSubject('');
      setDescription('');
      setCategory('UI Bug');
      setFile(null);
      setIsCreateOpen(false);
      fetchTickets();
    } catch (err) {
      console.error('Failed to create support ticket:', err);
      alert('Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (ticketId: number, status: string) => {
    try {
      await axiosClient.put(`support-tickets/${ticketId}/status?status=${status}`);
      fetchTickets();
    } catch (err) {
      console.error('Failed to update ticket status:', err);
      alert('Failed to update status.');
    }
  };

  const handleResolveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setSubmitting(true);
    try {
      await axiosClient.post(`support-tickets/${selectedTicket.id}/resolve`, {
        resolutionNotes
      });
      setResolutionNotes('');
      setSelectedTicket(null);
      setIsResolveOpen(false);
      fetchTickets();
    } catch (err) {
      console.error('Failed to resolve support ticket:', err);
      alert('Failed to resolve ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'InProgress':
        return 'bg-amber-50 text-amber-600 border border-amber-100';
      default:
        return 'bg-rose-50 text-rose-600 border border-rose-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Resolved':
        return <CheckCircle size={14} className="text-emerald-500" />;
      case 'InProgress':
        return <Clock size={14} className="text-amber-500" />;
      default:
        return <AlertCircle size={14} className="text-rose-500" />;
    }
  };

  // Filter logic
  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
    const matchesSearch =
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.submittedByUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.societyName && t.societyName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesCategory && matchesSearch;
  });

  // KPI Calculations
  const kpis = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'Open').length,
    inProgress: tickets.filter((t) => t.status === 'InProgress').length,
    resolved: tickets.filter((t) => t.status === 'Resolved').length
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <LifeBuoy className="text-primary-500" size={24} />
            {user?.role === 'SuperAdmin'
              ? 'Platform Support Ledger'
              : user?.role === 'SocietyAdmin'
              ? 'Society Support & Feedback'
              : 'Support & Platform Feedback'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {user?.role === 'SuperAdmin'
              ? 'Manage and resolve technical and UI feedback from all housing societies.'
              : 'Report interface issues, bugs, or functional feedback directly to the product developers.'}
          </p>
        </div>

        {user?.role !== 'SuperAdmin' && (
          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 self-start sm:self-center font-bold text-xs"
          >
            <Plus size={16} /> New Support Ticket
          </Button>
        )}
      </div>

      {/* KPI Section for Super Admin */}
      {user?.role === 'SuperAdmin' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Feedback</p>
              <h3 className="text-xl font-bold text-slate-800 mt-0.5">{kpis.total}</h3>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
              <LifeBuoy size={18} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Open Issues</p>
              <h3 className="text-xl font-bold text-rose-600 mt-0.5">{kpis.open}</h3>
            </div>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">In Progress</p>
              <h3 className="text-xl font-bold text-amber-600 mt-0.5">{kpis.inProgress}</h3>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-500">
              <Clock size={18} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Resolved Bugs</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-0.5">{kpis.resolved}</h3>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500">
              <CheckCircle size={18} />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <Card className="p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search tickets by subject, description or submitter..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 text-xs bg-slate-50 text-slate-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto shrink-0">
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-xs text-slate-600">
            <Filter size={14} className="text-slate-400" />
            <select
              className="focus:outline-none bg-transparent cursor-pointer font-medium"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="InProgress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-xs text-slate-600">
            <LifeBuoy size={14} className="text-slate-400" />
            <select
              className="focus:outline-none bg-transparent cursor-pointer font-medium"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="UI Bug">UI Bug</option>
              <option value="Feature Request">Feature Request</option>
              <option value="System Issue">System Issue</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <Card className="py-12 text-center text-slate-400 text-xs">
            <LifeBuoy size={40} className="mx-auto text-slate-300 mb-2.5" />
            No support tickets found matching the criteria.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTickets.map((ticket) => (
              <Card
                key={ticket.id}
                className={`p-5 hover:shadow-md transition-shadow duration-200 border-l-4 ${
                  ticket.status === 'Resolved'
                    ? 'border-l-emerald-500'
                    : ticket.status === 'InProgress'
                    ? 'border-l-amber-500'
                    : 'border-l-rose-500'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">
                        #{ticket.id}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-primary-50 rounded text-primary-600 border border-primary-100">
                        {ticket.category}
                      </span>
                      <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusBadgeClass(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        <span>{ticket.status === 'InProgress' ? 'In Progress' : ticket.status}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ticket.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 leading-tight">{ticket.subject}</h4>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                    </div>

                    {/* Metadata: Who submitted */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <User size={12} className="text-slate-400" />
                        By: <strong className="text-slate-700">{ticket.submittedByUserName}</strong> ({ticket.submittedByUserRole})
                      </span>
                      {ticket.societyName && (
                        <span className="flex items-center gap-1">
                          <Building size={12} className="text-slate-400" />
                          Society: <strong className="text-slate-700">{ticket.societyName}</strong>
                        </span>
                      )}
                    </div>

                    {/* Attachment Link */}
                    {ticket.attachmentUrl && (
                      <div className="pt-2">
                        <a
                          href={`${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${ticket.attachmentUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-primary-600 hover:text-primary-700 font-bold bg-primary-50/50 hover:bg-primary-50 px-2 py-1 rounded border border-primary-100/50 transition-colors"
                        >
                          <ExternalLink size={12} /> View Attached Screenshot / File
                        </a>
                      </div>
                    )}

                    {/* Resolution Section if Resolved */}
                    {ticket.status === 'Resolved' && (
                      <div className="mt-3 p-3 bg-emerald-50/40 border border-emerald-100/50 rounded-lg text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-1">
                          <CheckCircle size={14} />
                          <span>Resolution Notes (Super Admin)</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed font-medium">
                          {ticket.resolutionNotes || 'This issue has been resolved.'}
                        </p>
                        {ticket.resolvedAt && (
                          <span className="text-[9px] text-slate-400 block mt-1">
                            Resolved on: {new Date(ticket.resolvedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions for Super Admin */}
                  {user?.role === 'SuperAdmin' && ticket.status !== 'Resolved' && (
                    <div className="flex flex-row lg:flex-col gap-2 shrink-0 pt-2 lg:pt-0">
                      {ticket.status === 'Open' && (
                        <Button
                          variant="secondary"
                          onClick={() => handleUpdateStatus(ticket.id, 'InProgress')}
                          className="text-xs font-semibold py-1.5 px-3 flex items-center justify-center gap-1 border-slate-200"
                        >
                          Mark In Progress
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setResolutionNotes('');
                          setIsResolveOpen(true);
                        }}
                        className="text-xs font-semibold py-1.5 px-3 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle size={14} /> Resolve Ticket
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* CREATE TICKET MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !submitting && setIsCreateOpen(false)}
        title="📝 Create Support Ticket"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4 text-left">
          <div className="p-3 bg-primary-50/50 border border-primary-100 rounded-lg flex items-start gap-2.5">
            <Info size={16} className="text-primary-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Facing a bug, visual glitch, or have functional feedback? Submit it here. The platform developers (Super Admin) will review and resolve it.
            </p>
          </div>

          <div className="text-left space-y-1">
            <label className="block text-xs font-bold text-slate-600 uppercase">Category</label>
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 text-xs bg-slate-50 text-slate-700 cursor-pointer"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={submitting}
            >
              <option value="UI Bug">UI Bug / Visual Glitch</option>
              <option value="Feature Request">Feature Request</option>
              <option value="System Issue">Functional / Backend Issue</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="text-left space-y-1">
            <label className="block text-xs font-bold text-slate-600 uppercase">Subject</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 text-xs bg-white text-slate-700"
              placeholder="Brief summary of the issue..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="text-left space-y-1">
            <label className="block text-xs font-bold text-slate-600 uppercase">Description</label>
            <textarea
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 text-xs bg-white h-32 leading-relaxed text-slate-700"
              placeholder="Explain the issue in detail. Add steps to reproduce if applicable..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="text-left space-y-1">
            <label className="block text-xs font-bold text-slate-600 uppercase">Attach Screenshot / File (Optional)</label>
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 text-xs bg-white text-slate-700 cursor-pointer"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setFile(e.target.files[0]);
                } else {
                  setFile(null);
                }
              }}
              disabled={submitting}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting} className="font-bold">
              {submitting ? 'Submitting...' : 'Submit Support Ticket'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* RESOLVE TICKET MODAL */}
      <Modal
        isOpen={isResolveOpen}
        onClose={() => !submitting && setIsResolveOpen(false)}
        title="✅ Resolve Support Ticket"
      >
        <form onSubmit={handleResolveTicket} className="space-y-4 text-left">
          <div className="text-xs text-slate-600">
            <p>You are marking ticket <strong>#{selectedTicket?.id}</strong> as Resolved.</p>
            <p className="mt-1 font-semibold text-slate-800">Subject: {selectedTicket?.subject}</p>
          </div>

          <div className="text-left space-y-1">
            <label className="block text-xs font-bold text-slate-600 uppercase">Resolution Notes</label>
            <textarea
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 text-xs bg-white h-28 leading-relaxed text-slate-700"
              placeholder="Explain how this issue was fixed or add feedback for the submitter..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsResolveOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              {submitting ? 'Resolving...' : 'Confirm Resolution'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
