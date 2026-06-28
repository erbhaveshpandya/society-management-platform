import axiosClient from '../api/axiosClient';
import { Invoice, Payment } from '../types/common.types';

export const maintenanceService = {
  getInvoices: async (): Promise<Invoice[]> => {
    const res = await axiosClient.get<Invoice[]>('maintenance/invoices');
    return res.data;
  },

  makePayment: async (invoiceId: number, amount: number, method: string): Promise<Payment> => {
    const res = await axiosClient.post<Payment>('maintenance/payments', {
      invoiceId,
      amount,
      method,
      transactionRef: '',
    });
    return res.data;
  },
};
