import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Badge } from '../../components/ui/Badge';
import { Complaint, ComplaintComment } from '../../types';
import { Eye, MessageSquare, Send } from 'lucide-react';

export const ComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [newComment, setNewComment] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');

  const fetchComplaints = async () => {
    try {
      const url = `complaints?status=${statusFilter}`;
      const res = await axiosClient.get<Complaint[]>(url);
      setComplaints(res.data);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await axiosClient.put(`complaints/${id}/status`, { status });
      fetchComplaints();
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint({ ...selectedComplaint, status: status as 'Open' | 'InProgress' | 'Resolved' | 'Rejected' });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !newComment.trim()) return;

    try {
      const res = await axiosClient.post(`complaints/${selectedComplaint.id}/comments`, { comment: newComment });
      
      const storedUser = localStorage.getItem('user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;

      const addedComment: ComplaintComment = {
        id: res.data.id,
        complaintId: selectedComplaint.id,
        userId: currentUser?.id || 0,
        userName: currentUser?.fullName || 'Me',
        userRole: currentUser?.role || 'Admin',
        comment: newComment,
        createdAt: new Date().toISOString()
      };

      setSelectedComplaint({
        ...selectedComplaint,
        comments: [...(selectedComplaint.comments || []), addedComment]
      });
      setNewComment('');
      fetchComplaints();
    } catch (err) {
      console.error('Failed to add comment:', err);
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
      <div>
        <h2 className="text-xl font-bold text-slate-800">Helpdesk & Complaints</h2>
        <p className="text-xs text-slate-500 mt-1">Review, assign, comment, and resolve complaints submitted by residents.</p>
      </div>

      {/* Filter */}
      <div className="flex bg-white p-4 rounded-xl shadow-sm border border-slate-100/50 justify-between items-center">
        <span className="text-sm font-semibold text-slate-700">Filter Status:</span>
        <div className="w-48">
          <select
            className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="InProgress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* List */}
      <Card>
        <Table headers={['Flat Number', 'Resident Name', 'Category', 'Subject', 'Priority', 'Status', 'Date Raised', 'Actions']}>
          {complaints.map((c) => (
            <tr key={c.id}>
              <td className="px-6 py-4 font-semibold text-slate-800">{c.flatNumber}</td>
              <td className="px-6 py-4">{c.residentName}</td>
              <td className="px-6 py-4 font-medium">{c.category}</td>
              <td className="px-6 py-4 truncate max-w-xs">{c.subject}</td>
              <td className="px-6 py-4">
                <Badge variant={getPriorityVariant(c.priority)}>{c.priority}</Badge>
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={c.status} />
              </td>
              <td className="px-6 py-4 text-xs">
                {new Date(c.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </td>
              <td className="px-6 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-xs"
                  onClick={() => {
                    setSelectedComplaint(c);
                    setStatusUpdate(c.status);
                  }}
                >
                  <Eye size={12} /> View
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {/* Detail Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedComplaint(null)}
          title={`Complaint Details - #${selectedComplaint.id}`}
          size="lg"
        >
          <div className="space-y-6 text-left">
            {/* Header Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Raised By</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedComplaint.residentName}</p>
                <p className="text-xs text-slate-500">Flat {selectedComplaint.flatNumber}</p>
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
                <p className="text-[10px] text-slate-400 font-bold uppercase">Date</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {new Date(selectedComplaint.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-1">Subject</h4>
              <p className="text-base font-semibold text-slate-900 mb-4">{selectedComplaint.subject}</p>
              <h4 className="text-sm font-bold text-slate-700 mb-1">Description</h4>
              <p className="text-sm text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                {selectedComplaint.description}
              </p>
            </div>

            {/* Status Change Control */}
            <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-700">Update Ticket Status:</span>
              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  <option value="Open">Open</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <Button size="sm" onClick={() => handleUpdateStatus(selectedComplaint.id, statusUpdate)}>
                  Save Status
                </Button>
              </div>
            </div>

            {/* Comments Feed */}
            <div className="border-t border-slate-100 pt-6">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <MessageSquare size={16} /> Committee & Resident Logs
              </h4>
              
              <div className="space-y-4 max-h-60 overflow-y-auto mb-4 pr-2">
                {selectedComplaint.comments && selectedComplaint.comments.length > 0 ? (
                  selectedComplaint.comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          {comment.userName}
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/50 px-1 rounded">
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
                  <p className="text-xs text-slate-400 py-4 text-center">No comments logged yet.</p>
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <Input
                  placeholder="Log comment, response or update details..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-0"
                  required
                />
                <Button type="submit" className="flex items-center gap-1.5 shrink-0">
                  <Send size={14} /> Send
                </Button>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
