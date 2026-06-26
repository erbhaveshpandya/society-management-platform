import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { MaintenanceInvoice } from '../../types';
import { CreditCard, RefreshCw, CheckCircle, AlertCircle, Smartphone, Building2, ShieldCheck, Printer, X, Download } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const MyDuesPage: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<MaintenanceInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<MaintenanceInvoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Netbanking'>('UPI');
  const [checkoutStep, setCheckoutStep] = useState<'select' | 'processing' | 'success' | 'failed'>('select');
  const [processingProgress, setProcessingProgress] = useState(0);

  // Card details states
  const [cardForm, setCardForm] = useState({ number: '', name: '', expiry: '', cvv: '' });
  // UPI states
  const [upiTimer, setUpiTimer] = useState(120);
  // Netbanking states
  const [selectedBank, setSelectedBank] = useState('');

  // Receipt states
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptInvoice, setReceiptInvoice] = useState<MaintenanceInvoice | null>(null);

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

  // UPI Countdown Timer
  useEffect(() => {
    let timer: any;
    if (isCheckoutOpen && paymentMethod === 'UPI' && checkoutStep === 'select') {
      if (upiTimer > 0) {
        timer = setTimeout(() => setUpiTimer((prev) => prev - 1), 1000);
      } else {
        setUpiTimer(120); // reset
      }
    }
    return () => clearTimeout(timer);
  }, [upiTimer, isCheckoutOpen, paymentMethod, checkoutStep]);

  const handleOpenCheckout = (inv: MaintenanceInvoice) => {
    setSelectedInvoice(inv);
    setCheckoutStep('select');
    setPaymentMethod('UPI');
    setCardForm({ number: '', name: '', expiry: '', cvv: '' });
    setSelectedBank('');
    setUpiTimer(120);
    setIsCheckoutOpen(true);
  };

  const handleStartPayment = async () => {
    if (!selectedInvoice) return;
    setCheckoutStep('processing');
    setProcessingProgress(0);

    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 150);

    setTimeout(async () => {
      try {
        const ref = `SIM-TXN-${Date.now()}`;
        await axiosClient.post('maintenance/payments', {
          invoiceId: selectedInvoice.id,
          amount: selectedInvoice.amount,
          method: paymentMethod,
          transactionRef: ref
        });
        clearInterval(interval);
        setCheckoutStep('success');
        fetchDues();
      } catch (err) {
        console.error(err);
        clearInterval(interval);
        setCheckoutStep('failed');
      }
    }, 1800);
  };

  const handleOpenReceipt = (inv: MaintenanceInvoice) => {
    setReceiptInvoice(inv);
    setIsReceiptOpen(true);
  };

  const handlePrintReceipt = () => {
    const printContent = document.getElementById('printable-receipt');
    if (!printContent) return;
    const printWindow = window.open('about:blank', '_blank', 'left=50,top=50,width=800,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - Invoice #${receiptInvoice?.id}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #334155; line-height: 1.5; }
            .container { max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
            .logo { font-size: 20px; font-weight: bold; color: #0f172a; }
            .receipt-label { font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 700; text-align: right; }
            .ref-no { font-family: monospace; font-size: 12px; margin-top: 4px; }
            .details { display: grid; grid-template-cols: 1fr 1fr; gap: 16px; margin-bottom: 24px; font-size: 13px; }
            .details span { color: #64748b; }
            .details strong { color: #1e293b; }
            .table-container { margin: 24px 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 16px 0; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
            .total-row { display: flex; justify-content: space-between; padding-top: 16px; margin-top: 8px; font-weight: bold; font-size: 16px; border-top: 2px dashed #e2e8f0; }
            .stamp { border: 3px dashed #10b981; color: #10b981; display: inline-block; padding: 6px 12px; font-weight: bold; font-size: 18px; text-transform: uppercase; margin-top: 20px; transform: rotate(-6deg); border-radius: 4px; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="container">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
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
                    onClick={() => handleOpenCheckout(inv)}
                  >
                    <CreditCard size={12} /> Pay Now
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-600 font-semibold">Settled</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs py-1 px-2.5 flex items-center gap-1 border-slate-200 hover:bg-slate-50"
                      onClick={() => handleOpenReceipt(inv)}
                    >
                      <Printer size={11} /> Receipt
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {/* PAYMENT CHECKOUT MODAL */}
      {selectedInvoice && (
        <Modal
          isOpen={isCheckoutOpen}
          onClose={() => checkoutStep !== 'processing' && setIsCheckoutOpen(false)}
          title={`Secure Checkout - Invoice #${selectedInvoice.id}`}
        >
          {checkoutStep === 'select' && (
            <div className="space-y-4 text-left">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex justify-between items-center text-xs">
                <div>
                  <p className="text-slate-400 font-medium">Billing Period: {selectedInvoice.billingMonth}</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{selectedInvoice.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-medium">Total Amount</p>
                  <p className="font-bold text-slate-800 text-base">₹{selectedInvoice.amount.toLocaleString()}</p>
                </div>
              </div>

              {/* Payment Methods tabs */}
              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
                <button
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all text-xs font-semibold gap-1.5 ${
                    paymentMethod === 'UPI'
                      ? 'border-primary-500 bg-primary-50/30 text-primary-600'
                      : 'border-slate-100 hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  <Smartphone size={16} />
                  <span>UPI / QR</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('Card')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all text-xs font-semibold gap-1.5 ${
                    paymentMethod === 'Card'
                      ? 'border-primary-500 bg-primary-50/30 text-primary-600'
                      : 'border-slate-100 hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  <CreditCard size={16} />
                  <span>Card</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('Netbanking')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all text-xs font-semibold gap-1.5 ${
                    paymentMethod === 'Netbanking'
                      ? 'border-primary-500 bg-primary-50/30 text-primary-600'
                      : 'border-slate-100 hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  <Building2 size={16} />
                  <span>Netbanking</span>
                </button>
              </div>

              {/* Method UI forms */}
              {paymentMethod === 'UPI' && (
                <div className="space-y-4 py-2 text-center">
                  <p className="text-xs text-slate-500 font-medium">Scan the QR code below using any UPI app (PhonePe, GPay, Paytm)</p>
                  <div className="flex justify-center">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl relative shadow-sm">
                      {/* Premium Mock QR code with UPI logo */}
                      <div className="w-40 h-40 bg-slate-50 rounded flex flex-wrap justify-between p-3 relative items-center">
                        {Array.from({ length: 25 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-5 w-5 rounded-sm ${
                              (i * 3 + 7) % 4 === 0 || i % 5 === 0 ? 'bg-slate-900' : 'bg-transparent'
                            }`}
                          ></div>
                        ))}
                        <div className="absolute inset-0 flex justify-center items-center">
                          <span className="bg-white px-2 py-0.5 border border-slate-200 rounded text-[9px] font-black text-slate-800 tracking-wider">UPI</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 font-semibold flex items-center justify-center gap-1">
                    QR expires in <span className="text-red-500 font-bold">{Math.floor(upiTimer / 60)}:{(upiTimer % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              )}

              {paymentMethod === 'Card' && (
                <div className="space-y-3 py-2 text-left">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Card Number</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 font-mono"
                      placeholder="4111 2222 3333 4444"
                      value={cardForm.number}
                      onChange={(e) => setCardForm({ ...cardForm, number: formatCardNumber(e.target.value) })}
                      maxLength={19}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
                      placeholder="e.g. AMIT KUMAR"
                      value={cardForm.name}
                      onChange={(e) => setCardForm({ ...cardForm, name: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expiry Date</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 font-mono"
                        placeholder="MM/YY"
                        value={cardForm.expiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^0-9]/g, '');
                          if (val.length >= 2) val = val.substring(0,2) + '/' + val.substring(2,4);
                          setCardForm({ ...cardForm, expiry: val });
                        }}
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CVV</label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 font-mono"
                        placeholder="•••"
                        value={cardForm.cvv}
                        onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/[^0-9]/g, '') })}
                        maxLength={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'Netbanking' && (
                <div className="space-y-3 py-2 text-left">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Select Bank</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map((bank) => (
                      <button
                        key={bank}
                        onClick={() => setSelectedBank(bank)}
                        className={`p-2.5 text-xs text-left border rounded-lg font-medium transition-all ${
                          selectedBank === bank
                            ? 'border-primary-500 bg-primary-50/20 text-primary-700'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium uppercase tracking-wider">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>256-Bit SSL Encryption</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" type="button" onClick={() => setIsCheckoutOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="button"
                    onClick={handleStartPayment}
                    disabled={
                      (paymentMethod === 'Card' && (!cardForm.number || !cardForm.name || !cardForm.expiry || !cardForm.cvv)) ||
                      (paymentMethod === 'Netbanking' && !selectedBank)
                    }
                  >
                    Pay Total ₹{selectedInvoice.amount.toLocaleString()}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {checkoutStep === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-100 border-t-primary-600"></div>
                <div className="absolute font-semibold text-xs text-slate-500">{processingProgress}%</div>
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Processing Secure Transaction</h3>
              <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                Contacting payment partner. Please do not close this modal or refresh the page.
              </p>
            </div>
          )}

          {checkoutStep === 'success' && (
            <div className="py-8 text-center space-y-4 text-left">
              <div className="flex justify-center">
                <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-100">
                  <CheckCircle size={32} />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Payment Successful!</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
                  Your dues have been settled. An e-receipt has been generated in your history logs.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-center">
                <Button variant="primary" onClick={() => setIsCheckoutOpen(false)}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          )}

          {checkoutStep === 'failed' && (
            <div className="py-8 text-center space-y-4 text-left">
              <div className="flex justify-center">
                <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 border border-red-100">
                  <AlertCircle size={32} />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Payment Declined</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
                  Transaction failed due to network timeout or authorization limits. Please try again.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-center gap-3">
                <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
                  Close
                </Button>
                <Button variant="primary" onClick={() => setCheckoutStep('select')}>
                  Retry Payment
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* PRINTABLE RECEIPT MODAL */}
      {receiptInvoice && (
        <Modal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          title={`Invoice E-Receipt - #${receiptInvoice.id}`}
        >
          <div className="space-y-6 text-left">
            {/* Printable container */}
            <div id="printable-receipt" className="p-4 bg-white border border-slate-100 rounded-xl space-y-5">
              <div className="flex justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="logo">{user?.societyName || 'GREEN VALLEY RESIDENCY'}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Registration: MH-SOC-2020-001</p>
                  <p className="text-[10px] text-slate-400">Sector 5, Wakad, Pune, 411057</p>
                </div>
                <div className="text-right">
                  <h4 className="receipt-label">Payment Receipt</h4>
                  <p className="ref-no">No: RCP-{(receiptInvoice.payment?.id || receiptInvoice.id).toString().padStart(6, '0')}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Date: {receiptInvoice.payment ? new Date(receiptInvoice.payment.paymentDate).toLocaleDateString() : new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="details">
                <div>
                  <span>Billed To:</span>
                  <p className="font-semibold text-slate-700 mt-0.5">{receiptInvoice.ownerName || 'Society Member'}</p>
                  <p className="text-[11px]">Flat {receiptInvoice.flatNumber} {receiptInvoice.buildingName ? `, ${receiptInvoice.buildingName}` : ''}</p>
                </div>
                <div>
                  <span>Payment Info:</span>
                  <p className="font-semibold text-slate-700 mt-0.5">Method: {receiptInvoice.payment?.method || 'UPI'}</p>
                  <p className="ref-no font-medium">Ref: {receiptInvoice.payment?.transactionRef || 'N/A'}</p>
                </div>
              </div>

              <div className="table-container">
                <div className="row font-semibold text-slate-500 border-b border-slate-100 pb-1">
                  <span>Particulars</span>
                  <span>Amount</span>
                </div>
                <div className="row py-2 text-slate-700">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-xs">Society Maintenance Charges</p>
                    <p className="text-[10px] text-slate-400">{receiptInvoice.description}</p>
                  </div>
                  <span className="font-bold">₹{receiptInvoice.amount.toLocaleString()}</span>
                </div>
                <div className="total-row">
                  <span>Total Amount Paid</span>
                  <span>₹{receiptInvoice.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between items-end pt-2">
                <div>
                  <div className="stamp">Digitally Settled</div>
                </div>
                <div className="text-right text-[10px] text-slate-400">
                  <p>Computer generated document.</p>
                  <p>No signature required.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setIsReceiptOpen(false)} className="flex items-center gap-1 text-xs">
                <X size={12} /> Close
              </Button>
              <Button variant="primary" onClick={handlePrintReceipt} className="flex items-center gap-1.5 text-xs">
                <Printer size={13} /> Print / Save PDF
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

