import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Poll } from '../../types';
import { Plus, X, BarChart3, HelpCircle } from 'lucide-react';

export const PollsPage: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

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

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOptions = options.filter(o => o.trim() !== '');
    if (cleanOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }
    try {
      await axiosClient.post('polls', {
        question,
        description,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        options: cleanOptions,
      });
      setIsOpen(false);
      fetchPolls();
    } catch (err) {
      console.error('Failed to create poll:', err);
    }
  };

  const handleClosePoll = async (id: number) => {
    if (!window.confirm('Are you sure you want to close this poll? Residents will no longer be able to vote.')) return;
    try {
      await axiosClient.put(`polls/${id}/status`, { status: 'Closed' });
      fetchPolls();
    } catch (err) {
      console.error('Failed to close poll:', err);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Opinion Polls</h2>
          <p className="text-xs text-slate-500 mt-1">Gather resident opinions, run elections, and vote on community improvements.</p>
        </div>
        <Button className="flex items-center gap-1.5" onClick={() => {
          setQuestion('');
          setDescription('');
          setOptions(['', '']);
          setStartDate(new Date().toISOString().split('T')[0]);
          setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
          setIsOpen(true);
        }}>
          <Plus size={16} /> Create Poll
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {polls.map((poll) => (
          <Card key={poll.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                  poll.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-200'
                }`}>
                  {poll.status}
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-2">{poll.question}</h3>
                <p className="text-xs text-slate-500 mt-1">{poll.description}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Duration: {new Date(poll.startDate).toLocaleDateString('en-IN')} to {new Date(poll.endDate).toLocaleDateString('en-IN')} | Created by {poll.creatorName || 'Admin'}
                </p>
              </div>
              {poll.status === 'Active' && (
                <Button variant="outline" size="sm" onClick={() => handleClosePoll(poll.id)}>
                  Close Poll
                </Button>
              )}
            </div>

            {(() => {
              const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);
              return (
                <>
                  <div className="space-y-3 mt-6">
                    {poll.options.map((opt) => {
                      const percentage = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
                      return (
                        <div key={opt.id} className="relative">
                          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1 z-10 relative px-2">
                            <span>{opt.optionText}</span>
                            <span>{opt.voteCount} votes ({percentage}%)</span>
                          </div>
                          <div className="h-6 w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-100">
                            <div
                              className="h-full bg-primary-100 rounded-lg transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-right text-xs text-slate-400 font-semibold mt-3">
                    Total Responses: {totalVotes}
                  </div>
                </>
              );
            })()}
          </Card>
        ))}

        {polls.length === 0 && (
          <div className="py-12 text-center">
            <HelpCircle className="mx-auto text-slate-300 mb-2" size={48} />
            <p className="text-slate-500 font-medium">No polls created yet</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create New Opinion Poll"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Question / Proposal"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Should we renovate the children park next month?"
            required
          />

          <Input
            label="Brief Description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide context about this proposal..."
            required
          />

          <div className="space-y-2 text-left">
            <label className="block text-sm font-medium text-slate-700">Voting Options</label>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  placeholder={`Choice #${i + 1}`}
                  required
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(i)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={handleAddOption}
            >
              Add Option Choice
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Launch Poll
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
