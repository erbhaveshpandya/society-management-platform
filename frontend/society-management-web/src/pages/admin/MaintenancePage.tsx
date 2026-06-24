import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { MaintenanceInvoice, Flat } from '../../types';
import { Plus, Bell, RefreshCw } from 'lucide-react';

export const MaintenancePage: React.FC = () => {
  const [invoices, setInvoices] = useState<MaintenanceInvoice[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    flatId: 0,
    amount: 0,
    description: 'Monthly Maintenance Charge',
    billingMonth: '',
    dueDate: '',
  });

  const fetchInvoices = async () => {
    try {
      const url = `maintenance/invoices?status=${statusFilter}&search=${searchQuery}`;
      const res = await axiosClient.get<MaintenanceInvoice[]>(url);
      setInvoices(res.data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    }
  };

  const fetchFlats = async () => {
    try {
      const res = await axiosClient.get<Flat[]>('flats');
      setFlats(res.data.filter(f => f.isOccupied));
    } catch (err) {
      console.error('Failed to load flats:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchInvoices(), fetchFlats()]);
      setLoading(false);
    };
    init();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleRemind = async (id: number) => {
    try {
      await axiosClient.post(`maintenance/invoices/${id}/remind`);
      alert('Overdue payment reminder sent successfully (simulated).');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.post('maintenance/invoices', newInvoice);
      setIsModalOpen(false);
      fetchInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Maintenance Billings</h2>
          <p className="text-xs text-slate-500 mt-1">Generate maintenance charges, track payments, and send reminders.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-1" onClick={fetchInvoices}>
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button className="flex items-center gap-1.5" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> New Invoice
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100/50">
        <form onSubmit={handleSearch} className="flex gap-2 items-center flex-1">
          <Input
            placeholder="Search by Flat or Resident name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-0"
          />
          <Button type="submit">Search</Button>
        </form>
        <div className="w-full sm:w-48 text-left">
          <select
            className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
            <option value="PendingApproval">Pending Approval</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table headers={['Invoice ID', 'Flat Number', 'Owner', 'Billing Month', 'Amount', 'Due Date', 'Status', 'Actions']}>
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td className="px-6 py-4 font-mono font-semibold text-slate-500">#{inv.id}</td>
              <td className="px-6 py-4 font-semibold text-slate-800">{inv.flatNumber}</td>
              <td className="px-6 py-4">{inv.ownerName}</td>
              <td className="px-6 py-4 font-medium">{inv.billingMonth}</td>
              <td className="px-6 py-4 font-bold">₹{inv.amount.toLocaleString()}</td>
              <td className="px-6 py-4 text-xs">
                {new Date(inv.dueDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={inv.status} />
              </td>
              <td className="px-6 py-4">
                {inv.status !== 'Paid' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-xs px-2.5 py-1"
                    onClick={() => handleRemind(inv.id)}
                  >
                    <Bell size={12} /> Remind
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Maintenance Invoice"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="mb-4 text-left">
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Occupied Flat</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={newInvoice.flatId || ''}
              onChange={(e) => setNewInvoice({ ...newInvoice, flatId: parseInt(e.target.value) })}
              required
            >
              <option value="">Select Flat</option>
              {flats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.flatNumber} ({f.ownerName})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Amount (₹)"
            type="number"
            value={newInvoice.amount || ''}
            onChange={(e) => setNewInvoice({ ...newInvoice, amount: parseFloat(e.target.value) })}
            placeholder="e.g. 3500"
            required
          />

          <Input
            label="Billing Month"
            type="text"
            value={newInvoice.billingMonth}
            onChange={(e) => setNewInvoice({ ...newInvoice, billingMonth: e.target.value })}
            placeholder="e.g. June 2026"
            required
          />

          <Input
            label="Due Date"
            type="date"
            value={newInvoice.dueDate}
            onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
            required
          />

          <Input
            label="Description"
            type="text"
            value={newInvoice.description}
            onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
            required
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Generate
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
