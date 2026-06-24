import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Poll } from '../../types';
import { BarChart3, Clock, CheckCircle2, Calendar, HelpCircle, Lock } from 'lucide-react';

export const PollsPage: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<{ [pollId: number]: number }>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const fetchPolls = async () => {
    try {
      const res = await axiosClient.get<Poll[]>('polls');
      setPolls(res.data);
    } catch (err) {
      console.error('Failed to load polls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const handleVote = async (pollId: number) => {
    const optionId = selectedOptions[pollId];
    if (!optionId) return;

    setSubmittingId(pollId);
    try {
      await axiosClient.post(`polls/${pollId}/vote`, { pollOptionId: optionId });
      fetchPolls();
    } catch (err) {
      console.error('Failed to submit vote:', err);
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Opinion Polls</h2>
          <p className="text-xs text-slate-500 mt-1">
            Cast your vote on society proposals, parking rules, and cultural events. Your vote shapes the community.
          </p>
        </div>
        <div className="p-2 bg-slate-100/80 rounded-lg text-slate-600">
          <BarChart3 size={20} />
        </div>
      </div>

      {polls.length > 0 ? (
        <div className="space-y-6">
          {polls.map((poll) => {
            const hasVoted = poll.hasUserVoted || poll.hasVoted;
            const isClosed = poll.status.toLowerCase() === 'closed';
            const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);

            return (
              <Card key={poll.id} className="p-6 bg-white hover:shadow-md transition-shadow relative">
                <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={isClosed ? 'secondary' : 'success'}>
                      {isClosed ? 'Closed' : 'Active'}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                      <Clock size={12} />
                      Ends: {new Date(poll.endDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-800 leading-tight mb-1 flex items-center gap-2">
                  <HelpCircle size={18} className="text-primary-500" />
                  {poll.question}
                </h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed pl-7">
                  {poll.description}
                </p>

                {/* Poll Options */}
                <div className="space-y-3 pl-7">
                  {poll.options.map((option) => {
                    const pct = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
                    const isSelected = selectedOptions[poll.id] === option.id;

                    if (hasVoted || isClosed) {
                      return (
                        <div key={option.id} className="space-y-1">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-1.5">
                              {option.optionText}
                              {poll.votedOptionId === option.id && (
                                <CheckCircle2 size={13} className="text-emerald-600" />
                              )}
                            </span>
                            <span>{pct}% ({option.voteCount})</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                poll.votedOptionId === option.id
                                  ? 'bg-emerald-500'
                                  : 'bg-primary-500/80'
                              }`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    }

                    // Render selectable radio option if active and not voted
                    return (
                      <label
                        key={option.id}
                        className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all hover:bg-slate-50 ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50/20'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`poll-${poll.id}`}
                            value={option.id}
                            checked={isSelected}
                            onChange={() => setSelectedOptions({ ...selectedOptions, [poll.id]: option.id })}
                            className="h-4 w-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                          />
                          <span className="text-xs font-semibold text-slate-700">{option.optionText}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Vote button panel */}
                {!hasVoted && !isClosed && (
                  <div className="mt-6 flex justify-end pl-7">
                    <Button
                      variant="primary"
                      disabled={!selectedOptions[poll.id] || submittingId === poll.id}
                      onClick={() => handleVote(poll.id)}
                      className="text-xs px-4"
                    >
                      {submittingId === poll.id ? 'Casting...' : 'Submit Vote'}
                    </Button>
                  </div>
                )}

                {isClosed && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase pl-7">
                    <Lock size={12} />
                    Voting ended. Final choices are displayed.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
          <HelpCircle className="mx-auto text-slate-300 mb-3" size={36} />
          <h4 className="text-sm font-bold text-slate-700">No active polls found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            The managing committee has not published any active opinion proposals for your feedback currently.
          </p>
        </div>
      )}
    </div>
  );
};
