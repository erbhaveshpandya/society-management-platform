import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Open: { bg: '#FEF3C7', text: '#92400E' },
  InProgress: { bg: '#DBEAFE', text: '#1E40AF' },
  Resolved: { bg: '#D1FAE5', text: '#065F46' },
  Rejected: { bg: '#FEE2E2', text: '#991B1B' },
  Pending: { bg: '#FEF3C7', text: '#92400E' },
  Paid: { bg: '#D1FAE5', text: '#065F46' },
  Overdue: { bg: '#FEE2E2', text: '#991B1B' },
  Active: { bg: '#DBEAFE', text: '#1E40AF' },
  Closed: { bg: '#F1F5F9', text: '#475569' },
  Low: { bg: '#F0FDF4', text: '#166534' },
  Medium: { bg: '#FEF3C7', text: '#92400E' },
  High: { bg: '#FED7AA', text: '#9A3412' },
  Critical: { bg: '#FEE2E2', text: '#991B1B' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const colors = STATUS_COLORS[status] || { bg: '#F1F5F9', text: '#475569' };
  const isSmall = size === 'small';

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, isSmall && styles.badgeSmall]}>
      <Text style={[styles.text, { color: colors.text }, isSmall && styles.textSmall]}>
        {status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 10,
  },
});
