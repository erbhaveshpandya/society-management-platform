import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AppCard } from '../../components/AppCard';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { StatusBadge } from '../../components/StatusBadge';
import { maintenanceService } from '../../services/maintenanceService';
import { Invoice } from '../../types/common.types';
import { formatDate } from '../../utils/dateUtils';

const PAYMENT_METHODS = ['Cash', 'UPI', 'NetBanking', 'Cheque'];

export const DuesScreen: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paying, setPaying] = useState(false);

  const fetchInvoices = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await maintenanceService.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error('Invoices error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchInvoices(); }, []));

  const totalPending = invoices.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0);

  const handlePay = async (method: string) => {
    if (!selectedInvoice) return;
    Alert.alert('Confirm Payment', `Pay ₹${selectedInvoice.amount.toLocaleString('en-IN')} via ${method}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setPaying(true);
          try {
            await maintenanceService.makePayment(selectedInvoice.id, selectedInvoice.amount, method);
            Alert.alert('Payment Successful', `Receipt generated. Transaction via ${method}.`);
            setPayModalVisible(false);
            setSelectedInvoice(null);
            fetchInvoices(true);
          } catch (err) {
            console.error('Payment error:', err);
            Alert.alert('Payment Failed', 'Could not process payment. Please try again.');
          } finally {
            setPaying(false);
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingState message="Loading dues..." />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>💰 My Dues</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#FEF2F2' }]}>
          <Text style={[styles.summaryAmount, { color: '#DC2626' }]}>₹{totalPending.toLocaleString('en-IN')}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#ECFDF5' }]}>
          <Text style={[styles.summaryAmount, { color: '#059669' }]}>₹{totalPaid.toLocaleString('en-IN')}</Text>
          <Text style={styles.summaryLabel}>Paid</Text>
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchInvoices(true)} colors={['#4F46E5']} />}
      >
        {invoices.length === 0 ? (
          <EmptyState title="No invoices found" icon="receipt-outline" />
        ) : (
          invoices.map(inv => (
            <AppCard key={inv.id} style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                <View>
                  <Text style={styles.billingMonth}>{inv.billingMonth}</Text>
                  <Text style={styles.invoiceDesc} numberOfLines={1}>{inv.description}</Text>
                </View>
                <StatusBadge status={inv.status} />
              </View>
              <View style={styles.invoiceDetails}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.amountText}>₹{inv.amount.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Due Date</Text>
                  <Text style={styles.detailValue}>{formatDate(inv.dueDate)}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Flat</Text>
                  <Text style={styles.detailValue}>{inv.flatNumber}</Text>
                </View>
              </View>
              {inv.status !== 'Paid' && (
                <TouchableOpacity
                  style={styles.payBtn}
                  onPress={() => { setSelectedInvoice(inv); setPayModalVisible(true); }}
                >
                  <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.payBtnText}>Pay Now</Text>
                </TouchableOpacity>
              )}
              {inv.payment && (
                <View style={styles.receiptRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.receiptText}>
                    Paid via {inv.payment.method} • {inv.payment.receiptNumber}
                  </Text>
                </View>
              )}
            </AppCard>
          ))
        )}
      </ScrollView>

      {/* Payment Method Modal */}
      <Modal visible={payModalVisible} animationType="fade" transparent onRequestClose={() => setPayModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="card" size={24} color="#4F46E5" />
              <Text style={styles.modalTitle}>Select Payment Method</Text>
              <TouchableOpacity onPress={() => setPayModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            {selectedInvoice && (
              <Text style={styles.modalAmount}>₹{selectedInvoice.amount.toLocaleString('en-IN')} — {selectedInvoice.billingMonth}</Text>
            )}
            {paying ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Processing payment...</Text>
              </View>
            ) : (
              <View style={styles.methodGrid}>
                {PAYMENT_METHODS.map(method => (
                  <TouchableOpacity key={method} style={styles.methodBtn} onPress={() => handlePay(method)}>
                    <Ionicons
                      name={method === 'Cash' ? 'cash-outline' : method === 'UPI' ? 'phone-portrait-outline' : method === 'NetBanking' ? 'globe-outline' : 'document-text-outline'}
                      size={28} color="#4F46E5"
                    />
                    <Text style={styles.methodLabel}>{method}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 8 },
  summaryCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
  summaryAmount: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 4 },
  list: { flex: 1 },
  listContent: { padding: 20, gap: 12 },
  invoiceCard: { marginBottom: 0 },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  billingMonth: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  invoiceDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2, maxWidth: 200 },
  invoiceDetails: { flexDirection: 'row', marginTop: 12, gap: 16 },
  detailCol: {},
  detailLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' },
  amountText: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 2 },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#475569', marginTop: 2 },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 12, marginTop: 12,
  },
  payBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  receiptRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  receiptText: { fontSize: 12, color: '#059669', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, width: '100%', padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 12, marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', flex: 1 },
  modalAmount: { fontSize: 16, fontWeight: '700', color: '#4F46E5', textAlign: 'center', marginBottom: 16 },
  loadingBox: { alignItems: 'center', justifyContent: 'center', padding: 30, gap: 12 },
  loadingText: { color: '#4F46E5', fontWeight: '600' },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  methodBtn: {
    width: '47%', aspectRatio: 1.3, borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  methodLabel: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
});
