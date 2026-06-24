import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Expense, Vendor } from '../../types';
import { Plus, Filter } from 'lucide-react';

const CATEGORIES = ['Housekeeping', 'Gardening', 'Electricity', 'Water', 'Repairs', 'Maintenance', 'Salaries', 'Others'];

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Partial<Expense>>({
    category: 'Housekeeping',
    date: new Date().toISOString().split('T')[0],
  });
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const fetchData = async () => {
    try {
      const expensesRes = await axiosClient.get<Expense[]>('expenses');
      setExpenses(expensesRes.data);
      const vendorsRes = await axiosClient.get<Vendor[]>('expenses/vendors');
      setVendors(vendorsRes.data);
    } catch (err) {
      console.error('Failed to load expenses data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.post('expenses', {
        ...currentExpense,
        amount: parseFloat(currentExpense.amount?.toString() || '0'),
      });
      setIsOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving expense:', err);
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesStatus = statusFilter === 'All' || exp.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || exp.category === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Expenses Ledger</h2>
          <p className="text-xs text-slate-500 mt-1">Record and track housing society payouts, vendor bills, and operational expenses.</p>
        </div>
        <Button className="flex items-center gap-1.5" onClick={() => {
          setCurrentExpense({
            category: 'Housekeeping',
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            description: '',
            voucherNumber: ''
          });
          setIsOpen(true);
        }}>
          <Plus size={16} /> Record Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-50 border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase">Total Logged</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">₹{totalAmount.toLocaleString('en-IN')}</p>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase">Total Vouchers</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{filteredExpenses.length}</p>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase">Active Vendors</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{vendors.length}</p>
        </Card>
      </div>

      <Card className="p-4 flex flex-wrap gap-4 items-center justify-between bg-white">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Filter size={14} /> Filter:
          </div>
          <div>
            <select
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-1.5"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-1.5"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <Table headers={['Voucher #', 'Category', 'Date', 'Amount', 'Vendor', 'Description', 'Status']}>
          {filteredExpenses.map((expense) => (
            <tr key={expense.id}>
              <td className="px-6 py-4 font-semibold text-slate-800">{expense.voucherNumber}</td>
              <td className="px-6 py-4">{expense.category}</td>
              <td className="px-6 py-4">{new Date(expense.date).toLocaleDateString('en-IN')}</td>
              <td className="px-6 py-4 font-bold text-slate-800">₹{expense.amount.toLocaleString('en-IN')}</td>
              <td className="px-6 py-4 font-medium">{expense.vendorName || 'Direct Expense'}</td>
              <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{expense.description || 'N/A'}</td>
              <td className="px-6 py-4">
                <StatusBadge status={expense.status === 'Paid' ? 'Paid' : expense.status === 'Approved' ? 'Pending' : 'Overdue'} />
                <span className="text-xs font-semibold text-slate-500 ml-1.5">{expense.status}</span>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Record New Expense"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="text-left">
            <label className="block text-sm font-medium text-slate-700 mb-1">Expense Category</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={currentExpense.category || ''}
              onChange={(e) => setCurrentExpense({ ...currentExpense, category: e.target.value })}
              required
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <Input
            label="Amount (₹)"
            type="number"
            value={currentExpense.amount || ''}
            onChange={(e) => setCurrentExpense({ ...currentExpense, amount: parseFloat(e.target.value) })}
            placeholder="e.g. 5000"
            required
          />

          <Input
            label="Date"
            type="date"
            value={currentExpense.date || ''}
            onChange={(e) => setCurrentExpense({ ...currentExpense, date: e.target.value })}
            required
          />

          <div className="text-left">
            <label className="block text-sm font-medium text-slate-700 mb-1">Payee Vendor (Optional)</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={currentExpense.vendorId || ''}
              onChange={(e) => setCurrentExpense({ ...currentExpense, vendorId: e.target.value ? parseInt(e.target.value) : undefined })}
            >
              <option value="">Direct / No Vendor</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.serviceType})</option>
              ))}
            </select>
          </div>

          <Input
            label="Voucher Number (Optional)"
            type="text"
            value={currentExpense.voucherNumber || ''}
            onChange={(e) => setCurrentExpense({ ...currentExpense, voucherNumber: e.target.value })}
            placeholder="Auto-generated if left blank"
          />

          <Input
            label="Description"
            type="text"
            value={currentExpense.description || ''}
            onChange={(e) => setCurrentExpense({ ...currentExpense, description: e.target.value })}
            placeholder="Details about this payout"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
