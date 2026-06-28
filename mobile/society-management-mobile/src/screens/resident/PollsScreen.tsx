import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AppCard } from '../../components/AppCard';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { StatusBadge } from '../../components/StatusBadge';
import { pollService } from '../../services/pollService';
import { Poll } from '../../types/common.types';

export const PollsScreen: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [voting, setVoting] = useState<number | null>(null);

  const fetchPolls = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await pollService.getPolls();
      setPolls(data);
    } catch (err) {
      console.error('Polls error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchPolls(); }, []));

  const handleVote = async (pollId: number, optionId: number, optionText: string) => {
    Alert.alert('Confirm Vote', `Vote for "${optionText}"? This cannot be changed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Vote',
        onPress: async () => {
          setVoting(pollId);
          try {
            await pollService.vote(pollId, optionId);
            Alert.alert('Vote Recorded', 'Your vote has been submitted successfully.');
            fetchPolls(true);
          } catch (err: any) {
            const msg = err?.response?.data || 'Failed to submit vote.';
            Alert.alert('Vote Failed', typeof msg === 'string' ? msg : 'An error occurred.');
          } finally {
            setVoting(null);
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingState message="Loading polls..." />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>🗳️ Opinion Polls</Text>
        <Text style={styles.subtitle}>{polls.length} polls</Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPolls(true)} colors={['#4F46E5']} />}
      >
        {polls.length === 0 ? (
          <EmptyState title="No polls available" icon="bar-chart-outline" />
        ) : (
          polls.map(poll => {
            const isActive = poll.status === 'Active';
            const canVote = isActive && !poll.hasUserVoted;

            return (
              <AppCard key={poll.id} style={styles.pollCard}>
                <View style={styles.pollHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pollQuestion}>{poll.question}</Text>
                    {poll.description ? <Text style={styles.pollDesc}>{poll.description}</Text> : null}
                  </View>
                  <StatusBadge status={poll.status} />
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>By {poll.createdByName}</Text>
                  <Text style={styles.metaText}>•</Text>
                  <Text style={styles.metaText}>{poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}</Text>
                  {poll.hasUserVoted && (
                    <>
                      <Text style={styles.metaText}>•</Text>
                      <View style={styles.votedBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#059669" />
                        <Text style={styles.votedText}>Voted</Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Options */}
                <View style={styles.optionsContainer}>
                  {poll.options.map(opt => {
                    const isSelected = poll.votedOptionId === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[styles.optionRow, isSelected && styles.optionSelected]}
                        disabled={!canVote || voting === poll.id}
                        onPress={() => handleVote(poll.id, opt.id, opt.optionText)}
                        activeOpacity={canVote ? 0.7 : 1}
                      >
                        <View style={styles.optionLeft}>
                          {canVote ? (
                            <View style={styles.radioOuter}>
                              <View style={isSelected ? styles.radioInner : null} />
                            </View>
                          ) : (
                            <Ionicons
                              name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                              size={20}
                              color={isSelected ? '#4F46E5' : '#CBD5E1'}
                            />
                          )}
                          <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                            {opt.optionText}
                          </Text>
                        </View>
                        <View style={styles.optionRight}>
                          <Text style={styles.percentText}>{opt.percentage}%</Text>
                          <Text style={styles.voteCountText}>{opt.voteCount}</Text>
                        </View>
                        {/* Percentage Bar */}
                        <View style={styles.barBg}>
                          <View style={[styles.barFill, { width: `${opt.percentage}%` }, isSelected && styles.barFillSelected]} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </AppCard>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  list: { flex: 1 },
  listContent: { padding: 20, gap: 16 },
  pollCard: { marginBottom: 0 },
  pollHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  pollQuestion: { fontSize: 16, fontWeight: '700', color: '#1E293B', lineHeight: 22 },
  pollDesc: { fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  metaText: { fontSize: 12, color: '#94A3B8' },
  votedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  votedText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  optionsContainer: { marginTop: 12, gap: 8 },
  optionRow: {
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#E2E8F0', position: 'relative', overflow: 'hidden',
  },
  optionSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 1 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4F46E5' },
  optionText: { fontSize: 14, fontWeight: '600', color: '#475569', flex: 1 },
  optionTextSelected: { color: '#4F46E5', fontWeight: '700' },
  optionRight: { position: 'absolute', top: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 1 },
  percentText: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  voteCountText: { fontSize: 11, color: '#94A3B8' },
  barBg: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, backgroundColor: '#E2E8F0' },
  barFill: { height: 4, backgroundColor: '#CBD5E1', borderRadius: 2 },
  barFillSelected: { backgroundColor: '#4F46E5' },
});
