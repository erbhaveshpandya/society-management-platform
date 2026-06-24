import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Badge } from '../../components/ui/Badge';
import { Complaint, ComplaintComment, Flat } from '../../types';
import { Plus, MessageSquare, Send, Eye, FileText, AlertTriangle } from 'lucide-react';

const CATEGORIES = ['Plumbing', 'Electrical', 'Elevator', 'Security', 'Carpentry', 'Cleaning', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export const ComplaintsPage: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [newComment, setNewComment] = useState('');
  
  const [formData, setFormData] = useState({
    flatId: '',
    subject: '',
    description: '',
    category: 'Plumbing',
    priority: 'Medium'
  });

  const fetchData = async () => {
    try {
      const complaintsRes = await axiosClient.get<Complaint[]>('complaints');
      setComplaints(complaintsRes.data);

      const flatsRes = await axiosClient.get<Flat[]>('flats');
      setFlats(flatsRes.data);
    } catch (err) {
      console.error('Failed to load resident complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter flats to only show those where current user is owner or resident
  const myFlats = flats.filter(
    (f) =>
      f.ownerId === user?.id ||
      (f.residents && f.residents.some((r: any) => r.userId === user?.id))
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.flatId) return;

    try {
      await axiosClient.post('complaints', {
        flatId: parseInt(formData.flatId),
        subject: formData.subject,
        description: formData.description,
        category: formData.category,
        priority: formData.priority
      });
      setIsOpen(false);
      setFormData({
        flatId: '',
        subject: '',
        description: '',
        category: 'Plumbing',
        priority: 'Medium'
      });
      fetchData();
    } catch (err) {
      console.error('Failed to create complaint:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !newComment.trim()) return;

    try {
      const res = await axiosClient.post(`complaints/${selectedComplaint.id}/comments`, { comment: newComment });

      const addedComment: ComplaintComment = {
        id: res.data.id,
        complaintId: selectedComplaint.id,
        userId: user?.id || 0,
        userName: user?.fullName || 'Me',
        userRole: user?.role || 'Resident',
        comment: newComment,
        createdAt: new Date().toISOString()
      };

      setSelectedComplaint({
        ...selectedComplaint,
        comments: [...(selectedComplaint.comments || []), addedComment]
      });
      setNewComment('');
      fetchData();
    } catch (err) {
      console.error('Failed to submit complaint comment:', err);
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'danger';
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Support Tickets</h2>
          <p className="text-xs text-slate-500 mt-1">
            File tickets for maintenance issues and track response updates from the management committee.
          </p>
        </div>
        <Button className="flex items-center gap-1.5" onClick={() => {
          if (myFlats.length > 0) {
            setFormData(prev => ({ ...prev, flatId: myFlats[0].id.toString() }));
          }
          setIsOpen(true);
        }}>
          <Plus size={16} /> Raise Complaint
        </Button>
      </div>

      <Card>
        {complaints.length > 0 ? (
          <Table headers={['Ticket ID', 'Flat #', 'Category', 'Subject', 'Priority', 'Status', 'Date Raised', 'Actions']}>
            {complaints.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-500">#{c.id}</td>
                <td className="px-6 py-4 font-semibold text-slate-800">Flat {c.flatNumber}</td>
                <td className="px-6 py-4 font-medium text-slate-700">{c.category}</td>
                <td className="px-6 py-4 truncate max-w-xs">{c.subject}</td>
                <td className="px-6 py-4">
                  <Badge variant={getPriorityVariant(c.priority)}>{c.priority}</Badge>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                  {new Date(c.createdAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </td>
                <td className="px-6 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-xs"
                    onClick={() => setSelectedComplaint(c)}
                  >
                    <Eye size={12} /> Details
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-slate-50 rounded-full border border-slate-100 text-slate-400 mb-3">
              <FileText size={32} />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No complaints raised yet</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Click the button above to log a maintenance concern or service request.
            </p>
          </div>
        )}
      </Card>

      {/* Raise Complaint Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="File a Support Ticket">
        {myFlats.length > 0 ? (
          <form onSubmit={handleSave} className="space-y-4 text-left">
            <div className="text-left mb-3">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Flat</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100"
                value={formData.flatId}
                onChange={(e) => setFormData({ ...formData, flatId: e.target.value })}
                required
              >
                <option value="">Choose a Flat...</option>
                {myFlats.map((f) => (
                  <option key={f.id} value={f.id}>
                    Flat {f.flatNumber} ({f.buildingName})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-left mb-3">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-left mb-3">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  required
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Subject / Headline"
              placeholder="e.g. Geyser leaking in master bathroom"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />

            <div className="text-left mb-3">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 font-medium">Detailed Description</label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 min-h-[100px]"
                placeholder="Describe the issue, location, availability for technician check-in, etc."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Submit Ticket
              </Button>
            </div>
          </form>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="text-amber-500 mb-2" size={24} />
            <h4 className="text-sm font-bold text-slate-700">No flat profiles found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Your profile is not assigned to any flats. Please contact the society administrator to map your profile.
            </p>
            <div className="mt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedComplaint(null)}
          title={`Support Ticket Details - #${selectedComplaint.id}`}
          size="lg"
        >
          <div className="space-y-6 text-left">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Associated Flat</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">Flat {selectedComplaint.flatNumber}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Category</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedComplaint.category}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Priority</p>
                <div className="mt-1">
                  <Badge variant={getPriorityVariant(selectedComplaint.priority)}>{selectedComplaint.priority}</Badge>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedComplaint.status} />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-0.5">Subject</h4>
              <p className="text-base font-semibold text-slate-900 mb-3">{selectedComplaint.subject}</p>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-0.5">Description</h4>
              <p className="text-sm text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                {selectedComplaint.description}
              </p>
            </div>

            {/* Conversation Logs */}
            <div className="border-t border-slate-100 pt-6">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <MessageSquare size={16} /> Updates & Committee Remarks
              </h4>

              <div className="space-y-4 max-h-60 overflow-y-auto mb-4 pr-2">
                {selectedComplaint.comments && selectedComplaint.comments.length > 0 ? (
                  selectedComplaint.comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          {comment.userName}
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/50 px-1.5 rounded">
                            {comment.userRole}
                          </span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(comment.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-normal text-left">{comment.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No logs logged yet.</p>
                )}
              </div>

              {/* Add Comment Form */}
              {selectedComplaint.status !== 'Resolved' && selectedComplaint.status !== 'Rejected' ? (
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <Input
                    placeholder="Type a message or response to administrators..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mb-0"
                    required
                  />
                  <Button type="submit" className="flex items-center gap-1.5 shrink-0">
                    <Send size={14} /> Send
                  </Button>
                </form>
              ) : (
                <div className="p-3 bg-slate-50 text-slate-400 text-xs font-semibold rounded-lg text-center">
                  This ticket has been marked {selectedComplaint.status.toLowerCase()} and comment threads are locked.
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
