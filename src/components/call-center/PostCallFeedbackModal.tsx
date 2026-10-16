"use client";

import React, { useState } from 'react';
import { Star, CheckCircle, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface PostCallFeedbackModalProps {
  callSid: string;
  onClose: () => void;
  onSubmit: () => void;
}

export function PostCallFeedbackModal({ callSid, onClose, onSubmit }: PostCallFeedbackModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tags = ["Resolved", "Follow-up needed", "Billing", "Technical", "Complaint", "Escalated"];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return; // Rating is required

    setIsSubmitting(true);
    try {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const res = await apiFetch(`/api/v1/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callSid,
          csatScore: rating,
          tags: selectedTags,
          notes,
        })
      });
      if (res.ok) {
        onSubmit();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0a] border border-[#222] rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="p-8 pb-6 text-center border-b border-[#222] shrink-0">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Call Completed</h2>
          <p className="text-slate-400 text-sm">Please log the interaction details before taking the next call.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* CSAT Rating */}
          <div className="text-center">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">Customer Satisfaction</label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-10 h-10 ${star <= (hoverRating || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-600'
                      }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">Call Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${selectedTags.includes(tag)
                    ? 'bg-primary/20 text-primary border-primary/30'
                    : 'bg-[#111] text-slate-400 border-[#333] hover:border-[#555]'
                    }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">Wrap-up Notes</label>
            <textarea aria-label="Call summary feedback"
              rows={3}
              className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-xl px-4 py-3 text-sm text-white outline-none resize-none"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Brief summary of the outcome..."
            ></textarea>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-medium text-slate-400 hover:text-white transition-colors"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className={`px-6 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 ${rating === 0
                ? 'bg-[#222] text-slate-500 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-orange-600 shadow-lg shadow-primary/20'
                }`}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Log Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
