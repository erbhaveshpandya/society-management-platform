import React from 'react';
import { Badge } from './Badge';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toLowerCase();

  switch (normalized) {
    // Invoice
    case 'paid':
    case 'approved':
    case 'resolved':
      return <Badge variant="success">{status}</Badge>;
    case 'pending':
    case 'requested':
      return <Badge variant="warning">{status}</Badge>;
    case 'overdue':
    case 'rejected':
    case 'cancelled':
      return <Badge variant="danger">{status}</Badge>;
    case 'pendingapproval':
    case 'inprogress':
      return <Badge variant="info">{status}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};
