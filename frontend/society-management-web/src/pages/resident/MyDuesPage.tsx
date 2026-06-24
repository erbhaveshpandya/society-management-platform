import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { MaintenanceInvoice } from '../../types';
import { CreditCard, CreditCard as UpiIcon, RefreshCw } from 'lucide-react';

export const MyDuesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<MaintenanceInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDues = async () => {
    try {
      const res = await axiosClient.get<MaintenanceInvoice[]>('maintenance/invoices');
      setInvoices(res.data);
    } catch (err) {
      console.error('Failed to load dues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDues();
  }, []);

  const handlePay = async (invoiceId: number, amount: number) => {
    if (!window.confirm(`Simulate payment of ₹${amount} for invoice #${invoiceId}?`)) return;

    try {
      setLoading(true);
      await axiosClient.post('maintenance/payments', {
        invoiceId,
        amount,
        method: 'UPI',
        transactionRef: `SIM-TXN-${Date.now()}`
      });
      alert('Payment simulated successfully! Invoice marked as paid.');
      fetchDues();
    } catch (err) {
      console.error(err);
      alert('Payment failed.');
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Dues & Invoices</h2>
          <p className="text-xs text-slate-500 mt-1">Review outstanding charges, payment history, and download receipts.</p>
        </div>
        <Button variant="outline" className="flex items-center gap-1" onClick={fetchDues}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      <Card>
        <Table headers={['Invoice ID', 'Billing Month', 'Description', 'Amount', 'Due Date', 'Status', 'Payment Method', 'Actions']}>
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td className="px-6 py-4 font-mono font-semibold text-slate-500">#{inv.id}</td>
              <td className="px-6 py-4 font-semibold text-slate-800">{inv.billingMonth}</td>
              <td className="px-6 py-4 text-xs">{inv.description}</td>
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
              <td className="px-6 py-4 text-xs">
                {inv.payment ? `${inv.payment.method} (${inv.payment.transactionRef})` : 'N/A'}
              </td>
              <td className="px-6 py-4">
                {inv.status !== 'Paid' ? (
                  <Button
                    size="sm"
                    className="flex items-center gap-1 text-xs"
                    onClick={() => handlePay(inv.id, inv.amount)}
                  >
                    <CreditCard size={12} /> Pay Now
                  </Button>
                ) : (
                  <span className="text-xs text-emerald-600 font-semibold">Setted</span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
};
